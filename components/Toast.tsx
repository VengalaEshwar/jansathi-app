// components/ToastContainer.tsx
import { useEffect, useRef, memo } from "react";
import { View, Text, Animated } from "react-native";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeToast } from "@/store/slices/toastSlice";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useSound } from "@/hooks/useSound";

// ── Toast config ──────────────────────────────────────────────────────────────
const TOAST_CONFIG = {
  success: {
    icon: CheckCircle, color: "#22C55E",
    lightBg: "#F0FDF4", darkBg: "#052e16",
    lightBorder: "#22C55E40", darkBorder: "#22C55E60",
  },
  error: {
    icon: XCircle, color: "#EF4444",
    lightBg: "#FEF2F2", darkBg: "#2d0a0a",
    lightBorder: "#EF444440", darkBorder: "#EF444460",
  },
  info: {
    icon: Info, color: "#3B82F6",
    lightBg: "#EFF6FF", darkBg: "#0a1628",
    lightBorder: "#3B82F640", darkBorder: "#3B82F660",
  },
  warning: {
    icon: AlertTriangle, color: "#F59E0B",
    lightBg: "#FFFBEB", darkBg: "#1c1206",
    lightBorder: "#F59E0B40", darkBorder: "#F59E0B60",
  },
} as const;

// Sound to play per toast type
const TOAST_SOUND: Record<keyof typeof TOAST_CONFIG, "soft" | "mechanical"> = {
  success: "mechanical",
  error:   "soft",
  info:    "soft",
  warning: "soft",
};

// ── ToastItem ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line react/display-name
const ToastItem = memo(({ id, message, type }: {
  id: string; message: string; type: keyof typeof TOAST_CONFIG;
}) => {
  const dispatch = useAppDispatch();
  const theme    = useAppSelector((s: any) => s.app?.theme ?? "dark");
  const isDark   = theme === "dark";
  const { playClick } = useSound();

  const cfg = TOAST_CONFIG[type];
  const { icon: Icon, color } = cfg;
  const bg     = isDark ? cfg.darkBg     : cfg.lightBg;
  const border = isDark ? cfg.darkBorder : cfg.lightBorder;
  const textColor = isDark ? "#F1F5F9" : "#0F172A";

  // Slide-in animation
  const translateY = useRef(new Animated.Value(-20)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Play sound when toast appears (respects soundEnabled via useSound hook)
    playClick(TOAST_SOUND[type]);

    // Animate in
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();

    // Auto-dismiss after 3.5s
    const timer = setTimeout(() => dispatch(removeToast(id)), 3500);
    return () => clearTimeout(timer);
  }, [id]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], marginBottom: 8 }}>
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: bg, borderWidth: 1, borderColor: border,
        borderRadius: 14, padding: 12,
        shadowColor: color, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18, shadowRadius: 10, elevation: 6,
      }}>
        {/* Colored left accent bar */}
        <View style={{ width: 3, height: 32, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />

        <Icon size={18} color={color} style={{ flexShrink: 0 }} />

        <Text style={{ color: textColor, fontSize: 13, lineHeight: 19, flex: 1 }}>
          {message}
        </Text>

        <AnimatedPressable onPress={() => dispatch(removeToast(id))} soundType="soft"
          style={{ width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center",
            backgroundColor: isDark ? "#334155" : "#F1F5F9", flexShrink: 0 }}>
          <X size={14} color={isDark ? "#94A3B8" : "#64748B"} />
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
});

// ── ToastContainer ────────────────────────────────────────────────────────────
export const ToastContainer = memo(() => {
  const toasts = useAppSelector((s) => s.toast.toasts);
  if (toasts.length === 0) return null;

  return (
    <View style={{ position: "absolute", top: 60, left: 16, right: 16, zIndex: 100000 }}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </View>
  );
});