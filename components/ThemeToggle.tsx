// components/ThemeToggle.tsx
import { memo } from "react";
import { Moon, Sun } from "lucide-react-native";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAppTheme } from "@/store/slices/appSlice";
import { apiRequest } from "@/integrations/api/client";
import type { Theme } from "@/store/slices/appSlice";

interface ThemeToggleProps {
  size?: number;
}

export const ThemeToggle = memo(({ size = 22 }: ThemeToggleProps) => {
  const dispatch = useAppDispatch();
  const theme    = useAppSelector((s: any) => s.app?.theme ?? "dark");
  const isDark   = theme === "dark";

  const handleToggle = async () => {
    const next: Theme = isDark ? "light" : "dark";
    dispatch(setAppTheme(next));
    // Best-effort persist — fire and forget, no blocking
    try { await apiRequest("/auth/preferences", "PATCH", { theme: next }); } catch {}
  };

  return (
    <AnimatedPressable onPress={handleToggle} soundType="soft"
      style={{
        width: 40, height: 40, borderRadius: 20,
        alignItems: "center", justifyContent: "center",
        backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
        borderWidth: 1.5,
        borderColor: isDark ? "#334155" : "#E2E8F0",
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
      }}>
      {isDark
        ? <Sun  size={size} color="#F59E0B" />
        : <Moon size={size} color="#6366F1" />}
    </AnimatedPressable>
  );
});