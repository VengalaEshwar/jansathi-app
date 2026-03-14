import { Pressable, Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

interface TabButtonProps {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onPress: () => void;
}

export default function TabButton({ label, icon: Icon, active, onPress }: TabButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: active ? "#8B5CF6" : "#FFFFFF",
        borderWidth: 1,
        borderColor: active ? "#8B5CF6" : "#E2E8F0",
      }}
      className="dark:bg-[#1E293B] dark:border-[#334155]"
    >
      <Icon size={16} color={active ? "#FFFFFF" : "#8B5CF6"} />
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: active ? "#FFFFFF" : "#475569",
        }}
        className={active ? "" : "dark:text-white"}
      >
        {label}
      </Text>
    </Pressable>
  );
}