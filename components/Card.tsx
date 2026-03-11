import { View, Text, Pressable } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { ReactNode } from "react";

interface CardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onPress?: () => void;
  gradient?: boolean;
  children?: ReactNode;
}

export const Card = ({
  icon: Icon,
  title,
  description,
  onPress,
  gradient = false,
  children,
}: CardProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`mb-4 rounded-2xl p-4 ${
        gradient ? "bg-primary" : "bg-light-card dark:bg-card border border-light-border dark:border-border"
      }`}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.85 : 1,
          transform: pressed ? [{ scale: 0.97 }] : [{ scale: 1 }],
        },
      ]}
    >
      <View className="flex-row items-start gap-4">
        <View
          className={`p-3 rounded-xl ${
            gradient ? "bg-white/20" : "bg-primary"
          }`}
        >
          <Icon size={24} color="white" />
        </View>

        <View className="flex-1">
          <Text
            className={`text-lg font-semibold mb-1 ${
              gradient ? "text-white" : "text-light-foreground dark:text-foreground"
            }`}
          >
            {title}
          </Text>

          <Text
            className={`text-sm ${
              gradient ? "text-white/80" : "text-muted"
            }`}
          >
            {description}
          </Text>

          {children && <View className="mt-3">{children}</View>}
        </View>
      </View>
    </Pressable>
  );
};