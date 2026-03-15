// app/about.tsx
import { useEffect, useRef } from "react";
import {
  View, Text, ScrollView, Pressable, Animated,
  Linking, useWindowDimensions, Platform,
} from "react-native";
import { Heart, Target, Users, Mail, Globe, Sparkles } from "lucide-react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { HeroSection } from "@/components/HeroSection";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useSound } from "@/hooks/useSound";

const S = {
  gap10: { gap: 10 } as const, gap12: { gap: 12 } as const,
  mb12:  { marginBottom: 12 } as const, mb16: { marginBottom: 16 } as const,
  mb20:  { marginBottom: 20 } as const, mb24: { marginBottom: 24 } as const,
};

const useFadeSlideIn = (delay = 0) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true, speed: 14, bounciness: 5 }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
};

function HoverCard({ icon: Icon, title, desc, color = "#8B5CF6", delay = 0 }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const tx    = useRef(new Animated.Value(0)).current;
  const ty    = useRef(new Animated.Value(0)).current;
  const anim  = useFadeSlideIn(delay);
  const { playClick } = useSound();

  const hIn  = () => Animated.parallel([
    Animated.spring(scale, { toValue: 1.03, useNativeDriver: true, speed: 28, bounciness: 8 }),
    Animated.spring(tx,    { toValue: 2,    useNativeDriver: true, speed: 28, bounciness: 8 }),
    Animated.spring(ty,    { toValue: -4,   useNativeDriver: true, speed: 28, bounciness: 8 }),
  ]).start();
  const hOut = () => Animated.parallel([
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 8 }),
    Animated.spring(tx,    { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 8 }),
    Animated.spring(ty,    { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 8 }),
  ]).start();

  return (
    <Animated.View style={[anim, { marginBottom: 12, transform: [{ scale }, { translateX: tx }, { translateY: ty }] }]}>
      <Pressable
        // @ts-ignore web
        onHoverIn={hIn} onHoverOut={hOut}
        onPressIn={() => { playClick("soft"); Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 4 }).start(); }}
        onPressOut={hOut}
        style={{ backgroundColor: "white", padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0",
          shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 }}
        className="dark:bg-[#1E293B] dark:border-[#334155]">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: color + "18", borderWidth: 1, borderColor: color + "30", alignItems: "center", justifyContent: "center" }}>
            <Icon size={20} color={color} />
          </View>
          <Text style={{ fontWeight: "700", fontSize: 14, color: "#0F172A" }} className="dark:text-white">{title}</Text>
        </View>
        <Text style={{ color: "#64748B", fontSize: 13, lineHeight: 19 }} className="dark:text-[#94A3B8]">{desc}</Text>
      </Pressable>
    </Animated.View>
  );
}

function ValueBox({ icon: Icon, title, text, color = "#8B5CF6", delay = 0 }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const anim  = useFadeSlideIn(delay);
  const { playClick } = useSound();
  return (
    <Animated.View style={[anim, { flex: 1 }]}>
      <Pressable
        onPressIn={() => { playClick("soft"); Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 40, bounciness: 4 }).start(); }}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        // @ts-ignore
        onHoverIn={() => Animated.spring(scale, { toValue: 1.05, useNativeDriver: true, speed: 28, bounciness: 8 }).start()}
        onHoverOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        style={{ transform: [{ scale }], borderRadius: 18, backgroundColor: "white", borderWidth: 1, borderColor: "#E2E8F0",
          padding: 16, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
        className="dark:bg-[#1E293B] dark:border-[#334155]">
        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: color, alignItems: "center", justifyContent: "center", marginBottom: 8,
          shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}>
          <Icon size={22} color="white" />
        </View>
        <Text style={{ fontWeight: "700", fontSize: 13, textAlign: "center", marginBottom: 4, color: "#0F172A" }} className="dark:text-white">{title}</Text>
        <Text style={{ color: "#64748B", fontSize: 12, textAlign: "center", lineHeight: 16 }} className="dark:text-[#94A3B8]">{text}</Text>
      </Pressable>
    </Animated.View>
  );
}

