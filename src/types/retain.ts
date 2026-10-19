export type UserRole = "user" | "admin";
export type User = { id: string; name: string; email: string; role: UserRole };
export type ExpenseCategory = { id: string; name: string; color: string; icon: string; count?: number };
export type Expense = {
  id: string; title: string; amount: number; category: ExpenseCategory; date: string;
  paymentMethod: "Card" | "Transfer" | "Cash"; note?: string;
};
export type Budget = { month: string; amount: number };
export type ExpenseInput = { title: string; amount: number; categoryId: string; date: string; paymentMethod: Expense["paymentMethod"]; note?: string };
export type ExpenseListResponse = { items: Expense[]; page: number; pageSize: number; total: number; totalPages: number };
export type DashboardSummary = {
  month: string;
  total: number;
  count: number;
  largestExpense: Expense | null;
  recentExpenses: Expense[];
  byCategory: Array<{ category: ExpenseCategory; total: number; count: number }>;
};
export type AdminUser = User & { createdAt: string };
export type AdminCategory = ExpenseCategory & { isSystem: boolean; expenseCount: number };
export type AdminExpense = Expense & { user: AdminUser };
export type AdminInsights = {
  currentMonth: string;
  totals: { users: number; expenses: number; value: number; currentMonthExpenses: number };
  spendingByCategory: Array<{ category: ExpenseCategory; total: number; count: number }>;
  topCategories: Array<{ category: ExpenseCategory; count: number; total: number }>;
  bottomCategories: Array<{ category: ExpenseCategory; count: number; total: number }>;
  recentExpenses: AdminExpense[];
  recentUsers: AdminUser[];
};
