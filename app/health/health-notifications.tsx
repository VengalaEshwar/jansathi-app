import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable,
  ActivityIndicator, TextInput, Modal, Switch,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft, Bell, Plus, Trash2, Pencil,
  Check, X, Clock, ChevronDown, ChevronUp,
  MessageSquare, Mail, ShieldCheck, AlertCircle, CheckCircle,
} from "lucide-react-native";
import { apiRequest } from "@/integrations/api/client";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateDbUser } from "@/store/slices/authSlice";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";

interface Reminder {
  _id: string;
  medicineName: string;
  dosage: string;
  times: string[];
  startDate: string;
  endDate: string | null;
  isEveryday: boolean;
  notifySms: boolean;
  notifyEmail: boolean;
  isActive: boolean;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────
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

// ── NotifyToggle — defined OUTSIDE component ──────────────────────
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
  <View style={{
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#0F172A", borderRadius: 12,
    padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: disabled ? "#1E293B" : value ? color : "#1E293B",
    opacity: disabled ? 0.5 : 1,
  }}>
    <View style={{
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: `${color}22`,
      alignItems: "center", justifyContent: "center", marginRight: 12,
    }}>
      <Icon size={18} color={disabled ? "#64748B" : color} />
    </View>
    <Text style={{ color: disabled ? "#64748B" : "#F8FAFC", flex: 1, fontSize: 14, fontWeight: "500" }}>
      {label}
    </Text>

    {disabled ? (
      <View style={{
        backgroundColor: "#1E293B", paddingHorizontal: 10,
        paddingVertical: 6, borderRadius: 8, marginRight: 8,
      }}>
        <Text style={{ color: "#64748B", fontSize: 11, fontWeight: "600" }}>
          {disabledLabel || "Disabled"}
        </Text>
      </View>
    ) : (
      <>
        {verified !== undefined && (
          !verified && onVerifyPress ? (
            <Pressable
              onPress={onVerifyPress}
              style={{
                flexDirection: "row", alignItems: "center", gap: 4,
                backgroundColor: "#1E293B", paddingHorizontal: 10,
                paddingVertical: 6, borderRadius: 8, marginRight: 8,
              }}
            >
              <ShieldCheck size={13} color="#F59E0B" />
              <Text style={{ color: "#F59E0B", fontSize: 12, fontWeight: "600" }}>
                {verifyLabel}
              </Text>
            </Pressable>
          ) : verified ? (
            <View style={{
              flexDirection: "row", alignItems: "center", gap: 4,
              backgroundColor: "#052e16", paddingHorizontal: 10,
              paddingVertical: 6, borderRadius: 8, marginRight: 8,
            }}>
              <Check size={13} color="#22C55E" />
              <Text style={{ color: "#22C55E", fontSize: 12, fontWeight: "600" }}>✓</Text>
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

// ── OtpModal — defined OUTSIDE component ─────────────────────────
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
  // SMS availability props (only for phone modal)
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
    <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
      <View style={{
        backgroundColor: "#1E293B", borderTopLeftRadius: 24,
        borderTopRightRadius: 24, padding: 24,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <ShieldCheck size={22} color="#8B5CF6" />
          <Text style={{ color: "white", fontWeight: "700", fontSize: 18, marginLeft: 10, flex: 1 }}>
            {title}
          </Text>
          <Pressable onPress={onClose}>
            <X size={22} color="#64748B" />
          </Pressable>
        </View>

        <Text style={{ color: "#94A3B8", marginBottom: 16, fontSize: 14 }}>{subtitle}</Text>

        {showPhoneInput && (
          <>
            <TextInput
              placeholder="+91 9876543210"
              placeholderTextColor="#475569"
              value={phoneValue}
              onChangeText={onPhoneChange}
              onBlur={onPhoneBlur}
              keyboardType="phone-pad"
              style={{
                backgroundColor: "#0F172A", borderRadius: 12,
                borderWidth: 1, borderColor: "#334155",
                color: "white", padding: 14, marginBottom: 8, fontSize: 15,
              }}
            />

            {/* SMS Availability indicator */}
            {checkingAvailability && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <ActivityIndicator size="small" color="#94A3B8" />
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>Checking SMS availability...</Text>
              </View>
            )}
            {!checkingAvailability && smsAvailable === false && (
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: "#2d1e00", borderRadius: 8, padding: 10, marginBottom: 12,
              }}>
                <AlertCircle size={14} color="#F59E0B" />
                <Text style={{ color: "#F59E0B", fontSize: 12, flex: 1 }}>
                  SMS is disabled for this number in production. Use email notifications instead.
                </Text>
              </View>
            )}
            {!checkingAvailability && smsAvailable === true && (
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: "#052e16", borderRadius: 8, padding: 10, marginBottom: 12,
              }}>
                <CheckCircle size={14} color="#22C55E" />
                <Text style={{ color: "#22C55E", fontSize: 12 }}>SMS available for this number ✓</Text>
              </View>
            )}
          </>
        )}

        {!otpSentState ? (
          <Pressable
            onPress={onSendOtp}
            disabled={vLoading || (showPhoneInput && smsAvailable === false)}
            style={{
              backgroundColor: (showPhoneInput && smsAvailable === false) ? "#334155" : "#8B5CF6",
              borderRadius: 12, padding: 14, alignItems: "center",
              opacity: (showPhoneInput && smsAvailable === false) ? 0.5 : 1,
            }}
          >
            {vLoading
              ? <ActivityIndicator color="white" />
              : <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>{sendOtpLabel}</Text>
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
              style={{
                backgroundColor: "#0F172A", borderRadius: 12,
                borderWidth: 1, borderColor: "#8B5CF6",
                color: "white", padding: 14, marginBottom: 12,
                fontSize: 22, letterSpacing: 8, textAlign: "center",
              }}
            />
            <Pressable
              onPress={onVerifyOtp}
              disabled={vLoading}
              style={{ backgroundColor: "#22C55E", borderRadius: 12, padding: 14, alignItems: "center" }}
            >
              {vLoading
                ? <ActivityIndicator color="white" />
                : <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>{verifyLabel}</Text>
              }
            </Pressable>
          </View>
        )}
      </View>
    </View>
  </Modal>
);

// ── Main Screen ───────────────────────────────────────────────────
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

  // Form state
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isEveryday, setIsEveryday] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(false);

  // Verification state
  const [showPhoneVerify, setShowPhoneVerify] = useState(false);
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // SMS availability (production guard)
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
    setNotifySms(false); setNotifyEmail(false);
    setEditingId(null);
  };

