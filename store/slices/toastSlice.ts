import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface ToastState {
  toasts: Toast[];
  confirm: {
    open: boolean;
    title: string;
    message: string;
    onConfirm: null | string; // store action key
    variant: "danger" | "info";
  };
}

const initialState: ToastState = {
  toasts: [],
  confirm: {
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    variant: "danger",
  },
};

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    addToast(state, action: PayloadAction<Omit<Toast, "id">>) {
      state.toasts.push({
        ...action.payload,
        id: Date.now().toString(),
      });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    showConfirm(state, action: PayloadAction<Omit<ToastState["confirm"], "open" | "onConfirm"> & { onConfirm: string }>) {
      state.confirm = { ...action.payload, open: true, onConfirm: action.payload.onConfirm };
    },
    hideConfirm(state) {
      state.confirm = initialState.confirm;
    },
  },
});

export const { addToast, removeToast, showConfirm, hideConfirm } = toastSlice.actions;
export default toastSlice.reducer;