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
import { useTranslation } from "@/hooks/useTranslation";
import { useAppDispatch } from "@/store/hooks";
import { setAppLanguage } from "@/store/slices/appSlice";
import type { Language } from "@/translations";

const LANGUAGES: { code: Language; native: string; label: string }[] = [
  { code: "en", native: "English", label: "EN" },
  { code: "hi", native: "हिंदी", label: "HI" },
  { code: "te", native: "తెలుగు", label: "TE" },
];

export default function Profile() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t, language } = useTranslation();
  const dispatch = useAppDispatch();

  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [helpSupportOpen, setHelpSupportOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/auth");
    } catch {
      Alert.alert(t.common.error, t.profile.signOutFailed);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-muted mt-2">{t.common.loading}</Text>
      </View>
    );
  }

  if (!user) return null;

  const sections = [
    {
      icon: User,
      title: t.profile.personalInfo,
      desc: t.profile.personalInfoDesc,
      action: () => setPersonalInfoOpen(true),
    },
    {
      icon: Globe,
      title: t.profile.language,
      desc: t.profile.languageDesc,
      action: () => setLanguageOpen(true),
    },
    {
      icon: Bell,
      title: t.profile.notifications,
      desc: t.profile.notificationsDesc,
      action: () => setNotificationsOpen(true),
    },
    {
      icon: Eye,
      title: t.profile.accessibility,
      desc: t.profile.accessibilityDesc,
      action: () => setAccessibilityOpen(true),
    },
    {
      icon: Shield,
      title: t.profile.privacy,
      desc: t.profile.comingSoon,
      action: () => Alert.alert(t.profile.comingSoon),
    },
    {
      icon: HelpCircle,
      title: t.profile.helpSupport,
      desc: t.profile.helpSupportDesc,
      action: () => setHelpSupportOpen(true),
    },
  ];

  const displayName = user.displayName ?? t.profile.welcomeBack;

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-xl bg-primary items-center justify-center">
              <User size={22} color="white" />
            </View>
            <Text className="text-2xl font-bold text-foreground">
              {t.profile.title}
            </Text>
          </View>
          <Text className="text-muted mt-2">{t.profile.subtitle}</Text>
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
              <Text className="text-white font-bold">
                {t.profile.editProfile}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSignOut}
              className="border border-white px-4 py-2 rounded-lg flex-row items-center"
            >
              <LogOut size={16} color="white" />
              <Text className="text-white ml-2">{t.profile.logout}</Text>
            </Pressable>
          </View>
        </View>

        {/* Language Selector */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          <Text className="text-foreground font-semibold mb-3">
            {t.profile.chooseLanguage}
          </Text>
          <View className="flex-row gap-2">
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => dispatch(setAppLanguage(lang.code))}
                className={`flex-1 py-3 rounded-xl items-center border ${
                  language === lang.code
                    ? "bg-primary border-primary"
                    : "bg-secondary border-border"
                }`}
              >
                <Text
                  className={`font-bold text-sm ${
                    language === lang.code ? "text-white" : "text-foreground"
                  }`}
                >
                  {lang.native}
                </Text>
                <Text
                  className={`text-xs mt-1 ${
                    language === lang.code
                      ? "text-white opacity-80"
                      : "text-muted"
                  }`}
                >
                  {lang.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Settings Sections */}
        {sections.map((s, i) => (
          <Pressable
            key={i}
            onPress={s.action}
            className="p-4 mb-3 rounded-xl bg-card border border-border"
          >
            <View className="flex-row gap-3 justify-center items-center">
              <View className="rounded-lg bg-primary items-center justify-center p-4">
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
        <View className="flex-row gap-3 mt-6 p-4">
          {[
            { label: t.profile.scans, count: 0 },
            { label: t.profile.forms, count: 0 },
            { label: t.profile.schemes, count: 0 },
          ].map((stat, i) => (
            <View
              key={i}
              className="flex-1 bg-secondary p-3 rounded-xl items-center"
            >
              <Text className="text-primary text-xl font-bold">
                {stat.count}
              </Text>
              <Text className="text-muted text-sm">{stat.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Dialogs */}
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