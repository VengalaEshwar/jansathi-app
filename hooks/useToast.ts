import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/slices/toastSlice";

export const useToast = () => {
  const dispatch = useAppDispatch();

  return {
    success: (message: string) => dispatch(addToast({ message, type: "success" })),
    error: (message: string) => dispatch(addToast({ message, type: "error" })),
    info: (message: string) => dispatch(addToast({ message, type: "info" })),
    warning: (message: string) => dispatch(addToast({ message, type: "warning" })),
  };
};