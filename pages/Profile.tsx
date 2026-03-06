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

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

import { PersonalInfoDialog } from "@/components/profile/PersonalInfoDialog";
import { LanguageDialog } from "@/components/profile/LanguageDialog";
import { NotificationsDialog } from "@/components/profile/NotificationsDialog";
import { AccessibilityDialog } from "@/components/profile/AccessibilityDialog";
import { HelpSupportDialog } from "@/components/profile/HelpSupportDialog";
import { ProfileChatbot } from "@/components/profile/ProfileChatbot";

export default function Profile() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [helpSupportOpen, setHelpSupportOpen] = useState(false);
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    } else if (user) {
      loadProfile();
    }
  }, [user, loading]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (e) {
      console.log("Profile load error:", e);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      Alert.alert("Signed out", "You have been logged out successfully");
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

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-xl bg-primary items-center justify-center">
              <User size={22} color="white" />
            </View>
            <Text className="text-2xl font-bold">Your Profile</Text>
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
                {profile?.first_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : "Welcome Back!"}
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
            <View className="flex-row gap-3">
              <View className="w-10 h-10 rounded-lg bg-primary items-center justify-center">
                <s.icon size={18} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold">{s.title}</Text>
                <Text className="text-muted text-sm">{s.desc}</Text>
              </View>
            </View>
          </Pressable>
        ))}

        {/* Stats */}
        <View className="flex-row gap-3 mt-6">
          {["Scans", "Forms", "Schemes"].map((label, i) => (
            <View
              key={i}
              className="flex-1 bg-secondary p-3 rounded-xl items-center"
            >
              <Text className="text-primary text-xl font-bold">0</Text>
              <Text className="text-muted text-sm">{label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Dialogs */}
      <PersonalInfoDialog
        open={personalInfoOpen}
        onOpenChange={setPersonalInfoOpen}
        userId={user.id}
      />
      <LanguageDialog
        open={languageOpen}
        onOpenChange={setLanguageOpen}
        userId={user.id}
      />
      <NotificationsDialog
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        userId={user.id}
      />
      <AccessibilityDialog
        open={accessibilityOpen}
        onOpenChange={setAccessibilityOpen}
        userId={user.id}
      />
      <HelpSupportDialog
        open={helpSupportOpen}
        onOpenChange={setHelpSupportOpen}
      />

      {/* Chatbot */}
      <ProfileChatbot />
    </View>
  );
}
