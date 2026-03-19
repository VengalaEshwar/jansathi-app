// app/g-assist/volunteer-network.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, Animated,
  TextInput, ActivityIndicator, Linking, useWindowDimensions, Platform,
} from "react-native";
import {
  Users, Search, X, Phone, MessageCircle, MapPin, Star,
  CheckCircle, ArrowLeft, Heart, Briefcase, GraduationCap,
  Shield, HandHelping, Send, UserPlus, RefreshCw, Clock,
  AlertTriangle, Edit2, Trash2, Lock,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { HeroSection } from "@/components/HeroSection";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useToast } from "@/hooks/useToast";
import { useSound } from "@/hooks/useSound";
import { useConfirm } from "@/hooks/useConfirm";
import { apiRequest } from "@/integrations/api/client";
import { useAppSelector } from "@/store/hooks";
import { useTranslation } from "@/hooks/useTranslation";

// ── Types ──────────────────────────────────────────────────────────────────────
type Tab        = "volunteers" | "requests" | "gethelp" | "volunteer";
type Speciality = "legal" | "health" | "education" | "government" | "general";

interface VolunteerReg {
  _id: string; name: string; organisation: string; speciality: Speciality;
  location: string; rating: number; helpedCount: number;
  languages: string[]; phone: string; available: boolean; bio: string;
}
interface HelpReq {
  _id: string; name: string; location: string; helpType: Speciality;
  urgency: "normal" | "urgent"; description: string;
  status: string; createdAt: string; phone?: string;
}

// ── Config — icons/colors are static, labels come from translations ────────────
const SPEC_ICONS: Record<Speciality, { icon: any; color: string }> = {
  legal:      { icon: Shield,        color: "#3B82F6" },
  health:     { icon: Heart,         color: "#EF4444" },
  education:  { icon: GraduationCap, color: "#8B5CF6" },
  government: { icon: Briefcase,     color: "#F59E0B" },
  general:    { icon: HandHelping,   color: "#10B981" },
};

// Fallback English labels (used in sub-components that don't have t)
const SPEC_LABELS_EN: Record<Speciality, string> = {
  legal: "Legal Aid", health: "Healthcare", education: "Education",
  government: "Govt Schemes", general: "General Help",
};

// Build full SPEC with translated labels
const makeSpec = (vol: any) => {
  const labels = vol ?? SPEC_LABELS_EN;
  return Object.fromEntries(
    (Object.keys(SPEC_ICONS) as Speciality[]).map(k => [k, {
      ...SPEC_ICONS[k],
      label: labels[k === "government" ? "govtSchemes" : k === "general" ? "generalHelp" :
             k === "health" ? "healthcare" : k === "education" ? "education" : "legalAid"] ?? SPEC_LABELS_EN[k],
    }])
  ) as Record<Speciality, { label: string; icon: any; color: string }>;
};

// Module-level ref so sub-components can access current translations
// Updated by the main component on every render
let _t: any = null;
const getT = () => _t;

// Module-level SPEC — updated by main component each render
let SPEC: Record<Speciality, { label: string; icon: any; color: string }> = makeSpec(null);

// ── Helpers ────────────────────────────────────────────────────────────────────
const useFade = (delay = 0) => {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 340, delay, useNativeDriver: true }),
      Animated.spring(ty, { toValue: 0, delay, useNativeDriver: true, speed: 14, bounciness: 5 }),
    ]).start();
  }, []);
  return { opacity: op, transform: [{ translateY: ty }] };
};

const FieldLabel = ({ text, required }: { text: string; required?: boolean }) => (
  <Text style={{ color: "#0F172A", fontWeight: "600", fontSize: 13, marginBottom: 6 }}
    className="dark:text-white">
    {text}{required && <Text style={{ color: "#EF4444" }}> *</Text>}
  </Text>
);

