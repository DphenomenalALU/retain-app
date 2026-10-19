import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { allowedCategoryIcons, createStore, defaultCategoryIcons } from "./store.mjs";

const isProduction = process.env.NODE_ENV === "production";
const corsOrigins = (process.env.CORS_ORIGIN ?? "*").split(",").map((origin) => origin.trim()).filter(Boolean);
if (isProduction && !process.env.DATABASE_URL) throw new Error("DATABASE_URL must be configured in production.");
if (isProduction && !process.env.JWT_SECRET) throw new Error("JWT_SECRET must be configured in production.");
if (isProduction && (!process.env.RETAIN_ADMIN_EMAIL || !process.env.RETAIN_ADMIN_PASSWORD)) throw new Error("RETAIN_ADMIN_EMAIL and RETAIN_ADMIN_PASSWORD must be configured in production.");
if (isProduction && process.env.RETAIN_ADMIN_PASSWORD.length < 12) throw new Error("RETAIN_ADMIN_PASSWORD must be at least 12 characters in production.");
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
const readBody = async (request) => { let raw = ""; for await (const chunk of request) { raw += chunk; if (raw.length > 1_000_000) throw new HttpError(413, "Request body is too large.", "PAYLOAD_TOO_LARGE"); } if (!raw) return {}; let body; try { body = JSON.parse(raw); } catch { throw new HttpError(400, "Request body must be valid JSON.", "INVALID_JSON"); } if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "Request body must be a JSON object.", "INVALID_BODY"); return body; };
const userView = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });
const adminUserView = (user) => ({ ...userView(user), createdAt: user.createdAt });
const tokenFor = (user) => jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: "7d" });
const validMonth = (value) => typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const validDate = (value) => { if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const [year, month, day] = value.split("-").map(Number); const parsed = new Date(Date.UTC(year, month - 1, day)); return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day; };
const amountFilter = (value, label) => { if (value === null || value === "") return null; const parsed = Number(value); if (!Number.isFinite(parsed) || parsed < 0) throw new HttpError(422, `${label} must be a non-negative amount.`, "INVALID_AMOUNT_FILTER"); return parsed; };
const textValue = (value, label, maxLength, required = true) => { if (typeof value !== "string") throw new HttpError(422, `${label} must be text.`, "INVALID_INPUT"); const normalized = value.trim(); if (required && !normalized) throw new HttpError(422, `${label} is required.`, "INVALID_INPUT"); if (normalized.length > maxLength) throw new HttpError(422, `${label} must be ${maxLength} characters or fewer.`, "INVALID_INPUT"); return normalized; };
const optionalTextValue = (value, label, maxLength) => value === undefined || value === null || value === "" ? undefined : textValue(value, label, maxLength);
const emailValue = (value) => { const email = textValue(value, "Email", 254).toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(422, "Enter a valid email address.", "INVALID_EMAIL"); return email; };
const moneyValue = (value, label, minimum) => { if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > 9_999_999_999.99 || Math.round(value * 100) !== value * 100) throw new HttpError(422, `${label} must be a valid amount with up to two decimal places.`, "INVALID_AMOUNT"); return Number(value.toFixed(2)); };
const currentMonth = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; };
const categoryView = (category) => { const safeCategory = category ?? { id: "cat_005", name: "Uncategorized", color: "#CFCFCF", icon: "tag" }; return { id: safeCategory.id, name: safeCategory.name, color: safeCategory.color, icon: safeCategory.icon ?? defaultCategoryIcons[safeCategory.id] ?? "receipt" }; };
const findCategory = (categories, idValue) => categories.find((category) => category.id === idValue) ?? categories.at(-1);
const expenseView = (expense, categories) => { const category = findCategory(categories, expense.categoryId); return { id: expense.id, title: expense.title, amount: Number(expense.amount), category: categoryView(category), date: expense.date, paymentMethod: expense.paymentMethod, note: expense.note }; };
const adminExpenseView = (expense, categories, users) => { const owner = users.find((candidate) => candidate.id === expense.userId); return { ...expenseView(expense, categories), user: owner ? adminUserView(owner) : { id: expense.userId, name: "Unknown account", email: "", role: "user", createdAt: "" } }; };
const adminCategoryView = (category, expenses) => ({ ...categoryView(category), isSystem: Boolean(category.isSystem), expenseCount: expenses.filter((expense) => expense.categoryId === category.id).length });
const dashboardSummaryView = (summary, categories, month) => ({
  month,
  total: Number(summary.total),
  count: Number(summary.count),
  largestExpense: summary.largestExpense ? expenseView(summary.largestExpense, categories) : null,
  recentExpenses: summary.recentExpenses.map((expense) => expenseView(expense, categories)),
  byCategory: summary.byCategory
    .map((item) => ({ category: categoryView(findCategory(categories, item.categoryId)), total: Number(item.total), count: Number(item.count) }))
    .sort((left, right) => right.total - left.total),
});

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

