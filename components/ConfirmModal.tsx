import { View, Text, Modal, Pressable } from "react-native";
import { AlertTriangle, Info } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hideConfirm } from "@/store/slices/toastSlice";
import { executeConfirmCallback } from "@/hooks/useConfirm";

export function ConfirmModal() {
  const dispatch = useAppDispatch();
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
      <View className="flex-1 bg-black/60 items-center justify-center p-6">
        <View 
          className="bg-light-card dark:bg-card rounded-2xl p-6 w-full max-w-[340px] border"
          style={{ borderColor: isDanger ? "#EF4444" : "#3B82F6" }}
        >
          <View 
            className={`w-12 h-12 rounded-full items-center justify-center mb-4 ${
              isDanger ? "bg-red-500/15" : "bg-blue-500/15"
            }`}
          >
            {isDanger
              ? <AlertTriangle size={24} color="#EF4444" />
              : <Info size={24} color="#3B82F6" />
            }
          </View>

          <Text className="text-light-foreground dark:text-foreground font-bold text-lg mb-2">
            {confirm.title}
          </Text>
          <Text className="text-muted text-sm mb-6 leading-5">
            {confirm.message}
          </Text>

          <View className="flex-row gap-3">
            <Pressable
              onPress={handleCancel}
              className="flex-1 p-3.5 rounded-xl border border-light-border dark:border-border items-center"
            >
              <Text className="text-muted font-semibold">
                {confirm.cancelText}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              className={`flex-1 p-3.5 rounded-xl items-center ${
                isDanger ? "bg-red-500" : "bg-blue-500"
              }`}
            >
              <Text className="text-white font-semibold">
                {confirm.confirmText}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}