const FieldInput = ({ value, onChange, placeholder, multiline = false, keyboardType = "default" as any }: {
  value: string; onChange: (v: string) => void; placeholder: string;
  multiline?: boolean; keyboardType?: any;
}) => (
  <TextInput value={value} onChangeText={onChange} placeholder={placeholder}
    placeholderTextColor="#94A3B8" multiline={multiline} keyboardType={keyboardType}
    numberOfLines={multiline ? 4 : 1}
    className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-[#0F172A] dark:text-white text-sm"
    style={[{ paddingHorizontal: 14, paddingVertical: 11, marginBottom: 14 },
      multiline ? { height: 96, textAlignVertical: "top" } : {}]} />
);

const SpecialityPicker = ({ value, onChange }: { value: Speciality | ""; onChange: (v: Speciality) => void }) => (
  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
    {(Object.entries(SPEC) as [Speciality, any][]).map(([key, cfg]) => {
      const active = value === key;
      const Icon   = cfg.icon;
      return (
        <Pressable key={key} onPress={() => onChange(key)}
          style={{ flexDirection: "row", alignItems: "center", gap: 5,
            paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
            backgroundColor: active ? cfg.color : "transparent",
            borderColor: active ? cfg.color : "#E2E8F0" }}
          className={active ? "" : "dark:border-[#334155]"}>
          <Icon size={13} color={active ? "white" : "#64748B"} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "white" : "#64748B" }}>{cfg.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

// ── VolunteerCard ──────────────────────────────────────────────────────────────
function VolunteerCard({ v, index }: { v: VolunteerReg; index: number }) {
  const anim     = useFade(index * 55);
  const scale    = useRef(new Animated.Value(1)).current;
  const [open, setOpen] = useState(false);
  const cfg  = SPEC[v.speciality] ?? SPEC.general;
  const Icon = cfg.icon;

  return (
    <Animated.View style={[anim, { marginBottom: 12 }]}>
      <Pressable onPress={() => setOpen(x => !x)}
        onPressIn={() =>  Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{ borderRadius: 18, overflow: "hidden",
          shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 }}>
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: cfg.color + "18",
              borderWidth: 1, borderColor: cfg.color + "30", alignItems: "center", justifyContent: "center" }}>
              <Icon size={21} color={cfg.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <Text className="text-[#0F172A] dark:text-white font-bold text-sm" style={{ flex: 1 }} numberOfLines={1}>{v.name}</Text>
                <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20,
                  backgroundColor: v.available ? "#D1FAE5" : "#F1F5F9" }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: v.available ? "#065F46" : "#64748B" }}>
                    {v.available ? `● ${getT()?.volunteer?.available ?? "Available"}` : (getT()?.volunteer?.busy ?? "Busy")}
                  </Text>
                </View>
              </View>
              {!!v.organisation && <Text style={{ color: cfg.color, fontSize: 12, fontWeight: "600", marginBottom: 4 }}>{v.organisation}</Text>}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {!!v.location && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <MapPin size={10} color="#94A3B8" /><Text style={{ color: "#94A3B8", fontSize: 11 }}>{v.location}</Text>
                  </View>
                )}
                {v.helpedCount > 0 && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Star size={10} color="#F59E0B" fill="#F59E0B" />
                    <Text style={{ color: "#94A3B8", fontSize: 11 }}>{v.helpedCount} helped</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {open && (
            <View style={{ marginTop: 12 }}>
              {!!v.bio && <Text style={{ color: "#64748B", fontSize: 13, lineHeight: 19, marginBottom: 10 }}>{v.bio}</Text>}
              {v.languages?.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {v.languages.map(l => (
                    <View key={l} className="bg-[#F1F5F9] dark:bg-[#334155]"
                      style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
                      <Text style={{ color: "#64748B", fontSize: 11 }}>{l}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <AnimatedPressable onPress={() => Linking.openURL(`tel:${v.phone.replace(/\s/g, "")}`)} soundType="mechanical"
                  style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                    paddingVertical: 11, borderRadius: 12, backgroundColor: "#10B981" }}>
                  <Phone size={14} color="white" />
                  <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>{getT()?.clinics?.call ?? "Call"}</Text>
                </AnimatedPressable>
                <AnimatedPressable onPress={() => Linking.openURL(`https://wa.me/${v.phone.replace(/[^0-9]/g, "")}`)} soundType="mechanical"
                  style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                    paddingVertical: 11, borderRadius: 12, backgroundColor: "#25D366" }}>
                  <MessageCircle size={14} color="white" />
                  <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>WhatsApp</Text>
                </AnimatedPressable>
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── HelpRequestCard ────────────────────────────────────────────────────────────
function HelpRequestCard({ req, isVolunteer, isOwn = false, onDelete }: {
  req: HelpReq; isVolunteer: boolean; isOwn?: boolean; onDelete?: () => void;
}) {
  const cfg      = SPEC[req.helpType] ?? SPEC.general;
  const Icon     = cfg.icon;
  const isUrgent = req.urgency === "urgent";

  return (
    <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
      style={{ borderRadius: 16, padding: 14, marginBottom: 12,
        borderLeftWidth: 4, borderLeftColor: isUrgent ? "#EF4444" : cfg.color,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>

      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: cfg.color + "18",
            alignItems: "center", justifyContent: "center" }}>
            <Icon size={16} color={cfg.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text className="text-[#0F172A] dark:text-white font-bold text-sm">{req.name}</Text>
            {!!req.location && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 }}>
                <MapPin size={10} color="#94A3B8" />
                <Text style={{ color: "#94A3B8", fontSize: 11 }}>{req.location}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {isUrgent && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3,
              paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99, backgroundColor: "#FEF2F2" }}>
              <AlertTriangle size={10} color="#EF4444" />
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#EF4444" }}>URGENT</Text>
            </View>
          )}
          <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99, backgroundColor: cfg.color + "18" }}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: cfg.color }}>{cfg.label}</Text>
          </View>
          {isOwn && onDelete && (
            <AnimatedPressable onPress={onDelete} soundType="soft"
              style={{ width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center",
                backgroundColor: "#FEF2F2" }}>
              <Trash2 size={14} color="#EF4444" />
            </AnimatedPressable>
          )}
        </View>
      </View>

      <Text className="text-[#374151] dark:text-[#CBD5E1] text-sm" style={{ lineHeight: 19, marginBottom: 10 }}
        numberOfLines={3}>{req.description}</Text>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Clock size={11} color="#94A3B8" />
          <Text style={{ color: "#94A3B8", fontSize: 11 }}>
            {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </Text>
        </View>

        {/* Phone — only shown to volunteers */}
        {isVolunteer && req.phone ? (
          <AnimatedPressable onPress={() => Linking.openURL(`tel:${req.phone!.replace(/\s/g, "")}`)} soundType="mechanical"
            style={{ flexDirection: "row", alignItems: "center", gap: 5,
              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: "#10B98118" }}>
            <Phone size={12} color="#10B981" />
            <Text style={{ color: "#10B981", fontSize: 12, fontWeight: "700" }}>{req.phone}</Text>
          </AnimatedPressable>
        ) : !isVolunteer ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Lock size={11} color="#94A3B8" />
            <Text style={{ color: "#94A3B8", fontSize: 11 }}>{getT()?.volunteer?.tabRegister ?? "Register as volunteer"} to contact</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ── VolunteerForm — register or edit ──────────────────────────────────────────
function VolunteerForm({ existing, onDone }: { existing: VolunteerReg | null; onDone: (reg: VolunteerReg | null) => void }) {
  const toast          = useToast();
  const { confirm }    = useConfirm();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name:         existing?.name         ?? "",
    organisation: existing?.organisation ?? "",
    phone:        existing?.phone        ?? "",
    location:     existing?.location     ?? "",
    speciality:   (existing?.speciality  ?? "") as Speciality | "",
    languages:    existing?.languages?.join(", ") ?? "",
    bio:          existing?.bio          ?? "",
  });
  const set = useCallback((k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v })), []);
  const isEdit = !!existing;

  const submit = useCallback(async () => {
    if (!form.name || !form.phone || !form.speciality || !form.bio) {
      toast.error(vt.saveFailed ?? "Please fill required fields."); return;
    }
    setLoading(true);
    try {
      let data;
      if (isEdit) {
        data = await apiRequest(`/volunteer/edit/${existing._id}`, "PATCH", form);
      } else {
        data = await apiRequest("/volunteer/register", "POST", form);
      }
      toast.success(isEdit ? (getT()?.common?.save ?? "Saved!") : (vt.applicationReceived ?? "You're now a volunteer!"));
      onDone(data.registration);
    } catch (err: any) {
      toast.error(err.message || (vt.saveFailed ?? "Failed. Please try again."));
    } finally { setLoading(false); }
  }, [form, isEdit, existing, onDone, toast]);

  const vt = getT()?.volunteer ?? {} as any;

  const handleDelete = useCallback(() => {
    confirm({
      title: vt.becomeVolunteer ?? "Remove Registration",
      message: vt.verificationNote ?? "Are you sure you want to remove your volunteer registration?",
      confirmText: getT()?.common?.delete ?? "Remove",
      variant: "danger",
      onConfirm: async () => {
        try {
          await apiRequest(`/volunteer/delete/${existing!._id}`, "DELETE");
          toast.success(getT()?.common?.success ?? "Registration removed.");
          onDone(null);
        } catch (err: any) {
          toast.error(err.message || (getT()?.volunteer?.saveFailed ?? "Failed to remove."));
        }
      },
    });
  }, [existing, confirm, toast, onDone]);

  return (
    <View>
      {/* Banner */}
      <View style={{ borderRadius: 18, padding: 16, marginBottom: 12, backgroundColor: "#8B5CF6",
        shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <UserPlus size={17} color="white" />
          <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>
            {isEdit ? `✏️ ${vt.organisation ?? "Edit Profile"}` : (vt.becomeVolunteer ?? "Become a Volunteer")}
          </Text>
        </View>
        <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 13, lineHeight: 19 }}>
          {isEdit
            ? (vt.becomeVolunteerDesc ?? "Update your details below.")
            : (vt.becomeVolunteerDesc ?? "Fill in your details and you'll be listed instantly.")}
        </Text>
      </View>

      <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{ borderRadius: 18, padding: 16,
          shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>

        <FieldLabel text={vt.yourName ?? "Full Name"} required />
        <FieldInput value={form.name} onChange={v => set("name", v)} placeholder={vt.yourName ?? "Your full name"} />
        <FieldLabel text={vt.organisation ?? "Organisation (optional)"} />
        <FieldInput value={form.organisation} onChange={v => set("organisation", v)} placeholder={vt.organisation ?? "NGO or 'Individual'"} />
        <FieldLabel text={vt.phoneNumber ?? "Phone Number"} required />
        <FieldInput value={form.phone} onChange={v => set("phone", v)} placeholder="+91 XXXXX XXXXX" keyboardType="phone-pad" />
        <FieldLabel text={vt.yourLocation ?? "Location"} />
        <FieldInput value={form.location} onChange={v => set("location", v)} placeholder={vt.locationPlaceholder ?? "City, District, State"} />

        <FieldLabel text={vt.expertise ?? "Area of Expertise"} required />
        <SpecialityPicker value={form.speciality} onChange={v => set("speciality", v)} />

        <FieldLabel text={vt.languages ?? "Languages (comma separated)"} />
        <FieldInput value={form.languages} onChange={v => set("languages", v)} placeholder={vt.languagesPlaceholder ?? "Hindi, English, Telugu..."} />
        <FieldLabel text={vt.aboutYou ?? "About Yourself"} required />
        <FieldInput value={form.bio} onChange={v => set("bio", v)} placeholder={vt.aboutYouPlaceholder ?? "Your background and how you can help..."} multiline />

        <AnimatedPressable onPress={submit} disabled={loading} soundType="mechanical"
          style={{ paddingVertical: 14, borderRadius: 14, flexDirection: "row" as const,
            alignItems: "center" as const, justifyContent: "center" as const, gap: 8,
            backgroundColor: "#8B5CF6",
            shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6 }}>
          {loading ? <ActivityIndicator color="white" size="small" /> : <>
            {isEdit ? <Edit2 size={16} color="white" /> : <UserPlus size={16} color="white" />}
            <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
              {isEdit ? (getT()?.common?.save ?? "Save Changes") : (vt.submitApplication ?? "Register as Volunteer")}
            </Text>
          </>}
        </AnimatedPressable>

        {isEdit && (
          <AnimatedPressable onPress={handleDelete} soundType="soft"
            style={{ marginTop: 10, paddingVertical: 13, borderRadius: 14, flexDirection: "row" as const,
              alignItems: "center" as const, justifyContent: "center" as const, gap: 8,
              borderWidth: 1, borderColor: "#EF4444" }}>
            <Trash2 size={15} color="#EF4444" />
            <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 14 }}>Remove Registration</Text>
          </AnimatedPressable>
        )}
      </View>
    </View>
  );
}