const validateExpense = (body, categories) => {
  const title = textValue(body.title, "Title", 120);
  const amount = moneyValue(body.amount, "Amount", 0.01);
  const categoryId = textValue(body.categoryId, "Category", 80);
  const date = textValue(body.date, "Date", 10);
  const paymentMethod = textValue(body.paymentMethod, "Payment method", 20);
  const note = optionalTextValue(body.note, "Note", 500);
  if (!validDate(date)) throw new HttpError(422, "Enter a valid calendar date.", "INVALID_DATE");
  if (!["Card", "Transfer", "Cash"].includes(paymentMethod)) throw new HttpError(422, "Choose a valid payment method.", "INVALID_PAYMENT_METHOD");
  if (!categories.some((category) => category.id === categoryId)) throw new HttpError(422, "Choose a valid category.", "INVALID_CATEGORY");
  return { title, amount, categoryId, date, paymentMethod, note };
};

const validateCategory = (body, fallback = {}) => {
  const name = textValue(body.name, "Category name", 40);
  const color = textValue(body.color ?? fallback.color ?? "#CFCFCF", "Category color", 7);
  const icon = textValue(body.icon ?? fallback.icon ?? "tag", "Category icon", 30);
  if (!/^#[0-9A-Fa-f]{6}$/.test(color) || !allowedCategoryIcons.has(icon)) throw new HttpError(422, "Add a valid hex color and supported icon.", "INVALID_CATEGORY");
  return { name, color, icon };
};

const listExpenses = async (userId, url, categories) => {
  const pageValue = Number(url.searchParams.get("page") ?? 1);
  const sizeValue = Number(url.searchParams.get("pageSize") ?? 20);
  const page = Number.isFinite(pageValue) ? Math.max(Math.floor(pageValue), 1) : 1;
  const pageSize = Number.isFinite(sizeValue) ? Math.min(Math.max(Math.floor(sizeValue), 1), 50) : 20;
  const search = url.searchParams.get("search")?.trim().toLowerCase();
  const categoryId = url.searchParams.get("categoryId") || "";
  const paymentMethod = url.searchParams.get("paymentMethod") || "";
  const month = url.searchParams.get("month") || "";
  const dateFrom = url.searchParams.get("dateFrom") || "";
  const dateTo = url.searchParams.get("dateTo") || "";
  const minAmount = amountFilter(url.searchParams.get("minAmount"), "Minimum amount");
  const maxAmount = amountFilter(url.searchParams.get("maxAmount"), "Maximum amount");
  if (month && !validMonth(month)) throw new HttpError(422, "Month must use YYYY-MM format.", "INVALID_MONTH");
  if (dateFrom && !validDate(dateFrom)) throw new HttpError(422, "Start date is invalid.", "INVALID_DATE");
  if (dateTo && !validDate(dateTo)) throw new HttpError(422, "End date is invalid.", "INVALID_DATE");
  if (minAmount !== null && maxAmount !== null && minAmount > maxAmount) throw new HttpError(422, "Minimum amount cannot exceed maximum amount.", "INVALID_AMOUNT_RANGE");
  const sortBy = url.searchParams.get("sortBy") === "amount" ? "amount" : "date";
  const sortDirection = url.searchParams.get("sortDirection") === "asc" ? "asc" : "desc";
  const listOptions = { page, pageSize, search, categoryId, paymentMethod, month, dateFrom, dateTo, minAmount, maxAmount, sortBy, sortDirection };
  if (store.kind === "postgres") {
    const result = await store.queryExpenses(userId, listOptions);
    return { items: result.rows.map((expense) => expenseView(expense, categories)), page, pageSize, total: result.total, totalPages: Math.max(Math.ceil(result.total / pageSize), 1) };
  }
  let rows = await store.listExpenses(userId);
  if (search) rows = rows.filter((expense) => expense.title.toLowerCase().includes(search) || expense.note?.toLowerCase().includes(search));
  if (categoryId) rows = rows.filter((expense) => expense.categoryId === categoryId);
  if (paymentMethod) rows = rows.filter((expense) => expense.paymentMethod === paymentMethod);
  if (month) rows = rows.filter((expense) => expense.date.startsWith(month));
  if (dateFrom) rows = rows.filter((expense) => expense.date >= dateFrom);
  if (dateTo) rows = rows.filter((expense) => expense.date <= dateTo);
  if (minAmount !== null) rows = rows.filter((expense) => Number(expense.amount) >= minAmount);
  if (maxAmount !== null) rows = rows.filter((expense) => Number(expense.amount) <= maxAmount);
  const direction = sortDirection === "asc" ? 1 : -1;
  rows.sort((a, b) => { const left = sortBy === "amount" ? Number(a.amount) : a.date; const right = sortBy === "amount" ? Number(b.amount) : b.date; return (left > right ? 1 : left < right ? -1 : 0) * direction; });
  const total = rows.length;
  return { items: rows.slice((page - 1) * pageSize, page * pageSize).map((expense) => expenseView(expense, categories)), page, pageSize, total, totalPages: Math.max(Math.ceil(total / pageSize), 1) };
};

const adminInsights = async () => {
  const [categories, expenses, users] = await Promise.all([store.listCategories(), store.listAllExpenses(), store.listUsers()]);
  const month = currentMonth();
  const spendingByCategory = categories.map((category) => { const categoryExpenses = expenses.filter((expense) => expense.categoryId === category.id); return { category: categoryView(category), total: categoryExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0), count: categoryExpenses.length }; }).sort((a, b) => b.total - a.total);
  const usage = spendingByCategory.map((item) => ({ category: item.category, count: item.count, total: item.total })).sort((a, b) => b.count - a.count || b.total - a.total);
  return { currentMonth: month, totals: { users: users.length, expenses: expenses.length, value: expenses.reduce((sum, expense) => sum + Number(expense.amount), 0), currentMonthExpenses: expenses.filter((expense) => expense.date.startsWith(month)).length }, spendingByCategory, topCategories: usage.slice(0, 5), bottomCategories: [...usage].sort((a, b) => a.count - b.count || a.total - b.total).slice(0, 5), recentExpenses: [...expenses].sort((a, b) => (b.createdAt ?? b.date).localeCompare(a.createdAt ?? a.date)).slice(0, 6).map((expense) => adminExpenseView(expense, categories, users)), recentUsers: [...users].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, 6).map(adminUserView) };
};

