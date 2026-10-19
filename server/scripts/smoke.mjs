import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = fileURLToPath(new URL("..", import.meta.url));
const serverPath = join(serverRoot, "src/index.mjs");
const dataDir = mkdtempSync(join(tmpdir(), "retain-smoke-"));
const dataFile = join(dataDir, "retain.json");
const port = 4300 + Math.floor(Math.random() * 500);
const base = `http://127.0.0.1:${port}/api`;
const server = spawn(process.execPath, [serverPath], { env: { ...process.env, DATA_FILE: dataFile, JWT_SECRET: "retain-smoke-secret", NODE_ENV: "test", PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"] });

const call = async (path, options = {}) => { const response = await fetch(base + path, options); const body = await response.json().catch(() => null); return { status: response.status, body }; };
const json = (body, token) => ({ headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const waitForHealth = async () => { const deadline = Date.now() + 5000; while (Date.now() < deadline) { try { const result = await call("/health"); if (result.status === 200) return; } catch { /* The server is still starting. */ } await new Promise((resolve) => setTimeout(resolve, 100)); } throw new Error("API did not become healthy within 5 seconds."); };

try {
  await waitForHealth();
  const adminAuth = await call("/auth/signin", { method: "POST", ...json({ email: "emmanuel@retain.app", password: "12345678" }) });
  assert(adminAuth.status === 200 && adminAuth.body?.token, "admin sign-in failed");
  const adminToken = adminAuth.body.token;
  const insights = await call("/admin/insights", { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(insights.status === 200 && insights.body?.totals?.users === 1, "admin insights failed");
  const summary = await call("/dashboard/summary?month=2026-10", { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(summary.status === 200 && summary.body?.count === 7 && summary.body?.total === 272.85 && summary.body?.largestExpense?.title === "Market groceries", "complete monthly summary failed");

  const userAuth = await call("/auth/signup", { method: "POST", ...json({ name: "Smoke User", email: "smoke@example.test", password: "password123" }) });
  assert(userAuth.status === 201 && userAuth.body?.token, "user sign-up failed");
  const forbidden = await call("/admin/insights", { headers: { Authorization: `Bearer ${userAuth.body.token}` } });
  assert(forbidden.status === 403, "non-admin access was not rejected");
  const summaryUser = await call("/auth/signup", { method: "POST", ...json({ name: "Summary User", email: "summary@example.test", password: "password123" }) });
  assert(summaryUser.status === 201 && summaryUser.body?.token, "summary user sign-up failed");
  const bulkExpenses = await Promise.all(Array.from({ length: 55 }, (_, index) => call("/expenses", { method: "POST", ...json({ title: `Summary item ${index + 1}`, amount: 1.23, categoryId: "cat_001", date: "2026-10-01", paymentMethod: "Card" }, summaryUser.body.token) })));
  assert(bulkExpenses.every((result) => result.status === 201), "bulk expense creation failed");
  const completeSummary = await call("/dashboard/summary?month=2026-10", { headers: { Authorization: `Bearer ${summaryUser.body.token}` } });
  assert(completeSummary.status === 200 && completeSummary.body?.count === 55 && completeSummary.body?.byCategory?.[0]?.count === 55, "monthly summary was capped or incomplete");

  const category = await call("/categories", { method: "POST", ...json({ name: "Smoke Category", color: "#123456", icon: "coffee" }, adminToken) });
  assert(category.status === 201 && category.body.item.icon === "coffee", "category creation or icon persistence failed");
  const categoryId = category.body.item.id;
  const createdExpense = await call("/expenses", { method: "POST", ...json({ title: "Smoke reassignment", amount: 12.5, categoryId, date: "2026-10-16", paymentMethod: "Cash" }, adminToken) });
  assert(createdExpense.status === 201, "expense creation failed");
  const deepLinkedExpense = await call(`/expenses/${createdExpense.body.item.id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(deepLinkedExpense.status === 200 && deepLinkedExpense.body.item.date === "2026-10-16", "expense deep link failed");
  const invalidExpense = await call("/expenses", { method: "POST", ...json({ title: "", amount: 0, categoryId, date: "not-a-date", paymentMethod: "Cash" }, adminToken) });
  assert(invalidExpense.status === 422 && invalidExpense.body?.code === "INVALID_INPUT", "invalid expense payload was not rejected cleanly");
  const malformedBody = await fetch(`${base}/expenses`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` }, body: "[]" });
  assert(malformedBody.status === 400, "non-object JSON body was not rejected");
  const filtered = await call("/expenses?month=2026-10&dateFrom=2026-10-16&dateTo=2026-10-16", { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(filtered.status === 200 && filtered.body.items.some((item) => item.title === "Smoke reassignment"), "date filtering failed");
  const amountFiltered = await call("/expenses?minAmount=10&maxAmount=15", { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(amountFiltered.status === 200 && amountFiltered.body.items.every((item) => item.amount >= 10 && item.amount <= 15), "amount filtering failed");
  const invalidAmountRange = await call("/expenses?minAmount=15&maxAmount=10", { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(invalidAmountRange.status === 422, "invalid amount range was not rejected");
  const budget = await call("/budgets/2026-10", { method: "PUT", ...json({ amount: 900 }, adminToken) });
  assert(budget.status === 200 && budget.body.amount === 900, "budget update failed");
  const updatedCategory = await call(`/categories/${categoryId}`, { method: "PATCH", ...json({ name: "Smoke Updated", color: "#654321", icon: "chart" }, adminToken) });
  assert(updatedCategory.status === 200 && updatedCategory.body.item.icon === "chart", "category update or icon persistence failed");
  const deletedCategory = await call(`/categories/${categoryId}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken}` } });
  assert(deletedCategory.status === 200, "category deletion failed");
  const afterDelete = await call("/expenses?search=Smoke%20reassignment", { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(afterDelete.status === 200 && afterDelete.body.items[0]?.category.name === "Uncategorized", "category reassignment failed");
  const userExpenses = await call("/expenses", { headers: { Authorization: `Bearer ${userAuth.body.token}` } });
  assert(userExpenses.status === 200 && userExpenses.body.total === 0, "expense ownership boundary failed");
  console.log("Retain smoke test passed: auth, admin authorization, ownership, complete monthly summaries, deep links, validation, budgets, category CRUD, reassignment, month/date filtering, and amount filtering.");
} catch (error) {
  console.error(`Retain smoke test failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  server.kill();
  rmSync(dataDir, { recursive: true, force: true });
}
