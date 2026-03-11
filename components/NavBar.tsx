import { View, Text, Pressable } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Home, Heart, Sparkles, User, Info } from "lucide-react-native";
import { useTranslation } from "@/hooks/useTranslation";

export const NavBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { path: "/", label: t.nav.home, icon: Home },
    { path: "/health", label: t.nav.health, icon: Heart },
    { path: "/g-assist", label: t.nav.assist, icon: Sparkles },
    { path: "/profile", label: t.nav.profile, icon: User },
    { path: "/about", label: t.nav.about, icon: Info },
  ];

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-light-card dark:bg-card border-t border-light-border dark:border-border">
      <View className="flex-row justify-around py-2">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = pathname === path;
          return (
            <Pressable
              key={path}
              onPress={() => router.push(path)}
              className={`items-center px-3 py-1 rounded-lg ${
                isActive ? "bg-primary/10" : ""
              }`}
            >
              <Icon size={22} color={isActive ? "#5B21B6" : "#9CA3AF"} />
              <Text
                className={`text-xs mt-1 ${
                  isActive ? "text-primary font-bold" : "text-muted"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};