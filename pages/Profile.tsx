// app/profile/index.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable,
  ActivityIndicator, Modal, Image, Platform, Animated,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  User, Shield, HelpCircle, LogOut,
  ChevronRight, Camera, X, Trash2, Sun, Moon, Volume2, VolumeX, Users, Mic , MicOff
} from "lucide-react-native";
import { signOut } from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/integrations/firebase/client";
import { HelpSupportDialog } from "@/components/profile/HelpSupportDialog";
import { ProfileChatbot } from "@/components/profile/ProfileChatbot";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAppLanguage, setAppTheme, setSoundEnabled , setVoiceAssistantEnabled} from "@/store/slices/appSlice";
import { updateDbUser } from "@/store/slices/authSlice";
import { apiRequest, BASE_URL } from "@/integrations/api/client";
import type { Language } from "@/translations";
import * as ImagePicker from "expo-image-picker";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import { useSound } from "@/hooks/useSound";
import type { Theme } from "@/store/slices/appSlice";

const LANGUAGES: { code: Language; native: string; label: string }[] = [
  { code: "en", native: "English", label: "EN" },
  { code: "hi", native: "हिंदी",   label: "HI" },
  { code: "te", native: "తెలుగు",  label: "TE" },
];

const SPECIALITY_LABELS: Record<string, string> = {
  legal:      "Legal Aid",
  health:     "Healthcare",
  education:  "Education",
  government: "Govt Schemes",
  general:    "General Help",
};

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
        <Animated.View style={{
          width: 22, height: 22, borderRadius: 11, backgroundColor: "white",
          transform: [{ translateX: tx }],
          shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3,
        }} />
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
  const scale      = useRef(new Animated.Value(1)).current;
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
      <Pressable onPress={onPress} disabled={!onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        className="flex-row items-center gap-3 p-4 mb-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
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

const SectionLabel = ({ label }: { label: string }) => (
  <Text className="text-xs font-semibold uppercase tracking-widest text-[#8B5CF6] mb-3 ml-1">{label}</Text>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Profile() {
  const router            = useRouter();
  const { user, loading } = useAuth();
  const { t, language }   = useTranslation();
  const dispatch          = useAppDispatch();
  const dbUser            = useAppSelector((s) => s.auth.dbUser);
  const soundEnabled      = useAppSelector((s) => s.app.soundEnabled);
  const voiceEnabled = useAppSelector((s: any) => s.app?.voiceAssistantEnabled ?? false);
  const [savingVoice, setSavingVoice] = useState(false);
  const theme             = useAppSelector((s) => s.app.theme);
  const isDark            = theme === "dark";
  const toast             = useToast();
  const { confirm }       = useConfirm();
  const { playClick }     = useSound();
  const { width }         = useWindowDimensions();
  const isWide            = width >= 700;
  const isLarge           = width >= 1100;

  // ── Correct width formula ──────────────────────────────────────────────────
  const containerWidth = isLarge ? 1100 : isWide ? 860 : undefined;
  const sidePad = containerWidth ? Math.max(24, (width - containerWidth) / 2) : 16;

  const [helpSupportOpen,   setHelpSupportOpen]   = useState(false);
  const [savingLang,        setSavingLang]        = useState(false);
  const [savingTheme,       setSavingTheme]       = useState(false);
  const [savingSound,       setSavingSound]       = useState(false);
  const [avatarLoading,     setAvatarLoading]     = useState(false);
  const [avatarModalOpen,   setAvatarModalOpen]   = useState(false);
  // ✅ Volunteer registration status
  const [volunteerReg,      setVolunteerReg]      = useState<any>(null);

  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY  = useRef(new Animated.Value(-14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOp, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(headerY,  { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 5 }),
    ]).start();
  }, []);

  useEffect(() => { if (!loading && !user) router.replace("/auth"); }, [user, loading]);

  // ── Load volunteer registration status ────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    apiRequest("/volunteer/my-registration")
      .then((d) => setVolunteerReg(d.registration))
      .catch(() => {});
  }, [user]);

  // ── Restore preferences from DB on mount ─────────────────────────────────
  useEffect(() => {
    if (!dbUser?.preferences) return;
    const prefs = dbUser.preferences;
    if (prefs.theme        && prefs.theme        !== theme)        dispatch(setAppTheme(prefs.theme as Theme));
    if (prefs.language     && prefs.language     !== language)     dispatch(setAppLanguage(prefs.language as Language));
    if (prefs.soundEnabled !== undefined && prefs.soundEnabled !== soundEnabled) dispatch(setSoundEnabled(prefs.soundEnabled));
  }, [dbUser?.preferences]);

  // ── Theme toggle — own loader ─────────────────────────────────────────────
  const handleToggleTheme = useCallback(async () => {
    playClick("soft");
    const next: Theme = theme === "dark" ? "light" : "dark";
    dispatch(setAppTheme(next));           // optimistic update
    setSavingTheme(true);
    try {
      const data = await apiRequest("/auth/preferences", "PATCH", { theme: next });
      if (data.success) dispatch(updateDbUser({ preferences: { ...dbUser?.preferences, theme: next } }));
    } catch { toast.error(t.common.error); dispatch(setAppTheme(theme)); } // rollback on error
    finally { setSavingTheme(false); }
  }, [theme, dbUser?.preferences, dispatch, t, toast, playClick]);

  // ── Sound toggle — own loader ─────────────────────────────────────────────
  const handleToggleSound = useCallback(async () => {
    playClick("soft");
    const next = !soundEnabled;
    dispatch(setSoundEnabled(next));       // optimistic update
    setSavingSound(true);
    try {
      const data = await apiRequest("/auth/preferences", "PATCH", { soundEnabled: next });
      if (data.success) dispatch(updateDbUser({ preferences: { ...dbUser?.preferences, soundEnabled: next } }));
    } catch { toast.error(t.common.error); dispatch(setSoundEnabled(soundEnabled)); } // rollback
    finally { setSavingSound(false); }
  }, [soundEnabled, dbUser?.preferences, dispatch, t, toast, playClick]);

  const handleToggleVoice = useCallback(async () => {
  playClick("soft");
  const next = !voiceEnabled;
  dispatch(setVoiceAssistantEnabled(next));
  setSavingVoice(true);
  try {
    await apiRequest("/auth/preferences", "PATCH", { voiceAssistantEnabled: next });
  } catch { toast.error(t.common.error); dispatch(setVoiceAssistantEnabled(voiceEnabled)); }
  finally { setSavingVoice(false); }
}, [voiceEnabled, dispatch, t, toast, playClick]);

  // ── Language change ───────────────────────────────────────────────────────
  const handleLanguageChange = useCallback(async (lang: Language) => {
    if (lang === language) return;
    playClick("soft");
    dispatch(setAppLanguage(lang));
    setSavingLang(true);
    try {
      const data = await apiRequest("/auth/preferences", "PATCH", { language: lang });
      if (data.success) dispatch(updateDbUser({ preferences: { ...dbUser?.preferences, language: lang } }));
    } catch { toast.error(t.common.error); dispatch(setAppLanguage(language)); } // rollback
    finally { setSavingLang(false); }
  }, [language, dbUser?.preferences, dispatch, t, toast, playClick]);

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

  if (loading) return (
    <View className="flex-1 items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text className="text-[#64748B] dark:text-[#94A3B8] mt-2">{t.common.loading}</Text>
    </View>
  );
  if (!user) return null;

  const displayName = dbUser?.name || user.displayName || t.profile.welcomeBack;
  const accountSections = [
    { icon: Shield,     title: t.profile.privacy,     desc: t.profile.comingSoon,      action: () => toast.info(t.profile.comingSoon), color: "#10B981" },
    { icon: HelpCircle, title: t.profile.helpSupport, desc: t.profile.helpSupportDesc, action: () => setHelpSupportOpen(true),         color: "#3B82F6" },
  ];

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── CENTERED CONTENT CONTAINER ── */}
        <View style={{
          paddingHorizontal: sidePad, paddingTop: 16,
          ...(containerWidth ? { maxWidth: containerWidth + sidePad * 2, alignSelf: "center" as const, width: "100%" } : {}),
        }}>
          {Platform.OS === "web" && <View style={{ height: 8 }} />}

          {/* Page header */}
          <Animated.View style={{ opacity: headerOp, transform: [{ translateY: headerY }] }}
            className="flex-row items-center gap-3 mb-6">
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
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            {LANGUAGES.map((lang) => {
              const isActive = language === lang.code;
              return (
                <Pressable key={lang.code} onPress={() => handleLanguageChange(lang.code)}
                  style={{
                    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center",
                    backgroundColor: isActive ? "#8B5CF6" : isDark ? "#1E293B" : "#F8FAFC",
                    borderWidth: 1.5,
                    borderColor: isActive ? "#8B5CF6" : isDark ? "#334155" : "#E2E8F0",
                  }}>
                  {savingLang && isActive ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Text style={{ fontWeight: "700", fontSize: 14,
                        color: isActive ? "white" : isDark ? "#F1F5F9" : "#0F172A" }}>
                        {lang.native}
                      </Text>
                      <Text style={{ fontSize: 11, marginTop: 2,
                        color: isActive ? "rgba(255,255,255,0.7)" : isDark ? "#94A3B8" : "#64748B" }}>
                        {lang.label}
                      </Text>
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Accessibility */}
          <SectionLabel label={t.profile.accessibility} />

          {/* Dark/Light Mode — own loader, no bleed into sound row */}
          <SectionRow
            icon={theme === "dark" ? Moon : Sun}
            title={theme === "dark" ? t.profile.darkMode : t.profile.lightMode}
            desc={theme === "dark" ? t.profile.tapToLight : t.profile.tapToDark}
            iconColor={theme === "dark" ? "#6366F1" : "#F59E0B"}
            delay={0}
            right={
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {/* ✅ savingTheme — only lights up when theme is saving */}
                {savingTheme && <ActivityIndicator size="small" color="#8B5CF6" />}
                <Toggle value={theme === "dark"} onToggle={handleToggleTheme} />
              </View>
            }
          />

          <SectionRow
            icon={voiceEnabled ? Mic : MicOff}
            title={t.voiceAssistant.toggleLabel}
            desc={voiceEnabled ? t.profile.voiceAssistantOn : t.profile.voiceAssistantOff}
            iconColor={voiceEnabled ? "#8B5CF6" : "#94A3B8"}
            delay={120}
            right={
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {savingVoice && <ActivityIndicator size="small" color="#8B5CF6" />}
                <Toggle value={voiceEnabled} onToggle={handleToggleVoice} />
              </View>
            }
          />

          {/* Click Sound — own loader, no bleed into theme row */}
          <SectionRow
            icon={soundEnabled ? Volume2 : VolumeX}
            title={t.profile.clickSound}
            desc={soundEnabled ? t.profile.soundOn : t.profile.soundOff}
            iconColor={soundEnabled ? "#8B5CF6" : "#94A3B8"}
            delay={60}
            right={
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {/* ✅ savingSound — only lights up when sound is saving */}
                {savingSound && <ActivityIndicator size="small" color="#8B5CF6" />}
                <Toggle value={soundEnabled} onToggle={handleToggleSound} />
              </View>
            }
          />

          {/* Account */}
          <SectionLabel label={t.profile.account} />

          {/* ✅ Volunteer status badge */}
          {volunteerReg && (
            <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
              style={{ borderRadius: 16, padding: 14, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: "#10B981",
                shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: "#10B98118",
                  borderWidth: 1, borderColor: "#10B98130", alignItems: "center", justifyContent: "center" }}>
                  <Users size={18} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text className="text-[#0F172A] dark:text-white font-bold text-sm">{t.volunteer.becomeVolunteer}</Text>
                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, backgroundColor: "#D1FAE5" }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: "#065F46" }}>● {t.volunteer.available}</Text>
                    </View>
                  </View>
                  <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs" style={{ marginTop: 2 }}>
                    {volunteerReg.speciality && SPECIALITY_LABELS[volunteerReg.speciality]} · {volunteerReg.location || t.profile.noLocationSet}
                  </Text>
                </View>
              </View>
              {volunteerReg.helpedCount > 0 && (
                <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#E2E8F0" }}
                  className="dark:border-[#334155]">
                  <Text style={{ color: "#10B981", fontWeight: "700", fontSize: 13 }}>
                    🌟 {volunteerReg.helpedCount} {t.profile.peopleHelped}
                  </Text>
                </View>
              )}
            </View>
          )}

          <SectionRow icon={User} title={t.profile.personalInfo} desc={t.profile.personalInfoDesc}
            onPress={() => router.push("/profile/personal-info")} iconColor="#8B5CF6" delay={120} />
          {accountSections.map((s, i) => (
            <SectionRow key={i} icon={s.icon} title={s.title} desc={s.desc}
              onPress={s.action} iconColor={s.color} delay={180 + i * 60} />
          ))}

          {/* Stats */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
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

        </View>
      </ScrollView>

      <HelpSupportDialog open={helpSupportOpen} onOpenChange={setHelpSupportOpen} />
      {/* <ProfileChatbot /> */}

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