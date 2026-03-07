import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Language = "en" | "hi" | "te";

interface AppState {
  language: Language;
}

const initialState: AppState = {
  language: "en",
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setAppLanguage(state, action: PayloadAction<Language>) {
      state.language = action.payload;
    },
  },
});

export const { setAppLanguage } = appSlice.actions;
export default appSlice.reducer;