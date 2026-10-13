import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { mockExpenses } from "../../data/mockData";
import type { Expense } from "../../types/retain";

type ExpensesState = { items: Expense[]; selectedMonth: string };
const initialState: ExpensesState = { items: mockExpenses, selectedMonth: "2026-10" };

const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    setSelectedMonth(state, action: PayloadAction<string>) { state.selectedMonth = action.payload; },
    replaceExpenses(state, action: PayloadAction<Expense[]>) { state.items = action.payload; },
  },
});

export const { replaceExpenses, setSelectedMonth } = expensesSlice.actions;
export default expensesSlice.reducer;
