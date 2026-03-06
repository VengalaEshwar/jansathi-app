import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Lock } from "lucide-react-native";

export default function Auth() {
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleSignUp = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert("Error", "Fill all fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) throw error;

      Alert.alert("Success", "Account created successfully!");
      router.replace("/");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Enter email and password");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      Alert.alert("Success", "Signed in successfully!");
      router.replace("/");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Signin failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background items-center justify-center px-5">
      {/* Header */}
      <View className="items-center mb-6">
        <View className="w-16 h-16 rounded-xl bg-primary items-center justify-center mb-3">
          <User size={28} color="white" />
        </View>
        <Text className="text-2xl font-bold">Welcome to JanSathi</Text>
        <Text className="text-muted mt-1 text-center">
          Your AI co-pilot for government access & health literacy
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row w-full mb-4">
        <Pressable
          onPress={() => setMode("signin")}
          className={`flex-1 py-2 rounded-l-lg ${
            mode === "signin" ? "bg-primary" : "bg-card"
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              mode === "signin" ? "text-white" : "text-foreground"
            }`}
          >
            Sign In
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode("signup")}
          className={`flex-1 py-2 rounded-r-lg ${
            mode === "signup" ? "bg-primary" : "bg-card"
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              mode === "signup" ? "text-white" : "text-foreground"
            }`}
          >
            Sign Up
          </Text>
        </Pressable>
      </View>

      {/* Form */}
      <View className="w-full space-y-3">
        {mode === "signup" && (
          <View className="flex-row gap-2">
            <TextInput
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              className="flex-1 border border-border rounded-lg px-3 py-2 text-foreground"
            />
            <TextInput
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              className="flex-1 border border-border rounded-lg px-3 py-2 text-foreground"
            />
          </View>
        )}

        <TextInput
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          className="border border-border rounded-lg px-3 py-2 text-foreground"
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          className="border border-border rounded-lg px-3 py-2 text-foreground"
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
              {mode === "signin" ? "Sign In" : "Create Account"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
