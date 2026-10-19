import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { allowedCategoryIcons, createStore, defaultCategoryIcons } from "./store.mjs";

const isProduction = process.env.NODE_ENV === "production";
const corsOrigins = (process.env.CORS_ORIGIN ?? "*").split(",").map((origin) => origin.trim()).filter(Boolean);
if (isProduction && !process.env.DATABASE_URL) throw new Error("DATABASE_URL must be configured in production.");
if (isProduction && !process.env.JWT_SECRET) throw new Error("JWT_SECRET must be configured in production.");
if (isProduction && !corsOrigins.length) throw new Error("CORS_ORIGIN must be configured in production.");
if (isProduction && corsOrigins.includes("*")) throw new Error("CORS_ORIGIN must list exact frontend origins in production.");
const store = await createStore();
const port = Number(process.env.PORT ?? 4000);
const jwtSecret = process.env.JWT_SECRET ?? "retain-day2-development-secret";
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("PORT must be a valid TCP port.");

class HttpError extends Error { constructor(status, message, code = "REQUEST_ERROR") { super(message); this.status = status; this.code = code; } }
const id = (prefix) => `${prefix}_${randomUUID().slice(0, 8)}`;
const send = (request, response, status, body) => {
  const requestOrigin = request.headers.origin;
  const allowAllOrigins = corsOrigins.includes("*");
  const originHeaders = allowAllOrigins
    ? { "Access-Control-Allow-Origin": "*" }
    : requestOrigin && corsOrigins.includes(requestOrigin)
      ? { "Access-Control-Allow-Origin": requestOrigin, Vary: "Origin" }
      : {};
  response.writeHead(status, { ...originHeaders, "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS", "Content-Type": "application/json", "Cache-Control": "no-store" });
  response.end(body === null ? "" : JSON.stringify(body));
};
const readBody = async (request) => { let raw = ""; for await (const chunk of request) { raw += chunk; if (raw.length > 1_000_000) throw new HttpError(413, "Request body is too large.", "PAYLOAD_TOO_LARGE"); } if (!raw) return {}; try { return JSON.parse(raw); } catch { throw new HttpError(400, "Request body must be valid JSON.", "INVALID_JSON"); } };
const userView = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });
const adminUserView = (user) => ({ ...userView(user), createdAt: user.createdAt });
const tokenFor = (user) => jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: "7d" });
const validMonth = (value) => typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const validDate = (value) => { if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const parsed = new Date(`${value}T00:00:00Z`); return parsed.toISOString().slice(0, 10) === value; };
const categoryView = (category) => ({ id: category.id, name: category.name, color: category.color, icon: category.icon ?? defaultCategoryIcons[category.id] ?? "receipt" });
const findCategory = (categories, idValue) => categories.find((category) => category.id === idValue) ?? categories.at(-1);
const expenseView = (expense, categories) => { const category = findCategory(categories, expense.categoryId); return { id: expense.id, title: expense.title, amount: Number(expense.amount), category: categoryView(category), date: expense.date, paymentMethod: expense.paymentMethod, note: expense.note }; };
const adminExpenseView = (expense, categories, users) => { const owner = users.find((candidate) => candidate.id === expense.userId); return { ...expenseView(expense, categories), user: owner ? adminUserView(owner) : { id: expense.userId, name: "Unknown account", email: "", role: "user", createdAt: "" } }; };
const adminCategoryView = (category, expenses) => ({ ...categoryView(category), isSystem: Boolean(category.isSystem), expenseCount: expenses.filter((expense) => expense.categoryId === category.id).length });

const authUser = async (request) => {
  const header = request.headers.authorization ?? "";
  if (!header.startsWith("Bearer ")) throw new HttpError(401, "Sign in is required.", "UNAUTHENTICATED");
  try {
    const payload = jwt.verify(header.slice(7), jwtSecret);
    const user = await store.getUserById(payload.sub);
    if (!user) throw new Error();
    return user;
  } catch { throw new HttpError(401, "Your session has expired. Please sign in again.", "INVALID_SESSION"); }
};
const requireAdmin = (user) => { if (user.role !== "admin") throw new HttpError(403, "Admin access is required.", "FORBIDDEN"); };

