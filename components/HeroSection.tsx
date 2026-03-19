// components/HeroSection.tsx
import { useEffect, useRef } from "react";
import { View, Text, Animated, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { LucideIcon } from "lucide-react-native";
import { AnimatedPressable } from "@/components/AnimatedPressable";

interface HeroSectionProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  gradientColors: [string, string, ...string[]];
  ctaLabel?: string;
  onCta?: () => void;
  badge?: string;
  delay?: number;
}

export const HeroSection = ({
  icon: Icon,
  title,
  subtitle,
  gradientColors,
  ctaLabel,
  onCta,
  badge,
  delay = 0,
}: HeroSectionProps) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale      = useRef(new Animated.Value(0.97)).current;
  const { width }  = useWindowDimensions();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true, speed: 12, bounciness: 6 }),
      Animated.spring(scale,      { toValue: 1, delay, useNativeDriver: true, speed: 12, bounciness: 6 }),
    ]).start();
  }, []);

  // Cap minHeight — on wide screens 0.36 * width is too tall (e.g. 540px on 1500px monitor)
  // Mobile: proportional. Wide: fixed compact height.
  const minHeight = width >= 700
    ? 160   // compact on wide / web — just enough for icon + text
    : Math.max(width * 0.36, 140); // proportional on mobile

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }], marginBottom: 16 }}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24,
          padding: 20,
          minHeight,
          justifyContent: "space-between",
          overflow: "hidden",
          shadowColor: gradientColors[0],
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        {/* Decorative circles */}
        <View style={{ position: "absolute", top: -24, right: -24, width: 110, height: 110, borderRadius: 55, backgroundColor: "rgba(255,255,255,0.08)" }} />
        <View style={{ position: "absolute", bottom: -16, left: width * 0.35, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.06)" }} />

        {/* Top row */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <View style={{ width: 52, height: 52, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" }}>
            <Icon size={26} color="white" />
          </View>
          {badge ? (
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" }}>
              <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>{badge}</Text>
            </View>
          ) : null}
        </View>

        {/* Text + CTA */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ color: "white", fontSize: 22, fontWeight: "800", letterSpacing: -0.4, marginBottom: 6 }} numberOfLines={1}>
            {title}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 14, lineHeight: 20, marginBottom: ctaLabel ? 14 : 0 }} numberOfLines={2}>
            {subtitle}
          </Text>
          {ctaLabel && onCta ? (
            <AnimatedPressable
              onPress={onCta}
              soundType="mechanical"
              style={{
                alignSelf: "flex-start",
                backgroundColor: "rgba(255,255,255,0.22)",
                paddingHorizontal: 16, paddingVertical: 8,
                borderRadius: 12, borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>{ctaLabel}</Text>
            </AnimatedPressable>
          ) : null}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};