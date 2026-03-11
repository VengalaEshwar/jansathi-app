import { useEffect } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeToast } from "@/store/slices/toastSlice";

const ICONS = {
  success: { icon: CheckCircle, color: "#22C55E", bgClass: "bg-green-50 dark:bg-[#052e16]", borderClass: "border-green-500 dark:border-[#22C55E]" },
  error: { icon: XCircle, color: "#EF4444", bgClass: "bg-red-50 dark:bg-[#2d0a0a]", borderClass: "border-red-500 dark:border-[#EF4444]" },
  info: { icon: Info, color: "#3B82F6", bgClass: "bg-blue-50 dark:bg-[#0a1628]", borderClass: "border-blue-500 dark:border-[#3B82F6]" },
  warning: { icon: AlertTriangle, color: "#F59E0B", bgClass: "bg-amber-50 dark:bg-[#1c1206]", borderClass: "border-amber-500 dark:border-[#F59E0B]" },
};

function ToastItem({ id, message, type }: { id: string; message: string; type: keyof typeof ICONS }) {
  const dispatch = useAppDispatch();
  const { icon: Icon, color, bgClass, borderClass } = ICONS[type];

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(id)), 3500);
    return () => clearTimeout(timer);
  }, [id]);

  return (
    <View 
      className={`flex-row items-center border rounded-xl p-3 mb-2 gap-2.5 ${bgClass} ${borderClass}`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <Icon size={18} color={color} />
      <Text className="text-light-foreground dark:text-[#F8FAFC] flex-1 text-sm">{message}</Text>
      <Pressable onPress={() => dispatch(removeToast(id))}>
        <X size={16} color="#64748B" />
      </Pressable>
    </View>
  );
}

export function ToastContainer() {
  const toasts = useAppSelector((s) => s.toast.toasts);

  if (toasts.length === 0) return null;

  return (
    <View style={{
      position: "absolute",
      top: 60,
      left: 16,
      right: 16,
      zIndex : 100000,
    }}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </View>
  );
}