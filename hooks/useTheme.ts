import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAppTheme, Theme } from "@/store/slices/appSlice";
import { apiRequest } from "@/integrations/api/client";

const saveThemeToDB = async (theme: Theme) => {
  try {
    await apiRequest("/preferences", "PATCH", { theme });
  } catch (e) {
    console.log("Failed to save theme to DB:", e);
  }
};

export const useTheme = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.app.theme);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    dispatch(setAppTheme(next));
    saveThemeToDB(next);
  };

  const setTheme = (t: Theme) => {
    dispatch(setAppTheme(t));
    saveThemeToDB(t);
  };

  return {
    theme,
    isDark: theme === "dark",
    isLight: theme === "light",
    toggleTheme,
    setTheme,
  };
};