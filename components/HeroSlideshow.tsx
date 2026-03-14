import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  PanResponder,
  StyleSheet,
  ImageBackground,
  ImageSourcePropType,
  Platform,
  useWindowDimensions,
  Pressable,
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
import { useAppSelector } from "@/store/hooks";

// =========================
// DARK MODE IMAGES
// =========================
const HealthImage = require("../assets/images/gen_images/hero-health-services-dark.jpg");
const GovtImage = require("../assets/images/gen_images/hero-government-assist-dark.jpg");
const MedicinesImage = require("../assets/images/gen_images/hero-medication-reminders-dark.jpg");
const PrescriptionImage = require("../assets/images/gen_images/hero-prescription-reader-dark.jpg");
const ClinicsImage = require("../assets/images/gen_images/hero-nearby-clinics-dark.jpg");
const SchemesImage = require("../assets/images/gen_images/hero-health-schemes-dark.jpg");
const VoiceImage = require("../assets/images/gen_images/hero-voice-assistant-dark.jpg");
const ProfileImage = require("../assets/images/gen_images/hero-profile-dark.jpg");

// =========================
// LIGHT MODE IMAGES
// =========================
const HealthImageLight = require("../assets/images/gen_images/hero-health-services-light.jpg");
const GovtImageLight = require("../assets/images/gen_images/hero-government-assist-light.jpg");
const MedicinesImageLight = require("../assets/images/gen_images/hero-medication-reminders-light.jpg");
const PrescriptionImageLight = require("../assets/images/gen_images/hero-prescription-reader-light.jpg");
const ClinicsImageLight = require("../assets/images/gen_images/hero-nearby-clinics-light.jpg");
const SchemesImageLight = require("../assets/images/gen_images/hero-health-schemes-light.jpg");
const VoiceImageLight = require("../assets/images/gen_images/hero-voice-assistant-light.jpg");
const ProfileImageLight = require("../assets/images/gen_images/hero-profile-light.jpg");

const INTERVAL = 3500;

interface Slide {
  icon: any;
  title: string;
  description: string;
  iconColor: string;
  image: ImageSourcePropType;
  imageL: ImageSourcePropType;
}

const SLIDES: Slide[] = [
  {
    icon: Heart,
    title: "Health Services",
    description: "Scan medicines & read prescriptions instantly",
    iconColor: "#F9A8D4",
    image: HealthImage,
    imageL: HealthImageLight,
  },
  {
    icon: Sparkles,
    title: "Government Assist",
    description: "AI-powered help with forms and schemes",
    iconColor: "#93C5FD",
    image: GovtImage,
    imageL: GovtImageLight,
  },
  {
    icon: Bell,
    title: "Medication Reminders",
    description: "Never miss a dose with smart reminders",
    iconColor: "#FDE68A",
    image: MedicinesImage,
    imageL: MedicinesImageLight,
  },
  {
    icon: FileText,
    title: "Prescription Reader",
    description: "Get prescriptions explained in plain language",
    iconColor: "#6EE7B7",
    image: PrescriptionImage,
    imageL: PrescriptionImageLight,
  },
  {
    icon: MapPin,
    title: "Nearby Clinics",
    description: "Find hospitals and pharmacies near you",
    iconColor: "#A5B4FC",
    image: ClinicsImage,
    imageL: ClinicsImageLight,
  },
  {
    icon: Shield,
    title: "Health Schemes",
    description: "Discover government schemes you qualify for",
    iconColor: "#67E8F9",
    image: SchemesImage,
    imageL: SchemesImageLight,
  },
  {
    icon: Mic,
    title: "Voice Assistant",
    description: "Talk in Hindi, Telugu, or English",
    iconColor: "#F9A8D4",
    image: VoiceImage,
    imageL: VoiceImageLight,
  },
  {
    icon: User,
    title: "Your Profile",
    description: "Manage health data and preferences",
    iconColor: "#C4B5FD",
    image: ProfileImage,
    imageL: ProfileImageLight,
  },
];