const validateExpense = async (body, categories) => {
  if (!body.title?.trim() || !Number.isFinite(Number(body.amount)) || Number(body.amount) <= 0 || !body.categoryId || !validDate(body.date) || !["Card", "Transfer", "Cash"].includes(body.paymentMethod)) throw new HttpError(422, "Add a title, positive amount, category, date, and payment method.", "INVALID_EXPENSE");
  if (!categories.some((category) => category.id === body.categoryId)) throw new HttpError(422, "Choose a valid category.", "INVALID_CATEGORY");
};

const listExpenses = async (userId, url, categories) => {
  const pageValue = Number(url.searchParams.get("page") ?? 1);
  const sizeValue = Number(url.searchParams.get("pageSize") ?? 20);
  const page = Number.isFinite(pageValue) ? Math.max(Math.floor(pageValue), 1) : 1;
  const pageSize = Number.isFinite(sizeValue) ? Math.min(Math.max(Math.floor(sizeValue), 1), 50) : 20;
  let rows = await store.listExpenses(userId);
  const search = url.searchParams.get("search")?.trim().toLowerCase();
  if (search) rows = rows.filter((expense) => expense.title.toLowerCase().includes(search) || expense.note?.toLowerCase().includes(search));
  const categoryId = url.searchParams.get("categoryId");
  if (categoryId) rows = rows.filter((expense) => expense.categoryId === categoryId);
  const paymentMethod = url.searchParams.get("paymentMethod");
  if (paymentMethod) rows = rows.filter((expense) => expense.paymentMethod === paymentMethod);
  const month = url.searchParams.get("month");
  if (month) { if (!validMonth(month)) throw new HttpError(422, "Month must use YYYY-MM format.", "INVALID_MONTH"); rows = rows.filter((expense) => expense.date.startsWith(month)); }
  const dateFrom = url.searchParams.get("dateFrom");
  if (dateFrom) { if (!validDate(dateFrom)) throw new HttpError(422, "Start date is invalid.", "INVALID_DATE"); rows = rows.filter((expense) => expense.date >= dateFrom); }
  const dateTo = url.searchParams.get("dateTo");
  if (dateTo) { if (!validDate(dateTo)) throw new HttpError(422, "End date is invalid.", "INVALID_DATE"); rows = rows.filter((expense) => expense.date <= dateTo); }
  const sortBy = url.searchParams.get("sortBy") === "amount" ? "amount" : "date";
  const direction = url.searchParams.get("sortDirection") === "asc" ? 1 : -1;
  rows.sort((a, b) => { const left = sortBy === "amount" ? Number(a.amount) : a.date; const right = sortBy === "amount" ? Number(b.amount) : b.date; return (left > right ? 1 : left < right ? -1 : 0) * direction; });
  const total = rows.length;
  return { items: rows.slice((page - 1) * pageSize, page * pageSize).map((expense) => expenseView(expense, categories)), page, pageSize, total, totalPages: Math.max(Math.ceil(total / pageSize), 1) };
};

const adminInsights = async () => {
  const [categories, expenses, users] = await Promise.all([store.listCategories(), store.listAllExpenses(), store.listUsers()]);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const spendingByCategory = categories.map((category) => { const categoryExpenses = expenses.filter((expense) => expense.categoryId === category.id); return { category: categoryView(category), total: categoryExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0), count: categoryExpenses.length }; }).sort((a, b) => b.total - a.total);
  const usage = spendingByCategory.map((item) => ({ category: item.category, count: item.count, total: item.total })).sort((a, b) => b.count - a.count || b.total - a.total);
  return { currentMonth, totals: { users: users.length, expenses: expenses.length, value: expenses.reduce((sum, expense) => sum + Number(expense.amount), 0), currentMonthExpenses: expenses.filter((expense) => expense.date.startsWith(currentMonth)).length }, spendingByCategory, topCategories: usage.slice(0, 5), bottomCategories: [...usage].sort((a, b) => a.count - b.count || a.total - b.total).slice(0, 5), recentExpenses: [...expenses].sort((a, b) => (b.createdAt ?? b.date).localeCompare(a.createdAt ?? a.date)).slice(0, 6).map((expense) => adminExpenseView(expense, categories, users)), recentUsers: [...users].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, 6).map(adminUserView) };
};

