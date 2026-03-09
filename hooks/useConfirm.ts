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
    onConfirm,
  }: {
    title: string;
    message: string;
    variant?: "danger" | "info";
    onConfirm: () => void;
  }) => {
    const key = Date.now().toString();
    confirmCallbacks[key] = onConfirm;
    dispatch(showConfirm({ title, message, variant, onConfirm: key }));
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