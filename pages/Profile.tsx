import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

import {
  User,
  Globe,
  Bell,
  Eye,
  Shield,
  HelpCircle,
  LogOut,
} from "lucide-react-native";
import { signOut } from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/integrations/firebase/client";

import { PersonalInfoDialog } from "@/components/profile/PersonalInfoDialog";
import { LanguageDialog } from "@/components/profile/LanguageDialog";
import { NotificationsDialog } from "@/components/profile/NotificationsDialog";
import { AccessibilityDialog } from "@/components/profile/AccessibilityDialog";
import { HelpSupportDialog } from "@/components/profile/HelpSupportDialog";
import { ProfileChatbot } from "@/components/profile/ProfileChatbot";
import { apiRequest } from "@/integrations/api/client";
export default function Profile() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [helpSupportOpen, setHelpSupportOpen] = useState(false);

  useEffect(() => {
    testBackend();
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading]);

    const testBackend = async () => {
    try {
      const data = await apiRequest("/auth/profile");
      console.log("Backend response:", data);
    } catch (e) {
      console.log("Backend error:", e);
    }
};

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/auth");
    } catch {
      Alert.alert("Error", "Failed to sign out");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="text-muted mt-2">Loading...</Text>
      </View>
    );
  }

  if (!user) return null;

  const sections = [
    {
      icon: User,
      title: "Personal Information",
      desc: "Update your name, age, location, and contact details",
      action: () => setPersonalInfoOpen(true),
    },
    {
      icon: Globe,
      title: "Language Preferences",
      desc: "Choose your preferred language",
      action: () => setLanguageOpen(true),
    },
    {
      icon: Bell,
      title: "Notifications",
      desc: "Manage alerts and reminders",
      action: () => setNotificationsOpen(true),
    },
    {
      icon: Eye,
      title: "Accessibility",
      desc: "Text size, contrast, screen reader and voice",
      action: () => setAccessibilityOpen(true),
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      desc: "Coming soon",
      action: () => Alert.alert("Coming Soon"),
    },
    {
      icon: HelpCircle,
      title: "Help & Support",
      desc: "FAQs and contact support",
      action: () => setHelpSupportOpen(true),
    },
  ];

  // Parse name from Firebase displayName
  const displayName = user.displayName ?? "Welcome Back!";
  // const displayName = JSON.stringify(user) ?? "Welcome Back!";

  return (
    <View className="flex-1 bg-background ">
      <ScrollView contentContainerStyle={{ padding: 16 ,paddingBottom : 100}}>
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-xl bg-primary items-center justify-center">
              <User size={22} color="white" />
            </View>
            <Text className="text-2xl font-bold text-foreground">Your Profile</Text>
          </View>
          <Text className="text-muted mt-2">
            Manage your account and preferences
          </Text>
        </View>

        {/* Profile Card */}
        <View className="p-4 rounded-2xl bg-primary mb-6">
          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
              <User size={28} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-xl font-bold">
                {displayName}
              </Text>
              <Text className="text-white/80">{user.email}</Text>
            </View>
          </View>

          <View className="flex-row gap-3 mt-4">
            <Pressable
              onPress={() => setPersonalInfoOpen(true)}
              className="bg-white px-4 py-2 rounded-lg"
            >
              <Text className="text-primary font-semibold">Edit Profile</Text>
            </Pressable>

            <Pressable
              onPress={handleSignOut}
              className="border border-white px-4 py-2 rounded-lg flex-row items-center"
            >
              <LogOut size={16} color="white" />
              <Text className="text-white ml-2">Sign Out</Text>
            </Pressable>
          </View>
        </View>

        {/* Settings */}
        {sections.map((s, i) => (
          <Pressable
            key={i}
            onPress={s.action}
            className="p-4 mb-3 rounded-xl bg-card border border-border"
          >
            <View className="flex-row gap-3 justify-center items-center">
              <View className=" rounded-lg bg-primary items-center justify-center p-4">
                <s.icon size={18} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">{s.title}</Text>
                <Text className="text-muted text-sm">{s.desc}</Text>
              </View>
            </View>
          </Pressable>
        ))}

        {/* Stats */}
        <View className="flex-row gap-3 mt-6 p-10" >
          {["Scans", "Forms", "Schemes"].map((label, i) => (
            <View
              key={i}
              className="flex-1 bg-secondary p-3 rounded-xl items-center pb-"
            >
              <Text className="text-primary text-xl font-bold">0</Text>
              <Text className="text-muted text-sm">{label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Dialogs - pass firebase uid */}
      <PersonalInfoDialog
        open={personalInfoOpen}
        onOpenChange={setPersonalInfoOpen}
        userId={user.uid}
      />
      <LanguageDialog
        open={languageOpen}
        onOpenChange={setLanguageOpen}
        userId={user.uid}
      />
      <NotificationsDialog
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        userId={user.uid}
      />
      <AccessibilityDialog
        open={accessibilityOpen}
        onOpenChange={setAccessibilityOpen}
        userId={user.uid}
      />
      <HelpSupportDialog
        open={helpSupportOpen}
        onOpenChange={setHelpSupportOpen}
      />

      <ProfileChatbot />
    </View>
  );
}