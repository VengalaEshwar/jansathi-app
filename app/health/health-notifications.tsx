import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable,
  ActivityIndicator, TextInput, Modal, Switch, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft, Bell, Plus, Trash2, Pencil,
  Check, X, Clock, ChevronDown, ChevronUp,
  MessageSquare, Mail, ShieldCheck, AlertCircle,
  CheckCircle, Smartphone,
} from "lucide-react-native";
import { apiRequest } from "@/integrations/api/client";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateDbUser } from "@/store/slices/authSlice";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import { scheduleAllReminders } from "@/utils/notificationScheduler";

interface Reminder {
  _id: string;
  medicineName: string;
  dosage: string;
  times: string[];
  startDate: string;
  endDate: string | null;
  isEveryday: boolean;
  notifyApp: boolean;
  notifySms: boolean;
  notifyEmail: boolean;
  isActive: boolean;
  createdAt: string;
}

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

const parseDate = (str: string): Date | null => {
  const parts = str.split("/");
  if (parts.length !== 3) return null;
  const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  return isNaN(d.getTime()) ? null : d;
};

const formatDateForApi = (str: string): string | null => {
  const d = parseDate(str);
  return d ? d.toISOString() : null;
};

const formatDateForDisplay = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

interface TimePickerProps {
  value: string;
  onChange: (val: string) => void;
  onRemove?: () => void;
  showRemove: boolean;
}

