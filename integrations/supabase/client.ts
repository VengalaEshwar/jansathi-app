import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import type { Database } from "./types";

const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY =
  Constants.expoConfig?.extra?.SUPABASE_PUBLISHABLE_KEY!;

let supabase: ReturnType<typeof createClient<Database>> | null = null;

if (typeof window !== "undefined") {
  supabase = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    }
  );
}

export { supabase };