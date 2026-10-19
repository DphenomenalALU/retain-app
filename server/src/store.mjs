import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool, types: pgTypes } = pg;
pgTypes.setTypeParser(1082, (value) => value);
const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "../data");
const defaultDataFile = join(dataDir, "retain.json");
const isProduction = process.env.NODE_ENV === "production";
const configuredAdminEmail = process.env.RETAIN_ADMIN_EMAIL?.trim().toLowerCase() || (!isProduction ? "emmanuel@retain.app" : "");
const configuredAdminPassword = process.env.RETAIN_ADMIN_PASSWORD || (!isProduction ? "12345678" : "");
const seedDemoData = process.env.RETAIN_SEED_DEMO === "true" || !isProduction;
const legacyDemoEmail = "emmanuel@retain.app";

export const defaultCategoryIcons = { cat_001: "utensils", cat_002: "car", cat_003: "house", cat_004: "heart", cat_005: "tag" };
export const allowedCategoryIcons = new Set(["utensils", "car", "house", "heart", "bag", "plane", "book", "gift", "bolt", "phone", "music", "briefcase", "paw", "camera", "coffee", "sun", "wallet", "receipt", "tag", "chart", "repeat", "sparkle"]);
export const seededCategories = [
  { id: "cat_001", name: "Food & dining", color: "#EEB390", icon: "utensils", isSystem: false },
  { id: "cat_002", name: "Transport", color: "#BFDBFE", icon: "car", isSystem: false },
  { id: "cat_003", name: "Home", color: "#B7AEE9", icon: "house", isSystem: false },
  { id: "cat_004", name: "Wellness", color: "#B1EBC5", icon: "heart", isSystem: false },
  { id: "cat_005", name: "Uncategorized", color: "#CFCFCF", icon: "tag", isSystem: true },
];

const seededExpenses = [
  ["exp_001", "Market groceries", 86.4, "cat_001", "2026-10-12", "Card", "Weekly staples"],
  ["exp_002", "Ride to the studio", 18.5, "cat_002", "2026-10-11", "Transfer", null],
  ["exp_003", "Home internet", 52, "cat_003", "2026-10-10", "Card", null],
  ["exp_004", "Pilates class", 34, "cat_004", "2026-10-08", "Card", null],
  ["exp_005", "Sunday lunch", 42.75, "cat_001", "2026-10-05", "Cash", null],
  ["exp_006", "Pharmacy refill", 27.2, "cat_004", "2026-10-03", "Card", null],
  ["exp_007", "Parking", 12, "cat_002", "2026-10-02", "Cash", null],
];

const demoAdmin = configuredAdminEmail && configuredAdminPassword ? { id: "usr_001", name: process.env.RETAIN_ADMIN_NAME?.trim() || "Emmanuel Annor", email: configuredAdminEmail, role: "admin" } : null;

const emptyData = () => ({ users: [], categories: structuredClone(seededCategories), expenses: [], budgets: [] });
const makeId = (prefix) => `${prefix}_${randomUUID().slice(0, 8)}`;

const mapUser = (row) => row && ({ id: row.id, name: row.name, email: row.email, passwordHash: row.password_hash ?? row.passwordHash, role: row.role, createdAt: row.created_at?.toISOString?.() ?? row.createdAt });
const mapCategory = (row) => row && ({ id: row.id, name: row.name, color: row.color, icon: row.icon, isSystem: Boolean(row.is_system ?? row.isSystem), createdAt: row.created_at?.toISOString?.() ?? row.createdAt });
const mapExpense = (row) => row && ({ id: row.id, userId: row.user_id ?? row.userId, title: row.title, amount: Number(row.amount), categoryId: row.category_id ?? row.categoryId, date: typeof row.expense_date === "string" ? row.expense_date : row.date, paymentMethod: row.payment_method ?? row.paymentMethod, note: row.note ?? undefined, createdAt: row.created_at?.toISOString?.() ?? row.createdAt, updatedAt: row.updated_at?.toISOString?.() ?? row.updatedAt });
const mapBudget = (row) => row && ({ id: row.id, userId: row.user_id ?? row.userId, month: typeof row.month === "string" ? row.month.slice(0, 7) : row.month, amount: Number(row.amount) });

