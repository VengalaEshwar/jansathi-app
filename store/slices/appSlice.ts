// store/slices/appSlice.ts — ADD these to your existing appSlice
//
// 1. Add voiceAssistantEnabled to the state interface and initialState
// 2. Add setVoiceAssistantEnabled action
// 3. Persist it in the AsyncStorage key list alongside theme/language/soundEnabled
//
// ─────────────────────────────────────────────────────────────────────────────
// PATCH — add to your existing AppState interface:
//
//   voiceAssistantEnabled: boolean;
//
// PATCH — add to initialState:
//
//   voiceAssistantEnabled: false,
//
// PATCH — add to reducers:
//
//   setVoiceAssistantEnabled: (state, action: PayloadAction<boolean>) => {
//     state.voiceAssistantEnabled = action.payload;
//   },
//
// PATCH — add to extraReducers / persistence (wherever you save to AsyncStorage):
//
//   case setVoiceAssistantEnabled.type:
//     await AsyncStorage.setItem("voiceAssistantEnabled", action.payload.toString());
//
// PATCH — add to your app startup loader (wherever you load persisted values):
//
//   const savedVoice = await AsyncStorage.getItem("voiceAssistantEnabled");
//   if (savedVoice !== null) dispatch(setVoiceAssistantEnabled(savedVoice === "true"));
//
// ─────────────────────────────────────────────────────────────────────────────
// EXPORT: make sure to export the new action
//
//   export const { setAppTheme, setAppLanguage, setSoundEnabled, setVoiceAssistantEnabled } = appSlice.actions;
// ─────────────────────────────────────────────────────────────────────────────

// If you want a complete replacement, here is the full recommended appSlice:


import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Theme    = "dark" | "light";
export type Language = "en" | "hi" | "te";

interface AppState {
  theme:                 Theme;
  language:              Language;
  soundEnabled:          boolean;
  voiceAssistantEnabled: boolean;
  _hydrated:             boolean;
}

const initialState: AppState = {
  theme:                 "dark",
  language:              "en",
  soundEnabled:          true,
  voiceAssistantEnabled: false,
  _hydrated:             false,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setAppTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      AsyncStorage.setItem("theme", action.payload).catch(() => {});
    },
    setAppLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
      AsyncStorage.setItem("language", action.payload).catch(() => {});
    },
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
      AsyncStorage.setItem("soundEnabled", action.payload.toString()).catch(() => {});
    },
    setVoiceAssistantEnabled: (state, action: PayloadAction<boolean>) => {
      state.voiceAssistantEnabled = action.payload;
      AsyncStorage.setItem("voiceAssistantEnabled", action.payload.toString()).catch(() => {});
    },
    hydrateApp: (
      state,
      action: PayloadAction<Partial<Omit<AppState, "_hydrated">>>
    ) => {
      return { ...state, ...action.payload, _hydrated: true };
    },
  },
});

export const {
  setAppTheme,
  setAppLanguage,
  setSoundEnabled,
  setVoiceAssistantEnabled,
  hydrateApp,
} = appSlice.actions;

export default appSlice.reducer;

// ── Startup hydration thunk — call once in _layout.tsx ──────────────────────
export function loadPersistedAppSettings() {
  return async (dispatch: any) => {
    try {
      const [theme, language, sound, voice] = await Promise.all([
        AsyncStorage.getItem("theme"),
        AsyncStorage.getItem("language"),
        AsyncStorage.getItem("soundEnabled"),
        AsyncStorage.getItem("voiceAssistantEnabled"),
      ]);
      dispatch(hydrateApp({
        theme:                 (theme    as Theme    | null) ?? "dark",
        language:              (language as Language | null) ?? "en",
        soundEnabled:          sound !== null ? sound === "true" : true,
        voiceAssistantEnabled: voice !== null ? voice === "true" : false,
      }));
    } catch {
      dispatch(hydrateApp({}));
    }
  };
}





// import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// type Language = "en" | "hi" | "te";
// export type Theme = "dark" | "light";

// interface AppState {
//   language: Language;
//   theme: Theme;
//   soundEnabled: boolean;
// }

// const initialState: AppState = {
//   language: "en",
//   theme: "dark",
//   soundEnabled: true,
// };

// const appSlice = createSlice({
//   name: "app",
//   initialState,
//   reducers: {
//     setAppLanguage(state, action: PayloadAction<Language>) {
//       state.language = action.payload;
//     },
//     setAppTheme(state, action: PayloadAction<Theme>) {
//       state.theme = action.payload;
//     },
//     setSoundEnabled(state, action: PayloadAction<boolean>) {
//       state.soundEnabled = action.payload;
//     },
//   },
// });

// export const { setAppLanguage, setAppTheme, setSoundEnabled } = appSlice.actions;
// export default appSlice.reducer;