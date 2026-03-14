// app/health/index.tsx
import { useEffect, useRef } from "react";
import { View, Text, ScrollView, Animated, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Scan, FileText, AlertTriangle, MapPin, Bell, Heart, Shield, Mic } from "lucide-react-native";
import { Card } from "@/components/Card";
import { HeroSection } from "@/components/HeroSection";
import { useTranslation } from "@/hooks/useTranslation";

const WIDE = 640;

const useFadeIn = (delay = 0) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay,          useNativeDriver: true, speed: 14, bounciness: 5 }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
};

export default function Health() {
  const router    = useRouter();
  const { t }     = useTranslation();
  const { width } = useWindowDimensions();
  const isWide    = width >= WIDE;

  const gridAnim   = useFadeIn(160);
  const footerAnim = useFadeIn(300);

  const features = [
    { icon: Scan,          title: t.health.medicineScanner,     description: t.health.medicineScannerDesc,     action: () => router.push("/health/medicine-scanner") },
    { icon: FileText,      title: t.health.prescriptionReader,  description: t.health.prescriptionReaderDesc,  action: () => router.push("/health/prescription-reader") },
    { icon: AlertTriangle, title: t.health.dangerAlerts,        description: t.health.dangerAlertsDesc,        action: () => router.push("/health/danger-alerts") },
    { icon: MapPin,        title: t.health.nearbyClinics,       description: t.health.nearbyClinicsDesc,       action: () => router.push("/health/nearby-clinics") },
    { icon: Bell,          title: t.health.healthNotifications, description: t.health.healthNotificationsDesc, action: () => router.push("/health/health-notifications") },
  ];

  // chunk into pairs for 2-col grid
  const pairs: (typeof features)[] = [];
  for (let i = 0; i < features.length; i += 2) pairs.push(features.slice(i, i + 2));

  return (
    <ScrollView
      className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]"
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <HeroSection
        icon={Heart}
        title={t.health.title}
        subtitle={t.health.heroSubtitle ?? "Verify medicines, read prescriptions, and find nearby clinics"}
        gradientColors={["#7C3AED", "#EC4899"]}
        badge="5 Tools"
        delay={0}
      />

      {/* Section label */}
      <Animated.View style={gridAnim}>
        <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.2, color: "#8B5CF6", marginBottom: 12, marginLeft: 4 }}>
          {t.health.title.toUpperCase()}
        </Text>

        {/* 2-col on wide / single col on mobile */}
        {isWide ? (
          pairs.map((pair, ri) => (
            <View key={ri} style={{ flexDirection: "row", gap: 14, marginBottom: 14 }}>
              {pair.map((f) => (
                <Card
                  key={f.title}
                  icon={f.icon}
                  title={f.title}
                  description={f.description}
                  onPress={f.action}
                  gridMode
                />
              ))}
              {pair.length === 1 && <View style={{ flex: 1 }} />}
            </View>
          ))
        ) : (
          features.map((f) => (
            <View key={f.title} style={{ marginBottom: 12 }}>
              <Card
                icon={f.icon}
                title={f.title}
                description={f.description}
                onPress={f.action}
              />
            </View>
          ))
        )}
      </Animated.View>

      {/* Footer */}
      <Animated.View style={footerAnim}>
        {/* Purple banner */}
        <View
          style={{
            backgroundColor: "#8B5CF6", borderRadius: 20, padding: 20, marginTop: 8, marginBottom: 12,
            shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Shield size={20} color="white" />
            <Text style={{ color: "white", fontSize: 15, fontWeight: "700" }}>
              {t.health.footerTitle ?? "Why Health Literacy Matters"}
            </Text>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 13, lineHeight: 20 }}>
            {t.health.footerText ?? "Understanding your medications and health information is crucial for your wellbeing. JanSathi helps you verify medicine authenticity, understand doctor's prescriptions, and make informed health decisions."}
          </Text>
        </View>

        {/* Multilingual card */}
        <View
          style={{
            backgroundColor: "white", borderRadius: 18, padding: 16,
            borderWidth: 1, borderColor: "#E2E8F0",
            shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
          }}
          className="dark:bg-[#1E293B] dark:border-[#334155]"
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: "#8B5CF618", alignItems: "center", justifyContent: "center" }}>
              <Mic size={16} color="#8B5CF6" />
            </View>
            <Text style={{ fontWeight: "600", fontSize: 14, color: "#0F172A" }} className="dark:text-white">
              {t.health.multilingualTitle ?? "Multilingual Support"}
            </Text>
          </View>
          <Text style={{ color: "#64748B", fontSize: 13, lineHeight: 19 }} className="dark:text-[#94A3B8]">
            {t.health.multilingualText ?? "Available in Hindi, English, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and more Indian languages."}
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}