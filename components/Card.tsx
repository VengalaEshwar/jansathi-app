import { useRef, useState } from "react";
import { View, Text, Pressable, Animated, Platform } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { ReactNode } from "react";
import { useSound } from "@/hooks/useSound";

interface CardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onPress?: () => void;
  gradient?: boolean;
  children?: ReactNode;
  gridMode?: boolean;
}

export const Card = ({
  icon: Icon,
  title,
  description,
  onPress,
  gradient = false,
  children,
  gridMode = false,
}: CardProps) => {
  const scale      = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered]   = useState(false);
  const { playClick } = useSound();

  // Press
  const onPressIn  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 25, bounciness: 10 }).start();
  const onPress_   = () => { playClick("soft"); onPress?.(); };

  // Hover (web only)
  const onHoverIn = () => {
    if (Platform.OS !== "web") return;
    setHovered(true);
    Animated.parallel([
      Animated.spring(scale,      { toValue: 1.03, useNativeDriver: true, speed: 28, bounciness: 8 }),
      Animated.spring(translateX, { toValue: 2,    useNativeDriver: true, speed: 28, bounciness: 8 }),
      Animated.spring(translateY, { toValue: -4,   useNativeDriver: true, speed: 28, bounciness: 8 }),
    ]).start();
  };
  const onHoverOut = () => {
    if (Platform.OS !== "web") return;
    setHovered(false);
    Animated.parallel([
      Animated.spring(scale,      { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 8 }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 8 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 8 }),
    ]).start();
  };

  const shadow = {
    shadowColor: gradient ? "#8B5CF6" : (hovered ? "#8B5CF6" : "#000"),
    shadowOffset: { width: 0, height: hovered ? 12 : 4 },
    shadowOpacity: hovered ? 0.22 : (gradient ? 0.28 : 0.07),
    shadowRadius: hovered ? 22 : 12,
    elevation: hovered ? 12 : (gradient ? 6 : 3),
  };

  const wrapStyle: any = [
    { transform: [{ scale }, { translateX }, { translateY }] },
    gridMode ? { flex: 1 } : {},
  ];

  if (gridMode) {
    return (
      <Animated.View style={wrapStyle}>
        <Pressable
          onPress={onPress_}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          // @ts-ignore web
          onHoverIn={onHoverIn}
          onHoverOut={onHoverOut}
          disabled={!onPress}
          className={`rounded-2xl p-4 items-center ${
            gradient ? "bg-primary" : "bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
          }`}
          style={{ minHeight: 152, justifyContent: "center", ...shadow }}
        >
          <View style={{
            width: 56, height: 56, borderRadius: 18,
            backgroundColor: gradient ? "rgba(255,255,255,0.2)" : "#8B5CF618",
            borderWidth: 1, borderColor: gradient ? "rgba(255,255,255,0.3)" : "#8B5CF635",
            alignItems: "center", justifyContent: "center", marginBottom: 12,
          }}>
            <Icon size={26} color={gradient ? "white" : "#8B5CF6"} />
          </View>
          <Text
            className={`font-bold text-sm text-center mb-1.5 ${gradient ? "text-white" : "text-[#0F172A] dark:text-white"}`}
            numberOfLines={2}
          >{title}</Text>
          <Text
            className={`text-xs text-center leading-4 ${gradient ? "text-white/72" : "text-[#64748B] dark:text-[#94A3B8]"}`}
            numberOfLines={3}
          >{description}</Text>
          {children && <View className="mt-3 w-full">{children}</View>}
        </Pressable>
      </Animated.View>
    );
  }

  // ── Horizontal list card ──────────────────────────────────────
  return (
    <Animated.View style={wrapStyle}>
      <Pressable
        onPress={onPress_}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        // @ts-ignore web
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        disabled={!onPress}
        className={`rounded-2xl p-4 ${
          gradient ? "bg-primary" : "bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        }`}
        style={shadow}
      >
        <View className="flex-row items-start gap-4">
          <View style={{
            width: 46, height: 46, borderRadius: 14,
            backgroundColor: gradient ? "rgba(255,255,255,0.2)" : "#8B5CF618",
            borderWidth: 1, borderColor: gradient ? "rgba(255,255,255,0.3)" : "#8B5CF635",
            alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={22} color={gradient ? "white" : "#8B5CF6"} />
          </View>
          <View className="flex-1">
            <Text className={`text-base font-semibold mb-1 ${gradient ? "text-white" : "text-[#0F172A] dark:text-white"}`}>
              {title}
            </Text>
            <Text className={`text-sm leading-5 ${gradient ? "text-white/75" : "text-[#64748B] dark:text-[#94A3B8]"}`}>
              {description}
            </Text>
            {children && <View className="mt-3">{children}</View>}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};