const TimePicker = ({ value, onChange, onRemove, showRemove }: TimePickerProps) => {
  const [hour, minute] = value.split(":");
  const safeHour = HOURS.includes(hour) ? hour : "08";
  const safeMinute = MINUTES.includes(minute) ? minute : "00";

  return (
    <View className="bg-light-background dark:bg-background rounded-xl p-3 mb-4 border border-light-border dark:border-border">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Clock size={16} color="#8B5CF6" />
          <Text className="text-primary text-base font-bold">
            {safeHour}:{safeMinute}
          </Text>
        </View>
        {showRemove && (
          <Pressable onPress={onRemove} hitSlop={8} className="bg-red-500/20 p-1.5 rounded-lg">
            <X size={14} color="#EF4444" />
          </Pressable>
        )}
      </View>

      <View className="flex-row gap-3 items-center">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="flex-1 bg-light-card dark:bg-card rounded-lg p-1"
        >
          {HOURS.map((h) => (
            <Pressable
              key={h}
              onPress={() => onChange(`${h}:${safeMinute}`)}
              className={`py-2 px-3 rounded-md mr-1 ${safeHour === h ? "bg-primary" : "bg-transparent"}`}
            >
              <Text className={`text-sm ${safeHour === h ? "text-white font-bold" : "text-muted font-medium"}`}>
                {h}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text className="text-muted text-lg font-bold">:</Text>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="flex-1 bg-light-card dark:bg-card rounded-lg p-1"
        >
          {MINUTES.map((m) => (
            <Pressable
              key={m}
              onPress={() => onChange(`${safeHour}:${m}`)}
              className={`py-2 px-3 rounded-md mr-1 ${safeMinute === m ? "bg-primary" : "bg-transparent"}`}
            >
              <Text className={`text-sm ${safeMinute === m ? "text-white font-bold" : "text-muted font-medium"}`}>
                {m}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

interface NotifyToggleProps {
  icon: any;
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  verified?: boolean;
  verifyLabel?: string;
  onVerifyPress?: () => void;
  color: string;
  disabled?: boolean;
  disabledLabel?: string;
}

const NotifyToggle = ({
  icon: Icon, label, value, onValueChange,
  verified, verifyLabel, onVerifyPress, color,
  disabled, disabledLabel,
}: NotifyToggleProps) => (
  <View 
    className={`flex-row items-center bg-light-card dark:bg-card rounded-xl p-3 mb-2 border ${disabled ? "opacity-50 border-light-border dark:border-border" : value ? "border-[" + color + "]" : "border-light-border dark:border-border"}`}
    style={{ borderColor: disabled ? undefined : value ? color : undefined }}
  >
    <View 
      className="w-9 h-9 rounded-lg items-center justify-center mr-3"
      style={{ backgroundColor: `${color}22` }}
    >
      <Icon size={18} color={disabled ? "#64748B" : color} />
    </View>
    <Text className={`flex-1 text-sm font-medium ${disabled ? "text-muted" : "text-light-foreground dark:text-foreground"}`}>
      {label}
    </Text>

    {disabled ? (
      <View className="bg-light-background dark:bg-background px-2.5 py-1.5 rounded-lg mr-2">
        <Text className="text-muted text-[11px] font-semibold">
          {disabledLabel || "Disabled"}
        </Text>
      </View>
    ) : (
      <>
        {verified !== undefined && (
          !verified && onVerifyPress ? (
            <Pressable
              onPress={onVerifyPress}
              className="flex-row items-center gap-1 bg-light-background dark:bg-background px-2.5 py-1.5 rounded-lg mr-2"
            >
              <ShieldCheck size={13} color="#F59E0B" />
              <Text className="text-yellow-500 text-xs font-semibold">
                {verifyLabel}
              </Text>
            </Pressable>
          ) : verified ? (
            <View className="flex-row items-center gap-1 bg-green-500/20 px-2.5 py-1.5 rounded-lg mr-2">
              <Check size={13} color="#22C55E" />
              <Text className="text-green-500 text-xs font-semibold">✓</Text>
            </View>
          ) : null
        )}
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: "#334155", true: `${color}66` }}
          thumbColor={value ? color : "#64748B"}
        />
      </>
    )}
  </View>
);

interface OtpModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  showPhoneInput: boolean;
  phoneValue: string;
  onPhoneChange: (v: string) => void;
  onPhoneBlur?: () => void;
  otpValue: string;
  onOtpChange: (v: string) => void;
  otpSentState: boolean;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
  loading: boolean;
  sendOtpLabel: string;
  enterOtpLabel: string;
  verifyLabel: string;
  checkingAvailability?: boolean;
  smsAvailable?: boolean | null;
}

const OtpModal = ({
  visible, onClose, title, subtitle,
  showPhoneInput, phoneValue, onPhoneChange, onPhoneBlur,
  otpValue, onOtpChange, otpSentState,
  onSendOtp, onVerifyOtp, loading: vLoading,
  sendOtpLabel, enterOtpLabel, verifyLabel,
  checkingAvailability, smsAvailable,
}: OtpModalProps) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View className="flex-1 bg-black/70 justify-end">
      <View className="bg-light-card dark:bg-card rounded-t-[24px] p-6">
        <View className="flex-row items-center mb-5">
          <ShieldCheck size={22} color="#8B5CF6" />
          <Text className="text-light-foreground dark:text-foreground font-bold text-lg ml-2.5 flex-1">
            {title}
          </Text>
          <Pressable onPress={onClose}>
            <X size={22} color="#64748B" />
          </Pressable>
        </View>

        <Text className="text-muted mb-4 text-sm">{subtitle}</Text>

        {showPhoneInput && (
          <>
            <TextInput
              placeholder="+91 9876543210"
              placeholderTextColor="#475569"
              value={phoneValue}
              onChangeText={onPhoneChange}
              onBlur={onPhoneBlur}
              keyboardType="phone-pad"
              className="bg-light-background dark:bg-background rounded-xl border border-light-border dark:border-border text-light-foreground dark:text-foreground p-3.5 mb-2 text-[15px]"
            />
            {checkingAvailability && (
              <View className="flex-row items-center gap-1.5 mb-3">
                <ActivityIndicator size="small" color="#94A3B8" />
                <Text className="text-muted text-xs">Checking SMS availability...</Text>
              </View>
            )}
            {!checkingAvailability && smsAvailable === false && (
              <View className="flex-row items-center gap-1.5 bg-yellow-500/20 rounded-lg p-2.5 mb-3">
                <AlertCircle size={14} color="#F59E0B" />
                <Text className="text-yellow-600 dark:text-yellow-500 text-xs flex-1">
                  SMS is disabled for this number. Use email notifications instead.
                </Text>
              </View>
            )}
            {!checkingAvailability && smsAvailable === true && (
              <View className="flex-row items-center gap-1.5 bg-green-500/20 rounded-lg p-2.5 mb-3">
                <CheckCircle size={14} color="#22C55E" />
                <Text className="text-green-600 dark:text-green-500 text-xs">SMS available ✓</Text>
              </View>
            )}
          </>
        )}

        {!otpSentState ? (
          <Pressable
            onPress={onSendOtp}
            disabled={vLoading || (showPhoneInput && smsAvailable === false)}
            className={`rounded-xl p-3.5 items-center ${
              showPhoneInput && smsAvailable === false ? "bg-secondary opacity-50" : "bg-primary"
            }`}
          >
            {vLoading
              ? <ActivityIndicator color="white" />
              : <Text className="text-white font-bold text-[15px]">{sendOtpLabel}</Text>
            }
          </Pressable>
        ) : (
          <View>
            <TextInput
              placeholder={enterOtpLabel}
              placeholderTextColor="#475569"
              value={otpValue}
              onChangeText={onOtpChange}
              keyboardType="number-pad"
              maxLength={6}
              className="bg-light-background dark:bg-background rounded-xl border border-primary text-light-foreground dark:text-foreground p-3.5 mb-3 text-[22px] tracking-[8px] text-center"
            />
            <Pressable
              onPress={onVerifyOtp}
              disabled={vLoading}
              className="bg-green-500 rounded-xl p-3.5 items-center"
            >
              {vLoading
                ? <ActivityIndicator color="white" />
                : <Text className="text-white font-bold text-[15px]">{verifyLabel}</Text>
              }
            </Pressable>
          </View>
        )}
      </View>
    </View>
  </Modal>
);

export default function HealthNotifications() {
  const router = useRouter();
  const { t } = useTranslation();
  const hn = t.healthNotif;
  const toast = useToast();
  const { confirm } = useConfirm();
  const dispatch = useAppDispatch();
  const dbUser = useAppSelector((s) => s.auth.dbUser);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isEveryday, setIsEveryday] = useState(true);
  const [notifyApp, setNotifyApp] = useState(false);
  const [notifySms, setNotifySms] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(false);

  const [showPhoneVerify, setShowPhoneVerify] = useState(false);
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [smsAvailable, setSmsAvailable] = useState<boolean | null>(null);
  const [checkingPhone, setCheckingPhone] = useState(false);

  const isGoogleUser = dbUser?.isVerified ?? false;
  const phoneVerified = dbUser?.phoneVerified ?? false;
  const emailVerified = dbUser?.emailVerified ?? false;

  useEffect(() => { loadReminders(); }, []);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/reminders");
      if (data.success) setReminders(data.reminders);
    } catch {
      toast.error(hn.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMedicineName(""); setDosage(""); setTimes(["08:00"]);
    setStartDate(""); setEndDate(""); setIsEveryday(true);
    setNotifyApp(false); setNotifySms(false); setNotifyEmail(false);
    setEditingId(null);
  };

  const openAddForm = () => { resetForm(); setShowForm(true); };

  const checkSmsAvailability = useCallback(async (phone: string) => {
    if (!phone || phone.replace(/\s/g, "").length < 10) {
      setSmsAvailable(null);
      return;
    }
    try {
      setCheckingPhone(true);
      const data = await apiRequest(
        `/reminders/sms-availability?phone=${encodeURIComponent(phone)}`
      );
      setSmsAvailable(data.available);
    } catch {
      setSmsAvailable(null);
    } finally {
      setCheckingPhone(false);
    }
  }, []);

  const openEditForm = (r: Reminder) => {
    setMedicineName(r.medicineName);
    setDosage(r.dosage);
    setTimes(r.times.map((t) => {
      const [h, m] = t.split(":");
      const normH = String(Number(h)).padStart(2, "0");
      const normM = MINUTES.includes(m) ? m : "00";
      return `${normH}:${normM}`;
    }));
    setStartDate(formatDateForDisplay(r.startDate));
    setEndDate(r.endDate ? formatDateForDisplay(r.endDate) : "");
    setIsEveryday(r.isEveryday);
    setNotifyApp(r.notifyApp ?? false);
    setNotifySms(r.notifySms);
    setNotifyEmail(r.notifyEmail);
    setEditingId(r._id);
    setShowForm(true);
  };

  const addTime = () => setTimes([...times, "08:00"]);
  const removeTime = (i: number) => setTimes(times.filter((_, idx) => idx !== i));
  const updateTime = (i: number, val: string) => {
    const updated = [...times];
    updated[i] = val;
    setTimes(updated);
  };

  const handleSmsToggle = useCallback((v: boolean) => {
    if (v && !phoneVerified) {
      setSmsAvailable(null);
      setShowPhoneVerify(true);
    } else {
      setNotifySms(v);
    }
  }, [phoneVerified]);

  const handleEmailToggle = useCallback((v: boolean) => {
    if (v && !emailVerified) {
      setShowEmailVerify(true);
    } else {
      setNotifyEmail(v);
    }
  }, [emailVerified]);

  const handleSave = async () => {
    if (!medicineName.trim() || !dosage.trim() || times.length === 0) {
      toast.error(hn.fillRequired); return;
    }
    if (!notifyApp && !notifySms && !notifyEmail) {
      toast.error("Please enable at least one notification method"); return;
    }
    if (notifySms && !phoneVerified) { toast.error(hn.verifyPhoneFirst); return; }
    if (notifyEmail && !emailVerified) { toast.error(hn.verifyEmailFirst); return; }

    const parsedStart = startDate ? formatDateForApi(startDate) : new Date().toISOString();
    if (startDate && !parsedStart) { toast.error(hn.invalidDate); return; }
    const parsedEnd = endDate && !isEveryday ? formatDateForApi(endDate) : null;
    if (endDate && !isEveryday && !parsedEnd) { toast.error(hn.invalidDate); return; }

    setSaving(true);
    try {
      const payload = {
        medicineName, dosage, times,
        startDate: parsedStart, endDate: parsedEnd,
        isEveryday, notifyApp, notifySms, notifyEmail,
      };
      const data = editingId
        ? await apiRequest(`/reminders/${editingId}`, "PATCH", payload)
        : await apiRequest("/reminders", "POST", payload);

      if (data.success) {
        setReminders(data.reminders);
        toast.success(hn.reminderSaved);
        setShowForm(false);
        resetForm();

        if (Platform.OS !== "web") {
          await scheduleAllReminders(data.reminders);
        }
      }
    } catch (e: any) {
      toast.error(e.message || hn.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    confirm({
      title: hn.deleteReminder, message: hn.deleteConfirm,
      variant: "danger", confirmText: t.common.delete, cancelText: t.common.cancel,
      onConfirm: async () => {
        try {
          const data = await apiRequest(`/reminders/${id}`, "DELETE");
          if (data.success) { 
            setReminders(data.reminders); 
            toast.success(hn.reminderDeleted); 
            if (Platform.OS !== "web") {
              await scheduleAllReminders(data.reminders);
            }
          }
        } catch { toast.error(t.common.error); }
      },
    });
  };

  const sendPhoneOtp = async () => {
    if (!phoneInput.trim()) { toast.error(hn.phoneRequired); return; }
    setVerifyLoading(true);
    try {
      const data = await apiRequest("/reminders/send-phone-otp", "POST", { phone: phoneInput });
      if (data.success) { setOtpSent(true); toast.success(hn.otpSent); }
      else if (data.smsDisabled) {
        setSmsAvailable(false);
        toast.error("SMS not available for this number.");
      }
    } catch (e: any) {
      if (e.smsDisabled) setSmsAvailable(false);
      toast.error(e.message || t.common.error);
    } finally { setVerifyLoading(false); }
  };

  const verifyPhoneOtp = async () => {
    setVerifyLoading(true);
    try {
      const data = await apiRequest("/reminders/verify-phone-otp", "POST", { otp: phoneOtp });
      if (data.success) {
        dispatch(updateDbUser({ phoneVerified: true, phone: phoneInput }));
        toast.success(hn.otpVerified);
        setNotifySms(true);
        setShowPhoneVerify(false);
        setOtpSent(false);
        setPhoneOtp("");
        setPhoneInput("");
        setSmsAvailable(null);
      }
    } catch (e: any) {
      toast.error(e.message || hn.otpFailed);
    } finally { setVerifyLoading(false); }
  };

  const sendEmailOtp = async () => {
    setVerifyLoading(true);
    try {
      const data = await apiRequest("/reminders/send-email-otp", "POST", {});
      if (data.success) {
        if (isGoogleUser) {
          dispatch(updateDbUser({ emailVerified: true }));
          toast.success(hn.googleEmailVerified);
          setNotifyEmail(true);
          setShowEmailVerify(false);
        } else {
          setEmailOtpSent(true);
          toast.success(hn.otpSent);
        }
      }
    } catch (e: any) {
      toast.error(e.message || t.common.error);
    } finally { setVerifyLoading(false); }
  };

  const verifyEmailOtp = async () => {
    setVerifyLoading(true);
    try {
      const data = await apiRequest("/reminders/verify-email-otp", "POST", { otp: emailOtp });
      if (data.success) {
        dispatch(updateDbUser({ emailVerified: true }));
        toast.success(hn.otpVerified);
        setNotifyEmail(true);
        setShowEmailVerify(false);
        setEmailOtpSent(false);
        setEmailOtp("");
      }
    } catch (e: any) {
      toast.error(e.message || hn.otpFailed);
    } finally { setVerifyLoading(false); }
  };

  return (
    <View className="flex-1 bg-light-background dark:bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center mb-5"
        >
          <ArrowLeft size={20} color="#6b7280" />
          <Text className="text-muted ml-2">{hn.backToHealth}</Text>
        </Pressable>

        <View className="mb-6">
          <View className="flex-row items-center gap-3 mb-1.5">
            <View className="w-11 h-11 rounded-xl bg-primary items-center justify-center">
              <Bell size={22} color="white" />
            </View>
            <Text className="text-light-foreground dark:text-foreground text-[22px] font-extrabold">{hn.title}</Text>
          </View>
          <Text className="text-muted text-sm">{hn.subtitle}</Text>
        </View>

        <Pressable
          onPress={openAddForm}
          className="flex-row items-center justify-center gap-2 bg-primary rounded-[14px] p-3.5 mb-5"
        >
          <Plus size={18} color="white" />
          <Text className="text-white font-bold text-[15px]">{hn.addReminder}</Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator color="#8B5CF6" className="mt-5" />
        ) : reminders.length === 0 ? (
          <View className="items-center py-10 bg-light-card dark:bg-card rounded-2xl border border-light-border dark:border-border">
            <Bell size={40} color="#64748B" />
            <Text className="text-muted mt-3 font-semibold text-[15px]">
              {hn.noReminders}
            </Text>
            <Text className="text-muted mt-1.5 text-[13px] text-center px-6">
              {hn.noRemindersDesc}
            </Text>
          </View>
        ) : (
          reminders.map((r) => (
            <View key={r._id} className={`rounded-2xl border mb-3 overflow-hidden ${r.isActive ? "bg-light-card dark:bg-card border-light-border dark:border-border" : "bg-light-background dark:bg-background border-transparent"}`}>
              <Pressable
                onPress={() => setExpandedId(expandedId === r._id ? null : r._id)}
                className="p-4"
              >
                <View className="flex-row items-center">
                  <View className={`w-[42px] h-[42px] rounded-lg items-center justify-center mr-3 border ${r.isActive ? "bg-primary/20 border-primary" : "bg-light-card dark:bg-card border-light-border dark:border-border"}`}>
                    <Bell size={18} color={r.isActive ? "#A78BFA" : "#64748B"} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-light-foreground dark:text-foreground font-bold text-[15px]">
                      {r.medicineName}
                    </Text>
                    <Text className="text-muted text-xs mt-0.5">
                      {r.dosage} • {r.times.join(", ")}
                    </Text>
                  </View>
                  <View className={`px-2 py-1 rounded-md mr-2 ${r.isActive ? "bg-green-500/20" : "bg-light-background dark:bg-background"}`}>
                    <Text className={`text-[11px] font-semibold ${r.isActive ? "text-green-500" : "text-muted"}`}>
                      {r.isActive ? hn.active : hn.inactive}
                    </Text>
                  </View>
                  {expandedId === r._id
                    ? <ChevronUp size={16} color="#64748B" />
                    : <ChevronDown size={16} color="#64748B" />
                  }
                </View>
              </Pressable>

              {expandedId === r._id && (
                <View className="px-4 pb-4 border-t border-light-border dark:border-border">
                  <View className="mt-3 gap-1.5">
                    <Text className="text-muted text-xs">
                      📅 {formatDateForDisplay(r.startDate)}
                      {r.endDate ? ` → ${formatDateForDisplay(r.endDate)}` : ` (${hn.everyday})`}
                    </Text>
                    <View className="flex-row gap-1.5 flex-wrap mt-1">
                      {r.notifyApp && (
                        <View className="bg-sky-500/20 px-2 py-1 rounded-md">
                          <Text className="text-sky-400 text-[11px]">📱 In-App</Text>
                        </View>
                      )}
                      {r.notifySms && (
                        <View className="bg-green-500/20 px-2 py-1 rounded-md">
                          <Text className="text-green-400 text-[11px]">💬 {hn.smsNotification}</Text>
                        </View>
                      )}
                      {r.notifyEmail && (
                        <View className="bg-purple-500/20 px-2 py-1 rounded-md">
                          <Text className="text-purple-400 text-[11px]">✉️ {hn.emailNotification}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View className="flex-row gap-2.5 mt-3.5">
                    <Pressable
                      onPress={() => openEditForm(r)}
                      className="flex-1 flex-row items-center justify-center gap-1.5 bg-secondary rounded-lg p-2.5"
                    >
                      <Pencil size={14} color="#8B5CF6" />
                      <Text className="text-primary font-semibold text-[13px]">{hn.editReminder}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(r._id)}
                      className="flex-1 flex-row items-center justify-center gap-1.5 bg-red-500/10 rounded-lg p-2.5 border border-red-500/20"
                    >
                      <Trash2 size={14} color="#EF4444" />
                      <Text className="text-red-500 font-semibold text-[13px]">{hn.deleteReminder}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-light-card dark:bg-card rounded-t-[24px] max-h-[92%]">
            <ScrollView contentContainerStyle={{ padding: 24 }}>

              <View className="flex-row items-center mb-6">
                <Text className="text-light-foreground dark:text-foreground font-extrabold text-lg flex-1">
                  {editingId ? hn.editReminder : hn.addReminder}
                </Text>
                <Pressable onPress={() => { setShowForm(false); resetForm(); }}>
                  <X size={22} color="#64748B" />
                </Pressable>
              </View>

              <Text className="text-muted text-[13px] mb-1.5 font-semibold">{hn.medicineName}</Text>
              <TextInput
                placeholder={hn.medicineNamePlaceholder}
                placeholderTextColor="#475569"
                value={medicineName}
                onChangeText={setMedicineName}
                className="bg-light-background dark:bg-background rounded-xl border border-light-border dark:border-border text-light-foreground dark:text-foreground p-3.5 mb-4 text-[15px]"
              />

              <Text className="text-muted text-[13px] mb-1.5 font-semibold">{hn.dosage}</Text>
              <TextInput
                placeholder={hn.dosagePlaceholder}
                placeholderTextColor="#475569"
                value={dosage}
                onChangeText={setDosage}
                className="bg-light-background dark:bg-background rounded-xl border border-light-border dark:border-border text-light-foreground dark:text-foreground p-3.5 mb-4 text-[15px]"
              />

              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-muted text-[13px] font-semibold">{hn.times}</Text>
                  <View className="bg-light-background dark:bg-background rounded-md px-2 py-0.5">
                    <Text className="text-muted text-[11px]">every 15 min slots</Text>
                  </View>
                </View>
                <Pressable onPress={addTime} className="flex-row items-center gap-1">
                  <Plus size={14} color="#8B5CF6" />
                  <Text className="text-primary text-[13px] font-semibold">{hn.addTime}</Text>
                </Pressable>
              </View>

              {times.map((time, i) => (
                <TimePicker
                  key={i}
                  value={time}
                  onChange={(val) => updateTime(i, val)}
                  onRemove={() => removeTime(i)}
                  showRemove={times.length > 1}
                />
              ))}

              <View className="mt-2 mb-4">
                <Text className="text-muted text-[13px] mb-2 font-semibold">{hn.startDate}</Text>
                <TextInput
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#475569"
                  value={startDate}
                  onChangeText={setStartDate}
                  className="bg-light-background dark:bg-background rounded-xl border border-light-border dark:border-border text-light-foreground dark:text-foreground p-3.5 mb-3 text-[15px]"
                />
                <View className={`flex-row items-center bg-light-background dark:bg-background rounded-xl p-3 mb-3 border ${isEveryday ? "border-primary" : "border-light-border dark:border-border"}`}>
                  <Text className="text-light-foreground dark:text-foreground flex-1 text-sm">{hn.everyday}</Text>
                  <Switch
                    value={isEveryday}
                    onValueChange={setIsEveryday}
                    trackColor={{ false: "#334155", true: "#7C3AED" }}
                    thumbColor={isEveryday ? "#8B5CF6" : "#64748B"}
                  />
                </View>
                {!isEveryday && (
                  <>
                    <Text className="text-muted text-[13px] mb-2 font-semibold">{hn.endDate}</Text>
                    <TextInput
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#475569"
                      value={endDate}
                      onChangeText={setEndDate}
                      className="bg-light-background dark:bg-background rounded-xl border border-light-border dark:border-border text-light-foreground dark:text-foreground p-3.5 text-[15px]"
                    />
                  </>
                )}
              </View>

              <Text className="text-muted text-[13px] mb-2.5 font-semibold">{hn.notifyVia}</Text>

              <NotifyToggle
                icon={Smartphone}
                label="In-App Notification"
                value={notifyApp}
                onValueChange={setNotifyApp}
                color="#38BDF8"
              />
              <NotifyToggle
                icon={MessageSquare}
                label={hn.smsNotification}
                value={notifySms}
                onValueChange={handleSmsToggle}
                verified={phoneVerified}
                verifyLabel={hn.verifyPhone}
                onVerifyPress={() => {
                  setSmsAvailable(null);
                  setShowPhoneVerify(true);
                }}
                color="#22C55E"
                disabled={smsAvailable === false}
                disabledLabel="Unavailable"
              />
              <NotifyToggle
                icon={Mail}
                label={hn.emailNotification}
                value={notifyEmail}
                onValueChange={handleEmailToggle}
                verified={emailVerified}
                verifyLabel={hn.verifyEmail}
                onVerifyPress={() => setShowEmailVerify(true)}
                color="#C084FC"
              />

              <Pressable
                onPress={handleSave}
                disabled={saving}
                className="bg-primary rounded-[14px] p-4 items-center mt-5"
              >
                {saving
                  ? <ActivityIndicator color="white" />
                  : <Text className="text-white font-bold text-[16px]">{hn.saveReminder}</Text>
                }
              </Pressable>

            </ScrollView>
          </View>
        </View>
      </Modal>

      <OtpModal
        visible={showPhoneVerify}
        onClose={() => {
          setShowPhoneVerify(false);
          setOtpSent(false);
          setPhoneOtp("");
          setPhoneInput("");
          setSmsAvailable(null);
        }}
        title={hn.verifyPhone}
        subtitle={hn.phoneRequired}
        showPhoneInput={true}
        phoneValue={phoneInput}
        onPhoneChange={(v) => { setPhoneInput(v); setSmsAvailable(null); }}
        onPhoneBlur={() => checkSmsAvailability(phoneInput)}
        otpValue={phoneOtp}
        onOtpChange={setPhoneOtp}
        otpSentState={otpSent}
        onSendOtp={sendPhoneOtp}
        onVerifyOtp={verifyPhoneOtp}
        loading={verifyLoading}
        sendOtpLabel={hn.sendOtp}
        enterOtpLabel={hn.enterOtp}
        verifyLabel={hn.otpVerified}
        checkingAvailability={checkingPhone}
        smsAvailable={smsAvailable}
      />

      <OtpModal
        visible={showEmailVerify}
        onClose={() => {
          setShowEmailVerify(false);
          setEmailOtpSent(false);
          setEmailOtp("");
        }}
        title={hn.verifyEmail}
        subtitle={hn.emailRequired}
        showPhoneInput={false}
        phoneValue=""
        onPhoneChange={() => {}}
        otpValue={emailOtp}
        onOtpChange={setEmailOtp}
        otpSentState={emailOtpSent}
        onSendOtp={sendEmailOtp}
        onVerifyOtp={verifyEmailOtp}
        loading={verifyLoading}
        sendOtpLabel={hn.sendOtp}
        enterOtpLabel={hn.enterOtp}
        verifyLabel={hn.otpVerified}
      />
    </View>
  );
}