function StatBox({ value, label, color = "#8B5CF6", delay = 0 }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const anim  = useFadeSlideIn(delay);
  return (
    <Animated.View style={[anim, { flex: 1 }]}>
      <Pressable
        onPressIn={() => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        // @ts-ignore
        onHoverIn={() => Animated.spring(scale, { toValue: 1.05, useNativeDriver: true, speed: 28, bounciness: 8 }).start()}
        onHoverOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        style={{ transform: [{ scale }], borderRadius: 18, backgroundColor: color, padding: 16, alignItems: "center",
          shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.32, shadowRadius: 10, elevation: 5 }}>
        <Text style={{ color: "white", fontSize: 24, fontWeight: "800" }}>{value}</Text>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2, textAlign: "center" }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function AboutUs() {
  const { t }     = useTranslation();
  const { width } = useWindowDimensions();
  const isWide    = width >= 700;
  const isLarge   = width >= 1100;

  const missionAnim = useFadeSlideIn(180);
  const valuesAnim  = useFadeSlideIn(320);
  const statsAnim   = useFadeSlideIn(440);
  const ctaAnim     = useFadeSlideIn(520);

  // ── Correct width formula ──────────────────────────────────────────────────
  const containerWidth = isLarge ? 1100 : isWide ? 860 : undefined;
  const sidePad = containerWidth ? Math.max(24, (width - containerWidth) / 2) : 20;

  return (
    <ScrollView className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]"
      showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

      {/* ── FULL WIDTH: HeroSection ── */}
      <View style={{ paddingHorizontal: sidePad, paddingTop: 20 }}>
        {Platform.OS === "web" && <View style={{ height: 8 }} />}
        <HeroSection icon={Heart} title={t.about.title} subtitle={t.about.subtitle}
          gradientColors={["#EC4899", "#F97316"]} badge="Open Source" delay={0} />
        {Platform.OS === "web" && <View style={{ height: 8 }} />}
      </View>

      {/* ── CENTERED CONTENT ── */}
      <View style={{
        paddingHorizontal: sidePad,
        ...(containerWidth ? { maxWidth: containerWidth + sidePad * 2, alignSelf: "center" as const, width: "100%" } : {}),
      }}>

        {/* Mission */}
        <Animated.View style={[missionAnim, S.mb20]}>
          <View style={{ backgroundColor: "#8B5CF6", borderRadius: 20, padding: 20, overflow: "hidden",
            shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 6 }}>
            <View style={{ position: "absolute", top: -20, right: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(255,255,255,0.08)" }} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Target size={22} color="white" />
              <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>{t.about.mission}</Text>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 20 }}>{t.about.missionText}</Text>
          </View>
        </Animated.View>

        {/* Features */}
        <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.2, color: "#8B5CF6", marginBottom: 12, marginLeft: 4 }}>WHAT WE DO</Text>

        {/* 2-col on wide */}
        {isWide ? (
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 0 }}>
            <View style={{ flex: 1 }}>
              <HoverCard icon={Heart}    title={t.about.healthLiteracy} desc={t.about.healthLiteracyDesc} color="#EF4444" delay={200} />
            </View>
            <View style={{ flex: 1 }}>
              <HoverCard icon={Sparkles} title={t.about.govAccess}      desc={t.about.govAccessDesc}      color="#6366F1" delay={260} />
            </View>
          </View>
        ) : (
          <>
            <HoverCard icon={Heart}    title={t.about.healthLiteracy} desc={t.about.healthLiteracyDesc} color="#EF4444" delay={200} />
            <HoverCard icon={Sparkles} title={t.about.govAccess}      desc={t.about.govAccessDesc}      color="#6366F1" delay={260} />
          </>
        )}

        {/* Values */}
        <Animated.View style={valuesAnim}>
          <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.2, color: "#8B5CF6", marginBottom: 12, marginTop: 8, marginLeft: 4 }}>
            {t.about.ourValues.toUpperCase()}
          </Text>
          <View style={[{ flexDirection: "row" }, S.gap12, S.mb24]}>
            <ValueBox icon={Globe} title={t.about.accessibility} text={t.about.accessibilityText} color="#3B82F6" delay={340} />
            <ValueBox icon={Heart} title={t.about.compassion}    text={t.about.compassionText}    color="#EC4899" delay={380} />
            <ValueBox icon={Users} title={t.about.community}     text={t.about.communityText}     color="#10B981" delay={420} />
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View style={statsAnim}>
          <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.2, color: "#8B5CF6", marginBottom: 12, marginLeft: 4 }}>BY THE NUMBERS</Text>
          <View style={[{ flexDirection: "row" }, S.gap10, S.mb24]}>
            <StatBox value="10+"  label={t.about.languages}       color="#8B5CF6" delay={460} />
            <StatBox value="5"    label={t.about.healthTools}     color="#EF4444" delay={490} />
            <StatBox value="5"    label={t.about.gAssistFeatures} color="#6366F1" delay={520} />
            <StatBox value="24/7" label={t.about.aiSupport}       color="#10B981" delay={550} />
          </View>
        </Animated.View>

        {/* Contact CTA */}
        <Animated.View style={ctaAnim}>
          <View style={{ backgroundColor: "white", borderRadius: 20, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0",
            shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 }}
            className="dark:bg-[#1E293B] dark:border-[#334155]">
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Mail size={24} color="white" />
            </View>
            <Text style={{ fontSize: 17, fontWeight: "800", color: "#0F172A", marginBottom: 4 }} className="dark:text-white">
              {t.about.getInTouch}
            </Text>
            <Text style={{ color: "#64748B", fontSize: 13, textAlign: "center", marginBottom: 16 }} className="dark:text-[#94A3B8]">
              {t.about.getInTouchDesc}
            </Text>
            <AnimatedPressable
              onPress={() => Linking.openURL("mailto:support@jansathi.in")}
              soundType="mechanical"
              style={{ backgroundColor: "#8B5CF6", paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14,
                shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}>
              <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>{t.about.contactUs}</Text>
            </AnimatedPressable>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}