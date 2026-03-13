import { useEffect, useRef } from "react";
import { View, Text, ScrollView, Animated, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Heart, Sparkles, User, Info, ArrowRight } from "lucide-react-native";
import { Card } from "@/components/Card";
import { useTranslation } from "@/hooks/useTranslation";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import * as Notifications from "expo-notifications";
import { useToast } from "@/hooks/useToast";

const WIDE = 640;

const useFadeSlideIn = (delay: number = 0) => {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,   { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true, speed: 14, bounciness: 5 }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
};

const TestNotificationButton = () => {
  const toast = useToast();
  const anim  = useFadeSlideIn(500);
  const handleTest = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") { toast.error("Enable notifications in your phone settings."); return; }
    await Notifications.scheduleNotificationAsync({
      content: { title: "💊 Medicine Reminder", body: "Time to take Paracetamol - 500mg", data: { test: true } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10 },
    });
    toast.success("Notification in 10s — background the app now!");
  };
  return (
    <Animated.View style={anim}>
      <AnimatedPressable onPress={handleTest} soundType="mechanical" className="mb-4 rounded-2xl bg-primary items-center py-4">
        <Text className="text-white font-bold text-base">🔔 Test Notification (10s)</Text>
      </AnimatedPressable>
    </Animated.View>
  );
};

const Home = () => {
  const router = useRouter();
  const { t }  = useTranslation();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE;

  const slideshowAnim = useFadeSlideIn(0);
  const greetingAnim  = useFadeSlideIn(80);
  const cardsAnim     = useFadeSlideIn(200);

  // All 4 quick-link cards in order
  const quickLinks = [
    { icon: Heart,    title: t.home.healthServices, description: t.home.healthDesc,  path: "/health",   gradient: true  },
    { icon: Sparkles, title: t.home.govAssist,      description: t.home.govDesc,     path: "/g-assist", gradient: false },
    { icon: User,     title: t.home.yourProfile,    description: t.home.profileDesc, path: "/profile",  gradient: false },
    { icon: Info,     title: t.home.about,          description: t.home.aboutDesc,   path: "/about",    gradient: false },
  ];

  // Chunk into pairs for 2-col grid
  const pairs: (typeof quickLinks)[] = [];
  for (let i = 0; i < quickLinks.length; i += 2) pairs.push(quickLinks.slice(i, i + 2));

  return (
    <ScrollView
      className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]"
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Slideshow */}
      <Animated.View style={slideshowAnim}>
        <HeroSlideshow />
      </Animated.View>

      {/* Greeting + CTA */}
      <Animated.View style={greetingAnim} className="mb-8">
        <Text className="text-2xl font-bold text-[#0F172A] dark:text-white mb-1" style={{ letterSpacing: -0.4 }}>
          {t.home.welcome}
        </Text>
        <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm mb-5">
          {t.home.subtitle}
        </Text>
        <AnimatedPressable
          onPress={() => router.push("/health")}
          soundType="mechanical"
          className="self-start flex-row items-center bg-primary px-5 py-3 rounded-xl"
          style={{ shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }}
        >
          <Text className="text-white font-semibold mr-2">{t.home.getStarted}</Text>
          <ArrowRight size={16} color="white" />
        </AnimatedPressable>
      </Animated.View>

      {/* Quick Access — 2 col grid on wide, 1 col on mobile */}
      <Animated.View style={cardsAnim}>
        <Text className="text-xs font-semibold uppercase tracking-widest text-[#8B5CF6] mb-3">
          Quick Access
        </Text>

        {isWide ? (
          // ── 2-column square grid ──
          pairs.map((pair, ri) => (
            <View key={ri} style={{ flexDirection: "row", gap: 14, marginBottom: 14 }}>
              {pair.map((l) => (
                <Card
                  key={l.path}
                  icon={l.icon}
                  title={l.title}
                  description={l.description}
                  gradient={l.gradient}
                  gridMode
                  onPress={() => router.push(l.path as any)}
                />
              ))}
              {pair.length === 1 && <View style={{ flex: 1 }} />}
            </View>
          ))
        ) : (
          // ── Single column list on mobile ──
          quickLinks.map((l) => (
            <View key={l.path} className="mb-3">
              <Card
                icon={l.icon}
                title={l.title}
                description={l.description}
                gradient={l.gradient}
                onPress={() => router.push(l.path as any)}
              />
            </View>
          ))
        )}
      </Animated.View>

      {__DEV__ && <TestNotificationButton />}
    </ScrollView>
  );
};

export default Home;