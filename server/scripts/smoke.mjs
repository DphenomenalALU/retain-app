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
  const adminAuth = await call("/auth/signin", { method: "POST", ...json({ email: "maya@retain.app", password: "password" }) });
  assert(adminAuth.status === 200 && adminAuth.body?.token, "admin sign-in failed");
  const adminToken = adminAuth.body.token;
  const insights = await call("/admin/insights", { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(insights.status === 200 && insights.body?.totals?.users === 1, "admin insights failed");

  const userAuth = await call("/auth/signup", { method: "POST", ...json({ name: "Smoke User", email: "smoke@example.test", password: "password123" }) });
  assert(userAuth.status === 201 && userAuth.body?.token, "user sign-up failed");
  const forbidden = await call("/admin/insights", { headers: { Authorization: `Bearer ${userAuth.body.token}` } });
  assert(forbidden.status === 403, "non-admin access was not rejected");

  const category = await call("/categories", { method: "POST", ...json({ name: "Smoke Category", color: "#123456" }, adminToken) });
  assert(category.status === 201, "category creation failed");
  const categoryId = category.body.item.id;
  const createdExpense = await call("/expenses", { method: "POST", ...json({ title: "Smoke reassignment", amount: 12.5, categoryId, date: "2026-10-16", paymentMethod: "Cash" }, adminToken) });
  assert(createdExpense.status === 201, "expense creation failed");
  const filtered = await call("/expenses?dateFrom=2026-10-16&dateTo=2026-10-16", { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(filtered.status === 200 && filtered.body.items.some((item) => item.title === "Smoke reassignment"), "date filtering failed");
  const budget = await call("/budgets/2026-10", { method: "PUT", ...json({ amount: 900 }, adminToken) });
  assert(budget.status === 200 && budget.body.amount === 900, "budget update failed");
  const updatedCategory = await call(`/categories/${categoryId}`, { method: "PATCH", ...json({ name: "Smoke Updated", color: "#654321" }, adminToken) });
  assert(updatedCategory.status === 200, "category update failed");
  const deletedCategory = await call(`/categories/${categoryId}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken}` } });
  assert(deletedCategory.status === 200, "category deletion failed");
  const afterDelete = await call("/expenses?search=Smoke%20reassignment", { headers: { Authorization: `Bearer ${adminToken}` } });
  assert(afterDelete.status === 200 && afterDelete.body.items[0]?.category.name === "Uncategorized", "category reassignment failed");
  const userExpenses = await call("/expenses", { headers: { Authorization: `Bearer ${userAuth.body.token}` } });
  assert(userExpenses.status === 200 && userExpenses.body.total === 0, "expense ownership boundary failed");
  console.log("Retain smoke test passed: auth, admin authorization, ownership, budgets, category CRUD, reassignment, and date filtering.");
} catch (error) {
  console.error(`Retain smoke test failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  server.kill();
  rmSync(dataDir, { recursive: true, force: true });
}
