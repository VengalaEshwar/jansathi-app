import { View, Text, Modal, Pressable } from "react-native";
import { AlertTriangle, Info } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hideConfirm } from "@/store/slices/toastSlice";
import { executeConfirmCallback } from "@/hooks/useConfirm";
import { useTranslation } from "@/hooks/useTranslation";

export function ConfirmModal() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const confirm = useAppSelector((s) => s.toast.confirm);

  const handleConfirm = () => {
    if (confirm.onConfirm) executeConfirmCallback(confirm.onConfirm);
    dispatch(hideConfirm());
  };

  const handleCancel = () => {
    dispatch(hideConfirm());
  };

  const isDanger = confirm.variant === "danger";

  return (
    <Modal
      visible={confirm.open}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}>
        <View style={{
          backgroundColor: "#1E293B",
          borderRadius: 16,
          padding: 24,
          width: "100%",
          maxWidth: 340,
          borderWidth: 1,
          borderColor: isDanger ? "#EF4444" : "#3B82F6",
        }}>
          {/* Icon */}
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: isDanger ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}>
            {isDanger
              ? <AlertTriangle size={24} color="#EF4444" />
              : <Info size={24} color="#3B82F6" />
            }
          </View>

          <Text style={{ color: "white", fontWeight: "700", fontSize: 18, marginBottom: 8 }}>
            {confirm.title}
          </Text>
          <Text style={{ color: "#94A3B8", fontSize: 14, marginBottom: 24, lineHeight: 20 }}>
            {confirm.message}
          </Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={handleCancel}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#334155",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#94A3B8", fontWeight: "600" }}>{t.common.cancel}</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 12,
                backgroundColor: isDanger ? "#EF4444" : "#3B82F6",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>
                {isDanger ? t.common.delete : t.common.confirm ?? "Confirm"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}