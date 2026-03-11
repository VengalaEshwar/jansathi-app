import { useState } from "react";
import {
  View, Text, TextInput, Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { User } from "lucide-react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppDispatch } from "@/store/hooks";
import { setAppLanguage } from "@/store/slices/appSlice";
import type { Language } from "@/translations";
import { Platform } from "react-native";
import { useToast } from "@/hooks/useToast";

let GoogleSignin: any;
let statusCodes: any;
if (Platform.OS !== "web") {
  try {
    const RNGoogleSignin = require("@react-native-google-signin/google-signin");
    GoogleSignin = RNGoogleSignin.GoogleSignin;
    statusCodes = RNGoogleSignin.statusCodes;

    GoogleSignin.configure({
      webClientId: "926203078040-veqcg4kjg32m9jpn0o72ljjsc6iekf90.apps.googleusercontent.com",
    });
  } catch (e) {
    console.log("Google Sign-In not available:", e);
  }
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हि" },
  { code: "te", label: "తె" },
];

export default function Auth() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const dispatch = useAppDispatch();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  
  const toast = useToast();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      if (Platform.OS === "web") {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        router.replace("/");
        return;
      }

      if (!GoogleSignin) {
        toast.error(t.auth.googleNotAvailable);
        return;
      }

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) throw new Error("No ID token received");

      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      router.replace("/");

    } catch (e: any) {
      if (statusCodes && e.code === statusCodes.SIGN_IN_CANCELLED) {
      } else if (statusCodes && e.code === statusCodes.IN_PROGRESS) {
      } else {
        toast.error(e.message || t.auth.googleFailed);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !firstName || !lastName) {
      toast.error(t.auth.fillAllFields);
      return;
    }
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: `${firstName} ${lastName}` });
      toast.success(t.auth.accountCreated);
      router.replace("/");
    } catch (e: any) {
      toast.error(e.message || t.auth.signupFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error(t.auth.enterCredentials);
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/");
    } catch (e: any) {
      toast.error(e.message || t.auth.signinFailed);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View className="flex-1 bg-light-background dark:bg-background items-center justify-center px-5">

      <View className="absolute top-12 right-4 flex-row gap-1">
        {LANGUAGES.map((lang) => (
          <Pressable
            key={lang.code}
            onPress={() => dispatch(setAppLanguage(lang.code))}
            className={`px-2 py-1 rounded-lg border ${
              language === lang.code
                ? "bg-primary border-primary"
                : "bg-light-card dark:bg-card border-light-border dark:border-border"
            }`}
          >
            <Text className={`text-xs font-bold ${
              language === lang.code ? "text-white" : "text-muted"
            }`}>
              {lang.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="items-center mb-6">
        <View className="w-16 h-16 rounded-xl bg-primary items-center justify-center mb-3">
          <User size={28} color="white" />
        </View>
        <Text className="text-2xl font-bold text-light-foreground dark:text-foreground">
          {t.home.welcome}
        </Text>
        <Text className="text-muted mt-1 text-center">
          {t.auth.subtitle}
        </Text>
      </View>

      <View className="flex-row w-full mb-4">
        <Pressable
          onPress={() => setMode("signin")}
          className={`flex-1 py-2 rounded-l-lg ${
            mode === "signin" ? "bg-primary" : "bg-light-card dark:bg-card"
          }`}
        >
          <Text className={`text-center font-semibold ${
            mode === "signin" ? "text-white" : "text-light-foreground dark:text-foreground"
          }`}>
            {t.auth.signIn}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode("signup")}
          className={`flex-1 py-2 rounded-r-lg ${
            mode === "signup" ? "bg-primary" : "bg-light-card dark:bg-card"
          }`}
        >
          <Text className={`text-center font-semibold ${
            mode === "signup" ? "text-white" : "text-light-foreground dark:text-foreground"
          }`}>
            {t.auth.signUp}
          </Text>
        </Pressable>
      </View>

      <View className="w-full space-y-3">
        {mode === "signup" && (
          <View className="flex-row gap-2 mb-3">
            <TextInput
              placeholder={t.auth.firstName}
              placeholderTextColor="#94A3B8"
              value={firstName}
              onChangeText={setFirstName}
              className="flex-1 border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-foreground dark:text-foreground"
            />
            <TextInput
              placeholder={t.auth.lastName}
              placeholderTextColor="#94A3B8"
              value={lastName}
              onChangeText={setLastName}
              className="flex-1 border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-foreground dark:text-foreground"
            />
          </View>
        )}

        <TextInput
          placeholder={t.auth.email}
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          className="border border-light-border dark:border-border rounded-lg px-3 py-2 mb-3 text-light-foreground dark:text-foreground"
        />
        <TextInput
          placeholder={t.auth.password}
          placeholderTextColor="#94A3B8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          className="border border-light-border dark:border-border rounded-lg px-3 py-2 mb-3 text-light-foreground dark:text-foreground"
        />

        <Pressable
          onPress={mode === "signin" ? handleSignIn : handleSignUp}
          disabled={loading}
          className="bg-primary py-3 rounded-lg items-center mt-2"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">
              {mode === "signin" ? t.auth.signIn : t.auth.createAccount}
            </Text>
          )}
        </Pressable>

        <View className="flex-row items-center my-3">
          <View className="flex-1 h-px bg-light-border dark:bg-border" />
          <Text className="text-muted text-xs mx-3">{t.auth.orContinueWith}</Text>
          <View className="flex-1 h-px bg-light-border dark:bg-border" />
        </View>

        <Pressable
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
          className="border border-light-border dark:border-border bg-light-card dark:bg-card py-3 rounded-lg items-center flex-row justify-center gap-2"
          style={{ opacity: googleLoading ? 0.7 : 1 }}
        >
          {googleLoading ? (
            <ActivityIndicator color="#8B5CF6" />
          ) : (
            <>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#4285F4" }}>G</Text>
              <Text className="text-light-foreground dark:text-foreground font-semibold ml-1">
                {t.auth.continueWithGoogle}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}