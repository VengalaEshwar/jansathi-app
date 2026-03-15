// components/ConfirmModal.tsx
import { memo } from "react";
import { View, Text, Modal } from "react-native";
import { AlertTriangle, Info } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hideConfirm } from "@/store/slices/toastSlice";
import { executeConfirmCallback } from "@/hooks/useConfirm";
import { AnimatedPressable } from "@/components/AnimatedPressable";

export const ConfirmModal = memo(() => {
  const dispatch = useAppDispatch();
  const confirm  = useAppSelector((s) => s.toast.confirm);
  const theme    = useAppSelector((s: any) => s.app?.theme ?? "dark");
  const isDark   = theme === "dark";
  const isDanger = confirm.variant === "danger";

  // ── Theme-aware colors ──────────────────────────────────────────────────────
  const cardBg    = isDark ? "#1E293B" : "white";
  const textPri   = isDark ? "#F1F5F9" : "#0F172A";
  const textMuted = isDark ? "#94A3B8" : "#64748B";
  const border    = isDark ? "#334155" : "#E2E8F0";

  const accentColor  = isDanger ? "#EF4444" : "#3B82F6";
  const accentBg     = isDanger ? "#EF444420" : "#3B82F620";

  const handleConfirm = () => {
    if (confirm.onConfirm) executeConfirmCallback(confirm.onConfirm);
    dispatch(hideConfirm());
  };
  const handleCancel = () => dispatch(hideConfirm());

  return (
    <Modal visible={confirm.open} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View style={{
          backgroundColor: cardBg, borderRadius: 20, padding: 24,
          width: "100%", maxWidth: 340,
          borderWidth: 1, borderColor: accentColor + "50",
          shadowColor: accentColor, shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
        }}>
          {/* Icon */}
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: accentBg,
            alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            {isDanger
              ? <AlertTriangle size={26} color={accentColor} />
              : <Info          size={26} color={accentColor} />}
          </View>

          {/* Title */}
          <Text style={{ color: textPri, fontWeight: "800", fontSize: 17, marginBottom: 8 }}>
            {confirm.title}
          </Text>

          {/* Message */}
          <Text style={{ color: textMuted, fontSize: 14, lineHeight: 21, marginBottom: 24 }}>
            {confirm.message}
          </Text>

          {/* Buttons */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            {/* Cancel */}
            <AnimatedPressable onPress={handleCancel} soundType="soft"
              style={{ flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: "center",
                borderWidth: 1, borderColor: border, backgroundColor: "transparent" }}>
              <Text style={{ color: textMuted, fontWeight: "600", fontSize: 14 }}>
                {confirm.cancelText}
              </Text>
            </AnimatedPressable>

            {/* Confirm */}
            <AnimatedPressable onPress={handleConfirm} soundType="mechanical"
              style={{ flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: "center",
                backgroundColor: accentColor,
                shadowColor: accentColor, shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 }}>
              <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
                {confirm.confirmText}
              </Text>
            </AnimatedPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});