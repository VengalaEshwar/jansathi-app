import { useEffect } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeToast } from "@/store/slices/toastSlice";

const ICONS = {
  success: { icon: CheckCircle, color: "#22C55E", bg: "#052e16" },
  error: { icon: XCircle, color: "#EF4444", bg: "#2d0a0a" },
  info: { icon: Info, color: "#3B82F6", bg: "#0a1628" },
  warning: { icon: AlertTriangle, color: "#F59E0B", bg: "#1c1206" },
};

function ToastItem({ id, message, type }: { id: string; message: string; type: keyof typeof ICONS }) {
  const dispatch = useAppDispatch();
  const { icon: Icon, color, bg } = ICONS[type];

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(id)), 3500);
    return () => clearTimeout(timer);
  }, [id]);

  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: bg,
      borderWidth: 1,
      borderColor: color,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      gap: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    }}>
      <Icon size={18} color={color} />
      <Text style={{ color: "#F8FAFC", flex: 1, fontSize: 14 }}>{message}</Text>
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