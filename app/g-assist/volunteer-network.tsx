// app/health/volunteer-network.tsx
import { useEffect, useRef, useState, useCallback, memo } from "react";
import {
  View, Text, ScrollView, Pressable, Animated,
  TextInput, ActivityIndicator, Linking, useWindowDimensions, Platform,
} from "react-native";
import {
  Users, Search, X, Phone, MessageCircle,
  MapPin, Star, CheckCircle, ArrowLeft,
  Heart, Briefcase, GraduationCap, Shield, HandHelping,
  Send, UserPlus,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { HeroSection } from "@/components/HeroSection";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useSound } from "@/hooks/useSound";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab        = "directory" | "request" | "register";
type Speciality = "legal" | "health" | "education" | "government" | "general";

interface Volunteer {
  id: string; name: string; organisation: string; speciality: Speciality;
  location: string; rating: number; helpedCount: number;
  languages: string[]; phone: string; available: boolean; bio: string;
}

const VOLUNTEERS: Volunteer[] = [
  { id: "1", name: "Ravi Kumar Singh",    organisation: "Jan Seva NGO",        speciality: "government", location: "Patna, Bihar",            rating: 4.8, helpedCount: 234, languages: ["Hindi", "Bhojpuri", "English"],           phone: "+91-9876543210", available: true,  bio: "10 years of experience helping families with Aadhaar, ration cards, and pension schemes." },
  { id: "2", name: "Dr. Priya Sharma",    organisation: "Arogya Sewa Trust",   speciality: "health",     location: "Lucknow, UP",             rating: 4.9, helpedCount: 412, languages: ["Hindi", "English", "Urdu"],               phone: "+91-9765432109", available: true,  bio: "MBBS doctor providing free medical guidance and helping patients navigate public healthcare systems." },
  { id: "3", name: "Advocate Meena Devi", organisation: "Legal Aid Society",   speciality: "legal",      location: "Jaipur, Rajasthan",       rating: 4.7, helpedCount: 178, languages: ["Hindi", "Rajasthani", "English"],         phone: "+91-9654321098", available: false, bio: "Specialises in land rights, domestic violence cases, and free legal aid for marginalised communities." },
  { id: "4", name: "Suresh Patel",        organisation: "Shiksha Doot",        speciality: "education",  location: "Bhopal, MP",              rating: 4.6, helpedCount: 89,  languages: ["Hindi", "English"],                       phone: "+91-9543210987", available: true,  bio: "Helping families with school admissions, scholarship applications, and mid-day meal entitlements." },
  { id: "5", name: "Sister Mary Thomas",  organisation: "Caritas India",       speciality: "general",    location: "Bangalore, Karnataka",    rating: 4.9, helpedCount: 567, languages: ["Kannada", "English", "Hindi", "Tamil"],  phone: "+91-9432109876", available: true,  bio: "General welfare assistance — ration cards, disability certificates, widow pensions, and emergency relief." },
  { id: "6", name: "Mohammad Aslam",      organisation: "Khidmat Foundation",  speciality: "government", location: "Hyderabad, Telangana",    rating: 4.5, helpedCount: 156, languages: ["Telugu", "Urdu", "Hindi", "English"],    phone: "+91-9321098765", available: true,  bio: "Expert in TSEPDS ration cards, Rythu Bandhu scheme, and Telangana state government schemes." },
];

const SPECIALITY_CONFIG: Record<Speciality, { label: string; icon: any; color: string }> = {
  legal:      { label: "Legal Aid",    icon: Shield,        color: "#3B82F6" },
  health:     { label: "Healthcare",   icon: Heart,         color: "#EF4444" },
  education:  { label: "Education",    icon: GraduationCap, color: "#8B5CF6" },
  government: { label: "Govt Schemes", icon: Briefcase,     color: "#F59E0B" },
  general:    { label: "General Help", icon: HandHelping,   color: "#10B981" },
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
const S = {
  gap6:  { gap: 6  } as const, gap8:  { gap: 8  } as const,
  gap10: { gap: 10 } as const, gap12: { gap: 12 } as const,
  mb4:  { marginBottom: 4  } as const, mb6:  { marginBottom: 6  } as const,
  mb8:  { marginBottom: 8  } as const, mb10: { marginBottom: 10 } as const,
  mb12: { marginBottom: 12 } as const, mb16: { marginBottom: 16 } as const,
  mb20: { marginBottom: 20 } as const, mb24: { marginBottom: 24 } as const,
};

// ─── useFadeSlideIn ───────────────────────────────────────────────────────────
const useFadeSlideIn = (delay = 0) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 360, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true, speed: 14, bounciness: 5 }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
};

