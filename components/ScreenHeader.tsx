// components/ScreenHeader.tsx
import { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { LucideIcon } from "lucide-react-native";

interface ScreenHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  iconColor?: string;
  delay?: number;
}

export const ScreenHeader = ({
  icon: Icon,
  title,
  subtitle,
  iconColor = "#8B5CF6",
  delay = 0,
}: ScreenHeaderProps) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true, speed: 14, bounciness: 5 }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }} className="flex-row items-center gap-3 mb-6">
      <View
        className="w-12 h-12 rounded-2xl items-center justify-center"
        style={{
          backgroundColor: iconColor,
          shadowColor: iconColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.38,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        <Icon size={22} color="white" />
      </View>
      <View className="flex-1">
        <Text className="text-2xl font-bold text-[#0F172A] dark:text-white" style={{ letterSpacing: -0.4 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">{subtitle}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
};