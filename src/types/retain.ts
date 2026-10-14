export type UserRole = "user" | "admin";
export type User = { id: string; name: string; email: string; role: UserRole };
export type ExpenseCategory = { id: string; name: string; color: string; count?: number };
export type Expense = {
  id: string; title: string; amount: number; category: ExpenseCategory; date: string;
  paymentMethod: "Card" | "Transfer" | "Cash"; note?: string;
};
export type Budget = { month: string; amount: number };
export type ExpenseInput = { title: string; amount: number; categoryId: string; date: string; paymentMethod: Expense["paymentMethod"]; note?: string };
export type ExpenseListResponse = { items: Expense[]; page: number; pageSize: number; total: number; totalPages: number };
