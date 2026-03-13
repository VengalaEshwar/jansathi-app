import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  Dimensions,
  Pressable,
  PanResponder,
} from "react-native";
import {
  Heart,
  Sparkles,
  Bell,
  FileText,
  MapPin,
  Shield,
  Mic,
  User,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SLIDE_HEIGHT = SCREEN_HEIGHT * 0.30;
const INTERVAL = 3500;

interface Slide {
  icon: any;
  title: string;
  description: string;
  gradientColors: [string, string, string];
  iconColor: string;
}

const SLIDES: Slide[] = [
  {
    icon: Heart,
    title: "Health Services",
    description: "Scan medicines & read prescriptions instantly",
    gradientColors: ["#1a0533", "#4C1D95", "#7C3AED"],
    iconColor: "#F9A8D4",
  },
  {
    icon: Sparkles,
    title: "Government Assist",
    description: "AI-powered help with forms and schemes",
    gradientColors: ["#0c1a3d", "#1E3A8A", "#3B82F6"],
    iconColor: "#93C5FD",
  },
  {
    icon: Bell,
    title: "Medication Reminders",
    description: "Never miss a dose with smart reminders",
    gradientColors: ["#1a1200", "#92400E", "#F59E0B"],
    iconColor: "#FDE68A",
  },
  {
    icon: FileText,
    title: "Prescription Reader",
    description: "Get prescriptions explained in plain language",
    gradientColors: ["#001a0e", "#065F46", "#10B981"],
    iconColor: "#6EE7B7",
  },
  {
    icon: MapPin,
    title: "Nearby Clinics",
    description: "Find hospitals and pharmacies near you",
    gradientColors: ["#001233", "#1E3A8A", "#6366F1"],
    iconColor: "#A5B4FC",
  },
  {
    icon: Shield,
    title: "Health Schemes",
    description: "Discover government schemes you qualify for",
    gradientColors: ["#001a1a", "#164E63", "#06B6D4"],
    iconColor: "#67E8F9",
  },
  {
    icon: Mic,
    title: "Voice Assistant",
    description: "Talk in Hindi, Telugu, or English",
    gradientColors: ["#1a0022", "#831843", "#EC4899"],
    iconColor: "#F9A8D4",
  },
  {
    icon: User,
    title: "Your Profile",
    description: "Manage health data and preferences",
    gradientColors: ["#0d0d1a", "#312E81", "#6366F1"],
    iconColor: "#C4B5FD",
  },
];

export const HeroSlideshow = () => {
  const [current, setCurrent] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRef = useRef(0);

  // Dot scale animations
  const dotScales = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.7))).current;
  const dotOpacities = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.4))).current;

  const animateDots = (index: number) => {
    SLIDES.forEach((_, i) => {
      Animated.parallel([
        Animated.spring(dotScales[i], {
          toValue: i === index ? 1 : 0.7,
          useNativeDriver: true,
          speed: 20,
          bounciness: 8,
        }),
        Animated.timing(dotOpacities[i], {
          toValue: i === index ? 1 : 0.4,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const slideTo = (nextIndex: number) => {
    const direction = nextIndex > currentRef.current ? -1 : 1;

    // Slide out current
    Animated.timing(translateX, {
      toValue: direction * SCREEN_WIDTH,
      duration: 0,
      useNativeDriver: true,
    }).start(() => {
      currentRef.current = nextIndex;
      setCurrent(nextIndex);
      animateDots(nextIndex);

      // Slide in from opposite side
      translateX.setValue(-direction * SCREEN_WIDTH);
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        speed: 16,
        bounciness: 4,
      }).start();
    });
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const next = (currentRef.current + 1) % SLIDES.length;
      slideTo(next);
    }, INTERVAL);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Swipe gesture support
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderMove: (_, g) => {
        translateX.setValue(g.dx * 0.3); // slight drag follow
      },
      onPanResponderRelease: (_, g) => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (g.dx < -40) {
          const next = (currentRef.current + 1) % SLIDES.length;
          slideTo(next);
        } else if (g.dx > 40) {
          const prev = (currentRef.current - 1 + SLIDES.length) % SLIDES.length;
          slideTo(prev);
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            speed: 20,
            bounciness: 6,
          }).start();
        }
        startTimer();
      },
    })
  ).current;

  const slide = SLIDES[current];
  const Icon = slide.icon;

  return (
    <View
      style={{ height: SLIDE_HEIGHT, overflow: "hidden", borderRadius: 20 }}
      className="mb-6"
    >
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateX }],
        }}
        {...panResponder.panHandlers}
      >
        <LinearGradient
          colors={slide.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, padding: 24, justifyContent: "space-between" }}
        >
          {/* Decorative circles */}
          <View
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: "rgba(255,255,255,0.05)",
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: -20,
              left: -20,
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "rgba(255,255,255,0.04)",
            }}
          />

          {/* Slide number badge */}
          <View className="flex-row justify-between items-start">
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "600" }}>
                {current + 1} / {SLIDES.length}
              </Text>
            </View>

            {/* Icon badge */}
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={24} color={slide.iconColor} />
            </View>
          </View>

          {/* Text content */}
          <View>
            <Text
              style={{
                color: "white",
                fontSize: 26,
                fontWeight: "800",
                letterSpacing: -0.5,
                marginBottom: 6,
              }}
            >
              {slide.title}
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: 14,
                lineHeight: 20,
              }}
            >
              {slide.description}
            </Text>
          </View>

          {/* Dot indicators */}
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            {SLIDES.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  slideTo(i);
                  startTimer();
                }}
              >
                <Animated.View
                  style={{
                    height: 4,
                    width: i === current ? 24 : 6,
                    borderRadius: 2,
                    backgroundColor: "white",
                    opacity: dotOpacities[i],
                    transform: [{ scaleY: dotScales[i] }],
                  }}
                />
              </Pressable>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};