// ── GetHelpForm ────────────────────────────────────────────────────────────────
function GetHelpForm({ onSubmitted }: { onSubmitted: () => void }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", location: "", helpType: "" as Speciality | "",
    description: "", urgency: "normal" as "normal" | "urgent",
  });
  const set = useCallback((k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v })), []);

  const gt = getT()?.volunteer ?? {} as any;
  const ct = getT()?.common    ?? {} as any;

  const submit = useCallback(async () => {
    if (!form.name || !form.phone || !form.helpType || !form.description) {
      toast.error(gt.saveFailed ?? "Please fill in all required fields."); return;
    }
    setLoading(true);
    try {
      await apiRequest("/volunteer/request", "POST", form);
      setDone(true);
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message || (gt.saveFailed ?? "Failed to submit. Please try again."));
    } finally { setLoading(false); }
  }, [form, toast, onSubmitted]);

  if (done) return (
    <View style={{ borderRadius: 20, padding: 24, alignItems: "center", backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0" }}>
      <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <CheckCircle size={32} color="white" />
      </View>
      <Text style={{ color: "#065F46", fontWeight: "800", fontSize: 17, marginBottom: 6 }}>{gt.requestSubmitted ?? "Request Submitted!"}</Text>
      <Text style={{ color: "#374151", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 16 }}>
        {gt.requestSubmittedDesc ?? "A volunteer will contact you within 24–48 hours."}
      </Text>
      <AnimatedPressable onPress={() => setDone(false)} soundType="soft"
        style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: "#8B5CF6" }}>
        <Text style={{ color: "white", fontWeight: "700" }}>{gt.submitAnother ?? "Submit Another"}</Text>
      </AnimatedPressable>
    </View>
  );

  return (
    <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
      style={{ borderRadius: 18, padding: 16,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <HandHelping size={16} color="#8B5CF6" />
        <Text className="text-[#0F172A] dark:text-white font-bold" style={{ fontSize: 15 }}>{gt.requestTitle ?? "Request Help"}</Text>
      </View>
      <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs" style={{ marginBottom: 16 }}>
        {gt.requestDesc ?? "Fill in your details and a volunteer will reach out to you."}
      </Text>

      <FieldLabel text={gt.yourName ?? "Your Name"} required />
      <FieldInput value={form.name} onChange={v => set("name", v)} placeholder={gt.yourName ?? "Enter your full name"} />
      <FieldLabel text={gt.phoneNumber ?? "Phone Number"} required />
      <FieldInput value={form.phone} onChange={v => set("phone", v)} placeholder="+91 XXXXX XXXXX" keyboardType="phone-pad" />
      <FieldLabel text={gt.yourLocation ?? "Location"} />
      <FieldInput value={form.location} onChange={v => set("location", v)} placeholder={gt.locationPlaceholder ?? "Village, District, State"} />

      <FieldLabel text={gt.helpType ?? "Type of Help"} required />
      <SpecialityPicker value={form.helpType} onChange={v => set("helpType", v)} />

      <FieldLabel text={gt.urgency ?? "Urgency"} />
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
        {([
          { v: "normal", label: gt.normal ?? "Normal", color: "#10B981" },
          { v: "urgent", label: gt.urgent ?? "Urgent", color: "#EF4444" },
        ] as const).map(({ v, label, color }) => (
          <Pressable key={v} onPress={() => set("urgency", v)}
            style={{ flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: "center", borderWidth: 1,
              backgroundColor: form.urgency === v ? color : "transparent",
              borderColor: form.urgency === v ? color : "#E2E8F0" }}
            className={form.urgency === v ? "" : "dark:border-[#334155]"}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: form.urgency === v ? "white" : "#64748B" }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <FieldLabel text={gt.situation ?? "Describe Your Situation"} required />
      <FieldInput value={form.description} onChange={v => set("description", v)} placeholder={gt.situationPlaceholder ?? "What help do you need?"} multiline />

      <AnimatedPressable onPress={submit} disabled={loading} soundType="mechanical"
        style={{ paddingVertical: 14, borderRadius: 14, flexDirection: "row" as const,
          alignItems: "center" as const, justifyContent: "center" as const, gap: 8,
          backgroundColor: "#8B5CF6",
          shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6 }}>
        {loading ? <ActivityIndicator color="white" size="small" /> : <>
          <Send size={16} color="white" />
          <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>{gt.submitRequest ?? "Submit Request"}</Text>
        </>}
      </AnimatedPressable>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function VolunteerNetwork() {
  const router        = useRouter();
  const { playClick } = useSound();
  const { confirm }   = useConfirm();
  const toast         = useToast();
  const { t }         = useTranslation();
  const { width }     = useWindowDimensions();
  const isWide        = width >= 700;
  const isLarge       = width >= 1100;
  const isDark        = useAppSelector((s: any) => s.app?.theme === "dark");

  // Update SPEC labels with current language
  SPEC = makeSpec(t.volunteer);
  _t   = t; // expose t to sub-components via getT()

  const containerWidth = isLarge ? 1100 : isWide ? 860 : undefined;
  const sidePad = containerWidth ? Math.max(24, (width - containerWidth) / 2) : 20;

  const [tab,          setTab]          = useState<Tab>("volunteers");
  const [search,       setSearch]       = useState("");
  const [filter,       setFilter]       = useState<Speciality | "all">("all");
  const [volunteers,   setVolunteers]   = useState<VolunteerReg[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpReq[]>([]);
  const [myRequests,   setMyRequests]   = useState<HelpReq[]>([]);
  const [myReg,        setMyReg]        = useState<VolunteerReg | null>(null);
  const [isVolunteer,  setIsVolunteer]  = useState(false);
  const [loadingVol,   setLoadingVol]   = useState(true);
  const [loadingReq,   setLoadingReq]   = useState(false);
  const [loadingMyReq, setLoadingMyReq] = useState(false);
  const bodyAnim = useFade(120);

  // ── Load volunteers ────────────────────────────────────────────────────────
  const loadVolunteers = useCallback(async () => {
    setLoadingVol(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("speciality", filter);
      if (search)           params.append("search", search);
      const data = await apiRequest(`/volunteer?${params}`);
      setVolunteers(data.volunteers ?? []);
    } catch {} finally { setLoadingVol(false); }
  }, [filter, search]);

  // ── Load open help requests (auth — phone gated by server) ─────────────────
  const loadHelpRequests = useCallback(async () => {
    setLoadingReq(true);
    try {
      const data = await apiRequest("/volunteer/open-requests");
      setHelpRequests(data.requests ?? []);
      // Server tells us if we're a volunteer — also fallback to myReg state
      setIsVolunteer(data.isVolunteer ?? false);
    } catch {} finally { setLoadingReq(false); }
  }, []);

  // ── Load my own requests ───────────────────────────────────────────────────
  const loadMyRequests = useCallback(async () => {
    setLoadingMyReq(true);
    try {
      const data = await apiRequest("/volunteer/my-requests");
      setMyRequests(data.requests ?? []);
    } catch {} finally { setLoadingMyReq(false); }
  }, []);

  // ── Load my registration ───────────────────────────────────────────────────
  const loadMyReg = useCallback(async () => {
    try {
      const data = await apiRequest("/volunteer/my-registration");
      setMyReg(data.registration);
    } catch {}
  }, []);

  useEffect(() => { loadVolunteers(); loadMyReg(); }, []);
  useEffect(() => { const t = setTimeout(loadVolunteers, 350); return () => clearTimeout(t); }, [search, filter]);
  useEffect(() => {
    if (tab === "requests") loadHelpRequests();
    if (tab === "gethelp")  loadMyRequests();
  }, [tab]);

  // ── Derive isVolunteer from myReg — more reliable than server response alone ──
  // If myReg exists and is active, the user IS a volunteer regardless of server flag
  const effectiveIsVolunteer = isVolunteer || (!!myReg && myReg.isActive !== false);

  // ── Delete my help request ─────────────────────────────────────────────────
  const handleDeleteRequest = useCallback((id: string) => {
    confirm({
      title: getT()?.common?.delete ?? "Delete Request",
      message: getT()?.volunteer?.situationPlaceholder ?? "Are you sure you want to delete this help request?",
      confirmText: getT()?.common?.delete ?? "Delete",
      variant: "danger",
      onConfirm: async () => {
        try {
          await apiRequest(`/volunteer/request/${id}`, "DELETE");
          setMyRequests(p => p.filter(r => r._id !== id));
          toast.success(getT()?.common?.success ?? "Request deleted.");
        } catch (err: any) { toast.error(err.message); }
      },
    });
  }, [confirm, toast]);

  const allVol = volunteers;
  const pairs: VolunteerReg[][] = [];
  for (let i = 0; i < allVol.length; i += 2) pairs.push(allVol.slice(i, i + 2));

  const TABS: { key: Tab; icon: any; label: string }[] = [
    { key: "volunteers", icon: Users,       label: t.volunteer.tabFind },
    { key: "requests",   icon: HandHelping, label: t.volunteer.tabGet ?? "Help Requests" },
    { key: "gethelp",    icon: Send,        label: t.volunteer.tabGet },
    { key: "volunteer",  icon: UserPlus,    label: myReg ? `${t.volunteer.tabRegister} ✓` : t.volunteer.tabRegister },
  ];

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* FULL WIDTH: header */}
        <View style={{ paddingHorizontal: sidePad, paddingTop: 20 }}>
          {Platform.OS === "web" && <View style={{ height: 8 }} />}
          <AnimatedPressable onPress={() => router.back()} soundType="soft"
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}>
            <ArrowLeft size={18} color="#8B5CF6" />
            <Text className="text-[#8B5CF6] font-semibold text-sm">{getT()?.common?.back ?? "Back"}</Text>
          </AnimatedPressable>
          <HeroSection icon={Users} title={t.volunteer.title}
            subtitle={t.volunteer.subtitle}
            gradientColors={["#10B981", "#8B5CF6"]} delay={0} />
          {Platform.OS === "web" && <View style={{ height: 8 }} />}
        </View>

        {/* CENTERED */}
        <View style={{
          paddingHorizontal: sidePad,
          ...(containerWidth ? { maxWidth: containerWidth + sidePad * 2, alignSelf: "center" as const, width: "100%" } : {}),
        }}>
          {/* Tabs — 4 tabs, 2-per-row on narrow */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {TABS.map(m => {
              const active = tab === m.key;
              const Icon   = m.icon;
              return (
                <AnimatedPressable key={m.key} soundType="soft"
                  onPress={() => { playClick("soft"); setTab(m.key); }}
                  style={{ flex: 1, minWidth: isWide ? 0 : "45%", paddingVertical: 12, borderRadius: 14,
                    flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6,
                    backgroundColor: active ? "#8B5CF6" : isDark ? "#1E293B" : "white",
                    borderWidth: 1,
                    borderColor: active ? "#8B5CF6" : isDark ? "#334155" : "#E2E8F0",
                    ...(active ? { shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 } : {}) }}>
                  <Icon size={14} color={active ? "white" : "#64748B"} />
                  <Text style={{ fontSize: 12, fontWeight: active ? "700" : "500", color: active ? "white" : "#64748B" }}>
                    {m.label}
                    {m.key === "volunteer" && myReg ? " ✓" : ""}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          {/* ══ VOLUNTEERS TAB ══ */}
          {tab === "volunteers" && (
            <Animated.View style={bodyAnim}>
              {/* Search */}
              <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
                style={{ flexDirection: "row", alignItems: "center", borderRadius: 14, paddingHorizontal: 12, marginBottom: 12 }}>
                <Search size={15} color="#94A3B8" />
                <TextInput value={search} onChangeText={setSearch} placeholder={t.volunteer.searchPlaceholder}
                  placeholderTextColor="#94A3B8" className="flex-1 text-[#0F172A] dark:text-white text-sm"
                  style={{ paddingVertical: 11, paddingHorizontal: 8 }} />
                {search ? <Pressable onPress={() => setSearch("")} hitSlop={8}><X size={13} color="#94A3B8" /></Pressable> : null}
              </View>

              {/* Filter pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(["all", ...Object.keys(SPEC)] as (Speciality | "all")[]).map(key => {
                    const active = filter === key;
                    const cfg    = key === "all" ? null : SPEC[key as Speciality];
                    const Icon   = cfg?.icon;
                    return (
                      <AnimatedPressable key={key} onPress={() => setFilter(key)} soundType="soft"
                        style={{ flexDirection: "row", alignItems: "center", gap: 5,
                          paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1,
                          backgroundColor: active ? (cfg?.color ?? "#8B5CF6") : "transparent",
                          borderColor: active ? (cfg?.color ?? "#8B5CF6") : "#E2E8F0" }}
                        className={active ? "" : "dark:border-[#334155]"}>
                        {Icon && <Icon size={11} color={active ? "white" : "#64748B"} />}
                        <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "white" : "#64748B" }}>
                          {key === "all" ? (getT()?.common?.search ?? "All") : cfg!.label}
                        </Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Stats */}
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                {[
                  { label: getT()?.volunteer?.tabFind ?? "Volunteers",  count: volunteers.length,  color: "#8B5CF6" },
                  { label: getT()?.volunteer?.available ?? "Available", count: volunteers.filter(v => v.available).length, color: "#10B981" },
                  { label: "Helped",      count: volunteers.reduce((a,v) => a + (v.helpedCount||0), 0), color: "#3B82F6" },
                ].map((s, i) => (
                  <View key={i} className="flex-1 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
                    style={{ borderRadius: 14, padding: 12, alignItems: "center" }}>
                    <Text style={{ color: s.color, fontSize: 18, fontWeight: "800" }}>{s.count}</Text>
                    <Text className="text-[#64748B] dark:text-[#94A3B8]" style={{ fontSize: 11, marginTop: 2 }}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {loadingVol ? (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color="#8B5CF6" />
                  <Text className="text-[#94A3B8] text-sm" style={{ marginTop: 10 }}>{getT()?.common?.loading ?? "Loading volunteers..."}</Text>
                </View>
              ) : volunteers.length === 0 ? (
                <View className="rounded-2xl p-8 items-center bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
                  <Users size={32} color="#8B5CF6" style={{ marginBottom: 12 }} />
                  <Text className="text-[#0F172A] dark:text-white font-bold text-base mb-2">{getT()?.gAssist?.volunteer ?? "No Volunteers Yet"}</Text>
                  <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm text-center">
                    {getT()?.volunteer?.becomeVolunteerDesc ?? "Be the first to register as a volunteer!"}
                  </Text>
                </View>
              ) : isWide ? (
                pairs.map((pair, ri) => (
                  <View key={ri} style={{ flexDirection: "row", gap: 12 }}>
                    {pair.map((v, vi) => <View key={v._id} style={{ flex: 1 }}><VolunteerCard v={v} index={ri*2+vi} /></View>)}
                    {pair.length === 1 && <View style={{ flex: 1 }} />}
                  </View>
                ))
              ) : (
                volunteers.map((v, i) => <VolunteerCard key={v._id} v={v} index={i} />)
              )}
            </Animated.View>
          )}

          {/* ══ HELP REQUESTS TAB — visible only to volunteers ══ */}
          {tab === "requests" && (
            <Animated.View style={bodyAnim}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <View>
                  <Text className="text-[#0F172A] dark:text-white font-bold" style={{ fontSize: 16 }}>{getT()?.volunteer?.tabGet ?? "Open Help Requests"}</Text>
                  <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs" style={{ marginTop: 2 }}>
                    {effectiveIsVolunteer
                      ? (getT()?.volunteer?.tapToExpand ?? "You can see contact details as a volunteer")
                      : (getT()?.volunteer?.tapToExpand ?? "Register as a volunteer to see contact details")}
                  </Text>
                </View>
                <AnimatedPressable onPress={loadHelpRequests} soundType="soft"
                  style={{ flexDirection: "row", alignItems: "center", gap: 4,
                    padding: 8, borderRadius: 10, backgroundColor: "#8B5CF610" }}>
                  <RefreshCw size={13} color="#8B5CF6" />
                  <Text style={{ color: "#8B5CF6", fontSize: 11, fontWeight: "600" }}>{getT()?.common?.refresh ?? "Refresh"}</Text>
                </AnimatedPressable>
              </View>

              {/* Volunteer gating hint banner */}
              {!effectiveIsVolunteer && (
                <View style={{ borderRadius: 14, padding: 12, marginBottom: 16,
                  backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Lock size={14} color="#10B981" />
                    <Text style={{ color: "#065F46", fontSize: 13, fontWeight: "600", flex: 1 }}>
                      {getT()?.volunteer?.tapToExpand ?? "Register as a volunteer to see contact details and help people"}
                    </Text>
                  </View>
                </View>
              )}

              {loadingReq ? (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color="#8B5CF6" />
                </View>
              ) : helpRequests.length === 0 ? (
                <View className="rounded-2xl p-8 items-center bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
                  <HandHelping size={32} color="#8B5CF6" style={{ marginBottom: 12 }} />
                  <Text className="text-[#0F172A] dark:text-white font-bold text-base mb-2">{getT()?.volunteer?.requestTitle ?? "No Open Requests"}</Text>
                  <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm text-center">{getT()?.volunteer?.loadFailed ?? "No open requests at the moment."}</Text>
                </View>
              ) : (
                helpRequests.map(req => (
                  <HelpRequestCard key={req._id} req={req} isVolunteer={effectiveIsVolunteer} />
                ))
              )}
            </Animated.View>
          )}

          {/* ══ GET HELP TAB — visible to everyone ══ */}
          {tab === "gethelp" && (
            <Animated.View style={bodyAnim}>
              <GetHelpForm onSubmitted={loadMyRequests} />

              {/* My submitted requests */}
              {(loadingMyReq || myRequests.length > 0) && (
                <View style={{ marginTop: 24 }}>
                  <Text className="text-[#0F172A] dark:text-white font-bold" style={{ fontSize: 15, marginBottom: 12 }}>
                    {getT()?.volunteer?.requestTitle ?? "My Requests"}
                  </Text>
                  {loadingMyReq ? (
                    <ActivityIndicator color="#8B5CF6" />
                  ) : (
                    myRequests.map(req => (
                      <HelpRequestCard key={req._id} req={req}
                        isVolunteer={true} // own requests — show phone
                        isOwn
                        onDelete={() => handleDeleteRequest(req._id)} />
                    ))
                  )}
                </View>
              )}
            </Animated.View>
          )}

          {/* ══ VOLUNTEER TAB — register if new, edit/delete if registered ══ */}
          {tab === "volunteer" && (
            <Animated.View style={bodyAnim}>
              <VolunteerForm
                existing={myReg}
                onDone={(reg) => {
                  setMyReg(reg);
                  // If deleted, go back to volunteers tab
                  if (!reg) setTab("volunteers");
                }}
              />
            </Animated.View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}