// ─── VolunteerCard ────────────────────────────────────────────────────────────
const VolunteerCard = memo(({ volunteer, index }: { volunteer: Volunteer; index: number }) => {
  const anim     = useFadeSlideIn(index * 60);
  const scale    = useRef(new Animated.Value(1)).current;
  const [expanded, setExpanded] = useState(false);
  const cfg      = SPECIALITY_CONFIG[volunteer.speciality];
  const IconComp = cfg.icon;

  const handleCall      = useCallback(() => Linking.openURL(`tel:${volunteer.phone.replace(/\s/g, "")}`), [volunteer.phone]);
  const handleWhatsapp  = useCallback(() => Linking.openURL(`https://wa.me/${volunteer.phone.replace(/[^0-9]/g, "")}`), [volunteer.phone]);
  const handleToggle    = useCallback(() => setExpanded((v) => !v), []);

  return (
    <Animated.View style={[anim, S.mb12]}>
      <Pressable
        onPressIn={() =>  Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        // @ts-ignore
        onHoverIn={() =>  { if (Platform.OS === "web") Animated.spring(scale, { toValue: 1.015, useNativeDriver: true, speed: 28, bounciness: 8 }).start(); }}
        onHoverOut={() => { if (Platform.OS === "web") Animated.spring(scale, { toValue: 1,     useNativeDriver: true, speed: 22, bounciness: 8 }).start(); }}
        onPress={handleToggle}
        className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{ borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 }}>

        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
            {/* Avatar */}
            <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: cfg.color + "18",
              borderWidth: 1, borderColor: cfg.color + "30", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <IconComp size={22} color={cfg.color} />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <Text className="text-[#0F172A] dark:text-white font-bold text-sm" style={{ flex: 1 }} numberOfLines={1}>
                  {volunteer.name}
                </Text>
                <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20,
                  backgroundColor: volunteer.available ? "#D1FAE5" : "#F1F5F9", flexShrink: 0 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: volunteer.available ? "#065F46" : "#64748B" }}>
                    {volunteer.available ? "● Available" : "Busy"}
                  </Text>
                </View>
              </View>

              <Text style={{ color: cfg.color, fontSize: 12, fontWeight: "600", marginBottom: 4 }}>{volunteer.organisation}</Text>

              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <MapPin size={11} color="#94A3B8" />
                  <Text style={{ color: "#94A3B8", fontSize: 11 }}>{volunteer.location}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Star size={11} color="#F59E0B" fill="#F59E0B" />
                  <Text style={{ color: "#94A3B8", fontSize: 11 }}>{volunteer.rating} · {volunteer.helpedCount} helped</Text>
                </View>
              </View>
            </View>
          </View>

          {expanded && (
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: "#64748B", fontSize: 13, lineHeight: 19, marginBottom: 10 }}>{volunteer.bio}</Text>

              {/* Languages */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {volunteer.languages.map((l) => (
                  <View key={l} className="bg-[#F1F5F9] dark:bg-[#334155]"
                    style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
                    <Text style={{ color: "#64748B", fontSize: 11 }}>{l}</Text>
                  </View>
                ))}
              </View>

              {/* Contact buttons — pure style */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <AnimatedPressable onPress={handleCall} soundType="mechanical"
                  style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                    paddingVertical: 11, borderRadius: 12, backgroundColor: "#10B981",
                    shadowColor: "#10B981", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 }}>
                  <Phone size={14} color="white" />
                  <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>Call</Text>
                </AnimatedPressable>
                <AnimatedPressable onPress={handleWhatsapp} soundType="mechanical"
                  style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                    paddingVertical: 11, borderRadius: 12, backgroundColor: "#25D366",
                    shadowColor: "#25D366", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 }}>
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
});

// ─── Shared form sub-components ───────────────────────────────────────────────
const FieldLabel = memo(({ text, required }: { text: string; required?: boolean }) => (
  <Text className="text-[#0F172A] dark:text-white" style={{ fontWeight: "600", fontSize: 13, marginBottom: 6 }}>
    {text} {required && <Text style={{ color: "#EF4444" }}>*</Text>}
  </Text>
));