  const openAddForm = () => { resetForm(); setShowForm(true); };

  // ── SMS Availability Check ─────────────────────────────────────
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
    setMedicineName(r.medicineName); setDosage(r.dosage);
    setTimes(r.times);
    setStartDate(formatDateForDisplay(r.startDate));
    setEndDate(r.endDate ? formatDateForDisplay(r.endDate) : "");
    setIsEveryday(r.isEveryday);
    setNotifySms(r.notifySms); setNotifyEmail(r.notifyEmail);
    setEditingId(r._id); setShowForm(true);
  };

  const addTime = () => setTimes([...times, "08:00"]);
  const removeTime = (i: number) => setTimes(times.filter((_, idx) => idx !== i));
  const updateTime = (i: number, val: string) => {
    const updated = [...times]; updated[i] = val; setTimes(updated);
  };

  // ── SMS toggle handler ─────────────────────────────────────────
  const handleSmsToggle = useCallback((v: boolean) => {
    if (v && !phoneVerified) {
      setSmsAvailable(null); // reset on each open
      setShowPhoneVerify(true);
    } else {
      setNotifySms(v);
    }
  }, [phoneVerified]);

  // ── Email toggle handler ───────────────────────────────────────
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
    if (!notifySms && !notifyEmail) {
      toast.error(hn.notifyAtLeastOne); return;
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
        isEveryday, notifySms, notifyEmail,
      };
      const data = editingId
        ? await apiRequest(`/reminders/${editingId}`, "PATCH", payload)
        : await apiRequest("/reminders", "POST", payload);

      if (data.success) {
        setReminders(data.reminders);
        toast.success(hn.reminderSaved);
        setShowForm(false);
        resetForm();
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
          if (data.success) { setReminders(data.reminders); toast.success(hn.reminderDeleted); }
        } catch { toast.error(t.common.error); }
      },
    });
  };

  // ── Phone OTP ──────────────────────────────────────────────────
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

  // ── Email OTP ──────────────────────────────────────────────────
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
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
        >
          <ArrowLeft size={20} color="#6b7280" />
          <Text style={{ color: "#6b7280", marginLeft: 8 }}>{hn.backToHealth}</Text>
        </Pressable>

        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <View style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center",
            }}>
              <Bell size={22} color="white" />
            </View>
            <Text style={{ color: "white", fontSize: 22, fontWeight: "800" }}>{hn.title}</Text>
          </View>
          <Text style={{ color: "#64748B", fontSize: 14 }}>{hn.subtitle}</Text>
        </View>

        {/* Add Button */}
        <Pressable
          onPress={openAddForm}
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "center",
            gap: 8, backgroundColor: "#8B5CF6", borderRadius: 14,
            padding: 14, marginBottom: 20,
          }}
        >
          <Plus size={18} color="white" />
          <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>{hn.addReminder}</Text>
        </Pressable>

        {/* Reminders List */}
        {loading ? (
          <ActivityIndicator color="#8B5CF6" style={{ marginTop: 20 }} />
        ) : reminders.length === 0 ? (
          <View style={{
            alignItems: "center", paddingVertical: 40,
            backgroundColor: "#1E293B", borderRadius: 16,
            borderWidth: 1, borderColor: "#334155",
          }}>
            <Bell size={40} color="#334155" />
            <Text style={{ color: "#64748B", marginTop: 12, fontWeight: "600", fontSize: 15 }}>
              {hn.noReminders}
            </Text>
            <Text style={{ color: "#475569", marginTop: 6, fontSize: 13, textAlign: "center", paddingHorizontal: 24 }}>
              {hn.noRemindersDesc}
            </Text>
          </View>
        ) : (
          reminders.map((r) => (
            <View key={r._id} style={{
              backgroundColor: "#1E293B", borderRadius: 16,
              borderWidth: 1, borderColor: r.isActive ? "#334155" : "#1E293B",
              marginBottom: 12, overflow: "hidden",
            }}>
              <Pressable
                onPress={() => setExpandedId(expandedId === r._id ? null : r._id)}
                style={{ padding: 16 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{
                    width: 42, height: 42, borderRadius: 10,
                    backgroundColor: r.isActive ? "#4C1D95" : "#1E293B",
                    alignItems: "center", justifyContent: "center", marginRight: 12,
                    borderWidth: 1, borderColor: r.isActive ? "#8B5CF6" : "#334155",
                  }}>
                    <Bell size={18} color={r.isActive ? "#A78BFA" : "#475569"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>
                      {r.medicineName}
                    </Text>
                    <Text style={{ color: "#94A3B8", fontSize: 12, marginTop: 2 }}>
                      {r.dosage} • {r.times.join(", ")}
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: r.isActive ? "#052e16" : "#1E293B",
                    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8,
                  }}>
                    <Text style={{ color: r.isActive ? "#22C55E" : "#64748B", fontSize: 11, fontWeight: "600" }}>
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
                <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: "#334155" }}>
                  <View style={{ marginTop: 12, gap: 6 }}>
                    <Text style={{ color: "#64748B", fontSize: 12 }}>
                      📅 {formatDateForDisplay(r.startDate)}
                      {r.endDate ? ` → ${formatDateForDisplay(r.endDate)}` : ` (${hn.everyday})`}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                      {r.notifySms && (
                        <View style={{ backgroundColor: "#1c2e1c", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                          <Text style={{ color: "#4ADE80", fontSize: 11 }}>💬 {hn.smsNotification}</Text>
                        </View>
                      )}
                      {r.notifyEmail && (
                        <View style={{ backgroundColor: "#2d1c3a", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                          <Text style={{ color: "#C084FC", fontSize: 11 }}>✉️ {hn.emailNotification}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                    <Pressable
                      onPress={() => openEditForm(r)}
                      style={{
                        flex: 1, flexDirection: "row", alignItems: "center",
                        justifyContent: "center", gap: 6,
                        backgroundColor: "#334155", borderRadius: 10, padding: 10,
                      }}
                    >
                      <Pencil size={14} color="#8B5CF6" />
                      <Text style={{ color: "#8B5CF6", fontWeight: "600", fontSize: 13 }}>{hn.editReminder}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(r._id)}
                      style={{
                        flex: 1, flexDirection: "row", alignItems: "center",
                        justifyContent: "center", gap: 6,
                        backgroundColor: "#2d0a0a", borderRadius: 10, padding: 10,
                        borderWidth: 1, borderColor: "#EF444433",
                      }}
                    >
                      <Trash2 size={14} color="#EF4444" />
                      <Text style={{ color: "#EF4444", fontWeight: "600", fontSize: 13 }}>{hn.deleteReminder}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Form Modal */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#1E293B", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%" }}>
            <ScrollView contentContainerStyle={{ padding: 24 }}>

              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
                <Text style={{ color: "white", fontWeight: "800", fontSize: 18, flex: 1 }}>
                  {editingId ? hn.editReminder : hn.addReminder}
                </Text>
                <Pressable onPress={() => { setShowForm(false); resetForm(); }}>
                  <X size={22} color="#64748B" />
                </Pressable>
              </View>

              {/* Medicine Name */}
              <Text style={{ color: "#94A3B8", fontSize: 13, marginBottom: 6, fontWeight: "600" }}>{hn.medicineName}</Text>
              <TextInput
                placeholder={hn.medicineNamePlaceholder}
                placeholderTextColor="#475569"
                value={medicineName}
                onChangeText={setMedicineName}
                style={{
                  backgroundColor: "#0F172A", borderRadius: 12,
                  borderWidth: 1, borderColor: "#334155",
                  color: "white", padding: 13, marginBottom: 16, fontSize: 15,
                }}
              />

              {/* Dosage */}
              <Text style={{ color: "#94A3B8", fontSize: 13, marginBottom: 6, fontWeight: "600" }}>{hn.dosage}</Text>
              <TextInput
                placeholder={hn.dosagePlaceholder}
                placeholderTextColor="#475569"
                value={dosage}
                onChangeText={setDosage}
                style={{
                  backgroundColor: "#0F172A", borderRadius: 12,
                  borderWidth: 1, borderColor: "#334155",
                  color: "white", padding: 13, marginBottom: 16, fontSize: 15,
                }}
              />

              {/* Times */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <Text style={{ color: "#94A3B8", fontSize: 13, fontWeight: "600" }}>{hn.times}</Text>
                <Pressable onPress={addTime} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Plus size={14} color="#8B5CF6" />
                  <Text style={{ color: "#8B5CF6", fontSize: 13, fontWeight: "600" }}>{hn.addTime}</Text>
                </Pressable>
              </View>
              {times.map((time, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Clock size={16} color="#8B5CF6" />
                  <TextInput
                    value={time}
                    onChangeText={(v) => updateTime(i, v)}
                    placeholder="HH:MM"
                    placeholderTextColor="#475569"
                    style={{
                      flex: 1, backgroundColor: "#0F172A", borderRadius: 10,
                      borderWidth: 1, borderColor: "#334155",
                      color: "white", padding: 11, fontSize: 14,
                    }}
                  />
                  {times.length > 1 && (
                    <Pressable onPress={() => removeTime(i)}>
                      <X size={16} color="#EF4444" />
                    </Pressable>
                  )}
                </View>
              ))}

              {/* Dates */}
              <View style={{ marginTop: 8, marginBottom: 16 }}>
                <Text style={{ color: "#94A3B8", fontSize: 13, marginBottom: 8, fontWeight: "600" }}>{hn.startDate}</Text>
                <TextInput
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#475569"
                  value={startDate}
                  onChangeText={setStartDate}
                  style={{
                    backgroundColor: "#0F172A", borderRadius: 12,
                    borderWidth: 1, borderColor: "#334155",
                    color: "white", padding: 13, marginBottom: 12, fontSize: 15,
                  }}
                />
                <View style={{
                  flexDirection: "row", alignItems: "center",
                  backgroundColor: "#0F172A", borderRadius: 12,
                  padding: 12, marginBottom: 12,
                  borderWidth: 1, borderColor: isEveryday ? "#8B5CF6" : "#1E293B",
                }}>
                  <Text style={{ color: "#F8FAFC", flex: 1, fontSize: 14 }}>{hn.everyday}</Text>
                  <Switch
                    value={isEveryday}
                    onValueChange={setIsEveryday}
                    trackColor={{ false: "#334155", true: "#7C3AED" }}
                    thumbColor={isEveryday ? "#8B5CF6" : "#64748B"}
                  />
                </View>
                {!isEveryday && (
                  <>
                    <Text style={{ color: "#94A3B8", fontSize: 13, marginBottom: 8, fontWeight: "600" }}>{hn.endDate}</Text>
                    <TextInput
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#475569"
                      value={endDate}
                      onChangeText={setEndDate}
                      style={{
                        backgroundColor: "#0F172A", borderRadius: 12,
                        borderWidth: 1, borderColor: "#334155",
                        color: "white", padding: 13, fontSize: 15,
                      }}
                    />
                  </>
                )}
              </View>

              {/* Notify Via */}
              <Text style={{ color: "#94A3B8", fontSize: 13, marginBottom: 10, fontWeight: "600" }}>{hn.notifyVia}</Text>

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
                style={{
                  backgroundColor: "#8B5CF6", borderRadius: 14,
                  padding: 16, alignItems: "center", marginTop: 20,
                }}
              >
                {saving
                  ? <ActivityIndicator color="white" />
                  : <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>{hn.saveReminder}</Text>
                }
              </Pressable>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Phone OTP Modal */}
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
        onPhoneChange={(v) => {
          setPhoneInput(v);
          setSmsAvailable(null);
        }}
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

      {/* Email OTP Modal */}
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