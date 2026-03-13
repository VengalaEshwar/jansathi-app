import { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, Pressable,
  ActivityIndicator, Modal, Image, Platform, Animated,
} from "react-native";
import { useRouter } from "expo-router";
import {
  User, Bell, Shield, HelpCircle, LogOut,
  ChevronRight, Camera, X, Trash2, Sun, Moon, Volume2, VolumeX,
} from "lucide-react-native";
import { signOut } from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/integrations/firebase/client";
import { NotificationsDialog } from "@/components/profile/NotificationsDialog";
import { HelpSupportDialog } from "@/components/profile/HelpSupportDialog";
import { ProfileChatbot } from "@/components/profile/ProfileChatbot";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAppLanguage, setSoundEnabled } from "@/store/slices/appSlice";
import { updateDbUser } from "@/store/slices/authSlice";
import { apiRequest, BASE_URL } from "@/integrations/api/client";
import type { Language } from "@/translations";
import * as ImagePicker from "expo-image-picker";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import { useTheme } from "@/hooks/useTheme";
import { useSound } from "@/hooks/useSound";

const LANGUAGES: { code: Language; native: string; label: string }[] = [
  { code: "en", native: "English", label: "EN" },
  { code: "hi", native: "हिंदी",   label: "HI" },
  { code: "te", native: "తెలుగు",  label: "TE" },
];

// ── Animated toggle switch ────────────────────────────────────────────────────
const Toggle = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false, speed: 22, bounciness: 10 }).start();
  }, [value]);
  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: ["#CBD5E1", "#8B5CF6"] });
  const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  return (
    <Pressable onPress={onToggle} hitSlop={8}>
      <Animated.View style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: bg, justifyContent: "center" }}>
        <Animated.View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "white", transform: [{ translateX: tx }], shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 }} />
      </Animated.View>
    </Pressable>
  );
};

// ── Section row ───────────────────────────────────────────────────────────────
const SectionRow = ({
  icon: Icon, title, desc, onPress, right, iconColor = "#8B5CF6", delay = 0,
}: {
  icon: any; title: string; desc: string;
  onPress?: () => void; right?: React.ReactNode; iconColor?: string; delay?: number;
}) => {
  const scale  = useRef(new Animated.Value(1)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 340, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true, speed: 14, bounciness: 5 }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        disabled={!onPress}
        className="flex-row items-center gap-3 p-4 mb-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
      >
        <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: iconColor + "18", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: iconColor + "30" }}>
          <Icon size={18} color={iconColor} />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-[#0F172A] dark:text-white text-sm">{title}</Text>
          <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs mt-0.5">{desc}</Text>
        </View>
        {right ?? (onPress ? <ChevronRight size={16} color="#94A3B8" /> : null)}
      </Pressable>
    </Animated.View>
  );
};