const FieldInput = memo(({ value, onChange, placeholder, multiline = false }: {
  value: string; onChange: (v: string) => void; placeholder: string; multiline?: boolean;
}) => (
  <TextInput value={value} onChangeText={onChange} placeholder={placeholder}
    placeholderTextColor="#94A3B8" multiline={multiline} numberOfLines={multiline ? 4 : 1}
    className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-[#0F172A] dark:text-white text-sm"
    style={[{ paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 }, multiline ? { height: 100, textAlignVertical: "top" } : {}]} />
));

// ─── RequestHelpForm ──────────────────────────────────────────────────────────
const RequestHelpForm = memo(() => {
  const { user } = useAuth();
  const toast    = useToast();
  const anim     = useFadeSlideIn(0);
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", location: "", helpType: "" as Speciality | "",
    description: "", urgency: "normal" as "urgent" | "normal",
  });
  const update = useCallback((k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v })), []);

  const submit = useCallback(async () => {
    if (!form.name || !form.phone || !form.description || !form.helpType) { toast.error("Please fill in all required fields."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false); setSubmitted(true);
  }, [form, toast]);

  if (submitted) return (
    <Animated.View style={anim}>
      <View style={{ borderRadius: 20, padding: 24, alignItems: "center", backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0" }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <CheckCircle size={32} color="white" />
        </View>
        <Text style={{ color: "#065F46", fontWeight: "800", fontSize: 17, marginBottom: 6 }}>Request Submitted!</Text>
        <Text style={{ color: "#374151", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 16 }}>
          A volunteer matching your needs will contact you within 24–48 hours on your provided phone number.
        </Text>
        <AnimatedPressable onPress={() => setSubmitted(false)} soundType="mechanical"
          style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: "#8B5CF6",
            shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 }}>
          <Text style={{ color: "white", fontWeight: "700" }}>Submit Another</Text>
        </AnimatedPressable>
      </View>
    </Animated.View>
  );

  return (
    <Animated.View style={anim}>
      <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{ borderRadius: 20, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
        <View style={[{ flexDirection: "row", alignItems: "center" }, S.gap8, S.mb6]}>
          <HandHelping size={16} color="#8B5CF6" />
          <Text className="text-[#0F172A] dark:text-white font-bold" style={{ fontSize: 15 }}>Request Volunteer Help</Text>
        </View>
        <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs" style={S.mb16}>Fill in your details and a verified volunteer will reach out to you.</Text>

        <FieldLabel text="Your Name" required /><FieldInput value={form.name} onChange={(v) => update("name", v)} placeholder="Enter your full name" />
        <FieldLabel text="Phone Number" required /><FieldInput value={form.phone} onChange={(v) => update("phone", v)} placeholder="+91 XXXXX XXXXX" />
        <FieldLabel text="Your Location" /><FieldInput value={form.location} onChange={(v) => update("location", v)} placeholder="Village, District, State" />

        <FieldLabel text="Type of Help Needed" required />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {(Object.entries(SPECIALITY_CONFIG) as [Speciality, any][]).map(([key, cfg]) => {
            const active = form.helpType === key;
            const IconComp = cfg.icon;
            return (
              <Pressable key={key} onPress={() => update("helpType", key)}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
                  backgroundColor: active ? cfg.color : "transparent", borderColor: active ? cfg.color : "#E2E8F0" }}
                className={active ? "" : "dark:border-[#334155]"}>
                <IconComp size={13} color={active ? "white" : "#64748B"} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "white" : "#64748B" }}>{cfg.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <FieldLabel text="Urgency" />
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {[{ v: "normal", label: "Normal", color: "#10B981" }, { v: "urgent", label: "Urgent", color: "#EF4444" }].map(({ v, label, color }) => (
            <Pressable key={v} onPress={() => update("urgency", v as any)}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1,
                backgroundColor: form.urgency === v ? color : "transparent", borderColor: form.urgency === v ? color : "#E2E8F0" }}
              className={form.urgency === v ? "" : "dark:border-[#334155]"}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: form.urgency === v ? "white" : "#64748B" }}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <FieldLabel text="Describe Your Situation" required />
        <FieldInput value={form.description} onChange={(v) => update("description", v)}
          placeholder="Tell us what help you need and any relevant details..." multiline />

        <AnimatedPressable onPress={submit} disabled={loading} soundType="mechanical"
          style={{ paddingVertical: 14, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            backgroundColor: "#8B5CF6", shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6 }}>
          {loading ? <ActivityIndicator color="white" size="small" /> : <>
            <Send size={16} color="white" />
            <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>Submit Request</Text>
          </>}
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
});

// ─── RegisterVolunteer ────────────────────────────────────────────────────────
const RegisterVolunteer = memo(() => {
  const toast = useToast();
  const anim  = useFadeSlideIn(0);
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", organisation: "", phone: "", location: "",
    speciality: "" as Speciality | "", languages: "", bio: "", idProof: "",
  });
  const update = useCallback((k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v })), []);

  const submit = useCallback(async () => {
    if (!form.name || !form.phone || !form.speciality || !form.bio) { toast.error("Please fill in all required fields."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false); setSubmitted(true);
  }, [form, toast]);

  if (submitted) return (
    <Animated.View style={anim}>
      <View style={{ borderRadius: 20, padding: 24, alignItems: "center", backgroundColor: "#8B5CF6",
        shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 6 }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <UserPlus size={32} color="white" />
        </View>
        <Text style={{ color: "white", fontWeight: "800", fontSize: 17, marginBottom: 6 }}>Application Received!</Text>
        <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 16 }}>
          Our team will verify your details and contact you within 3–5 working days. Thank you for volunteering!
        </Text>
        <AnimatedPressable onPress={() => setSubmitted(false)} soundType="soft"
          style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" }}>
          <Text style={{ color: "white", fontWeight: "700" }}>Apply Again</Text>
        </AnimatedPressable>
      </View>
    </Animated.View>
  );

  return (
    <Animated.View style={anim}>
      {/* Banner */}
      <View style={{ borderRadius: 20, padding: 16, marginBottom: 12, backgroundColor: "#8B5CF6", overflow: "hidden",
        shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 6 }}>
        <View style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.08)" }} />
        <View style={[{ flexDirection: "row", alignItems: "center" }, S.gap8, S.mb8]}>
          <UserPlus size={18} color="white" />
          <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>Become a Volunteer</Text>
        </View>
        <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 13, lineHeight: 19 }}>
          Join our verified network of volunteers and help rural communities access government services and healthcare.
        </Text>
      </View>

      <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{ borderRadius: 20, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>

        <FieldLabel text="Full Name" required /><FieldInput value={form.name} onChange={(v) => update("name", v)} placeholder="Your full name" />
        <FieldLabel text="Organisation / NGO (if any)" /><FieldInput value={form.organisation} onChange={(v) => update("organisation", v)} placeholder="Organisation name or 'Individual'" />
        <FieldLabel text="Phone Number" required /><FieldInput value={form.phone} onChange={(v) => update("phone", v)} placeholder="+91 XXXXX XXXXX" />
        <FieldLabel text="Location" /><FieldInput value={form.location} onChange={(v) => update("location", v)} placeholder="City, District, State" />

        <FieldLabel text="Area of Expertise" required />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {(Object.entries(SPECIALITY_CONFIG) as [Speciality, any][]).map(([key, cfg]) => {
            const active = form.speciality === key;
            const IconComp = cfg.icon;
            return (
              <Pressable key={key} onPress={() => update("speciality", key)}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
                  backgroundColor: active ? cfg.color : "transparent", borderColor: active ? cfg.color : "#E2E8F0" }}
                className={active ? "" : "dark:border-[#334155]"}>
                <IconComp size={13} color={active ? "white" : "#64748B"} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "white" : "#64748B" }}>{cfg.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <FieldLabel text="Languages You Speak" /><FieldInput value={form.languages} onChange={(v) => update("languages", v)} placeholder="Hindi, English, Telugu..." />
        <FieldLabel text="Tell us about yourself" required /><FieldInput value={form.bio} onChange={(v) => update("bio", v)} placeholder="Your background, experience, and how you can help..." multiline />
        <FieldLabel text="ID Proof Number (Aadhaar / PAN)" /><FieldInput value={form.idProof} onChange={(v) => update("idProof", v)} placeholder="For verification purposes" />

        <View style={{ borderRadius: 14, padding: 12, marginBottom: 16, backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FED7AA" }}>
          <Text style={{ color: "#78350F", fontSize: 12, lineHeight: 17 }}>
            📋 Your application will be verified by our team within 3–5 working days. ID verification is required for the safety of beneficiaries.
          </Text>
        </View>

        <AnimatedPressable onPress={submit} disabled={loading} soundType="mechanical"
          style={{ paddingVertical: 14, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            backgroundColor: "#8B5CF6", shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6 }}>
          {loading ? <ActivityIndicator color="white" size="small" /> : <>
            <UserPlus size={16} color="white" />
            <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>Submit Application</Text>
          </>}
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function VolunteerNetwork() {
  const router        = useRouter();
  const { playClick } = useSound();
  const { width }     = useWindowDimensions();
  const isWide        = width >= 700;
  const isLarge       = width >= 1100;

  const [tab,    setTab]    = useState<Tab>("directory");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Speciality | "all">("all");

  const headerAnim = useFadeSlideIn(0);
  const tabAnim    = useFadeSlideIn(80);
  const bodyAnim   = useFadeSlideIn(160);

  // ── Correct width formula ──────────────────────────────────────────────────
  const containerWidth = isLarge ? 1100 : isWide ? 860 : undefined;
  const sidePad = containerWidth ? Math.max(24, (width - containerWidth) / 2) : 20;

  const filtered = VOLUNTEERS.filter((v) =>
    (filter === "all" || v.speciality === filter) &&
    (search === "" ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.location.toLowerCase().includes(search.toLowerCase()) ||
      v.organisation.toLowerCase().includes(search.toLowerCase()))
  );
  const pairs: Volunteer[][] = [];
  for (let i = 0; i < filtered.length; i += 2) pairs.push(filtered.slice(i, i + 2));

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── FULL WIDTH: web spacer + back + HeroSection ── */}
        <View style={{ paddingHorizontal: sidePad, paddingTop: 20 }}>
          {Platform.OS === "web" && <View style={{ height: 8 }} />}

          {/* Back */}
          <AnimatedPressable onPress={() => router.back()} soundType="soft"
            style={[{ flexDirection: "row", alignItems: "center" }, S.gap6, S.mb16]}>
            <ArrowLeft size={18} color="#8B5CF6" />
            <Text className="text-[#8B5CF6] font-semibold text-sm">Back</Text>
          </AnimatedPressable>

          {/* HeroSection — full width, NOT inside maxWidth container */}
          <HeroSection
            icon={Users}
            title="Volunteer Network"
            subtitle="Connect with verified NGOs & volunteers near you"
            gradientColors={["#10B981", "#8B5CF6"]}
            delay={0}
          />
          {Platform.OS === "web" && <View style={{ height: 8 }} />}
        </View>

        {/* ── CENTERED CONTENT CONTAINER ── */}
        <View style={{
          paddingHorizontal: sidePad,
          ...(containerWidth ? { maxWidth: containerWidth + sidePad * 2, alignSelf: "center" as const, width: "100%" } : {}),
        }}>

          {/* Tab Toggle */}
          <Animated.View style={tabAnim}>
            <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
              style={{ flexDirection: "row", borderRadius: 16, padding: 4, marginBottom: 20,
                shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
              {([
                { key: "directory" as Tab, icon: Search,      label: "Find Help"  },
                { key: "request"   as Tab, icon: HandHelping, label: "Get Help"   },
                { key: "register"  as Tab, icon: UserPlus,    label: "Volunteer"  },
              ]).map((m) => {
                const isActive = tab === m.key;
                const IconComp = m.icon;
                return (
                  <AnimatedPressable key={m.key} soundType="soft"
                    onPress={() => { playClick("soft"); setTab(m.key); }}
                    style={{ flex: 1, paddingVertical: 13, borderRadius: 12, flexDirection: "row",
                      alignItems: "center", justifyContent: "center", gap: 6,
                      backgroundColor: isActive ? "#8B5CF6" : "transparent",
                      ...(isActive ? { shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 } : {}) }}>
                    <IconComp size={14} color={isActive ? "white" : "#64748B"} />
                    <Text style={{ fontSize: 12, fontWeight: isActive ? "700" : "500", color: isActive ? "white" : "#64748B" }}>{m.label}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </Animated.View>

          {/* ══ DIRECTORY TAB ══ */}
          {tab === "directory" && (
            <Animated.View style={bodyAnim}>
              {Platform.OS === "web" && <View style={{ height: 8 }} />}

              {/* Search */}
              <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
                style={{ flexDirection: "row", alignItems: "center", borderRadius: 14, paddingHorizontal: 12, marginBottom: 12,
                  shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
                <Search size={16} color="#94A3B8" />
                <TextInput value={search} onChangeText={setSearch}
                  placeholder="Search by name, location, NGO..."
                  placeholderTextColor="#94A3B8"
                  className="flex-1 text-[#0F172A] dark:text-white text-sm"
                  style={{ paddingVertical: 12, paddingHorizontal: 8 }} />
                {search ? <Pressable onPress={() => setSearch("")} hitSlop={8}><X size={14} color="#94A3B8" /></Pressable> : null}
              </View>

              {/* Filter chips — pills pattern */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.mb16}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {/* All pill */}
                  <AnimatedPressable onPress={() => setFilter("all")} soundType="soft"
                    style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1,
                      backgroundColor: filter === "all" ? "#8B5CF6" : "transparent",
                      borderColor: filter === "all" ? "#8B5CF6" : "#E2E8F0",
                      ...(filter === "all" ? { shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 } : {}) }}
                    className={filter === "all" ? "" : "dark:border-[#334155]"}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: filter === "all" ? "white" : "#64748B" }}>All</Text>
                  </AnimatedPressable>
                  {(Object.entries(SPECIALITY_CONFIG) as [Speciality, any][]).map(([key, cfg]) => {
                    const active = filter === key;
                    const IconComp = cfg.icon;
                    return (
                      <AnimatedPressable key={key} onPress={() => setFilter(key)} soundType="soft"
                        style={{ flexDirection: "row", alignItems: "center", gap: 6,
                          paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1,
                          backgroundColor: active ? cfg.color : "transparent",
                          borderColor: active ? cfg.color : "#E2E8F0",
                          ...(active ? { shadowColor: cfg.color, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 } : {}) }}
                        className={active ? "" : "dark:border-[#334155]"}>
                        <IconComp size={12} color={active ? "white" : "#64748B"} />
                        <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "white" : "#64748B" }}>{cfg.label}</Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Stats row */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "Volunteers",    count: VOLUNTEERS.length,                                    color: "#8B5CF6" },
                  { label: "Available",     count: VOLUNTEERS.filter((v) => v.available).length,         color: "#10B981" },
                  { label: "People Helped", count: VOLUNTEERS.reduce((a, v) => a + v.helpedCount, 0),   color: "#3B82F6" },
                ].map((s, i) => (
                  <View key={i} style={{ flex: 1 }}
                    className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
                    // @ts-ignore RN style array with className
                  >
                    <View style={{ borderRadius: 16, padding: 12, alignItems: "center" }}>
                      <Text style={{ color: s.color, fontSize: 18, fontWeight: "800" }}>{s.count}</Text>
                      <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs text-center" style={{ marginTop: 2 }}>{s.label}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <Text style={{ color: "#94A3B8", fontSize: 11, marginBottom: 10, textAlign: "center" }}>
                Tap a card to see contact options
              </Text>

              {/* Grid / List */}
              {isWide ? (
                pairs.map((pair, ri) => (
                  <View key={ri} style={{ flexDirection: "row", gap: 14 }}>
                    {pair.map((v, vi) => (
                      <View key={v.id} style={{ flex: 1 }}>
                        <VolunteerCard volunteer={v} index={ri * 2 + vi} />
                      </View>
                    ))}
                    {pair.length === 1 && <View style={{ flex: 1 }} />}
                  </View>
                ))
              ) : (
                filtered.map((v, i) => <VolunteerCard key={v.id} volunteer={v} index={i} />)
              )}

              {filtered.length === 0 && (
                <View style={{ alignItems: "center", paddingVertical: 48 }}>
                  <Text className="text-[#94A3B8] text-sm">No volunteers found for your search.</Text>
                </View>
              )}
            </Animated.View>
          )}

          {tab === "request"  && <RequestHelpForm />}
          {tab === "register" && <RegisterVolunteer />}

        </View>
      </ScrollView>
    </View>
  );
}