async function handle(request, response) {
  if (request.method === "OPTIONS") { send(request, response, 204, null); return; }
  const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
  const path = url.pathname;
  const segments = path.split("/").filter(Boolean);
  if (request.method === "GET" && path === "/api/health") { send(request, response, 200, { status: "ok", service: "retain-api", version: "0.4.0", environment: process.env.NODE_ENV ?? "development", storage: store.kind }); return; }
  if (request.method === "POST" && path === "/api/auth/signup") {
    const body = await readBody(request);
    if (!body.name?.trim() || !body.email?.trim() || !body.password || body.password.length < 8) throw new HttpError(422, "Name, email, and a password of at least 8 characters are required.", "INVALID_SIGNUP");
    const email = body.email.trim().toLowerCase();
    if (await store.getUserByEmail(email)) throw new HttpError(409, "An account with that email already exists.", "EMAIL_TAKEN");
    const user = await store.createUser({ id: id("usr"), name: body.name.trim(), email, passwordHash: bcrypt.hashSync(body.password, 10), role: "user", createdAt: new Date().toISOString() });
    send(request, response, 201, { user: userView(user), token: tokenFor(user) }); return;
  }
  if (request.method === "POST" && path === "/api/auth/signin") {
    const body = await readBody(request); const user = await store.getUserByEmail(body.email?.trim().toLowerCase());
    if (!user || !bcrypt.compareSync(body.password ?? "", user.passwordHash)) throw new HttpError(401, "Email or password is incorrect.", "INVALID_CREDENTIALS");
    send(request, response, 200, { user: userView(user), token: tokenFor(user) }); return;
  }
  if (request.method === "GET" && path === "/api/auth/me") { send(request, response, 200, { user: userView(await authUser(request)) }); return; }
  if (request.method === "POST" && path === "/api/auth/signout") { send(request, response, 200, { ok: true }); return; }

  const user = await authUser(request);
  const categories = await store.listCategories();
  if (request.method === "GET" && path === "/api/categories") { const expenses = user.role === "admin" ? await store.listAllExpenses() : []; send(request, response, 200, { items: categories.map((category) => user.role === "admin" ? adminCategoryView(category, expenses) : categoryView(category)) }); return; }
  if (request.method === "GET" && path === "/api/admin/insights") { requireAdmin(user); send(request, response, 200, await adminInsights()); return; }
  if (request.method === "DELETE" && segments[1] === "users" && segments[2]) { requireAdmin(user); if (segments[2] === user.id) throw new HttpError(422, "The current admin account cannot be deleted.", "SELF_DELETE_FORBIDDEN"); if (!await store.getUserById(segments[2])) throw new HttpError(404, "Account not found.", "USER_NOT_FOUND"); await store.deleteUser(segments[2]); send(request, response, 200, { ok: true }); return; }
  if (request.method === "POST" && path === "/api/categories") { requireAdmin(user); const body = await readBody(request); const name = body.name?.trim(); const color = body.color?.trim() || "#CFCFCF"; const icon = body.icon?.trim() || "tag"; if (!name || name.length > 40 || !/^#[0-9A-Fa-f]{6}$/.test(color) || !allowedCategoryIcons.has(icon)) throw new HttpError(422, "Add a category name, valid hex color, and supported icon.", "INVALID_CATEGORY"); if (await store.categoryNameExists(name)) throw new HttpError(409, "That category already exists.", "CATEGORY_EXISTS"); const category = await store.createCategory({ id: id("cat"), name, color, icon, isSystem: false, createdAt: new Date().toISOString() }); send(request, response, 201, { item: adminCategoryView(category, await store.listAllExpenses()) }); return; }
  if (segments[1] === "categories" && segments[2] && ["PATCH", "DELETE"].includes(request.method)) {
    requireAdmin(user); const category = await store.getCategoryById(segments[2]); if (!category) throw new HttpError(404, "Category not found.", "CATEGORY_NOT_FOUND"); if (category.isSystem) throw new HttpError(422, "System categories cannot be changed.", "SYSTEM_CATEGORY");
    if (request.method === "DELETE") { const fallback = categories.find((candidate) => candidate.isSystem) ?? categories.find((candidate) => candidate.id !== category.id); if (!fallback) throw new HttpError(422, "Add an uncategorized fallback before deleting this category.", "NO_FALLBACK_CATEGORY"); await store.deleteCategory(category.id, fallback.id); send(request, response, 200, { ok: true, reassignedTo: fallback.id }); return; }
    const body = await readBody(request); const name = body.name?.trim(); const color = body.color?.trim() || category.color; const icon = body.icon?.trim() || category.icon || defaultCategoryIcons[category.id] || "tag"; if (!name || name.length > 40 || !/^#[0-9A-Fa-f]{6}$/.test(color) || !allowedCategoryIcons.has(icon)) throw new HttpError(422, "Add a category name, valid hex color, and supported icon.", "INVALID_CATEGORY"); if (await store.categoryNameExists(name, category.id)) throw new HttpError(409, "That category already exists.", "CATEGORY_EXISTS"); const updated = await store.updateCategory(category.id, { name, color, icon }); send(request, response, 200, { item: adminCategoryView(updated, await store.listAllExpenses()) }); return;
  }
  if (request.method === "GET" && path === "/api/expenses") { send(request, response, 200, await listExpenses(user.id, url, categories)); return; }
  if (request.method === "POST" && path === "/api/expenses") { const body = await readBody(request); await validateExpense(body, categories); const expense = await store.createExpense({ id: id("exp"), userId: user.id, title: body.title.trim(), amount: Number(body.amount), categoryId: body.categoryId, date: body.date, paymentMethod: body.paymentMethod, note: body.note?.trim() || undefined }); send(request, response, 201, { item: expenseView(expense, categories) }); return; }
  if (segments[1] === "expenses" && segments[2] && ["PATCH", "DELETE"].includes(request.method)) { const expense = await store.getExpense(segments[2], user.id); if (!expense) throw new HttpError(404, "Expense not found.", "EXPENSE_NOT_FOUND"); if (request.method === "DELETE") { await store.deleteExpense(expense.id, user.id); send(request, response, 200, { ok: true }); return; } const body = await readBody(request); await validateExpense(body, categories); const updated = await store.updateExpense(expense.id, user.id, { title: body.title.trim(), amount: Number(body.amount), categoryId: body.categoryId, date: body.date, paymentMethod: body.paymentMethod, note: body.note?.trim() || undefined }); send(request, response, 200, { item: expenseView(updated, categories) }); return; }
  if (request.method === "GET" && segments[1] === "budgets" && segments[2]) { const month = segments[2]; if (!validMonth(month)) throw new HttpError(422, "Month must use YYYY-MM format.", "INVALID_MONTH"); const budget = await store.getBudget(user.id, month); send(request, response, 200, { month, amount: budget?.amount ?? 0 }); return; }
  if (request.method === "PUT" && segments[1] === "budgets" && segments[2]) { const body = await readBody(request); const amount = Number(body.amount); const month = segments[2]; if (!validMonth(month)) throw new HttpError(422, "Month must use YYYY-MM format.", "INVALID_MONTH"); if (!Number.isFinite(amount) || amount < 0) throw new HttpError(422, "Budget must be a non-negative amount.", "INVALID_BUDGET"); send(request, response, 200, await store.upsertBudget(user.id, month, amount)); return; }
  throw new HttpError(404, "Route not found.", "NOT_FOUND");
}

const server = createServer((request, response) => { handle(request, response).catch((error) => { const status = error instanceof HttpError ? error.status : error.code === "23505" ? 409 : 500; send(request, response, status, { error: error.message ?? "Unexpected server error.", code: error.code ?? "INTERNAL_ERROR" }); }); });
server.listen(port, () => console.log(`Retain API listening on port ${port} (${store.kind})`));
const shutdown = async () => { server.close(); await store.close(); process.exit(0); };
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