const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL DEFAULT '#9AA6A2',
  icon TEXT NOT NULL DEFAULT 'tag',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Card', 'Transfer', 'Cash')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  UNIQUE (user_id, month)
);
CREATE INDEX IF NOT EXISTS expenses_user_date_idx ON expenses(user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON expenses(category_id);
`;

const jsonStore = (dataFile) => {
  mkdirSync(dirname(dataFile), { recursive: true });
  const load = () => {
    if (!existsSync(dataFile)) return emptyData();
    try { return JSON.parse(readFileSync(dataFile, "utf8")); } catch { return emptyData(); }
  };
  const data = load();
  const save = () => writeFileSync(dataFile, JSON.stringify(data, null, 2));
  const seed = () => {
    let changed = false;
    if (!data.categories.length) { data.categories.push(...structuredClone(seededCategories)); changed = true; }
    if (isProduction && !demoAdmin) {
      const legacyAdmin = data.users.find((user) => user.email === legacyDemoEmail && user.role === "admin");
      if (legacyAdmin) { legacyAdmin.role = "user"; changed = true; }
    }
    if (demoAdmin) {
      const existingDemoAdmin = data.users.find((user) => user.id === demoAdmin.id || user.email === demoAdmin.email);
      if (!existingDemoAdmin) {
        data.users.push({ ...demoAdmin, passwordHash: bcrypt.hashSync(configuredAdminPassword, 10), createdAt: new Date().toISOString() });
        changed = true;
      } else {
        Object.assign(existingDemoAdmin, { ...demoAdmin, passwordHash: bcrypt.hashSync(configuredAdminPassword, 10), createdAt: existingDemoAdmin.createdAt ?? new Date().toISOString() });
        changed = true;
      }
      if (seedDemoData && !data.expenses.length) {
        data.budgets.push({ id: "bud_001", userId: demoAdmin.id, month: "2026-10", amount: 1200 });
        data.expenses.push(...seededExpenses.map(([id, title, amount, categoryId, date, paymentMethod, note]) => ({ id, userId: demoAdmin.id, title, amount, categoryId, date, paymentMethod, note })));
        changed = true;
      }
    }
    if (changed || !existsSync(dataFile)) save();
  };
  seed();
  return {
    kind: "json",
    async close() {},
    async getUserByEmail(email) { return data.users.find((user) => user.email === email) ?? null; },
    async getUserById(id) { return data.users.find((user) => user.id === id) ?? null; },
    async listUsers() { return [...data.users]; },
    async deleteUser(id) { data.users = data.users.filter((user) => user.id !== id); data.expenses = data.expenses.filter((expense) => expense.userId !== id); data.budgets = data.budgets.filter((budget) => budget.userId !== id); save(); },
    async createUser(user) { data.users.push(user); save(); return user; },
    async listCategories() { return [...data.categories]; },
    async getCategoryById(id) { return data.categories.find((category) => category.id === id) ?? null; },
    async categoryNameExists(name, exceptId) { return data.categories.some((category) => category.id !== exceptId && category.name.toLowerCase() === name.toLowerCase()); },
    async createCategory(category) { data.categories.push(category); save(); return category; },
    async updateCategory(id, values) { const category = data.categories.find((candidate) => candidate.id === id); Object.assign(category, values); save(); return category; },
    async deleteCategory(id, fallbackId) { data.expenses.forEach((expense) => { if (expense.categoryId === id) expense.categoryId = fallbackId; }); data.categories = data.categories.filter((category) => category.id !== id); save(); },
    async listExpenses(userId) { return data.expenses.filter((expense) => expense.userId === userId).map((expense) => ({ ...expense })); },
    async listAllExpenses() { return [...data.expenses]; },
    async createExpense(expense) { data.expenses.unshift(expense); save(); return expense; },
    async getExpense(id, userId) { return data.expenses.find((expense) => expense.id === id && expense.userId === userId) ?? null; },
    async updateExpense(id, userId, values) { const expense = await this.getExpense(id, userId); Object.assign(expense, values, { updatedAt: new Date().toISOString() }); save(); return expense; },
    async deleteExpense(id, userId) { data.expenses = data.expenses.filter((expense) => !(expense.id === id && expense.userId === userId)); save(); },
    async getMonthlySummary(userId, month) {
      const rows = data.expenses.filter((expense) => expense.userId === userId && expense.date.startsWith(month)).map((expense) => ({ ...expense }));
      const byCategory = new Map();
      for (const expense of rows) {
        const current = byCategory.get(expense.categoryId) ?? { categoryId: expense.categoryId, total: 0, count: 0 };
        current.total += Number(expense.amount);
        current.count += 1;
        byCategory.set(expense.categoryId, current);
      }
      const ordered = [...rows].sort((left, right) => Number(right.amount) - Number(left.amount) || (right.createdAt ?? right.date).localeCompare(left.createdAt ?? left.date));
      const recentExpenses = [...rows].sort((left, right) => (right.date ?? "").localeCompare(left.date ?? "") || (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
      return { total: rows.reduce((sum, expense) => sum + Number(expense.amount), 0), count: rows.length, byCategory: [...byCategory.values()], largestExpense: ordered[0] ?? null, recentExpenses: recentExpenses.slice(0, 4) };
    },
    async getBudget(userId, month) { return data.budgets.find((budget) => budget.userId === userId && budget.month === month) ?? null; },
    async upsertBudget(userId, month, amount) { const existing = await this.getBudget(userId, month); if (existing) existing.amount = amount; else data.budgets.push({ id: makeId("bud"), userId, month, amount }); save(); return { month, amount }; },
  };
};

const postgresStore = async (connectionString) => {
  const pool = new Pool({ connectionString, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined, max: 10 });
  await pool.query(schemaSql);
  await pool.query("INSERT INTO categories (id, name, color, icon, is_system) VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10), ($11, $12, $13, $14, $15), ($16, $17, $18, $19, $20), ($21, $22, $23, $24, $25) ON CONFLICT (id) DO NOTHING", seededCategories.flatMap((category) => [category.id, category.name, category.color, category.icon, category.isSystem]));
  if (demoAdmin) {
    const passwordHash = bcrypt.hashSync(configuredAdminPassword, 10);
    await pool.query("INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role", [demoAdmin.id, demoAdmin.name, demoAdmin.email, passwordHash, demoAdmin.role]);
    if (isProduction && demoAdmin.email !== legacyDemoEmail) await pool.query("UPDATE users SET role = 'user' WHERE lower(email) = $1 AND id <> $2", [legacyDemoEmail, demoAdmin.id]);
  }
  const { rows: expenseCount } = await pool.query("SELECT COUNT(*)::int AS count FROM expenses");
  if (demoAdmin && seedDemoData && expenseCount[0].count === 0) {
    await pool.query("INSERT INTO budgets (id, user_id, month, amount) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING", ["bud_001", demoAdmin.id, "2026-10-01", 1200]);
    for (const [expenseId, title, amount, categoryId, date, paymentMethod, note] of seededExpenses) await pool.query("INSERT INTO expenses (id, user_id, category_id, title, amount, expense_date, payment_method, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING", [expenseId, demoAdmin.id, categoryId, title, amount, date, paymentMethod, note]);
  }
  return {
    kind: "postgres",
    async close() { await pool.end(); },
    async getUserByEmail(email) { const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]); return mapUser(rows[0]); },
    async getUserById(id) { const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]); return mapUser(rows[0]); },
    async listUsers() { const { rows } = await pool.query("SELECT * FROM users ORDER BY created_at DESC"); return rows.map(mapUser); },
    async deleteUser(id) { await pool.query("DELETE FROM users WHERE id = $1", [id]); },
    async createUser(user) { const { rows } = await pool.query("INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [user.id, user.name, user.email, user.passwordHash, user.role, user.createdAt]); return mapUser(rows[0]); },
    async listCategories() { const { rows } = await pool.query("SELECT * FROM categories ORDER BY created_at ASC, name ASC"); return rows.map(mapCategory); },
    async getCategoryById(id) { const { rows } = await pool.query("SELECT * FROM categories WHERE id = $1", [id]); return mapCategory(rows[0]); },
    async categoryNameExists(name, exceptId) { const { rows } = await pool.query("SELECT 1 FROM categories WHERE lower(name) = lower($1) AND ($2::text IS NULL OR id <> $2) LIMIT 1", [name, exceptId ?? null]); return Boolean(rows[0]); },
    async createCategory(category) { const { rows } = await pool.query("INSERT INTO categories (id, name, color, icon, is_system, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [category.id, category.name, category.color, category.icon, category.isSystem, category.createdAt]); return mapCategory(rows[0]); },
    async updateCategory(id, values) { const { rows } = await pool.query("UPDATE categories SET name = $1, color = $2, icon = $3 WHERE id = $4 RETURNING *", [values.name, values.color, values.icon, id]); return mapCategory(rows[0]); },
    async deleteCategory(id, fallbackId) { const client = await pool.connect(); try { await client.query("BEGIN"); await client.query("UPDATE expenses SET category_id = $1, updated_at = NOW() WHERE category_id = $2", [fallbackId, id]); await client.query("DELETE FROM categories WHERE id = $1", [id]); await client.query("COMMIT"); } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); } },
    async listExpenses(userId) { const { rows } = await pool.query("SELECT * FROM expenses WHERE user_id = $1 ORDER BY expense_date DESC, created_at DESC", [userId]); return rows.map(mapExpense); },
    async queryExpenses(userId, options) {
      const values = [userId];
      const clauses = ["user_id = $1"];
      const addValue = (value) => { values.push(value); return `$${values.length}`; };
      if (options.search) { const placeholder = addValue(`%${options.search}%`); clauses.push(`(title ILIKE ${placeholder} OR COALESCE(note, '') ILIKE ${placeholder})`); }
      if (options.categoryId) clauses.push(`category_id = ${addValue(options.categoryId)}`);
      if (options.paymentMethod) clauses.push(`payment_method = ${addValue(options.paymentMethod)}`);
      if (options.month) { const placeholder = addValue(`${options.month}-01`); clauses.push(`expense_date >= ${placeholder}::date AND expense_date < (${placeholder}::date + INTERVAL '1 month')`); }
      if (options.dateFrom) clauses.push(`expense_date >= ${addValue(options.dateFrom)}::date`);
      if (options.dateTo) clauses.push(`expense_date <= ${addValue(options.dateTo)}::date`);
      if (options.minAmount !== null) clauses.push(`amount >= ${addValue(options.minAmount)}`);
      if (options.maxAmount !== null) clauses.push(`amount <= ${addValue(options.maxAmount)}`);
      const where = clauses.join(" AND ");
      const orderColumn = options.sortBy === "amount" ? "amount" : "expense_date";
      const orderDirection = options.sortDirection === "asc" ? "ASC" : "DESC";
      const countQuery = pool.query(`SELECT COUNT(*)::int AS total FROM expenses WHERE ${where}`, values);
      const limitPosition = values.length + 1;
      const offsetPosition = values.length + 2;
      const rowsQuery = pool.query(`SELECT * FROM expenses WHERE ${where} ORDER BY ${orderColumn} ${orderDirection}, created_at DESC LIMIT $${limitPosition} OFFSET $${offsetPosition}`, [...values, options.pageSize, (options.page - 1) * options.pageSize]);
      const [{ rows: countRows }, { rows }] = await Promise.all([countQuery, rowsQuery]);
      return { rows: rows.map(mapExpense), total: countRows[0].total };
    },
    async listAllExpenses() { const { rows } = await pool.query("SELECT * FROM expenses ORDER BY created_at DESC, expense_date DESC"); return rows.map(mapExpense); },
    async createExpense(expense) { const { rows } = await pool.query("INSERT INTO expenses (id, user_id, category_id, title, amount, expense_date, payment_method, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *", [expense.id, expense.userId, expense.categoryId, expense.title, expense.amount, expense.date, expense.paymentMethod, expense.note ?? null]); return mapExpense(rows[0]); },
    async getExpense(id, userId) { const { rows } = await pool.query("SELECT * FROM expenses WHERE id = $1 AND user_id = $2", [id, userId]); return mapExpense(rows[0]); },
    async updateExpense(id, userId, values) { const { rows } = await pool.query("UPDATE expenses SET title = $1, amount = $2, category_id = $3, expense_date = $4, payment_method = $5, note = $6, updated_at = NOW() WHERE id = $7 AND user_id = $8 RETURNING *", [values.title, values.amount, values.categoryId, values.date, values.paymentMethod, values.note ?? null, id, userId]); return mapExpense(rows[0]); },
    async deleteExpense(id, userId) { await pool.query("DELETE FROM expenses WHERE id = $1 AND user_id = $2", [id, userId]); },
    async getMonthlySummary(userId, month) {
      const [totals, byCategory, largest, recent] = await Promise.all([
        pool.query("SELECT COALESCE(SUM(amount), 0)::numeric AS total, COUNT(*)::int AS count FROM expenses WHERE user_id = $1 AND expense_date >= $2::date AND expense_date < ($2::date + INTERVAL '1 month')", [userId, `${month}-01`]),
        pool.query("SELECT category_id, COALESCE(SUM(amount), 0)::numeric AS total, COUNT(*)::int AS count FROM expenses WHERE user_id = $1 AND expense_date >= $2::date AND expense_date < ($2::date + INTERVAL '1 month') GROUP BY category_id", [userId, `${month}-01`]),
        pool.query("SELECT * FROM expenses WHERE user_id = $1 AND expense_date >= $2::date AND expense_date < ($2::date + INTERVAL '1 month') ORDER BY amount DESC, expense_date DESC, created_at DESC LIMIT 1", [userId, `${month}-01`]),
        pool.query("SELECT * FROM expenses WHERE user_id = $1 AND expense_date >= $2::date AND expense_date < ($2::date + INTERVAL '1 month') ORDER BY expense_date DESC, created_at DESC LIMIT 4", [userId, `${month}-01`]),
      ]);
      return { total: Number(totals.rows[0].total), count: totals.rows[0].count, byCategory: byCategory.rows.map((row) => ({ categoryId: row.category_id, total: Number(row.total), count: row.count })), largestExpense: mapExpense(largest.rows[0]), recentExpenses: recent.rows.map(mapExpense) };
    },
    async getBudget(userId, month) { const { rows } = await pool.query("SELECT * FROM budgets WHERE user_id = $1 AND month = $2::date", [userId, `${month}-01`]); return mapBudget(rows[0]); },
    async upsertBudget(userId, month, amount) { await pool.query("INSERT INTO budgets (id, user_id, month, amount) VALUES ($1, $2, $3::date, $4) ON CONFLICT (user_id, month) DO UPDATE SET amount = EXCLUDED.amount", [makeId("bud"), userId, `${month}-01`, amount]); return { month, amount }; },
  };
};

export const createStore = async () => process.env.DATABASE_URL ? postgresStore(process.env.DATABASE_URL) : jsonStore(process.env.DATA_FILE ?? defaultDataFile);
