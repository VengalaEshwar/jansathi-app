import { useRef } from "react";
import { View, Text, Pressable, Animated, useWindowDimensions } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Home, Heart, Sparkles, User, Info } from "lucide-react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { useSound } from "@/hooks/useSound";

const WEB_BREAKPOINT = 768;

export const NavBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { playClick } = useSound();

  const isWide = width >= WEB_BREAKPOINT;

  const navItems = [
    { path: "/",         label: t.nav.home,    icon: Home     },
    { path: "/health",   label: t.nav.health,  icon: Heart    },
    { path: "/g-assist", label: t.nav.assist,  icon: Sparkles },
    { path: "/profile",  label: t.nav.profile, icon: User     },
    { path: "/about",    label: t.nav.about,   icon: Info     },
  ];

  const handlePress = (path: string) => {
    playClick("soft");
    router.push(path as any);
  };

  if (isWide) {
    return <TopNavBar navItems={navItems} pathname={pathname} onPress={handlePress} />;
  }

  return <BottomNavBar navItems={navItems} pathname={pathname} onPress={handlePress} />;
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavItem {
  path: string;
  label: string;
  icon: any;
}

interface NavProps {
  navItems: NavItem[];
  pathname: string;
  onPress: (path: string) => void;
}

// ── Top NavBar (web / wide screen) ───────────────────────────────────────────

const TopNavBar = ({ navItems, pathname, onPress }: NavProps) => (
  <View
    className="bg-white dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-[#1E293B]"
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 32,
      paddingVertical: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 4,
      zIndex: 100,
    }}
  >
    {/* Logo */}
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: "#8B5CF6",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#8B5CF6",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
        }}
      >
        <Sparkles size={18} color="white" />
      </View>
      <Text
        className="text-[#0F172A] dark:text-white"
        style={{ fontSize: 18, fontWeight: "800", letterSpacing: -0.4 }}
      >
        JanSathi
      </Text>
    </View>

    {/* Nav items */}
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      {navItems.map(({ path, label, icon: Icon }) => (
        <TopNavItem
          key={path}
          path={path}
          label={label}
          Icon={Icon}
          isActive={pathname === path}
          onPress={onPress}
        />
      ))}
    </View>
  </View>
);

const TopNavItem = ({
  path, label, Icon, isActive, onPress,
}: {
  path: string; label: string; Icon: any; isActive: boolean; onPress: (p: string) => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => onPress(path)}
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 40, bounciness: 4 }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start()
        }
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 10,
          backgroundColor: isActive ? "#8B5CF620" : "transparent",
          borderWidth: 1,
          borderColor: isActive ? "#8B5CF640" : "transparent",
        }}
      >
        <Icon size={16} color={isActive ? "#8B5CF6" : "#64748B"} />
        <Text
          style={{
            fontSize: 13,
            fontWeight: isActive ? "700" : "500",
            color: isActive ? "#8B5CF6" : "#64748B",
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

// ── Bottom NavBar (mobile / narrow screen) ────────────────────────────────────

const BottomNavBar = ({ navItems, pathname, onPress }: NavProps) => (
  <View
    className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#0F172A] border-t border-[#E2E8F0] dark:border-[#1E293B]"
    style={{
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 12,
    }}
  >
    <View className="flex-row justify-around py-2">
      {navItems.map(({ path, label, icon: Icon }) => (
        <BottomNavItem
          key={path}
          path={path}
          label={label}
          Icon={Icon}
          isActive={pathname === path}
          onPress={onPress}
        />
      ))}
    </View>
  </View>
);

const BottomNavItem = ({
  path, label, Icon, isActive, onPress,
}: {
  path: string; label: string; Icon: any; isActive: boolean; onPress: (p: string) => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  return (
    <Animated.View style={{ transform: [{ scale }, { translateY }] }}>
      <Pressable
        onPress={() => onPress(path)}
        onPressIn={() => {
          Animated.parallel([
            Animated.spring(scale,      { toValue: 0.88, useNativeDriver: true, speed: 40, bounciness: 4 }),
            Animated.spring(translateY, { toValue: -3,   useNativeDriver: true, speed: 40, bounciness: 4 }),
          ]).start();
        }}
        onPressOut={() => {
          Animated.parallel([
            Animated.spring(scale,      { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 10 }),
          ]).start();
        }}
        style={{
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 12,
          backgroundColor: isActive ? "#8B5CF615" : "transparent",
        }}
      >
        <Icon size={22} color={isActive ? "#8B5CF6" : "#9CA3AF"} />
        <Text
          style={{
            fontSize: 11,
            marginTop: 3,
            fontWeight: isActive ? "700" : "400",
            color: isActive ? "#8B5CF6" : "#9CA3AF",
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};