async function handle(request, response) {
  if (request.method === "OPTIONS") { send(request, response, 204, null); return; }
  const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
  const path = url.pathname;
  const segments = path.split("/").filter(Boolean);
  if (request.method === "GET" && path === "/api/health") { send(request, response, 200, { status: "ok", service: "retain-api", version: "0.4.0", environment: process.env.NODE_ENV ?? "development", storage: store.kind }); return; }
  if (request.method === "POST" && path === "/api/auth/signup") {
    const body = await readBody(request);
    const name = textValue(body.name, "Name", 80);
    const email = emailValue(body.email);
    if (typeof body.password !== "string" || body.password.length < 8 || body.password.length > 72) throw new HttpError(422, "Password must be between 8 and 72 characters.", "INVALID_PASSWORD");
    if (await store.getUserByEmail(email)) throw new HttpError(409, "An account with that email already exists.", "EMAIL_TAKEN");
    const user = await store.createUser({ id: id("usr"), name, email, passwordHash: bcrypt.hashSync(body.password, 10), role: "user", createdAt: new Date().toISOString() });
    send(request, response, 201, { user: userView(user), token: tokenFor(user) }); return;
  }
  if (request.method === "POST" && path === "/api/auth/signin") {
    const body = await readBody(request); const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""; const password = typeof body.password === "string" ? body.password : ""; const user = email ? await store.getUserByEmail(email) : null;
    if (!user || !password || !bcrypt.compareSync(password, user.passwordHash)) throw new HttpError(401, "Email or password is incorrect.", "INVALID_CREDENTIALS");
    send(request, response, 200, { user: userView(user), token: tokenFor(user) }); return;
  }
  if (request.method === "GET" && path === "/api/auth/me") { send(request, response, 200, { user: userView(await authUser(request)) }); return; }
  if (request.method === "POST" && path === "/api/auth/signout") { send(request, response, 200, { ok: true }); return; }

  const user = await authUser(request);
  const categories = await store.listCategories();
  if (request.method === "GET" && path === "/api/categories") { const expenses = user.role === "admin" ? await store.listAllExpenses() : []; send(request, response, 200, { items: categories.map((category) => user.role === "admin" ? adminCategoryView(category, expenses) : categoryView(category)) }); return; }
  if (request.method === "GET" && path === "/api/dashboard/summary") { const month = url.searchParams.get("month") ?? currentMonth(); if (!validMonth(month)) throw new HttpError(422, "Month must use YYYY-MM format.", "INVALID_MONTH"); send(request, response, 200, dashboardSummaryView(await store.getMonthlySummary(user.id, month), categories, month)); return; }
  if (request.method === "GET" && path === "/api/admin/insights") { requireAdmin(user); send(request, response, 200, await adminInsights()); return; }
  if (request.method === "DELETE" && segments.length === 3 && segments[1] === "users" && segments[2]) { requireAdmin(user); if (segments[2] === user.id) throw new HttpError(422, "The current admin account cannot be deleted.", "SELF_DELETE_FORBIDDEN"); if (!await store.getUserById(segments[2])) throw new HttpError(404, "Account not found.", "USER_NOT_FOUND"); await store.deleteUser(segments[2]); send(request, response, 200, { ok: true }); return; }
  if (request.method === "POST" && path === "/api/categories") { requireAdmin(user); const body = await readBody(request); const values = validateCategory(body); if (await store.categoryNameExists(values.name)) throw new HttpError(409, "That category already exists.", "CATEGORY_EXISTS"); const category = await store.createCategory({ id: id("cat"), ...values, isSystem: false, createdAt: new Date().toISOString() }); send(request, response, 201, { item: adminCategoryView(category, await store.listAllExpenses()) }); return; }
  if (segments.length === 3 && segments[1] === "categories" && segments[2] && ["PATCH", "DELETE"].includes(request.method)) {
    requireAdmin(user); const category = await store.getCategoryById(segments[2]); if (!category) throw new HttpError(404, "Category not found.", "CATEGORY_NOT_FOUND"); if (category.isSystem) throw new HttpError(422, "System categories cannot be changed.", "SYSTEM_CATEGORY");
    if (request.method === "DELETE") { const fallback = categories.find((candidate) => candidate.isSystem) ?? categories.find((candidate) => candidate.id !== category.id); if (!fallback) throw new HttpError(422, "Add an uncategorized fallback before deleting this category.", "NO_FALLBACK_CATEGORY"); await store.deleteCategory(category.id, fallback.id); send(request, response, 200, { ok: true, reassignedTo: fallback.id }); return; }
    const body = await readBody(request); const values = validateCategory(body, { color: category.color, icon: category.icon || defaultCategoryIcons[category.id] || "tag" }); if (await store.categoryNameExists(values.name, category.id)) throw new HttpError(409, "That category already exists.", "CATEGORY_EXISTS"); const updated = await store.updateCategory(category.id, values); send(request, response, 200, { item: adminCategoryView(updated, await store.listAllExpenses()) }); return;
  }
  if (request.method === "GET" && path === "/api/expenses") { send(request, response, 200, await listExpenses(user.id, url, categories)); return; }
  if (request.method === "POST" && path === "/api/expenses") { const body = await readBody(request); const values = validateExpense(body, categories); const expense = await store.createExpense({ id: id("exp"), userId: user.id, ...values }); send(request, response, 201, { item: expenseView(expense, categories) }); return; }
  if (request.method === "GET" && segments.length === 3 && segments[1] === "expenses" && segments[2]) { const expense = await store.getExpense(segments[2], user.id); if (!expense) throw new HttpError(404, "Expense not found.", "EXPENSE_NOT_FOUND"); send(request, response, 200, { item: expenseView(expense, categories) }); return; }
  if (segments.length === 3 && segments[1] === "expenses" && segments[2] && ["PATCH", "DELETE"].includes(request.method)) { const expense = await store.getExpense(segments[2], user.id); if (!expense) throw new HttpError(404, "Expense not found.", "EXPENSE_NOT_FOUND"); if (request.method === "DELETE") { await store.deleteExpense(expense.id, user.id); send(request, response, 200, { ok: true }); return; } const body = await readBody(request); const values = validateExpense(body, categories); const updated = await store.updateExpense(expense.id, user.id, values); send(request, response, 200, { item: expenseView(updated, categories) }); return; }
  if (request.method === "GET" && segments.length === 3 && segments[1] === "budgets" && segments[2]) { const month = segments[2]; if (!validMonth(month)) throw new HttpError(422, "Month must use YYYY-MM format.", "INVALID_MONTH"); const budget = await store.getBudget(user.id, month); send(request, response, 200, { month, amount: budget?.amount ?? 0 }); return; }
  if (request.method === "PUT" && segments.length === 3 && segments[1] === "budgets" && segments[2]) { const body = await readBody(request); const amount = moneyValue(body.amount, "Budget", 0); const month = segments[2]; if (!validMonth(month)) throw new HttpError(422, "Month must use YYYY-MM format.", "INVALID_MONTH"); send(request, response, 200, await store.upsertBudget(user.id, month, amount)); return; }
  throw new HttpError(404, "Route not found.", "NOT_FOUND");
}

const server = createServer((request, response) => { handle(request, response).catch((error) => { const knownError = error instanceof HttpError; const status = knownError ? error.status : error?.code === "23505" ? 409 : 500; if (status >= 500) console.error("Retain API error", error); const message = knownError ? error.message : error?.code === "23505" ? "That record already exists." : "Unexpected server error."; const code = knownError ? error.code : error?.code === "23505" ? "CONFLICT" : "INTERNAL_ERROR"; send(request, response, status, { error: message, code }); }); });
server.listen(port, () => console.log(`Retain API listening on port ${port} (${store.kind})`));
const shutdown = async () => { server.close(); await store.close(); process.exit(0); };
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
