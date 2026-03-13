import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Language = "en" | "hi" | "te";
export type Theme = "dark" | "light";

interface AppState {
  language: Language;
  theme: Theme;
  soundEnabled: boolean;
}

const initialState: AppState = {
  language: "en",
  theme: "dark",
  soundEnabled: true,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setAppLanguage(state, action: PayloadAction<Language>) {
      state.language = action.payload;
    },
    setAppTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },
    setSoundEnabled(state, action: PayloadAction<boolean>) {
      state.soundEnabled = action.payload;
    },
  },
});

export const { setAppLanguage, setAppTheme, setSoundEnabled } = appSlice.actions;
export default appSlice.reducer;