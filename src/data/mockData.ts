import type { Budget, Expense, ExpenseCategory, User } from "../types/retain";

export const demoUser: User = { id: "usr_001", name: "Maya Ibrahim", email: "maya@retain.app", role: "admin" };
export const categories: ExpenseCategory[] = [
  { id: "cat_001", name: "Food & dining", color: "#eeb390", icon: "utensils", count: 12 },
  { id: "cat_002", name: "Transport", color: "#bfdbfe", icon: "car", count: 8 },
  { id: "cat_003", name: "Home", color: "#b7aee9", icon: "house", count: 6 },
  { id: "cat_004", name: "Wellness", color: "#b1ebc5", icon: "heart", count: 4 },
  { id: "cat_005", name: "Uncategorized", color: "#cfcfcf", icon: "tag", count: 1 },
];
export const mockExpenses: Expense[] = [
  { id: "exp_001", title: "Market groceries", amount: 86.4, category: categories[0], date: "2026-10-12", paymentMethod: "Card", note: "Weekly staples" },
  { id: "exp_002", title: "Ride to the studio", amount: 18.5, category: categories[1], date: "2026-10-11", paymentMethod: "Transfer" },
  { id: "exp_003", title: "Home internet", amount: 52, category: categories[2], date: "2026-10-10", paymentMethod: "Card" },
  { id: "exp_004", title: "Pilates class", amount: 34, category: categories[3], date: "2026-10-08", paymentMethod: "Card" },
  { id: "exp_005", title: "Sunday lunch", amount: 42.75, category: categories[0], date: "2026-10-05", paymentMethod: "Cash" },
  { id: "exp_006", title: "Pharmacy refill", amount: 27.2, category: categories[3], date: "2026-10-03", paymentMethod: "Card" },
  { id: "exp_007", title: "Parking", amount: 12, category: categories[1], date: "2026-10-02", paymentMethod: "Cash" },
];
export const currentBudget: Budget = { month: "2026-10", amount: 1200 };
