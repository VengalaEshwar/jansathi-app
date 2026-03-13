import { useEffect, useRef } from "react";
import { View, Text, ScrollView, Animated, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Scan, FileText, AlertTriangle, MapPin, Bell, Heart, Shield, Mic } from "lucide-react-native";
import { Card } from "@/components/Card";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";

const WIDE = 640;

const useFadeSlideIn = (delay = 0) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true, speed: 14, bounciness: 5 }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
};

const Health = () => {
  const router = useRouter();
  const { t }  = useTranslation();
  const toast  = useToast();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE;

  const headerAnim = useFadeSlideIn(0);
  const gridAnim   = useFadeSlideIn(120);
  const footerAnim = useFadeSlideIn(260);

  const features = [
    { icon: Scan,          title: t.health.medicineScanner,      description: t.health.medicineScannerDesc,      action: () => router.push("/health/medicine-scanner") },
    { icon: FileText,      title: t.health.prescriptionReader,   description: t.health.prescriptionReaderDesc,   action: () => router.push("/health/prescription-reader") },
    { icon: AlertTriangle, title: t.health.dangerAlerts,         description: t.health.dangerAlertsDesc,         action: () => () => router.push("/health/danger-alerts") },
    { icon: MapPin,        title: t.health.nearbyClinics,        description: t.health.nearbyClinicsDesc,        action: () => router.push("/health/nearby-clinics") },
    { icon: Bell,          title: t.health.healthNotifications,  description: t.health.healthNotificationsDesc,  action: () => router.push("/health/health-notifications") },
  ];

  const pairs: (typeof features)[] = [];
  for (let i = 0; i < features.length; i += 2) pairs.push(features.slice(i, i + 2));

  return (
    <ScrollView
      className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]"
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View style={headerAnim} className="flex-row items-center gap-3 mb-6">
        <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center"
          style={{ shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 }}>
          <Heart size={22} color="white" />
        </View>
        <View>
          <Text className="text-2xl font-bold text-[#0F172A] dark:text-white" style={{ letterSpacing: -0.4 }}>
            {t.health.title}
          </Text>
          <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm">
            Access comprehensive health tools & services
          </Text>
        </View>
      </Animated.View>

      {/* Grid */}
      <Animated.View style={gridAnim}>
        {isWide ? (
          pairs.map((pair, ri) => (
            <View key={ri} style={{ flexDirection: "row", gap: 14, marginBottom: 14 }}>
              {pair.map((f) => (
                <Card key={f.title} icon={f.icon} title={f.title} description={f.description} onPress={f.action} gridMode />
              ))}
              {pair.length === 1 && <View style={{ flex: 1 }} />}
            </View>
          ))
        ) : (
          features.map((f) => (
            <View key={f.title} style={{ marginBottom: 12 }}>
              <Card icon={f.icon} title={f.title} description={f.description} onPress={f.action} />
            </View>
          ))
        )}
      </Animated.View>

      {/* Footer */}
      <Animated.View style={footerAnim}>
        <View className="rounded-2xl p-5 mb-4 mt-2"
          style={{ backgroundColor: "#8B5CF6", shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 14, elevation: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Shield size={20} color="white" />
            <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>Why Health Literacy Matters</Text>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 13, lineHeight: 20 }}>
            Understanding your medications and health information is crucial for your wellbeing. JanSathi helps you verify medicine authenticity, understand doctor's prescriptions, and make informed health decisions. Our tools are designed to be accessible to everyone, regardless of literacy level or language.
          </Text>
        </View>

        <View className="rounded-2xl p-4 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: "#8B5CF618", alignItems: "center", justifyContent: "center" }}>
              <Mic size={16} color="#8B5CF6" />
            </View>
            <Text className="text-[#0F172A] dark:text-white font-semibold text-sm">Multilingual Support</Text>
          </View>
          <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm leading-5">
            Available in Hindi, English, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and more Indian languages.
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

export default Health;