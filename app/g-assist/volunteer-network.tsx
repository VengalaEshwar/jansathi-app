import { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, Pressable, Animated,
  TextInput, ActivityIndicator, Linking, useWindowDimensions,
} from "react-native";
import {
  Users, Plus, Search, X, Phone, MessageCircle,
  MapPin, Star, CheckCircle, Clock, ChevronRight,
  Heart, Briefcase, GraduationCap, Shield, HandHelping,
  Send, UserPlus,
} from "lucide-react-native";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab        = "directory" | "request" | "register";
type Speciality = "legal" | "health" | "education" | "government" | "general";

interface Volunteer {
  id: string;
  name: string;
  organisation: string;
  speciality: Speciality;
  location: string;
  rating: number;
  helpedCount: number;
  languages: string[];
  phone: string;
  available: boolean;
  bio: string;
}

// ─── Static data (would come from backend in production) ──────────────────────
const VOLUNTEERS: Volunteer[] = [
  {
    id: "1", name: "Ravi Kumar Singh", organisation: "Jan Seva NGO",
    speciality: "government", location: "Patna, Bihar", rating: 4.8, helpedCount: 234,
    languages: ["Hindi", "Bhojpuri", "English"], phone: "+91-9876543210", available: true,
    bio: "10 years of experience helping families with Aadhaar, ration cards, and pension schemes.",
  },
  {
    id: "2", name: "Dr. Priya Sharma", organisation: "Arogya Sewa Trust",
    speciality: "health", location: "Lucknow, UP", rating: 4.9, helpedCount: 412,
    languages: ["Hindi", "English", "Urdu"], phone: "+91-9765432109", available: true,
    bio: "MBBS doctor providing free medical guidance and helping patients navigate public healthcare systems.",
  },
  {
    id: "3", name: "Advocate Meena Devi", organisation: "Legal Aid Society",
    speciality: "legal", location: "Jaipur, Rajasthan", rating: 4.7, helpedCount: 178,
    languages: ["Hindi", "Rajasthani", "English"], phone: "+91-9654321098", available: false,
    bio: "Specialises in land rights, domestic violence cases, and free legal aid for marginalised communities.",
  },
  {
    id: "4", name: "Suresh Patel", organisation: "Shiksha Doot",
    speciality: "education", location: "Bhopal, MP", rating: 4.6, helpedCount: 89,
    languages: ["Hindi", "English"], phone: "+91-9543210987", available: true,
    bio: "Helping families with school admissions, scholarship applications, and mid-day meal entitlements.",
  },
  {
    id: "5", name: "Sister Mary Thomas", organisation: "Caritas India",
    speciality: "general", location: "Bangalore, Karnataka", rating: 4.9, helpedCount: 567,
    languages: ["Kannada", "English", "Hindi", "Tamil"], phone: "+91-9432109876", available: true,
    bio: "General welfare assistance — ration cards, disability certificates, widow pensions, and emergency relief.",
  },
  {
    id: "6", name: "Mohammad Aslam", organisation: "Khidmat Foundation",
    speciality: "government", location: "Hyderabad, Telangana", rating: 4.5, helpedCount: 156,
    languages: ["Telugu", "Urdu", "Hindi", "English"], phone: "+91-9321098765", available: true,
    bio: "Expert in TSEPDS ration cards, Rythu Bandhu scheme, and Telangana state government schemes.",
  },
];

const SPECIALITY_CONFIG: Record<Speciality, { label: string; icon: any; color: string }> = {
  legal:      { label: "Legal Aid",    icon: Shield,       color: "#3B82F6" },
  health:     { label: "Healthcare",   icon: Heart,        color: "#EF4444" },
  education:  { label: "Education",    icon: GraduationCap, color: "#8B5CF6" },
  government: { label: "Govt Schemes", icon: Briefcase,    color: "#F59E0B" },
  general:    { label: "General Help", icon: HandHelping,  color: "#10B981" },
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
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

const TabButton = ({ label, icon: Icon, active, onPress }: { label: string; icon: any; active: boolean; onPress: () => void }) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <Pressable onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start()}
        className="items-center py-2.5 rounded-xl flex-row justify-center gap-1.5"
        style={{ backgroundColor: active ? "#8B5CF6" : "transparent" }}>
        <Icon size={14} color={active ? "white" : "#64748B"} />
        <Text style={{ fontSize: 12, fontWeight: active ? "700" : "500", color: active ? "white" : "#64748B" }}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

