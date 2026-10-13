import { configureStore } from "@reduxjs/toolkit";
import expensesReducer from "./slices/expensesSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: { expenses: expensesReducer, ui: uiReducer },
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
