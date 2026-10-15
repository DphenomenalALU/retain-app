import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { apiRequest } from "../../lib/api";
import type { Expense, ExpenseListResponse } from "../../types/retain";
import type { RootState } from "../store";

export type ExpenseFilters = { search: string; categoryId: string; paymentMethod: string; dateFrom: string; dateTo: string; sortBy: "date" | "amount"; sortDirection: "asc" | "desc"; page: number; pageSize: number };
type ExpensesState = { items: Expense[]; summaryItems: Expense[]; total: number; totalPages: number; selectedMonth: string; filters: ExpenseFilters; loading: boolean; summaryLoading: boolean; error: string | null };

const initialState: ExpensesState = {
  items: [], summaryItems: [], total: 0, totalPages: 1, selectedMonth: "2026-10", loading: false, summaryLoading: false, error: null,
  filters: { search: "", categoryId: "", paymentMethod: "", dateFrom: "", dateTo: "", sortBy: "date", sortDirection: "desc", page: 1, pageSize: 8 },
};

export const fetchExpenses = createAsyncThunk<ExpenseListResponse, void, { state: RootState; rejectValue: string }>("expenses/fetch", async (_, thunkApi) => {
  const { filters } = thunkApi.getState().expenses;
  const params = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize), sortBy: filters.sortBy, sortDirection: filters.sortDirection });
  if (filters.search) params.set("search", filters.search);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  try { return await apiRequest<ExpenseListResponse>(`/expenses?${params}`); }
  catch (error) { return thunkApi.rejectWithValue(error instanceof Error ? error.message : "Unable to load expenses."); }
});
export const fetchExpenseSummary = createAsyncThunk<ExpenseListResponse, void, { rejectValue: string }>("expenses/fetchSummary", async (_, thunkApi) => { try { return await apiRequest<ExpenseListResponse>("/expenses?page=1&pageSize=50&sortBy=date&sortDirection=desc"); } catch (error) { return thunkApi.rejectWithValue(error instanceof Error ? error.message : "Unable to load expense summary."); } });

const expensesSlice = createSlice({
  name: "expenses", initialState,
  reducers: {
    setSelectedMonth(state, action: PayloadAction<string>) { state.selectedMonth = action.payload; },
    setFilter(state, action: PayloadAction<{ key: keyof ExpenseFilters; value: string | number }>) { const { key, value } = action.payload; state.filters[key] = value as never; if (key !== "page" && key !== "pageSize") state.filters.page = 1; },
    resetFilters(state) { state.filters = initialState.filters; },
    upsertExpense(state, action: PayloadAction<Expense>) { const index = state.items.findIndex((item) => item.id === action.payload.id); if (index >= 0) state.items[index] = action.payload; else state.items.unshift(action.payload); state.total = state.items.length; },
    removeExpense(state, action: PayloadAction<string>) { state.items = state.items.filter((item) => item.id !== action.payload); state.total = Math.max(state.total - 1, 0); },
  },
  extraReducers: (builder) => { builder.addCase(fetchExpenses.pending, (state) => { state.loading = true; state.error = null; }).addCase(fetchExpenses.fulfilled, (state, action) => { state.loading = false; state.items = action.payload.items; state.total = action.payload.total; state.totalPages = action.payload.totalPages; }).addCase(fetchExpenses.rejected, (state, action) => { state.loading = false; state.error = action.payload ?? "Unable to load expenses."; }).addCase(fetchExpenseSummary.pending, (state) => { state.summaryLoading = true; }).addCase(fetchExpenseSummary.fulfilled, (state, action) => { state.summaryLoading = false; state.summaryItems = action.payload.items; }).addCase(fetchExpenseSummary.rejected, (state, action) => { state.summaryLoading = false; state.error = action.payload ?? "Unable to load expense summary."; }); },
});

export const { removeExpense, resetFilters, setFilter, setSelectedMonth, upsertExpense } = expensesSlice.actions;
export default expensesSlice.reducer;
