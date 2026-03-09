import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PersonalInfo {
  dob: string;
  gender: string;
  address: string;
  location: string;
  age: number | null;
  extra: { label: string; value: string }[];
}

interface Notifications {
  enabled: boolean;
  medicationReminders: boolean;
  appointmentAlerts: boolean;
  governmentUpdates: boolean;
}

interface DbUser {
  _id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string;
  language: "en" | "hi" | "te";
  notifications: Notifications;
  personalInfo: PersonalInfo;
}

interface AuthState {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
  } | null;
  dbUser: DbUser | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  dbUser: null,
  isLoading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthState["user"]>) {
      state.user = action.payload;
      state.isLoading = false;
    },
    setDbUser(state, action: PayloadAction<DbUser>) {
      state.dbUser = action.payload;
    },
    updateDbUser(state, action: PayloadAction<Partial<DbUser>>) {
      if (state.dbUser) {
        state.dbUser = { ...state.dbUser, ...action.payload };
      }
    },
    clearUser(state) {
      state.user = null;
      state.dbUser = null;
      state.isLoading = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setUser, setDbUser, updateDbUser, clearUser, setLoading } = authSlice.actions;
export default authSlice.reducer;