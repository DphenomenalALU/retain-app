import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { apiRequest } from "../../lib/api";
import type { DashboardSummary, Expense, ExpenseListResponse } from "../../types/retain";
import type { RootState } from "../store";

export type ExpenseFilters = { search: string; categoryId: string; paymentMethod: string; dateFrom: string; dateTo: string; minAmount: string; maxAmount: string; sortBy: "date" | "amount"; sortDirection: "asc" | "desc"; page: number; pageSize: number };
type TextFilterKey = "search" | "categoryId" | "paymentMethod" | "dateFrom" | "dateTo" | "minAmount" | "maxAmount";
export type ExpenseFilterAction =
  | { key: TextFilterKey; value: string }
  | { key: "sortBy"; value: ExpenseFilters["sortBy"] }
  | { key: "sortDirection"; value: ExpenseFilters["sortDirection"] }
  | { key: "page" | "pageSize"; value: number };
type ExpensesState = {
  items: Expense[];
  summary: DashboardSummary | null;
  searchResults: Expense[];
  total: number;
  totalPages: number;
  filters: ExpenseFilters;
  loading: boolean;
  summaryLoading: boolean;
  searchLoading: boolean;
  error: string | null;
  summaryError: string | null;
  searchError: string | null;
  requestId: string | null;
  summaryRequestId: string | null;
  searchRequestId: string | null;
};

const defaultFilters: ExpenseFilters = { search: "", categoryId: "", paymentMethod: "", dateFrom: "", dateTo: "", minAmount: "", maxAmount: "", sortBy: "date", sortDirection: "desc", page: 1, pageSize: 8 };
const initialState: ExpensesState = {
  items: [], summary: null, searchResults: [], total: 0, totalPages: 1, loading: false, summaryLoading: false, searchLoading: false,
  error: null, summaryError: null, searchError: null, requestId: null, summaryRequestId: null, searchRequestId: null, filters: defaultFilters,
};

export const fetchExpenses = createAsyncThunk<ExpenseListResponse, void, { state: RootState; rejectValue: string }>("expenses/fetch", async (_, thunkApi) => {
  const { filters } = thunkApi.getState().expenses;
  const params = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize), sortBy: filters.sortBy, sortDirection: filters.sortDirection });
  if (filters.search) params.set("search", filters.search);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.minAmount) params.set("minAmount", filters.minAmount);
  if (filters.maxAmount) params.set("maxAmount", filters.maxAmount);
  try { return await apiRequest<ExpenseListResponse>(`/expenses?${params}`, { signal: thunkApi.signal }); }
  catch (error) { return thunkApi.rejectWithValue(error instanceof Error ? error.message : "Unable to load expenses."); }
});

export const fetchExpenseSummary = createAsyncThunk<DashboardSummary, string, { rejectValue: string }>("expenses/fetchSummary", async (month, thunkApi) => {
  try { return await apiRequest<DashboardSummary>(`/dashboard/summary?month=${encodeURIComponent(month)}`, { signal: thunkApi.signal }); }
  catch (error) { return thunkApi.rejectWithValue(error instanceof Error ? error.message : "Unable to load expense summary."); }
});

export const searchExpenses = createAsyncThunk<ExpenseListResponse, string, { rejectValue: string }>("expenses/search", async (query, thunkApi) => {
  const params = new URLSearchParams({ page: "1", pageSize: "8", sortBy: "date", sortDirection: "desc", search: query });
  try { return await apiRequest<ExpenseListResponse>(`/expenses?${params}`, { signal: thunkApi.signal }); }
  catch (error) { return thunkApi.rejectWithValue(error instanceof Error ? error.message : "Unable to search expenses."); }
});

const expensesSlice = createSlice({
  name: "expenses", initialState,
  reducers: {
    setFilter(state, action: PayloadAction<ExpenseFilterAction>) {
      if (action.payload.key === "page" || action.payload.key === "pageSize") state.filters[action.payload.key] = action.payload.value;
      else if (action.payload.key === "sortBy") state.filters.sortBy = action.payload.value;
      else if (action.payload.key === "sortDirection") state.filters.sortDirection = action.payload.value;
      else state.filters[action.payload.key as TextFilterKey] = action.payload.value as string;
      if (action.payload.key !== "page" && action.payload.key !== "pageSize") state.filters.page = 1;
    },
    resetFilters(state) { state.filters = { ...defaultFilters }; },
    clearSearchResults(state) { state.searchResults = []; state.searchError = null; state.searchLoading = false; state.searchRequestId = null; },
    resetExpenses: () => initialState,
    upsertExpense(state, action: PayloadAction<Expense>) { const index = state.items.findIndex((item) => item.id === action.payload.id); if (index >= 0) state.items[index] = action.payload; else state.items.unshift(action.payload); },
    removeExpense(state, action: PayloadAction<string>) { const existed = state.items.some((item) => item.id === action.payload); state.items = state.items.filter((item) => item.id !== action.payload); state.searchResults = state.searchResults.filter((item) => item.id !== action.payload); if (existed) state.total = Math.max(state.total - 1, 0); },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state, action) => { state.loading = true; state.error = null; state.requestId = action.meta.requestId; })
      .addCase(fetchExpenses.fulfilled, (state, action) => { if (state.requestId !== action.meta.requestId) return; state.loading = false; state.items = action.payload.items; state.total = action.payload.total; state.totalPages = action.payload.totalPages; })
      .addCase(fetchExpenses.rejected, (state, action) => { if (state.requestId !== action.meta.requestId) return; state.loading = false; if (!action.meta.aborted) state.error = action.payload ?? "Unable to load expenses."; })
      .addCase(fetchExpenseSummary.pending, (state, action) => { state.summaryLoading = true; state.summaryError = null; state.summaryRequestId = action.meta.requestId; })
      .addCase(fetchExpenseSummary.fulfilled, (state, action) => { if (state.summaryRequestId !== action.meta.requestId) return; state.summaryLoading = false; state.summary = action.payload; })
      .addCase(fetchExpenseSummary.rejected, (state, action) => { if (state.summaryRequestId !== action.meta.requestId) return; state.summaryLoading = false; if (!action.meta.aborted) state.summaryError = action.payload ?? "Unable to load expense summary."; })
      .addCase(searchExpenses.pending, (state, action) => { state.searchLoading = true; state.searchError = null; state.searchRequestId = action.meta.requestId; })
      .addCase(searchExpenses.fulfilled, (state, action) => { if (state.searchRequestId !== action.meta.requestId) return; state.searchLoading = false; state.searchResults = action.payload.items; })
      .addCase(searchExpenses.rejected, (state, action) => { if (state.searchRequestId !== action.meta.requestId) return; state.searchLoading = false; if (!action.meta.aborted) state.searchError = action.payload ?? "Unable to search expenses."; });
  },
});

export const { clearSearchResults, removeExpense, resetExpenses, resetFilters, setFilter, upsertExpense } = expensesSlice.actions;
export default expensesSlice.reducer;