// ─── Volunteer card ───────────────────────────────────────────────────────────
const VolunteerCard = ({ volunteer, index }: { volunteer: Volunteer; index: number }) => {
  const anim  = useFadeSlideIn(index * 60);
  const scale = useRef(new Animated.Value(1)).current;
  const [expanded, setExpanded] = useState(false);
  const cfg = SPECIALITY_CONFIG[volunteer.speciality];
  const IconComp = cfg.icon;

  const call = () => Linking.openURL(`tel:${volunteer.phone.replace(/\s/g, "")}`);
  const whatsapp = () => Linking.openURL(`https://wa.me/${volunteer.phone.replace(/[^0-9]/g, "")}`);

  return (
    <Animated.View style={[anim, { marginBottom: 12 }]}>
      <Pressable
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        onPress={() => setExpanded((v) => !v)}
        className="rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] overflow-hidden"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 }}>

        <View className="p-4">
          <View className="flex-row items-start gap-3">
            {/* Avatar */}
            <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: cfg.color + "18", borderWidth: 1, borderColor: cfg.color + "30", alignItems: "center", justifyContent: "center" }}>
              <IconComp size={22} color={cfg.color} />
            </View>

            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-0.5">
                <Text className="text-[#0F172A] dark:text-white font-bold text-sm flex-1">{volunteer.name}</Text>
                {/* Available badge */}
                <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20,
                  backgroundColor: volunteer.available ? "#D1FAE5" : "#F1F5F9" }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: volunteer.available ? "#065F46" : "#64748B" }}>
                    {volunteer.available ? "● Available" : "Busy"}
                  </Text>
                </View>
              </View>

              <Text style={{ color: cfg.color, fontSize: 12, fontWeight: "600", marginBottom: 3 }}>
                {volunteer.organisation}
              </Text>

              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center gap-1">
                  <MapPin size={11} color="#94A3B8" />
                  <Text style={{ color: "#94A3B8", fontSize: 11 }}>{volunteer.location}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Star size={11} color="#F59E0B" fill="#F59E0B" />
                  <Text style={{ color: "#94A3B8", fontSize: 11 }}>{volunteer.rating} · {volunteer.helpedCount} helped</Text>
                </View>
              </View>
            </View>
          </View>

          {expanded && (
            <View className="mt-3">
              <Text style={{ color: "#64748B", fontSize: 13, lineHeight: 19, marginBottom: 10 }}>{volunteer.bio}</Text>

              {/* Languages */}
              <View className="flex-row flex-wrap gap-1.5 mb-3">
                {volunteer.languages.map((l) => (
                  <View key={l} className="px-2.5 py-1 rounded-full bg-[#F1F5F9] dark:bg-[#334155]">
                    <Text style={{ color: "#64748B", fontSize: 11 }}>{l}</Text>
                  </View>
                ))}
              </View>

              {/* Contact buttons */}
              <View className="flex-row gap-2">
                <Pressable onPress={call}
                  className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl"
                  style={{ backgroundColor: "#10B981" }}>
                  <Phone size={14} color="white" />
                  <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>Call</Text>
                </Pressable>
                <Pressable onPress={whatsapp}
                  className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl"
                  style={{ backgroundColor: "#25D366" }}>
                  <MessageCircle size={14} color="white" />
                  <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>WhatsApp</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ─── Request Help Form ────────────────────────────────────────────────────────
const RequestHelpForm = () => {
  const { user }   = useAuth();
  const toast      = useToast();
  const anim       = useFadeSlideIn(0);
  const [loading,  setLoading]  = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", location: "", helpType: "" as Speciality | "",
    description: "", urgency: "normal" as "urgent" | "normal",
  });

  const update = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.phone || !form.description || !form.helpType) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) return (
    <Animated.View style={anim}>
      <View className="rounded-2xl p-6 items-center bg-[#F0FDF4] border border-[#BBF7D0]">
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <CheckCircle size={32} color="white" />
        </View>
        <Text style={{ color: "#065F46", fontWeight: "800", fontSize: 17, marginBottom: 6 }}>Request Submitted!</Text>
        <Text style={{ color: "#374151", fontSize: 13, textAlign: "center", lineHeight: 20 }}>
          A volunteer matching your needs will contact you within 24–48 hours on your provided phone number.
        </Text>
        <Pressable onPress={() => setSubmitted(false)} className="mt-4 px-6 py-2.5 rounded-xl bg-primary">
          <Text style={{ color: "white", fontWeight: "700" }}>Submit Another</Text>
        </Pressable>
      </View>
    </Animated.View>
  );

  const Label = ({ text, required }: { text: string; required?: boolean }) => (
    <Text style={{ color: "#0F172A", fontWeight: "600", fontSize: 13, marginBottom: 6 }}>
      {text} {required && <Text style={{ color: "#EF4444" }}>*</Text>}
    </Text>
  );

  const Input = ({ value, onChange, placeholder, multiline = false }: { value: string; onChange: (v: string) => void; placeholder: string; multiline?: boolean }) => (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-4 py-3 text-[#0F172A] dark:text-white text-sm mb-4"
      style={multiline ? { height: 100, textAlignVertical: "top" } : {}}
    />
  );

  return (
    <Animated.View style={anim}>
      <View className="rounded-2xl p-4 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>

        <View className="flex-row items-center gap-2 mb-1">
          <HandHelping size={16} color="#8B5CF6" />
          <Text className="text-[#0F172A] dark:text-white font-bold">Request Volunteer Help</Text>
        </View>
        <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs mb-4">
          Fill in your details and a verified volunteer will reach out to you.
        </Text>

        <Label text="Your Name" required />
        <Input value={form.name} onChange={(v) => update("name", v)} placeholder="Enter your full name" />

        <Label text="Phone Number" required />
        <Input value={form.phone} onChange={(v) => update("phone", v)} placeholder="+91 XXXXX XXXXX" />

        <Label text="Your Location" />
        <Input value={form.location} onChange={(v) => update("location", v)} placeholder="Village, District, State" />

        <Label text="Type of Help Needed" required />
        <View className="flex-row flex-wrap gap-2 mb-4">
          {(Object.entries(SPECIALITY_CONFIG) as [Speciality, any][]).map(([key, cfg]) => {
            const active = form.helpType === key;
            const IconComp = cfg.icon;
            return (
              <Pressable key={key} onPress={() => update("helpType", key)}
                className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border"
                style={{ backgroundColor: active ? cfg.color : "transparent", borderColor: active ? cfg.color : "#E2E8F0" }}>
                <IconComp size={13} color={active ? "white" : "#64748B"} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "white" : "#64748B" }}>{cfg.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Label text="Urgency" />
        <View className="flex-row gap-2 mb-4">
          {[{ v: "normal", label: "Normal", color: "#10B981" }, { v: "urgent", label: "Urgent", color: "#EF4444" }].map(({ v, label, color }) => (
            <Pressable key={v} onPress={() => update("urgency", v as any)}
              className="flex-1 py-2.5 rounded-xl items-center border"
              style={{ backgroundColor: form.urgency === v ? color : "transparent", borderColor: form.urgency === v ? color : "#E2E8F0" }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: form.urgency === v ? "white" : "#64748B" }}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <Label text="Describe Your Situation" required />
        <Input value={form.description} onChange={(v) => update("description", v)} placeholder="Tell us what help you need and any relevant details..." multiline />

        <Pressable onPress={submit} disabled={loading}
          className="rounded-xl py-3.5 items-center flex-row justify-center gap-2 bg-primary">
          {loading
            ? <ActivityIndicator color="white" size="small" />
            : <><Send size={16} color="white" /><Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>Submit Request</Text></>
          }
        </Pressable>
      </View>
    </Animated.View>
  );
};

// ─── Register as Volunteer Form ───────────────────────────────────────────────
const RegisterVolunteer = () => {
  const toast      = useToast();
  const anim       = useFadeSlideIn(0);
  const [loading,  setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", organisation: "", phone: "", location: "",
    speciality: "" as Speciality | "", languages: "", bio: "", idProof: "",
  });

  const update = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.phone || !form.speciality || !form.bio) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) return (
    <Animated.View style={anim}>
      <View className="rounded-2xl p-6 items-center" style={{ backgroundColor: "#8B5CF6" }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <UserPlus size={32} color="white" />
        </View>
        <Text style={{ color: "white", fontWeight: "800", fontSize: 17, marginBottom: 6 }}>Application Received!</Text>
        <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, textAlign: "center", lineHeight: 20 }}>
          Our team will verify your details and contact you within 3–5 working days. Thank you for volunteering!
        </Text>
        <Pressable onPress={() => setSubmitted(false)} className="mt-4 px-6 py-2.5 rounded-xl bg-white/20">
          <Text style={{ color: "white", fontWeight: "700" }}>Apply Again</Text>
        </Pressable>
      </View>
    </Animated.View>
  );

  const Label = ({ text, required }: { text: string; required?: boolean }) => (
    <Text style={{ color: "#0F172A", fontWeight: "600", fontSize: 13, marginBottom: 6 }}>
      {text} {required && <Text style={{ color: "#EF4444" }}>*</Text>}
    </Text>
  );

  const Input = ({ value, onChange, placeholder, multiline = false }: { value: string; onChange: (v: string) => void; placeholder: string; multiline?: boolean }) => (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-4 py-3 text-[#0F172A] dark:text-white text-sm mb-4"
      style={multiline ? { height: 100, textAlignVertical: "top" } : {}}
    />
  );

  return (
    <Animated.View style={anim}>
      {/* Banner */}
      <View className="rounded-2xl p-4 mb-4 bg-primary overflow-hidden"
        style={{ shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 6 }}>
        <View style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.08)" }} />
        <View className="flex-row items-center gap-2 mb-2">
          <UserPlus size={18} color="white" />
          <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>Become a Volunteer</Text>
        </View>
        <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 13, lineHeight: 19 }}>
          Join our verified network of volunteers and help rural communities access government services and healthcare.
        </Text>
      </View>

      <View className="rounded-2xl p-4 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>

        <Label text="Full Name" required />
        <Input value={form.name} onChange={(v) => update("name", v)} placeholder="Your full name" />

        <Label text="Organisation / NGO (if any)" />
        <Input value={form.organisation} onChange={(v) => update("organisation", v)} placeholder="Organisation name or 'Individual'" />

        <Label text="Phone Number" required />
        <Input value={form.phone} onChange={(v) => update("phone", v)} placeholder="+91 XXXXX XXXXX" />

        <Label text="Location" />
        <Input value={form.location} onChange={(v) => update("location", v)} placeholder="City, District, State" />

        <Label text="Area of Expertise" required />
        <View className="flex-row flex-wrap gap-2 mb-4">
          {(Object.entries(SPECIALITY_CONFIG) as [Speciality, any][]).map(([key, cfg]) => {
            const active = form.speciality === key;
            const IconComp = cfg.icon;
            return (
              <Pressable key={key} onPress={() => update("speciality", key)}
                className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border"
                style={{ backgroundColor: active ? cfg.color : "transparent", borderColor: active ? cfg.color : "#E2E8F0" }}>
                <IconComp size={13} color={active ? "white" : "#64748B"} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "white" : "#64748B" }}>{cfg.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Label text="Languages You Speak" />
        <Input value={form.languages} onChange={(v) => update("languages", v)} placeholder="Hindi, English, Telugu..." />

        <Label text="Tell us about yourself" required />
        <Input value={form.bio} onChange={(v) => update("bio", v)} placeholder="Your background, experience, and how you can help..." multiline />

        <Label text="ID Proof Number (Aadhaar / PAN)" />
        <Input value={form.idProof} onChange={(v) => update("idProof", v)} placeholder="For verification purposes" />

        <View className="p-3 rounded-xl mb-4 bg-[#FFF7ED] border border-[#FED7AA]">
          <Text style={{ color: "#78350F", fontSize: 12, lineHeight: 17 }}>
            📋 Your application will be verified by our team within 3–5 working days. ID verification is required for the safety of beneficiaries.
          </Text>
        </View>

        <Pressable onPress={submit} disabled={loading}
          className="rounded-xl py-3.5 items-center flex-row justify-center gap-2 bg-primary">
          {loading
            ? <ActivityIndicator color="white" size="small" />
            : <><UserPlus size={16} color="white" /><Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>Submit Application</Text></>
          }
        </Pressable>
      </View>
    </Animated.View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function VolunteerNetwork() {
  const [tab,    setTab]    = useState<Tab>("directory");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Speciality | "all">("all");
  const { width } = useWindowDimensions();
  const isWide = width >= 640;

  const headerAnim = useFadeSlideIn(0);
  const tabAnim    = useFadeSlideIn(80);

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
    <ScrollView
      className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]"
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View style={headerAnim} className="flex-row items-center gap-3 mb-6">
        <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center"
          style={{ shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 }}>
          <Users size={22} color="white" />
        </View>
        <View>
          <Text className="text-2xl font-bold text-[#0F172A] dark:text-white" style={{ letterSpacing: -0.4 }}>
            Volunteer Network
          </Text>
          <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm">
            Connect with verified NGOs & volunteers
          </Text>
        </View>
      </Animated.View>

      {/* Tabs */}
      <Animated.View style={tabAnim}
        className="flex-row bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-1 mb-5"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
        <TabButton label="Find Help"  icon={Search}   active={tab === "directory"} onPress={() => setTab("directory")} />
        <TabButton label="Get Help"   icon={HandHelping} active={tab === "request"} onPress={() => setTab("request")} />
        <TabButton label="Volunteer"  icon={UserPlus} active={tab === "register"} onPress={() => setTab("register")} />
      </Animated.View>

      {/* Directory */}
      {tab === "directory" && (
        <>
          {/* Search */}
          <View className="flex-row items-center gap-2 mb-3 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] px-3 py-2.5">
            <Search size={16} color="#94A3B8" />
            <TextInput
              value={search} onChangeText={setSearch}
              placeholder="Search by name, location, NGO..."
              placeholderTextColor="#94A3B8"
              className="flex-1 text-[#0F172A] dark:text-white text-sm"
            />
            {search ? <Pressable onPress={() => setSearch("")}><X size={14} color="#94A3B8" /></Pressable> : null}
          </View>

          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              <Pressable onPress={() => setFilter("all")}
                className="px-4 py-2 rounded-xl border"
                style={{ backgroundColor: filter === "all" ? "#8B5CF6" : "transparent", borderColor: filter === "all" ? "#8B5CF6" : "#E2E8F0" }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: filter === "all" ? "white" : "#64748B" }}>All</Text>
              </Pressable>
              {(Object.entries(SPECIALITY_CONFIG) as [Speciality, any][]).map(([key, cfg]) => {
                const active = filter === key;
                const IconComp = cfg.icon;
                return (
                  <Pressable key={key} onPress={() => setFilter(key)}
                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border"
                    style={{ backgroundColor: active ? cfg.color : "transparent", borderColor: active ? cfg.color : "#E2E8F0" }}>
                    <IconComp size={12} color={active ? "white" : "#64748B"} />
                    <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "white" : "#64748B" }}>{cfg.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Stats row */}
          <View className="flex-row gap-3 mb-4">
            {[
              { label: "Volunteers", count: VOLUNTEERS.length, color: "#8B5CF6" },
              { label: "Available",  count: VOLUNTEERS.filter((v) => v.available).length, color: "#10B981" },
              { label: "People Helped", count: VOLUNTEERS.reduce((a, v) => a + v.helpedCount, 0), color: "#3B82F6" },
            ].map((s, i) => (
              <View key={i} className="flex-1 rounded-2xl p-3 items-center bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
                <Text style={{ color: s.color, fontSize: 18, fontWeight: "800" }}>{s.count}</Text>
                <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs mt-0.5 text-center">{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Tap to expand hint */}
          <Text style={{ color: "#94A3B8", fontSize: 11, marginBottom: 10, textAlign: "center" }}>
            Tap a card to see contact options
          </Text>

          {/* Grid / List */}
          {isWide ? (
            pairs.map((pair, ri) => (
              <View key={ri} style={{ flexDirection: "row", gap: 14, marginBottom: 0 }}>
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
            <View className="items-center py-12">
              <Text className="text-[#94A3B8] text-sm">No volunteers found for your search.</Text>
            </View>
          )}
        </>
      )}

      {tab === "request"  && <RequestHelpForm />}
      {tab === "register" && <RegisterVolunteer />}
    </ScrollView>
  );
}