// ── Section label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ label }: { label: string }) => (
  <Text className="text-xs font-semibold uppercase tracking-widest text-[#8B5CF6] mb-3 ml-1">
    {label}
  </Text>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Profile() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t, language }   = useTranslation();
  const dispatch          = useAppDispatch();
  const dbUser            = useAppSelector((s) => s.auth.dbUser);
  const soundEnabled      = useAppSelector((s) => s.app.soundEnabled);
  const toast             = useToast();
  const { confirm }       = useConfirm();
  const { theme, toggleTheme } = useTheme();
  const { playClick }     = useSound();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpSupportOpen,   setHelpSupportOpen]   = useState(false);
  const [savingLang,        setSavingLang]        = useState(false);
  const [avatarLoading,     setAvatarLoading]     = useState(false);
  const [avatarModalOpen,   setAvatarModalOpen]   = useState(false);

  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY  = useRef(new Animated.Value(-14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOp, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(headerY,  { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 5 }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading]);

  const closeAvatarModal = () => setAvatarModalOpen(false);

  const handleSignOut = async () => {
    try { await signOut(auth); router.replace("/auth"); }
    catch { toast.error(t.profile.signOutFailed); }
  };

  const handleAvatarPress = () => {
    if (dbUser?.avatar) setAvatarModalOpen(true);
    else pickAndUploadAvatar();
  };

  const pickAndUploadAvatar = async () => {
    closeAvatarModal();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { toast.error(t.profile.photoPermissionDenied); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setAvatarLoading(true);
      try {
        const token    = auth.currentUser ? await auth.currentUser.getIdToken() : null;
        const asset    = result.assets[0];
        const formData = new FormData();
        if (Platform.OS === "web") {
          const blob = await (await fetch(asset.uri)).blob();
          formData.append("avatar", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
        } else {
          formData.append("avatar", { uri: asset.uri, type: "image/jpeg", name: "avatar.jpg" } as any);
        }
        const res  = await fetch(`${BASE_URL}/auth/upload-avatar`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
        const data = await res.json();
        if (data.success) { dispatch(updateDbUser({ avatar: data.avatarUrl })); toast.success(t.profile.photoUpdated); }
        else toast.error(data.message || t.common.error);
      } catch (e: any) { toast.error(e.message || t.common.error); }
      finally { setAvatarLoading(false); }
    }
  };

  const handleDeleteAvatar = () => confirm({
    title: t.profile.deletePhoto, message: t.profile.deletePhotoConfirm,
    variant: "danger", confirmText: t.common.delete, cancelText: t.common.cancel,
    onConfirm: async () => {
      closeAvatarModal(); setAvatarLoading(true);
      try {
        const data = await apiRequest("/auth/delete-avatar", "DELETE");
        if (data.success) { dispatch(updateDbUser({ avatar: "", avatarPublicId: "" })); toast.success(t.profile.photoDeleted); }
      } catch (e: any) { toast.error(e.message || t.common.error); }
      finally { setAvatarLoading(false); }
    },
  });

  const handleLanguageChange = async (lang: Language) => {
    playClick("soft"); dispatch(setAppLanguage(lang)); setSavingLang(true);
    try {
      const data = await apiRequest("/auth/preferences", "PATCH", { language: lang });
      if (data.success) dispatch(updateDbUser({ language: lang }));
    } catch { toast.error(t.common.error); }
    finally { setSavingLang(false); }
  };

  if (loading) return (
    <View className="flex-1 items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text className="text-[#64748B] dark:text-[#94A3B8] mt-2">{t.common.loading}</Text>
    </View>
  );
  if (!user) return null;

  const displayName = dbUser?.name || user.displayName || t.profile.welcomeBack;
  const accountSections = [
    { icon: Bell,       title: t.profile.notifications, desc: t.profile.notificationsDesc, action: () => setNotificationsOpen(true), color: "#F59E0B" },
    { icon: Shield,     title: t.profile.privacy,       desc: t.profile.comingSoon,        action: () => toast.info(t.profile.comingSoon), color: "#10B981" },
    { icon: HelpCircle, title: t.profile.helpSupport,   desc: t.profile.helpSupportDesc,   action: () => setHelpSupportOpen(true), color: "#3B82F6" },
  ];

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Page header */}
        <Animated.View style={{ opacity: headerOp, transform: [{ translateY: headerY }] }} className="flex-row items-center gap-3 mb-6">
          <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center"
            style={{ shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 }}>
            <User size={22} color="white" />
          </View>
          <View>
            <Text className="text-2xl font-bold text-[#0F172A] dark:text-white" style={{ letterSpacing: -0.4 }}>{t.profile.title}</Text>
            <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm">{t.profile.subtitle}</Text>
          </View>
        </Animated.View>

        {/* Hero card */}
        <Animated.View style={{ opacity: headerOp, transform: [{ translateY: headerY }] }}>
          <View className="rounded-3xl bg-primary p-5 mb-5 overflow-hidden"
            style={{ shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 }}>
            {/* Decorative circle */}
            <View style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.06)" }} />

            <View className="flex-row items-center gap-4 mb-4">
              <Pressable onPress={handleAvatarPress} disabled={avatarLoading}>
                <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" }}>
                  {avatarLoading ? <ActivityIndicator color="white" /> :
                   dbUser?.avatar ? <Image source={{ uri: dbUser.avatar }} style={{ width: 68, height: 68, borderRadius: 34 }} /> :
                   <User size={28} color="white" />}
                </View>
                <View style={{ position: "absolute", bottom: 0, right: 0, backgroundColor: "#7C3AED", borderRadius: 10, padding: 4, borderWidth: 2, borderColor: "white" }}>
                  <Camera size={10} color="white" />
                </View>
              </Pressable>
              <View className="flex-1">
                <Text className="text-white text-xl font-bold">{displayName}</Text>
                <Text className="text-white/75 text-sm">{user.email}</Text>
                {dbUser?.phone ? <Text className="text-white/55 text-xs mt-1">{dbUser.phone}</Text> : null}
              </View>
            </View>

            <View className="flex-row gap-2">
              <Pressable onPress={() => router.push("/profile/personal-info")} className="flex-1 items-center py-2.5 rounded-xl bg-white/20">
                <Text className="text-white font-semibold text-sm">{t.profile.editProfile}</Text>
              </Pressable>
              <Pressable onPress={handleSignOut} className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/30">
                <LogOut size={14} color="white" />
                <Text className="text-white text-sm">{t.profile.logout}</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Language */}
        <SectionLabel label={t.profile.chooseLanguage} />
        <View className="flex-row gap-2 mb-5">
          {LANGUAGES.map((lang) => (
            <Pressable key={lang.code} onPress={() => handleLanguageChange(lang.code)} className="flex-1 py-3 rounded-xl items-center"
              style={{ backgroundColor: language === lang.code ? "#8B5CF6" : "transparent", borderWidth: 1, borderColor: language === lang.code ? "#8B5CF6" : "#E2E8F0" }}>
              {savingLang && language === lang.code
                ? <ActivityIndicator size="small" color="white" />
                : <>
                    <Text style={{ fontWeight: "700", fontSize: 14, color: language === lang.code ? "white" : "#0F172A" }}>{lang.native}</Text>
                    <Text style={{ fontSize: 11, marginTop: 2, color: language === lang.code ? "rgba(255,255,255,0.7)" : "#64748B" }}>{lang.label}</Text>
                  </>
              }
            </Pressable>
          ))}
        </View>

        {/* Accessibility */}
        <SectionLabel label="Accessibility" />
        <SectionRow
          icon={theme === "dark" ? Moon : Sun}
          title={theme === "dark" ? "Dark Mode" : "Light Mode"}
          desc={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          iconColor={theme === "dark" ? "#6366F1" : "#F59E0B"}
          delay={0}
          right={<Toggle value={theme === "dark"} onToggle={toggleTheme} />}
        />
        <SectionRow
          icon={soundEnabled ? Volume2 : VolumeX}
          title="Click Sound"
          desc={soundEnabled ? "Tap sounds are enabled" : "Tap sounds are disabled"}
          iconColor={soundEnabled ? "#8B5CF6" : "#94A3B8"}
          delay={60}
          right={<Toggle value={soundEnabled} onToggle={() => dispatch(setSoundEnabled(!soundEnabled))} />}
        />

        {/* Account */}
        <SectionLabel label="Account" />
        <SectionRow icon={User} title={t.profile.personalInfo} desc={t.profile.personalInfoDesc} onPress={() => router.push("/profile/personal-info")} iconColor="#8B5CF6" delay={120} />
        {accountSections.map((s, i) => (
          <SectionRow key={i} icon={s.icon} title={s.title} desc={s.desc} onPress={s.action} iconColor={s.color} delay={180 + i * 60} />
        ))}

        {/* Stats — back at bottom */}
        <View className="flex-row gap-3 mt-6">
          {[
            { label: t.profile.scans,   count: dbUser?.prescriptionHistory?.length ?? 0, color: "#8B5CF6" },
            { label: t.profile.forms,   count: dbUser?.formHistory?.length ?? 0,          color: "#3B82F6" },
            { label: t.profile.schemes, count: 0,                                          color: "#10B981" },
          ].map((stat, i) => (
            <View key={i} className="flex-1 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] p-3 items-center"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
              <Text style={{ color: stat.color, fontSize: 22, fontWeight: "800" }}>{stat.count}</Text>
              <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs mt-0.5">{stat.label}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} userId={user.uid} />
      <HelpSupportDialog open={helpSupportOpen} onOpenChange={setHelpSupportOpen} />
      <ProfileChatbot />

      <Modal visible={avatarModalOpen} transparent animationType="fade" onRequestClose={closeAvatarModal}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.88)", alignItems: "center", justifyContent: "center" }}>
          <Pressable onPress={closeAvatarModal} style={{ position: "absolute", top: 50, right: 20, zIndex: 10 }}>
            <X size={28} color="white" />
          </Pressable>
          <Image source={{ uri: dbUser?.avatar }} style={{ width: 280, height: 280, borderRadius: 140, borderWidth: 3, borderColor: "#8B5CF6" }} />
          <View style={{ flexDirection: "row", gap: 12, marginTop: 32 }}>
            <Pressable onPress={pickAndUploadAvatar} style={{ backgroundColor: "#8B5CF6", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Camera size={16} color="white" /><Text style={{ color: "white", fontWeight: "600" }}>{t.profile.changePhoto}</Text>
            </Pressable>
            <Pressable onPress={handleDeleteAvatar} style={{ borderWidth: 1, borderColor: "#EF4444", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Trash2 size={16} color="#EF4444" /><Text style={{ color: "#EF4444", fontWeight: "600" }}>{t.profile.deletePhoto}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}