// app/health/health-notifications.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, ScrollView, Pressable, Animated, ActivityIndicator, TextInput, Modal, Switch, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Bell, Plus, Trash2, Pencil, Check, X, Clock, ChevronDown, ChevronUp, MessageSquare, Mail, ShieldCheck, AlertCircle, CheckCircle, Smartphone } from "lucide-react-native";
import { apiRequest } from "@/integrations/api/client";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateDbUser } from "@/store/slices/authSlice";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import { HeroSection } from "@/components/HeroSection";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useSound } from "@/hooks/useSound";
import { scheduleAllReminders } from "@/utils/notificationScheduler";

interface Reminder { _id: string; medicineName: string; dosage: string; times: string[]; startDate: string; endDate: string | null; isEveryday: boolean; notifyApp: boolean; notifySms: boolean; notifyEmail: boolean; isActive: boolean; createdAt: string; }

const HOURS   = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

const parseDate        = (str: string): Date | null => { const p = str.split("/"); if (p.length !== 3) return null; const d = new Date(`${p[2]}-${p[1]}-${p[0]}`); return isNaN(d.getTime()) ? null : d; };
const formatDateForApi = (str: string): string | null => { const d = parseDate(str); return d ? d.toISOString() : null; };
const formatDateForDisplay = (iso: string): string => { const d = new Date(iso); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; };

