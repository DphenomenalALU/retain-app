import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { apiRequest } from "../../lib/api";
import { currentMonth } from "../../lib/date";
import type { Budget } from "../../types/retain";
import type { RootState } from "../store";

type BudgetState = { current: Budget; loading: boolean; saving: boolean; error: string | null; requestId: string | null };
const initialState: BudgetState = { current: { month: currentMonth(), amount: 0 }, loading: false, saving: false, error: null, requestId: null };

export const fetchBudget = createAsyncThunk<Budget, string, { state: RootState; rejectValue: string }>("budget/fetch", async (month, thunkApi) => { try { return await apiRequest<Budget>(`/budgets/${month}`, { signal: thunkApi.signal }); } catch (error) { return thunkApi.rejectWithValue(error instanceof Error ? error.message : "Unable to load budget."); } });
export const saveBudget = createAsyncThunk<Budget, Budget, { rejectValue: string }>("budget/save", async (budget, thunkApi) => { try { return await apiRequest<Budget>(`/budgets/${budget.month}`, { method: "PUT", body: JSON.stringify({ amount: budget.amount }), signal: thunkApi.signal }); } catch (error) { return thunkApi.rejectWithValue(error instanceof Error ? error.message : "Unable to save budget."); } });

const budgetSlice = createSlice({ name: "budget", initialState, reducers: { setCurrentBudget(state, action: PayloadAction<Budget>) { state.current = action.payload; }, resetBudget: () => initialState }, extraReducers: (builder) => { builder.addCase(fetchBudget.pending, (state, action) => { state.loading = true; state.error = null; state.requestId = action.meta.requestId; }).addCase(fetchBudget.fulfilled, (state, action) => { if (state.requestId !== action.meta.requestId) return; state.loading = false; state.current = action.payload; }).addCase(fetchBudget.rejected, (state, action) => { if (state.requestId !== action.meta.requestId) return; state.loading = false; if (!action.meta.aborted) state.error = action.payload ?? "Unable to load budget."; }).addCase(saveBudget.pending, (state) => { state.saving = true; state.error = null; }).addCase(saveBudget.fulfilled, (state, action) => { state.saving = false; state.current = action.payload; }).addCase(saveBudget.rejected, (state, action) => { state.saving = false; state.error = action.payload ?? "Unable to save budget."; }); } });
export const { resetBudget, setCurrentBudget } = budgetSlice.actions;
export default budgetSlice.reducer;
