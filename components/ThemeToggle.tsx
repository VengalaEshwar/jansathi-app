import { Pressable } from "react-native";
import { Moon, Sun } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  size?: number;
}

export const ThemeToggle = ({ size = 22 }: ThemeToggleProps) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Pressable
      onPress={toggleTheme}
      className="w-10 h-10 rounded-full bg-secondary items-center justify-center"
      style={{ elevation: 2 }}
    >
      {isDark ? (
        <Sun size={size} color="#F59E0B" />
      ) : (
        <Moon size={size} color="#6366F1" />
      )}
    </Pressable>
  );
};