// ── TimePicker ─────────────────────────────────────────────────────────────────
const TimePicker = ({ value, onChange, onRemove, showRemove }: { value: string; onChange: (v: string) => void; onRemove?: () => void; showRemove: boolean }) => {
  const [hour, minute] = value.split(":");
  const safeH = HOURS.includes(hour) ? hour : "08";
  const safeM = MINUTES.includes(minute) ? minute : "00";
  return (
    <View className="bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl p-3 mb-3 border border-[#E2E8F0] dark:border-[#334155]">
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center gap-1.5">
          <Clock size={15} color="#8B5CF6" />
          <Text className="text-primary font-bold text-base">{safeH}:{safeM}</Text>
        </View>
        {showRemove && (
          <Pressable onPress={onRemove} hitSlop={8} className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-lg">
            <X size={13} color="#EF4444" />
          </Pressable>
        )}
      </View>
      <View className="flex-row gap-2.5 items-center">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 bg-white dark:bg-[#1E293B] rounded-lg p-1">
          {HOURS.map((h) => (
            <Pressable key={h} onPress={() => onChange(`${h}:${safeM}`)} className={`py-2 px-2.5 rounded-lg mr-1 ${safeH === h ? "bg-primary" : ""}`}>
              <Text className={`text-xs ${safeH === h ? "text-white font-bold" : "text-[#64748B] dark:text-[#94A3B8] font-medium"}`}>{h}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text className="text-[#94A3B8] text-lg font-bold">:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 bg-white dark:bg-[#1E293B] rounded-lg p-1">
          {MINUTES.map((m) => (
            <Pressable key={m} onPress={() => onChange(`${safeH}:${m}`)} className={`py-2 px-2.5 rounded-lg mr-1 ${safeM === m ? "bg-primary" : ""}`}>
              <Text className={`text-xs ${safeM === m ? "text-white font-bold" : "text-[#64748B] dark:text-[#94A3B8] font-medium"}`}>{m}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

// ── NotifyToggle ───────────────────────────────────────────────────────────────
const NotifyToggle = ({ icon: Icon, label, value, onValueChange, verified, verifyLabel, onVerifyPress, color, disabled, disabledLabel }: any) => (
  <View className={`flex-row items-center bg-white dark:bg-[#1E293B] rounded-xl p-3 mb-2 border ${disabled ? "opacity-50 border-[#E2E8F0] dark:border-[#334155]" : "border-[#E2E8F0] dark:border-[#334155]"}`}>
    <View className="w-9 h-9 rounded-xl items-center justify-center mr-2.5" style={{ backgroundColor: `${color}22` }}>
      <Icon size={18} color={disabled ? "#94A3B8" : color} />
    </View>
    <Text className={`flex-1 text-sm font-semibold ${disabled ? "text-[#94A3B8]" : "text-[#0F172A] dark:text-white"}`}>{label}</Text>
    {disabled ? (
      <View className="bg-[#F1F5F9] dark:bg-[#334155] px-2.5 py-1.5 rounded-lg mr-2">
        <Text className="text-[#94A3B8] text-xs font-semibold">{disabledLabel || "Unavailable"}</Text>
      </View>
    ) : (
      <>
        {verified !== undefined && (!verified && onVerifyPress ? (
          <Pressable onPress={onVerifyPress} className="flex-row items-center gap-1 bg-[#FFF7ED] px-2.5 py-1.5 rounded-lg mr-2">
            <ShieldCheck size={12} color="#F59E0B" />
            <Text className="text-amber-500 text-xs font-bold">{verifyLabel}</Text>
          </Pressable>
        ) : verified ? (
          <View className="flex-row items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2.5 py-1.5 rounded-lg mr-2">
            <Check size={12} color="#10B981" />
            <Text className="text-green-600 text-xs font-bold">✓</Text>
          </View>
        ) : null)}
        <Switch value={value} onValueChange={onValueChange} disabled={disabled}
          trackColor={{ false: "#CBD5E1", true: `${color}88` }} thumbColor={value ? color : "#94A3B8"} />
      </>
    )}
  </View>
);

// ── OtpModal ───────────────────────────────────────────────────────────────────
const OtpModal = ({ visible, onClose, title, subtitle, showPhoneInput, phoneValue, onPhoneChange, onPhoneBlur, otpValue, onOtpChange, otpSentState, onSendOtp, onVerifyOtp, loading: vLoading, sendOtpLabel, enterOtpLabel, verifyLabel, checkingAvailability, smsAvailable }: any) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View className="flex-1 bg-black/70 justify-end">
      <View className="bg-white dark:bg-[#1E293B] rounded-t-3xl p-6">
        <View className="flex-row items-center mb-4">
          <ShieldCheck size={20} color="#8B5CF6" />
          <Text className="text-[#0F172A] dark:text-white font-bold text-base ml-2 flex-1">{title}</Text>
          <Pressable onPress={onClose}><X size={20} color="#94A3B8" /></Pressable>
        </View>
        <Text className="text-[#64748B] dark:text-[#94A3B8] mb-3 text-sm">{subtitle}</Text>
        {showPhoneInput && (
          <>
            <TextInput placeholder="+91 9876543210" placeholderTextColor="#94A3B8" value={phoneValue} onChangeText={onPhoneChange} onBlur={onPhoneBlur} keyboardType="phone-pad"
              className="bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-white p-3.5 mb-2 text-[15px]" />
            {checkingAvailability && <View className="flex-row items-center gap-1.5 mb-3"><ActivityIndicator size="small" color="#94A3B8" /><Text className="text-[#94A3B8] text-xs">Checking SMS availability...</Text></View>}
            {!checkingAvailability && smsAvailable === false && <View className="flex-row items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg p-2.5 mb-3"><AlertCircle size={13} color="#F59E0B" /><Text className="text-amber-700 dark:text-amber-400 text-xs flex-1">SMS is disabled for this number. Use email instead.</Text></View>}
            {!checkingAvailability && smsAvailable === true && <View className="flex-row items-center gap-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg p-2.5 mb-3"><CheckCircle size={13} color="#10B981" /><Text className="text-green-700 dark:text-green-400 text-xs">SMS available ✓</Text></View>}
          </>
        )}
        {!otpSentState ? (
          <AnimatedPressable onPress={onSendOtp} disabled={vLoading || (showPhoneInput && smsAvailable === false)} soundType="mechanical"
            className={`rounded-xl p-3.5 items-center ${showPhoneInput && smsAvailable === false ? "bg-[#E2E8F0] dark:bg-[#334155]" : "bg-primary"}`}>
            {vLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-[15px]">{sendOtpLabel}</Text>}
          </AnimatedPressable>
        ) : (
          <View>
            <TextInput placeholder={enterOtpLabel} placeholderTextColor="#94A3B8" value={otpValue} onChangeText={onOtpChange} keyboardType="number-pad" maxLength={6}
              className="bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl border-2 border-primary text-[#0F172A] dark:text-white p-3.5 mb-3 text-[22px] text-center tracking-widest" />
            <AnimatedPressable onPress={onVerifyOtp} disabled={vLoading} soundType="mechanical" className="bg-green-500 rounded-xl p-3.5 items-center">
              {vLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-[15px]">{verifyLabel}</Text>}
            </AnimatedPressable>
          </View>
        )}
      </View>
    </View>
  </Modal>
);

// ── Main ───────────────────────────────────────────────────────────────────────
export default function HealthNotifications() {
  const router  = useRouter();
  const { t }   = useTranslation();
  const hn      = t.healthNotif;
  const toast   = useToast();
  const { confirm } = useConfirm();
  const dispatch    = useAppDispatch();
  const dbUser      = useAppSelector((s) => s.auth.dbUser);
  const { playClick } = useSound();

  const [reminders,  setReminders]  = useState<Reminder[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);

  const [medicineName, setMedicineName] = useState("");
  const [dosage,       setDosage]       = useState("");
  const [times,        setTimes]        = useState<string[]>(["08:00"]);
  const [startDate,    setStartDate]    = useState("");
  const [endDate,      setEndDate]      = useState("");
  const [isEveryday,   setIsEveryday]   = useState(true);
  const [notifyApp,    setNotifyApp]    = useState(false);
  const [notifySms,    setNotifySms]    = useState(false);
  const [notifyEmail,  setNotifyEmail]  = useState(false);

  const [showPhoneVerify, setShowPhoneVerify] = useState(false);
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [phoneInput,      setPhoneInput]      = useState("");
  const [phoneOtp,        setPhoneOtp]        = useState("");
  const [emailOtp,        setEmailOtp]        = useState("");
  const [otpSent,         setOtpSent]         = useState(false);
  const [emailOtpSent,    setEmailOtpSent]    = useState(false);
  const [verifyLoading,   setVerifyLoading]   = useState(false);
  const [smsAvailable,    setSmsAvailable]    = useState<boolean | null>(null);
  const [checkingPhone,   setCheckingPhone]   = useState(false);

  const isGoogleUser  = dbUser?.isVerified   ?? false;
  const phoneVerified = dbUser?.phoneVerified ?? false;
  const emailVerified = dbUser?.emailVerified ?? false;

  useEffect(() => { loadReminders(); }, []);

  const loadReminders = async () => {
    setLoading(true);
    try { const data = await apiRequest("/reminders"); if (data.success) setReminders(data.reminders); }
    catch { toast.error(hn.loadFailed); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setMedicineName(""); setDosage(""); setTimes(["08:00"]); setStartDate(""); setEndDate(""); setIsEveryday(true); setNotifyApp(false); setNotifySms(false); setNotifyEmail(false); setEditingId(null); };
  const openAddForm = () => { playClick("mechanical"); resetForm(); setShowForm(true); };
  const openEditForm = (r: Reminder) => {
    playClick("soft");
    setMedicineName(r.medicineName); setDosage(r.dosage);
    setTimes(r.times.map((t) => { const [h, m] = t.split(":"); return `${String(Number(h)).padStart(2,"0")}:${MINUTES.includes(m) ? m : "00"}`; }));
    setStartDate(formatDateForDisplay(r.startDate)); setEndDate(r.endDate ? formatDateForDisplay(r.endDate) : "");
    setIsEveryday(r.isEveryday); setNotifyApp(r.notifyApp ?? false); setNotifySms(r.notifySms); setNotifyEmail(r.notifyEmail);
    setEditingId(r._id); setShowForm(true);
  };

  const addTime    = ()          => setTimes([...times, "08:00"]);
  const removeTime = (i: number) => setTimes(times.filter((_, idx) => idx !== i));
  const updateTime = (i: number, val: string) => { const u = [...times]; u[i] = val; setTimes(u); };

  const checkSmsAvailability = useCallback(async (phone: string) => {
    if (!phone || phone.replace(/\s/g, "").length < 10) { setSmsAvailable(null); return; }
    try { setCheckingPhone(true); const data = await apiRequest(`/reminders/sms-availability?phone=${encodeURIComponent(phone)}`); setSmsAvailable(data.available); }
    catch { setSmsAvailable(null); }
    finally { setCheckingPhone(false); }
  }, []);

  const handleSmsToggle   = useCallback((v: boolean) => { if (v && !phoneVerified) { setSmsAvailable(null); setShowPhoneVerify(true); } else setNotifySms(v); }, [phoneVerified]);
  const handleEmailToggle = useCallback((v: boolean) => { if (v && !emailVerified) setShowEmailVerify(true); else setNotifyEmail(v); }, [emailVerified]);

  const handleSave = async () => {
    if (!medicineName.trim() || !dosage.trim() || times.length === 0) { toast.error(hn.fillRequired); return; }
    if (!notifyApp && !notifySms && !notifyEmail) { toast.error("Please enable at least one notification method"); return; }
    if (notifySms && !phoneVerified) { toast.error(hn.verifyPhoneFirst); return; }
    if (notifyEmail && !emailVerified) { toast.error(hn.verifyEmailFirst); return; }
    const parsedStart = startDate ? formatDateForApi(startDate) : new Date().toISOString();
    if (startDate && !parsedStart) { toast.error(hn.invalidDate); return; }
    const parsedEnd = endDate && !isEveryday ? formatDateForApi(endDate) : null;
    if (endDate && !isEveryday && !parsedEnd) { toast.error(hn.invalidDate); return; }
    setSaving(true);
    try {
      const payload = { medicineName, dosage, times, startDate: parsedStart, endDate: parsedEnd, isEveryday, notifyApp, notifySms, notifyEmail };
      const data = editingId ? await apiRequest(`/reminders/${editingId}`, "PATCH", payload) : await apiRequest("/reminders", "POST", payload);
      if (data.success) { setReminders(data.reminders); toast.success(hn.reminderSaved); setShowForm(false); resetForm(); if (Platform.OS !== "web") await scheduleAllReminders(data.reminders); }
    } catch (e: any) { toast.error(e.message || hn.saveFailed); }
    finally { setSaving(false); }
  };

  const handleDelete = (id: string) => confirm({ title: hn.deleteReminder, message: hn.deleteConfirm, variant: "danger", confirmText: t.common.delete, cancelText: t.common.cancel,
    onConfirm: async () => {
      try { const data = await apiRequest(`/reminders/${id}`, "DELETE"); if (data.success) { setReminders(data.reminders); toast.success(hn.reminderDeleted); if (Platform.OS !== "web") await scheduleAllReminders(data.reminders); } }
      catch { toast.error(t.common.error); }
    },
  });

  const sendPhoneOtp = async () => {
    if (!phoneInput.trim()) { toast.error(hn.phoneRequired); return; }
    setVerifyLoading(true);
    try { const data = await apiRequest("/reminders/send-phone-otp", "POST", { phone: phoneInput }); if (data.success) { setOtpSent(true); toast.success(hn.otpSent); } else if (data.smsDisabled) { setSmsAvailable(false); } }
    catch (e: any) { if (e.smsDisabled) setSmsAvailable(false); toast.error(e.message || t.common.error); }
    finally { setVerifyLoading(false); }
  };

  const verifyPhoneOtp = async () => {
    setVerifyLoading(true);
    try { const data = await apiRequest("/reminders/verify-phone-otp", "POST", { otp: phoneOtp }); if (data.success) { dispatch(updateDbUser({ phoneVerified: true, phone: phoneInput })); toast.success(hn.otpVerified); setNotifySms(true); setShowPhoneVerify(false); setOtpSent(false); setPhoneOtp(""); setPhoneInput(""); setSmsAvailable(null); } }
    catch (e: any) { toast.error(e.message || hn.otpFailed); }
    finally { setVerifyLoading(false); }
  };

  const sendEmailOtp = async () => {
    setVerifyLoading(true);
    try { const data = await apiRequest("/reminders/send-email-otp", "POST", {}); if (data.success) { if (isGoogleUser) { dispatch(updateDbUser({ emailVerified: true })); toast.success(hn.googleEmailVerified); setNotifyEmail(true); setShowEmailVerify(false); } else { setEmailOtpSent(true); toast.success(hn.otpSent); } } }
    catch (e: any) { toast.error(e.message || t.common.error); }
    finally { setVerifyLoading(false); }
  };

  const verifyEmailOtp = async () => {
    setVerifyLoading(true);
    try { const data = await apiRequest("/reminders/verify-email-otp", "POST", { otp: emailOtp }); if (data.success) { dispatch(updateDbUser({ emailVerified: true })); toast.success(hn.otpVerified); setNotifyEmail(true); setShowEmailVerify(false); setEmailOtpSent(false); setEmailOtp(""); } }
    catch (e: any) { toast.error(e.message || hn.otpFailed); }
    finally { setVerifyLoading(false); }
  };

  const inputClass = "bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-white p-3.5 mb-4 text-[15px]";

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        <AnimatedPressable onPress={() => router.back()} soundType="soft" className="flex-row items-center gap-1.5 mb-4">
          <Text className="text-[#8B5CF6] font-semibold text-sm">← {hn.backToHealth}</Text>
        </AnimatedPressable>

        <HeroSection icon={Bell} title={hn.title} subtitle={hn.subtitle} gradientColors={["#F59E0B", "#EF4444"]} delay={0} />

        <AnimatedPressable onPress={openAddForm} soundType="mechanical"
          className="flex-row items-center justify-center gap-2 bg-primary rounded-2xl py-3.5 mb-5">
          <Plus size={18} color="white" />
          <Text className="text-white font-bold text-[15px]">{hn.addReminder}</Text>
        </AnimatedPressable>

        {loading ? <ActivityIndicator color="#8B5CF6" /> :
         reminders.length === 0 ? (
          <View className="items-center py-10 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155]">
            <Bell size={40} color="#94A3B8" />
            <Text className="text-[#0F172A] dark:text-white mt-3 font-semibold text-[15px]">{hn.noReminders}</Text>
            <Text className="text-[#94A3B8] mt-1.5 text-[13px] text-center px-6">{hn.noRemindersDesc}</Text>
          </View>
         ) : reminders.map((r) => {
          const scale = useRef(new Animated.Value(1)).current;
          return (
            <Animated.View key={r._id} style={{ transform: [{ scale }] }} className="mb-2.5">
              <View className={`rounded-2xl border overflow-hidden ${r.isActive ? "bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155]" : "bg-[#F8FAFC] dark:bg-[#0F172A] border-transparent"}`}>
                <Pressable
                  onPress={() => { playClick("soft"); setExpandedId(expandedId === r._id ? null : r._id); }}
                  onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
                  onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
                  className="p-3.5"
                >
                  <View className="flex-row items-center">
                    <View className={`w-11 h-11 rounded-xl items-center justify-center mr-2.5 border ${r.isActive ? "bg-primary/10 border-primary" : "bg-[#F1F5F9] dark:bg-[#334155] border-[#E2E8F0] dark:border-[#334155]"}`}>
                      <Bell size={18} color={r.isActive ? "#8B5CF6" : "#94A3B8"} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#0F172A] dark:text-white font-bold text-[15px]">{r.medicineName}</Text>
                      <Text className="text-[#94A3B8] text-xs mt-0.5">{r.dosage} · {r.times.join(", ")}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded-lg mr-2 ${r.isActive ? "bg-green-100 dark:bg-green-900/30" : "bg-[#F1F5F9] dark:bg-[#334155]"}`}>
                      <Text className={`text-xs font-bold ${r.isActive ? "text-green-600 dark:text-green-400" : "text-[#94A3B8]"}`}>{r.isActive ? hn.active : hn.inactive}</Text>
                    </View>
                    {expandedId === r._id ? <ChevronUp size={15} color="#94A3B8" /> : <ChevronDown size={15} color="#94A3B8" />}
                  </View>
                </Pressable>
                {expandedId === r._id && (
                  <View className="px-3.5 pb-3.5 border-t border-[#E2E8F0] dark:border-[#334155]">
                    <Text className="text-[#94A3B8] text-xs mt-2.5 mb-1.5">📅 {formatDateForDisplay(r.startDate)}{r.endDate ? ` → ${formatDateForDisplay(r.endDate)}` : ` (${hn.everyday})`}</Text>
                    <View className="flex-row gap-1.5 flex-wrap mb-3">
                      {r.notifyApp   && <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-lg"><Text className="text-blue-600 dark:text-blue-400 text-xs">📱 In-App</Text></View>}
                      {r.notifySms   && <View className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg"><Text className="text-green-600 dark:text-green-400 text-xs">💬 {hn.smsNotification}</Text></View>}
                      {r.notifyEmail && <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-lg"><Text className="text-purple-600 dark:text-purple-400 text-xs">✉️ {hn.emailNotification}</Text></View>}
                    </View>
                    <View className="flex-row gap-2">
                      <AnimatedPressable onPress={() => openEditForm(r)} soundType="soft" className="flex-1 flex-row items-center justify-center gap-1.5 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl py-2.5">
                        <Pencil size={13} color="#8B5CF6" /><Text className="text-primary font-semibold text-[13px]">{hn.editReminder}</Text>
                      </AnimatedPressable>
                      <AnimatedPressable onPress={() => handleDelete(r._id)} soundType="soft" className="flex-1 flex-row items-center justify-center gap-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl py-2.5">
                        <Trash2 size={13} color="#EF4444" /><Text className="text-red-500 font-semibold text-[13px]">{hn.deleteReminder}</Text>
                      </AnimatedPressable>
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          );
         })}
      </ScrollView>

      {/* Add/Edit Form Modal */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-white dark:bg-[#1E293B] rounded-t-3xl max-h-[92%]">
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <View className="flex-row items-center mb-5">
                <Text className="text-[#0F172A] dark:text-white font-extrabold text-lg flex-1">{editingId ? hn.editReminder : hn.addReminder}</Text>
                <Pressable onPress={() => { setShowForm(false); resetForm(); }}><X size={22} color="#94A3B8" /></Pressable>
              </View>

              <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs font-semibold mb-1.5">{hn.medicineName}</Text>
              <TextInput placeholder={hn.medicineNamePlaceholder} placeholderTextColor="#94A3B8" value={medicineName} onChangeText={setMedicineName} className={inputClass} />

              <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs font-semibold mb-1.5">{hn.dosage}</Text>
              <TextInput placeholder={hn.dosagePlaceholder} placeholderTextColor="#94A3B8" value={dosage} onChangeText={setDosage} className={inputClass} />

              <View className="flex-row items-center justify-between mb-2.5">
                <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs font-semibold">{hn.times}</Text>
                <AnimatedPressable onPress={addTime} soundType="soft" className="flex-row items-center gap-1">
                  <Plus size={13} color="#8B5CF6" /><Text className="text-primary text-xs font-semibold">{hn.addTime}</Text>
                </AnimatedPressable>
              </View>
              {times.map((time, i) => <TimePicker key={i} value={time} onChange={(val) => updateTime(i, val)} onRemove={() => removeTime(i)} showRemove={times.length > 1} />)}

              <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs font-semibold mb-1.5 mt-1">{hn.startDate}</Text>
              <TextInput placeholder="DD/MM/YYYY" placeholderTextColor="#94A3B8" value={startDate} onChangeText={setStartDate} className={inputClass} />

              <View className={`flex-row items-center bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl p-3 mb-3 border ${isEveryday ? "border-primary" : "border-[#E2E8F0] dark:border-[#334155]"}`}>
                <Text className="text-[#0F172A] dark:text-white flex-1 text-sm">{hn.everyday}</Text>
                <Switch value={isEveryday} onValueChange={setIsEveryday} trackColor={{ false: "#CBD5E1", true: "#7C3AED" }} thumbColor={isEveryday ? "#8B5CF6" : "#94A3B8"} />
              </View>
              {!isEveryday && (
                <>
                  <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs font-semibold mb-1.5">{hn.endDate}</Text>
                  <TextInput placeholder="DD/MM/YYYY" placeholderTextColor="#94A3B8" value={endDate} onChangeText={setEndDate} className={inputClass} />
                </>
              )}

              <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs font-semibold mb-2">{hn.notifyVia}</Text>
              <NotifyToggle icon={Smartphone} label="In-App Notification" value={notifyApp} onValueChange={setNotifyApp} color="#38BDF8" />
              <NotifyToggle icon={MessageSquare} label={hn.smsNotification} value={notifySms} onValueChange={handleSmsToggle} verified={phoneVerified} verifyLabel={hn.verifyPhone} onVerifyPress={() => { setSmsAvailable(null); setShowPhoneVerify(true); }} color="#22C55E" disabled={smsAvailable === false} disabledLabel="Unavailable" />
              <NotifyToggle icon={Mail} label={hn.emailNotification} value={notifyEmail} onValueChange={handleEmailToggle} verified={emailVerified} verifyLabel={hn.verifyEmail} onVerifyPress={() => setShowEmailVerify(true)} color="#C084FC" />

              <AnimatedPressable onPress={handleSave} disabled={saving} soundType="mechanical" className="bg-primary rounded-2xl p-4 items-center mt-4">
                {saving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">{hn.saveReminder}</Text>}
              </AnimatedPressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <OtpModal visible={showPhoneVerify} onClose={() => { setShowPhoneVerify(false); setOtpSent(false); setPhoneOtp(""); setPhoneInput(""); setSmsAvailable(null); }}
        title={hn.verifyPhone} subtitle={hn.phoneRequired} showPhoneInput={true} phoneValue={phoneInput}
        onPhoneChange={(v: string) => { setPhoneInput(v); setSmsAvailable(null); }} onPhoneBlur={() => checkSmsAvailability(phoneInput)}
        otpValue={phoneOtp} onOtpChange={setPhoneOtp} otpSentState={otpSent} onSendOtp={sendPhoneOtp} onVerifyOtp={verifyPhoneOtp}
        loading={verifyLoading} sendOtpLabel={hn.sendOtp} enterOtpLabel={hn.enterOtp} verifyLabel={hn.otpVerified}
        checkingAvailability={checkingPhone} smsAvailable={smsAvailable} />

      <OtpModal visible={showEmailVerify} onClose={() => { setShowEmailVerify(false); setEmailOtpSent(false); setEmailOtp(""); }}
        title={hn.verifyEmail} subtitle={hn.emailRequired} showPhoneInput={false} phoneValue="" onPhoneChange={() => {}}
        otpValue={emailOtp} onOtpChange={setEmailOtp} otpSentState={emailOtpSent} onSendOtp={sendEmailOtp} onVerifyOtp={verifyEmailOtp}
        loading={verifyLoading} sendOtpLabel={hn.sendOtp} enterOtpLabel={hn.enterOtp} verifyLabel={hn.otpVerified} />
    </View>
  );
}