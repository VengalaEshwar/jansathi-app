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
    <Animated.View style={{ opacity, transform: [{ translateY }], flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 }}>
      <View style={{
        width: 48, height: 48, borderRadius: 16,
        backgroundColor: iconColor,
        alignItems: "center", justifyContent: "center",
        shadowColor: iconColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.38, shadowRadius: 10, elevation: 6,
      }}>
        <Icon size={22} color="white" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#0F172A", letterSpacing: -0.4 }}
          className="dark:text-white">{title}</Text>
        {subtitle ? (
          <Text style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}
            className="dark:text-[#94A3B8]">{subtitle}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
};