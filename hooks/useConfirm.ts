import { useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { showConfirm, hideConfirm } from "@/store/slices/toastSlice";

// Global callback store
const confirmCallbacks: Record<string, () => void> = {};

export const useConfirm = () => {
  const dispatch = useAppDispatch();

  const confirm = ({
  title,
  message,
  variant = "danger",
  confirmText,
  cancelText,
  onConfirm,
}: {
  title: string;
  message: string;
  variant?: "danger" | "info";
  confirmText: string;  // ← caller passes translated text
  cancelText: string;   // ← caller passes translated text
  onConfirm: () => void;
}) => {
  const key = Date.now().toString();
  confirmCallbacks[key] = onConfirm;
  dispatch(showConfirm({ title, message, variant, onConfirm: key, confirmText, cancelText }));
};

  return { confirm };
};

// Used inside ConfirmModal to execute callback
export const executeConfirmCallback = (key: string) => {
  if (confirmCallbacks[key]) {
    confirmCallbacks[key]();
    delete confirmCallbacks[key];
  }
};