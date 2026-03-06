import { View, Text, Pressable } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Home, Heart, Sparkles, User, Info } from "lucide-react-native";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/health", label: "Health", icon: Heart },
  { path: "/g-assist", label: "G-Assist", icon: Sparkles },
  { path: "/profile", label: "Profile", icon: User },
  { path: "/about", label: "About", icon: Info },
];

export const NavBar = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border">
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
