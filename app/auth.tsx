// app/auth.tsx
import { useState, useEffect, useRef, memo } from "react";
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  Animated, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, GoogleAuthProvider, signInWithCredential, signInWithPopup,
} from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { Sparkles, Mail, Lock, User, Eye, EyeOff, Moon, Sun } from "lucide-react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAppLanguage, setAppTheme } from "@/store/slices/appSlice";
import type { Language } from "@/translations";
import { useToast } from "@/hooks/useToast";
import { useSound } from "@/hooks/useSound";

let GoogleSignin: any, statusCodes: any;
if (Platform.OS !== "web") {
  try {
    const G = require("@react-native-google-signin/google-signin");
    GoogleSignin = G.GoogleSignin; statusCodes = G.statusCodes;
    GoogleSignin.configure({ webClientId: "926203078040-veqcg4kjg32m9jpn0o72ljjsc6iekf90.apps.googleusercontent.com" });
  } catch {}
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हि" },
  { code: "te", label: "తె" },
];

const useFadeSlideIn = (delay = 0) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true, speed: 12, bounciness: 6 }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
};

// ── LangPill — extracted so useRef is at component level ──────────────────────
const LangPill = memo(({ label, active, onPress, isDark }: {
  label: string; active: boolean; onPress: () => void; isDark: boolean;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        style={{
          paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
          backgroundColor: active ? "#8B5CF6" : isDark ? "#1E293B" : "white",
          borderWidth: 1.5, borderColor: active ? "#8B5CF6" : isDark ? "#334155" : "#E2E8F0",
        }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: active ? "white" : isDark ? "#94A3B8" : "#64748B" }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
});

// ── ThemeToggle — next to language pills ──────────────────────────────────────
const ThemeToggle = memo(({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onToggle}
        onPressIn={() => Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        style={{
          paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
          backgroundColor: isDark ? "#1E293B" : "white",
          borderWidth: 1.5, borderColor: isDark ? "#334155" : "#E2E8F0",
          alignItems: "center", justifyContent: "center",
        }}>
        {isDark
          ? <Sun  size={14} color="#F59E0B" />
          : <Moon size={14} color="#64748B" />}
      </Pressable>
    </Animated.View>
  );
});

// ── ModeTab — extracted so useRef is at component level ───────────────────────
const ModeTab = memo(({ label, active, onPress, isDark }: {
  label: string; active: boolean; onPress: () => void; isDark: boolean;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <Pressable onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        style={{ paddingVertical: 10, borderRadius: 12, alignItems: "center", backgroundColor: active ? "#8B5CF6" : "transparent" }}>
        <Text style={{ fontWeight: "700", fontSize: 14, color: active ? "white" : isDark ? "#94A3B8" : "#64748B" }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
});

// ── AnimInput ─────────────────────────────────────────────────────────────────
const AnimInput = ({ icon: Icon, placeholder, value, onChangeText, secureTextEntry = false, keyboardType = "default" as any, autoCapitalize = "none" as any, delay = 0, isDark }: any) => {
  const anim    = useFadeSlideIn(delay);
  const [secure,  setSecure]  = useState(secureTextEntry);
  const [focused, setFocused] = useState(false);
  return (
    <Animated.View style={[anim, { marginBottom: 12 }]}>
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 10,
        borderWidth: 1.5,
        borderColor: focused ? "#8B5CF6" : isDark ? "#334155" : "#E2E8F0",
        borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
        backgroundColor: focused
          ? "#8B5CF615"
          : isDark ? "#1E293B" : "white",
      }}>
        <Icon size={18} color={focused ? "#8B5CF6" : isDark ? "#64748B" : "#94A3B8"} />
        <TextInput
          style={{ flex: 1, color: isDark ? "#F1F5F9" : "#0F172A", fontSize: 14 }}
          placeholder={placeholder}
          placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setSecure((v: boolean) => !v)} hitSlop={8}>
            {secure ? <Eye size={16} color={isDark ? "#64748B" : "#94A3B8"} /> : <EyeOff size={16} color={isDark ? "#64748B" : "#94A3B8"} />}
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};

// ── SpringBtn ─────────────────────────────────────────────────────────────────
const SpringBtn = ({ children, onPress, style }: any) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 8 }).start()}
        style={style}>
        {children}
      </Pressable>
    </Animated.View>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Auth() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const dispatch = useAppDispatch();
  const toast    = useToast();
  const { playClick } = useSound();

  // Read theme from Redux (same as rest of app)
  const colorScheme = useAppSelector((s: any) => s.app?.theme ?? "dark");
  const isDark = colorScheme === "dark";

  const [mode,          setMode]          = useState<"signin" | "signup">("signin");
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [firstName,     setFirstName]     = useState("");
  const [lastName,      setLastName]      = useState("");

  const logoAnim   = useFadeSlideIn(0);
  const tabAnim    = useFadeSlideIn(100);
  const bottomAnim = useFadeSlideIn(420);

  // Theme-aware colors
  const bg        = isDark ? "#0F172A" : "#F8FAFC";
  const cardBg    = isDark ? "#1E293B" : "white";
  const border    = isDark ? "#334155" : "#E2E8F0";
  const textPri   = isDark ? "#F1F5F9" : "#0F172A";
  const textMuted = isDark ? "#94A3B8" : "#64748B";
  const divider   = isDark ? "#334155" : "#E2E8F0";

  const toggleTheme = () => {
    playClick("soft");
    dispatch(setAppTheme(isDark ? "light" : "dark"));
  };

  const handleGoogleSignIn = async () => {
    playClick("mechanical"); setGoogleLoading(true);
    try {
      if (Platform.OS === "web") { await signInWithPopup(auth, new GoogleAuthProvider()); router.replace("/"); return; }
      if (!GoogleSignin) { toast.error(t.auth.googleNotAvailable); return; }
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken  = userInfo.data?.idToken;
      if (!idToken) throw new Error("No ID token");
      await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
      router.replace("/");
    } catch (e: any) {
      if (statusCodes && (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === statusCodes.IN_PROGRESS)) return;
      toast.error(e.message || t.auth.googleFailed);
    } finally { setGoogleLoading(false); }
  };

  const handleSubmit = async () => {
    playClick("mechanical");
    if (mode === "signup") {
      if (!email || !password || !firstName || !lastName) { toast.error(t.auth.fillAllFields); return; }
      setLoading(true);
      try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: `${firstName} ${lastName}` });
        toast.success(t.auth.accountCreated); router.replace("/");
      } catch (e: any) { toast.error(e.message || t.auth.signupFailed); }
      finally { setLoading(false); }
    } else {
      if (!email || !password) { toast.error(t.auth.enterCredentials); return; }
      setLoading(true);
      try { await signInWithEmailAndPassword(auth, email, password); router.replace("/"); }
      catch (e: any) { toast.error(e.message || t.auth.signinFailed); }
      finally { setLoading(false); }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Top-right: Language pills + Theme toggle ── */}
        <View style={{
          position: "absolute", top: 52, right: 16,
          flexDirection: "row", alignItems: "center", gap: 6, zIndex: 10,
        }}>
          {LANGUAGES.map((lang) => (
            <LangPill
              key={lang.code}
              label={lang.label}
              active={language === lang.code}
              isDark={isDark}
              onPress={() => { playClick("soft"); dispatch(setAppLanguage(lang.code)); }}
            />
          ))}
          {/* Thin divider */}
          <View style={{ width: 1, height: 20, backgroundColor: border }} />
          {/* Theme toggle — right beside language pills */}
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </View>

        {/* ── Logo ── */}
        <Animated.View style={[logoAnim, { alignItems: "center", marginBottom: 28 }]}>
          <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: "#8B5CF6",
            alignItems: "center", justifyContent: "center", marginBottom: 14,
            shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }}>
            <Sparkles size={32} color="white" />
          </View>
          <Text style={{ fontSize: 26, fontWeight: "800", color: textPri, letterSpacing: -0.5 }}>JanSathi</Text>
          <Text style={{ color: textMuted, fontSize: 13, marginTop: 4, textAlign: "center", maxWidth: 260 }}>{t.auth.subtitle}</Text>
        </Animated.View>

        {/* ── Tab toggle ── */}
        <Animated.View style={[tabAnim, {
          flexDirection: "row", backgroundColor: cardBg, borderRadius: 16, padding: 4,
          marginBottom: 20, borderWidth: 1, borderColor: border,
          shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, elevation: 2,
        }]}>
          {(["signin", "signup"] as const).map((m) => (
            <ModeTab
              key={m}
              label={m === "signin" ? t.auth.signIn : t.auth.signUp}
              active={mode === m}
              isDark={isDark}
              onPress={() => { playClick("soft"); setMode(m); }}
            />
          ))}
        </Animated.View>

        {/* ── Form ── */}
        {mode === "signup" && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <AnimInput icon={User} placeholder={t.auth.firstName} value={firstName} onChangeText={setFirstName} autoCapitalize="words" delay={200} isDark={isDark} />
            </View>
            <View style={{ flex: 1 }}>
              <AnimInput icon={User} placeholder={t.auth.lastName}  value={lastName}  onChangeText={setLastName}  autoCapitalize="words" delay={240} isDark={isDark} />
            </View>
          </View>
        )}
        <AnimInput icon={Mail} placeholder={t.auth.email}    value={email}    onChangeText={setEmail}    keyboardType="email-address" delay={280} isDark={isDark} />
        <AnimInput icon={Lock} placeholder={t.auth.password} value={password} onChangeText={setPassword} secureTextEntry delay={320} isDark={isDark} />

        {/* ── Submit + Google ── */}
        <Animated.View style={bottomAnim}>
          <SpringBtn onPress={handleSubmit}
            style={{ backgroundColor: "#8B5CF6", borderRadius: 14, paddingVertical: 14,
              alignItems: "center", marginTop: 4, marginBottom: 16,
              shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.38, shadowRadius: 12, elevation: 6,
              opacity: loading ? 0.8 : 1 }}>
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>
                  {mode === "signin" ? t.auth.signIn : t.auth.createAccount}
                </Text>}
          </SpringBtn>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: divider }} />
            <Text style={{ color: textMuted, fontSize: 12, marginHorizontal: 12 }}>{t.auth.orContinueWith}</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: divider }} />
          </View>

          <SpringBtn onPress={handleGoogleSignIn}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
              borderWidth: 1.5, borderColor: border, borderRadius: 14, paddingVertical: 13,
              backgroundColor: cardBg,
              shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.06, shadowRadius: 8, elevation: 2,
              opacity: googleLoading ? 0.75 : 1 }}>
            {googleLoading
              ? <ActivityIndicator color="#8B5CF6" />
              : <>
                  <Text style={{ fontSize: 18, fontWeight: "900", color: "#4285F4" }}>G</Text>
                  <Text style={{ color: textPri, fontWeight: "600", fontSize: 14 }}>{t.auth.continueWithGoogle}</Text>
                </>}
          </SpringBtn>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}