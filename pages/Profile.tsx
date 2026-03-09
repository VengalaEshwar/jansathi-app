import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Image,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  User, Bell, Shield, HelpCircle, LogOut,
  ChevronRight, Camera, X, Trash2,
} from "lucide-react-native";
import { signOut } from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/integrations/firebase/client";
import { NotificationsDialog } from "@/components/profile/NotificationsDialog";
import { HelpSupportDialog } from "@/components/profile/HelpSupportDialog";
import { ProfileChatbot } from "@/components/profile/ProfileChatbot";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAppLanguage } from "@/store/slices/appSlice";
import { updateDbUser } from "@/store/slices/authSlice";
import { apiRequest, BASE_URL } from "@/integrations/api/client";
import type { Language } from "@/translations";
import * as ImagePicker from "expo-image-picker";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";

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
  const dbUser = useAppSelector((s) => s.auth.dbUser);
  const toast = useToast();
  const { confirm } = useConfirm();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpSupportOpen, setHelpSupportOpen] = useState(false);
  const [savingLang, setSavingLang] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading]);

  const closeAvatarModal = () => setAvatarModalOpen(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/auth");
    } catch {
      toast.error(t.profile.signOutFailed);
    }
  };

  const handleAvatarPress = () => {
    if (dbUser?.avatar) setAvatarModalOpen(true);
    else pickAndUploadAvatar();
  };

  const pickAndUploadAvatar = async () => {
    closeAvatarModal();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error(t.profile.photoPermissionDenied);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarLoading(true);
      try {
        const currentUser = auth.currentUser;
        const token = currentUser ? await currentUser.getIdToken() : null;
        const asset = result.assets[0];
        const formData = new FormData();

        if (Platform.OS === "web") {
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
          formData.append("avatar", file);
        } else {
          formData.append("avatar", {
            uri: asset.uri,
            type: "image/jpeg",
            name: "avatar.jpg",
          } as any);
        }

        const response = await fetch(`${BASE_URL}/auth/upload-avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await response.json();
        if (data.success) {
          dispatch(updateDbUser({ avatar: data.avatarUrl }));
          toast.success(t.profile.photoUpdated);
        } else {
          toast.error(data.message || t.common.error);
        }
      } catch (e: any) {
        toast.error(e.message || t.common.error);
      } finally {
        setAvatarLoading(false);
      }
    }
  };

  const handleDeleteAvatar = () => {
    confirm({
      title: t.profile.deletePhoto,
      message: t.profile.deletePhotoConfirm,
      variant: "danger",
      confirmText: t.common.delete,
      cancelText: t.common.cancel,
      onConfirm: deleteAvatar,
    });
  };

  const deleteAvatar = async () => {
    closeAvatarModal();
    setAvatarLoading(true);
    try {
      const data = await apiRequest("/auth/delete-avatar", "DELETE");
      if (data.success) {
        dispatch(updateDbUser({ avatar: "", avatarPublicId: "" }));
        toast.success(t.profile.photoDeleted);
      }
    } catch (e: any) {
      toast.error(e.message || t.common.error);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleLanguageChange = async (lang: Language) => {
    dispatch(setAppLanguage(lang));
    setSavingLang(true);
    try {
      const data = await apiRequest("/auth/preferences", "PATCH", { language: lang });
      if (data.success) dispatch(updateDbUser({ language: lang }));
    } catch {
      toast.error(t.common.error);
    } finally {
      setSavingLang(false);
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

  const displayName = dbUser?.name || user.displayName || t.profile.welcomeBack;

  const sections = [
    {
      icon: Bell,
      title: t.profile.notifications,
      desc: t.profile.notificationsDesc,
      action: () => setNotificationsOpen(true),
    },
    {
      icon: Shield,
      title: t.profile.privacy,
      desc: t.profile.comingSoon,
      action: () => toast.info(t.profile.comingSoon),
    },
    {
      icon: HelpCircle,
      title: t.profile.helpSupport,
      desc: t.profile.helpSupportDesc,
      action: () => setHelpSupportOpen(true),
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-xl bg-primary items-center justify-center">
              <User size={22} color="white" />
            </View>
            <Text className="text-2xl font-bold text-foreground">{t.profile.title}</Text>
          </View>
          <Text className="text-muted mt-2">{t.profile.subtitle}</Text>
        </View>

        {/* Profile Card */}
        <View className="p-4 rounded-2xl bg-primary mb-6">
          <View className="flex-row items-center gap-4">
            <Pressable onPress={handleAvatarPress} disabled={avatarLoading} style={{ position: "relative" }}>
              <View style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center", justifyContent: "center", overflow: "hidden",
              }}>
                {avatarLoading ? (
                  <ActivityIndicator color="white" />
                ) : dbUser?.avatar ? (
                  <Image source={{ uri: dbUser.avatar }} style={{ width: 64, height: 64, borderRadius: 32 }} />
                ) : (
                  <User size={28} color="white" />
                )}
              </View>
              <View style={{
                position: "absolute", bottom: 0, right: 0,
                backgroundColor: "#7C3AED", borderRadius: 10,
                padding: 3, borderWidth: 2, borderColor: "white",
              }}>
                <Camera size={10} color="white" />
              </View>
            </Pressable>

            <View className="flex-1">
              <Text className="text-white text-xl font-bold">{displayName}</Text>
              <Text className="text-white/80">{user.email}</Text>
              {dbUser?.phone ? <Text className="text-white/60 text-sm mt-1">{dbUser.phone}</Text> : null}
            </View>
          </View>

          <View className="flex-row gap-3 mt-4">
            <Pressable onPress={() => router.push("/profile/personal-info")} className="bg-white/20 px-4 py-2 rounded-lg">
              <Text className="text-white font-bold">{t.profile.editProfile}</Text>
            </Pressable>
            <Pressable onPress={handleSignOut} className="border border-white px-4 py-2 rounded-lg flex-row items-center gap-2">
              <LogOut size={16} color="white" />
              <Text className="text-white">{t.profile.logout}</Text>
            </Pressable>
          </View>
        </View>

        {/* Language Selector */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-foreground font-semibold">{t.profile.chooseLanguage}</Text>
            {savingLang && <ActivityIndicator size="small" color="#8B5CF6" />}
          </View>
          <View className="flex-row gap-2">
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => handleLanguageChange(lang.code)}
                className={`flex-1 py-3 rounded-xl items-center border ${
                  language === lang.code ? "bg-primary border-primary" : "bg-secondary border-border"
                }`}
              >
                <Text className={`font-bold text-sm ${language === lang.code ? "text-white" : "text-foreground"}`}>
                  {lang.native}
                </Text>
                <Text className={`text-xs mt-1 ${language === lang.code ? "text-white opacity-80" : "text-muted"}`}>
                  {lang.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Personal Info */}
        <Pressable onPress={() => router.push("/profile/personal-info")} className="p-4 mb-3 rounded-xl bg-card border border-border">
          <View className="flex-row gap-3 items-center">
            <View className="rounded-lg bg-primary items-center justify-center p-4">
              <User size={18} color="white" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-foreground">{t.profile.personalInfo}</Text>
              <Text className="text-muted text-sm">{t.profile.personalInfoDesc}</Text>
            </View>
            <ChevronRight size={18} color="#64748B" />
          </View>
        </Pressable>

        {/* Settings Sections */}
        {sections.map((s, i) => (
          <Pressable key={i} onPress={s.action} className="p-4 mb-3 rounded-xl bg-card border border-border">
            <View className="flex-row gap-3 items-center">
              <View className="rounded-lg bg-primary items-center justify-center p-4">
                <s.icon size={18} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">{s.title}</Text>
                <Text className="text-muted text-sm">{s.desc}</Text>
              </View>
              <ChevronRight size={18} color="#64748B" />
            </View>
          </Pressable>
        ))}

        {/* Stats */}
        <View className="flex-row gap-3 mt-6 p-4">
          {[
            { label: t.profile.scans, count: dbUser?.prescriptionHistory?.length ?? 0 },
            { label: t.profile.forms, count: dbUser?.formHistory?.length ?? 0 },
            { label: t.profile.schemes, count: 0 },
          ].map((stat, i) => (
            <View key={i} className="flex-1 bg-secondary p-3 rounded-xl items-center">
              <Text className="text-primary text-xl font-bold">{stat.count}</Text>
              <Text className="text-muted text-sm">{stat.label}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} userId={user.uid} />
      <HelpSupportDialog open={helpSupportOpen} onOpenChange={setHelpSupportOpen} />
      <ProfileChatbot />

      {/* Avatar Modal */}
      <Modal visible={avatarModalOpen} transparent animationType="fade" onRequestClose={closeAvatarModal}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", alignItems: "center", justifyContent: "center" }}>

          <Pressable onPress={closeAvatarModal} style={{ position: "absolute", top: 50, right: 20, zIndex: 10 }}>
            <X size={28} color="white" />
          </Pressable>

          <Image source={{ uri: dbUser?.avatar }} style={{ width: 280, height: 280, borderRadius: 140 }} />

          <View style={{ flexDirection: "row", gap: 12, marginTop: 32 }}>
            <Pressable
              onPress={pickAndUploadAvatar}
              style={{ backgroundColor: "#8B5CF6", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Camera size={16} color="white" />
              <Text style={{ color: "white", fontWeight: "600" }}>{t.profile.changePhoto}</Text>
            </Pressable>

            <Pressable
              onPress={handleDeleteAvatar}
              style={{ borderWidth: 1, borderColor: "#EF4444", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Trash2 size={16} color="#EF4444" />
              <Text style={{ color: "#EF4444", fontWeight: "600" }}>{t.profile.deletePhoto}</Text>
            </Pressable>
          </View>

        </View>
      </Modal>

    </View>
  );
}