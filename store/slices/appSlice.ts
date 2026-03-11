import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Language = "en" | "hi" | "te";
export type Theme = "dark" | "light";

interface AppState {
  language: Language;
  theme: Theme;
}

const initialState: AppState = {
  language: "en",
  theme: "dark",
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setAppLanguage(state, action: PayloadAction<Language>) {
      state.language = action.payload;
    },
    // Only updates local Redux state — DB save is handled by useTheme hook
    setAppTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },
  },
});

export const { setAppLanguage, setAppTheme } = appSlice.actions;
export default appSlice.reducer;