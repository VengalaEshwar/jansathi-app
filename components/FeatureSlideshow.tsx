import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  Dimensions,
  Pressable,
} from "react-native";
import {
  Heart,
  Sparkles,
  User,
  Bell,
  FileText,
  MapPin,
  Shield,
  Mic,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Slide {
  icon: any;
  title: string;
  description: string;
  color: string;       // icon bg
  accent: string;      // card accent line
}

const SLIDES: Slide[] = [
  {
    icon: Heart,
    title: "Health Services",
    description: "Scan medicines, read prescriptions, and find nearby clinics instantly",
    color: "#EF4444",
    accent: "#FCA5A5",
  },
  {
    icon: Sparkles,
    title: "Government Assist",
    description: "AI-powered help with forms, schemes, and government services",
    color: "#8B5CF6",
    accent: "#C4B5FD",
  },
  {
    icon: Bell,
    title: "Medication Reminders",
    description: "Never miss a dose — set smart reminders for all your medicines",
    color: "#F59E0B",
    accent: "#FDE68A",
  },
  {
    icon: FileText,
    title: "Prescription Reader",
    description: "Upload any prescription and get it explained in plain language",
    color: "#10B981",
    accent: "#6EE7B7",
  },
  {
    icon: MapPin,
    title: "Nearby Clinics",
    description: "Find hospitals, clinics, and pharmacies near your location",
    color: "#3B82F6",
    accent: "#93C5FD",
  },
  {
    icon: Shield,
    title: "Health Schemes",
    description: "Discover government health schemes you are eligible for",
    color: "#06B6D4",
    accent: "#67E8F9",
  },
  {
    icon: Mic,
    title: "Voice Assistant",
    description: "Talk to JanSathi in your language — Hindi, Telugu, or English",
    color: "#EC4899",
    accent: "#F9A8D4",
  },
  {
    icon: User,
    title: "Your Profile",
    description: "Manage your personal health data and accessibility preferences",
    color: "#6366F1",
    accent: "#A5B4FC",
  },
];

const INTERVAL = 3000;

export const FeatureSlideshow = () => {
  const [current, setCurrent] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (index: number, direction: "left" | "right" = "right") => {
    const slideOut = direction === "right" ? -30 : 30;
    const slideIn = direction === "right" ? 30 : -30;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: slideOut,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrent(index);
      slideAnim.setValue(slideIn);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          speed: 20,
          bounciness: 6,
        }),
      ]).start();
    });
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % SLIDES.length;
        goTo(next, "right");
        return prev; // goTo handles setCurrent internally
      });
    }, INTERVAL);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleDotPress = (index: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    goTo(index, index > current ? "right" : "left");
    startTimer();
  };

  const slide = SLIDES[current];
  const Icon = slide.icon;

  return (
    <View className="mx-1 mb-6">
      {/* Card */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        }}
      >
        <View
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "#1E293B",
            borderWidth: 1,
            borderColor: slide.accent + "40",
            shadowColor: slide.color,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          {/* Accent top bar */}
          <View
            style={{
              height: 3,
              backgroundColor: slide.accent,
              opacity: 0.8,
            }}
          />

          <View className="p-5 flex-row items-center gap-4">
            {/* Icon */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                backgroundColor: slide.color + "22",
                borderWidth: 1,
                borderColor: slide.color + "44",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={30} color={slide.color} />
            </View>

            {/* Text */}
            <View className="flex-1">
              <Text
                className="text-white font-bold text-lg mb-1"
                style={{ letterSpacing: 0.3 }}
              >
                {slide.title}
              </Text>
              <Text
                className="text-[#94A3B8] text-sm leading-5"
                numberOfLines={2}
              >
                {slide.description}
              </Text>
            </View>
          </View>

          {/* Slide counter */}
          <View className="px-5 pb-4 flex-row justify-between items-center">
            {/* Dots */}
            <View className="flex-row gap-1.5">
              {SLIDES.map((_, i) => (
                <Pressable key={i} onPress={() => handleDotPress(i)}>
                  <Animated.View
                    style={{
                      width: i === current ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: i === current ? slide.accent : "#334155",
                    }}
                  />
                </Pressable>
              ))}
            </View>

            <Text className="text-[#475569] text-xs">
              {current + 1} / {SLIDES.length}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};