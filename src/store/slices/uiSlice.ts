import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UiState = { sidebarOpen: boolean; toast: string | null };
const initialState: UiState = { sidebarOpen: false, toast: null };

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarOpen(state, action: PayloadAction<boolean>) { state.sidebarOpen = action.payload; },
    setToast(state, action: PayloadAction<string | null>) { state.toast = action.payload; },
  },
});

export const { setSidebarOpen, setToast } = uiSlice.actions;
export default uiSlice.reducer;