export const HeroSlideshow = () => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  // Adaptive height
  const isMobile = SCREEN_WIDTH < 768;
  const SLIDE_HEIGHT = isMobile
    ? Math.max(SCREEN_WIDTH * 0.55, 200)
    : Math.max(SCREEN_WIDTH * 0.36, 140);

  const [current, setCurrent] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);
  const currentRef = useRef(0);

  // Theme from Redux
  const theme = useAppSelector((state) => state.app.theme);
  const isDark = theme === "dark";

  // Dynamic theme colors
  const titleColor = isDark ? "white" : "#0F172A";
  const descColor = isDark ? "rgba(255,255,255,0.9)" : "rgba(15, 23, 42, 0.82)";
  const overlayColor = isDark ? "rgba(0,0,0,0.35)" : "rgba(248,250,252,0.18)";
  const elementsColor = isDark ? "white" : "#334155";

  const dotScales = useRef(
    SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.7))
  ).current;

  const dotOpacities = useRef(
    SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.4))
  ).current;

  const animateDots = (index: number) => {
    SLIDES.forEach((_, i) => {
      Animated.parallel([
        Animated.spring(dotScales[i], {
          toValue: i === index ? 1 : 0.7,
          useNativeDriver: true,
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
    if (nextIndex === currentRef.current) return;

    const direction = nextIndex > currentRef.current ? -1 : 1;

    Animated.timing(translateX, {
      toValue: direction * SCREEN_WIDTH,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      currentRef.current = nextIndex;
      setCurrent(nextIndex);
      animateDots(nextIndex);

      translateX.setValue(-direction * SCREEN_WIDTH);

      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        speed: 14,
        bounciness: 4,
      }).start();
    });
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      slideTo((currentRef.current + 1) % SLIDES.length);
    }, INTERVAL);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [SCREEN_WIDTH]);

  const handleDotPress = (index: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    slideTo(index);
    startTimer();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderMove: (_, g) => {
        translateX.setValue(g.dx * 0.4);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) {
          slideTo((currentRef.current + 1) % SLIDES.length);
        } else if (g.dx > 50) {
          slideTo((currentRef.current - 1 + SLIDES.length) % SLIDES.length);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
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
      style={[
        styles.mainContainer,
        {
          height: SLIDE_HEIGHT,
          backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
          shadowColor: isDark ? "#000" : "#94A3B8",
        },
      ]}
    >
      <Animated.View
        style={{ flex: 1, transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <ImageBackground
          source={isDark ? slide.image : slide.imageL}
          resizeMode="cover"
          style={styles.slideContent}
          imageStyle={styles.imageStyle}
        >
          {/* Optional subtle overlay for both modes */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: overlayColor,
                borderRadius: 24,
              },
            ]}
          />

          <View style={styles.innerContent}>
            {/* Top Row */}
            <View style={styles.topRow}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.16)"
                      : "rgba(255,255,255,0.72)",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.22)"
                      : "rgba(148,163,184,0.22)",
                  },
                ]}
              >
                <Icon size={24} color={elementsColor} />
              </View>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isDark
                      ? "rgba(15,23,42,0.45)"
                      : "rgba(255,255,255,0.75)",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.16)"
                      : "rgba(148,163,184,0.22)",
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: elementsColor }]}>
                  {current + 1} / {SLIDES.length}
                </Text>
              </View>
            </View>

            {/* Bottom Content */}
            <View>
              <Text style={[styles.titleText, { color: titleColor }]}>
                {slide.title}
              </Text>

              <Text
                style={[styles.descText, { color: descColor }]}
                numberOfLines={2}
              >
                {slide.description}
              </Text>

              <View style={styles.dotContainer}>
                {SLIDES.map((_, i) => (
                  <Pressable key={i} onPress={() => handleDotPress(i)}>
                    <Animated.View
                      style={[
                        styles.dot,
                        {
                          width: i === current ? 20 : 6,
                          opacity: dotOpacities[i],
                          transform: [{ scaleY: dotScales[i] }],
                          backgroundColor: elementsColor,
                        },
                      ]}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </ImageBackground>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    overflow: "hidden",
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 24,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  slideContent: {
    flex: 1,
    padding: 20,
  },
  innerContent: {
    flex: 1,
    justifyContent: "space-between",
    zIndex: 2,
  },
  imageStyle: {
    borderRadius: 24,
    ...Platform.select({
      web: {
        width: "100%",
        height: "100%",
        objectFit: "cover" as any,
      },
      default: {},
    }),
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  titleText: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  descText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  dotContainer: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
});