import { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, Pressable, Animated,
  TextInput, ActivityIndicator, useWindowDimensions,
} from "react-native";
import {
  AlertTriangle, Zap, History, Search, ChevronDown,
  ChevronUp, X, ShieldAlert, Info, CheckCircle,
} from "lucide-react-native";
import { useAppSelector } from "@/store/hooks";

// ─── Types ────────────────────────────────────────────────────────────────────
type Severity = "high" | "medium" | "low";
type Tab = "static" | "ai" | "history";

interface Warning {
  id: string;
  drugs: string[];
  severity: Severity;
  title: string;
  description: string;
  whatToDo: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────
const STATIC_WARNINGS: Warning[] = [
  {
    id: "1",
    drugs: ["Aspirin", "Ibuprofen"],
    severity: "high",
    title: "Aspirin + Ibuprofen",
    description: "Taking both NSAIDs together significantly increases the risk of internal bleeding and stomach ulcers.",
    whatToDo: "Never take both at the same time. Consult your doctor for safe alternatives.",
  },
  {
    id: "2",
    drugs: ["Paracetamol", "Alcohol"],
    severity: "high",
    title: "Paracetamol + Alcohol",
    description: "Combining paracetamol with alcohol can cause severe liver damage, even at normal doses.",
    whatToDo: "Avoid all alcohol while taking paracetamol. Wait at least 24 hours after your last drink.",
  },
  {
    id: "3",
    drugs: ["Metformin", "Alcohol"],
    severity: "high",
    title: "Metformin + Alcohol",
    description: "Risk of lactic acidosis — a dangerous buildup of lactic acid in the blood.",
    whatToDo: "Diabetic patients should completely avoid alcohol while on Metformin.",
  },
  {
    id: "4",
    drugs: ["Warfarin", "Aspirin"],
    severity: "high",
    title: "Warfarin + Aspirin",
    description: "Both thin the blood — together they dramatically increase bleeding risk, including internal bleeding.",
    whatToDo: "Only combine under strict doctor supervision with regular INR monitoring.",
  },
  {
    id: "5",
    drugs: ["Amoxicillin", "Methotrexate"],
    severity: "medium",
    title: "Amoxicillin + Methotrexate",
    description: "Amoxicillin can reduce kidney clearance of Methotrexate, raising its toxicity levels.",
    whatToDo: "Inform your doctor if you are on Methotrexate before taking any antibiotic.",
  },
  {
    id: "6",
    drugs: ["Atenolol", "Verapamil"],
    severity: "high",
    title: "Atenolol + Verapamil",
    description: "Both slow heart rate — together they can cause dangerous bradycardia or heart block.",
    whatToDo: "This combination requires close cardiac monitoring. Do not take without doctor supervision.",
  },
  {
    id: "7",
    drugs: ["Ciprofloxacin", "Antacids"],
    severity: "medium",
    title: "Ciprofloxacin + Antacids",
    description: "Antacids with calcium, magnesium or aluminium reduce absorption of ciprofloxacin by up to 90%.",
    whatToDo: "Take ciprofloxacin at least 2 hours before or 6 hours after antacids.",
  },
  {
    id: "8",
    drugs: ["Diazepam", "Alcohol"],
    severity: "high",
    title: "Diazepam + Alcohol",
    description: "Both are CNS depressants. Combined, they can cause severe sedation, respiratory depression, or coma.",
    whatToDo: "Strictly avoid alcohol while taking any benzodiazepine like Diazepam.",
  },
  {
    id: "9",
    drugs: ["Levothyroxine", "Calcium"],
    severity: "low",
    title: "Levothyroxine + Calcium Supplements",
    description: "Calcium binds to Levothyroxine in the gut, reducing its absorption significantly.",
    whatToDo: "Take Levothyroxine on an empty stomach, at least 4 hours apart from calcium supplements.",
  },
  {
    id: "10",
    drugs: ["Simvastatin", "Amiodarone"],
    severity: "high",
    title: "Simvastatin + Amiodarone",
    description: "Amiodarone inhibits the enzyme that breaks down Simvastatin, causing dangerous muscle damage (rhabdomyolysis).",
    whatToDo: "Dose of Simvastatin must not exceed 20mg if taking Amiodarone. Doctor adjustment required.",
  },
];

const SEVERITY_CONFIG = {
  high:   { color: "#EF4444", bg: "#FEF2F2", darkBg: "#3B1515", border: "#FECACA", label: "High Risk",   icon: ShieldAlert },
  medium: { color: "#F59E0B", bg: "#FFFBEB", darkBg: "#3B2F0A", border: "#FDE68A", label: "Medium Risk", icon: AlertTriangle },
  low:    { color: "#3B82F6", bg: "#EFF6FF", darkBg: "#0F2038", border: "#BFDBFE", label: "Low Risk",    icon: Info },
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

// ─── Sub-components ───────────────────────────────────────────────────────────
const TabButton = ({
  label, icon: Icon, active, onPress,
}: { label: string; icon: any; active: boolean; onPress: () => void }) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 8 }).start()}
        className="items-center py-2.5 rounded-xl flex-row justify-center gap-1.5"
        style={{ backgroundColor: active ? "#8B5CF6" : "transparent" }}
      >
        <Icon size={14} color={active ? "white" : "#64748B"} />
        <Text style={{ fontSize: 12, fontWeight: active ? "700" : "500", color: active ? "white" : "#64748B" }}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const WarningCard = ({ warning, index }: { warning: Warning; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const anim    = useFadeSlideIn(index * 60);
  const cfg     = SEVERITY_CONFIG[warning.severity];
  const IconComp = cfg.icon;

  return (
    <Animated.View style={anim} className="mb-3">
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="rounded-2xl overflow-hidden border"
        style={{ borderColor: cfg.border, backgroundColor: cfg.bg }}
      >
        <View className="p-4 flex-row items-start gap-3">
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: cfg.color + "20", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: cfg.color + "40" }}>
            <IconComp size={18} color={cfg.color} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Text style={{ fontWeight: "700", fontSize: 14, color: "#0F172A", flex: 1 }}>{warning.title}</Text>
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: cfg.color }}>
                <Text style={{ color: "white", fontSize: 10, fontWeight: "700" }}>{cfg.label}</Text>
              </View>
            </View>
            <Text style={{ color: "#64748B", fontSize: 13, lineHeight: 18 }} numberOfLines={expanded ? undefined : 2}>
              {warning.description}
            </Text>
            {expanded && (
              <View className="mt-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.6)" }}>
                <View className="flex-row items-center gap-1.5 mb-1">
                  <CheckCircle size={13} color={cfg.color} />
                  <Text style={{ fontWeight: "700", fontSize: 12, color: cfg.color }}>What to do</Text>
                </View>
                <Text style={{ fontSize: 13, color: "#374151", lineHeight: 18 }}>{warning.whatToDo}</Text>
              </View>
            )}
          </View>
          <View className="mt-1">
            {expanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ─── AI Checker ───────────────────────────────────────────────────────────────
const AIChecker = () => {
  const [medicines, setMedicines] = useState<string[]>([]);
  const [input,    setInput]     = useState("");
  const [loading,  setLoading]   = useState(false);
  const [result,   setResult]    = useState<string | null>(null);
  const anim = useFadeSlideIn(0);

  const addMedicine = () => {
    const trimmed = input.trim();
    if (trimmed && !medicines.includes(trimmed)) {
      setMedicines((p) => [...p, trimmed]);
      setResult(null);
    }
    setInput("");
  };

  const removeMedicine = (m: string) => {
    setMedicines((p) => p.filter((x) => x !== m));
    setResult(null);
  };

  const checkInteractions = async () => {
    if (medicines.length < 2) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a clinical pharmacist assistant. The user is from rural India and may have limited health literacy. 
Analyze drug interactions for the given medicines. 
Respond in simple, clear language. Structure your response EXACTLY as valid JSON with this shape:
{
  "safe": boolean,
  "riskLevel": "high" | "medium" | "low" | "none",
  "summary": "1-2 sentence plain language summary",
  "interactions": [{ "pair": "Drug A + Drug B", "risk": "high|medium|low", "effect": "what happens", "advice": "what to do" }],
  "generalAdvice": "overall recommendation"
}
Return ONLY the JSON object, no markdown, no explanation outside the JSON.`,
          messages: [{ role: "user", content: `Check interactions between these medicines: ${medicines.join(", ")}` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find((b: any) => b.type === "text")?.text ?? "";
      setResult(text);
    } catch {
      setResult(JSON.stringify({ safe: false, riskLevel: "none", summary: "Unable to check right now. Please try again.", interactions: [], generalAdvice: "Consult your doctor or pharmacist." }));
    } finally {
      setLoading(false);
    }
  };

  let parsed: any = null;
  try { if (result) parsed = JSON.parse(result.replace(/```json|```/g, "").trim()); } catch {}

  return (
    <Animated.View style={anim}>
      {/* Input */}
      <View className="rounded-2xl p-4 mb-4 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
        <Text className="text-[#0F172A] dark:text-white font-semibold mb-1">Enter Medicine Names</Text>
        <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs mb-3">Add at least 2 medicines to check interactions</Text>

        <View className="flex-row gap-2 mb-3">
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={addMedicine}
            placeholder="e.g. Aspirin, Metformin..."
            placeholderTextColor="#94A3B8"
            returnKeyType="done"
            className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-4 py-3 text-[#0F172A] dark:text-white text-sm"
          />
          <Pressable onPress={addMedicine}
            className="bg-primary px-4 rounded-xl items-center justify-center"
            style={{ minWidth: 52 }}>
            <Text className="text-white font-bold text-lg">+</Text>
          </Pressable>
        </View>

        {/* Tags */}
        {medicines.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mb-3">
            {medicines.map((m) => (
              <View key={m} className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <Text style={{ color: "#8B5CF6", fontSize: 13, fontWeight: "600" }}>{m}</Text>
                <Pressable onPress={() => removeMedicine(m)} hitSlop={6}>
                  <X size={12} color="#8B5CF6" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={checkInteractions}
          disabled={medicines.length < 2 || loading}
          className="rounded-xl py-3 items-center flex-row justify-center gap-2"
          style={{ backgroundColor: medicines.length < 2 ? "#E2E8F0" : "#8B5CF6" }}
        >
          {loading
            ? <ActivityIndicator color="white" size="small" />
            : <><Zap size={16} color={medicines.length < 2 ? "#94A3B8" : "white"} />
                <Text style={{ color: medicines.length < 2 ? "#94A3B8" : "white", fontWeight: "700", fontSize: 14 }}>
                  Check Interactions
                </Text></>
          }
        </Pressable>
      </View>

      {/* Result */}
      {parsed && (
        <View className="rounded-2xl overflow-hidden border mb-4"
          style={{
            borderColor: parsed.riskLevel === "none" || parsed.safe
              ? "#BBF7D0" : SEVERITY_CONFIG[parsed.riskLevel as Severity]?.border ?? "#FECACA",
            backgroundColor: parsed.riskLevel === "none" || parsed.safe
              ? "#F0FDF4" : SEVERITY_CONFIG[parsed.riskLevel as Severity]?.bg ?? "#FEF2F2",
          }}>
          <View className="p-4">
            {/* Header */}
            <View className="flex-row items-center gap-2 mb-3">
              {parsed.safe
                ? <CheckCircle size={20} color="#10B981" />
                : <ShieldAlert size={20} color={SEVERITY_CONFIG[parsed.riskLevel as Severity]?.color ?? "#EF4444"} />}
              <Text style={{ fontWeight: "700", fontSize: 15,
                color: parsed.safe ? "#065F46" : (SEVERITY_CONFIG[parsed.riskLevel as Severity]?.color ?? "#EF4444") }}>
                {parsed.safe ? "No Significant Interactions Found" : `${SEVERITY_CONFIG[parsed.riskLevel as Severity]?.label ?? "Risk"} Detected`}
              </Text>
            </View>

            <Text style={{ fontSize: 13, color: "#374151", lineHeight: 20, marginBottom: 12 }}>{parsed.summary}</Text>

            {parsed.interactions?.length > 0 && parsed.interactions.map((inter: any, i: number) => {
              const cfg = SEVERITY_CONFIG[inter.risk as Severity] ?? SEVERITY_CONFIG.medium;
              return (
                <View key={i} className="rounded-xl p-3 mb-2" style={{ backgroundColor: "rgba(255,255,255,0.65)" }}>
                  <View className="flex-row items-center gap-2 mb-1">
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: cfg.color }}>
                      <Text style={{ color: "white", fontSize: 10, fontWeight: "700" }}>{inter.pair}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>{inter.effect}</Text>
                  <View className="flex-row items-start gap-1.5">
                    <CheckCircle size={12} color={cfg.color} style={{ marginTop: 2 }} />
                    <Text style={{ fontSize: 12, color: cfg.color, fontWeight: "600", flex: 1 }}>{inter.advice}</Text>
                  </View>
                </View>
              );
            })}

            <View className="mt-2 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.5)" }}>
              <Text style={{ fontSize: 12, color: "#64748B", fontStyle: "italic" }}>
                💡 {parsed.generalAdvice}
              </Text>
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

// ─── History Alerts ───────────────────────────────────────────────────────────
const HistoryAlerts = () => {
  const dbUser = useAppSelector((s) => s.auth.dbUser);
  const history: string[] = dbUser?.prescriptionHistory?.map((p: any) => p.medicines ?? []).flat() ?? [];
  const anim = useFadeSlideIn(0);

  // Cross-reference scanned meds against static warnings
  const triggered = STATIC_WARNINGS.filter((w) =>
    w.drugs.every((d) => history.some((h: string) => h.toLowerCase().includes(d.toLowerCase())))
  );

  if (history.length === 0) {
    return (
      <Animated.View style={anim}>
        <View className="rounded-2xl p-6 items-center bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
          <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: "#8B5CF618", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <History size={26} color="#8B5CF6" />
          </View>
          <Text className="text-[#0F172A] dark:text-white font-bold text-base mb-1">No Scan History</Text>
          <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm text-center">
            Scan your prescriptions in Health Services to get personalised danger alerts based on your medicines.
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={anim}>
      {/* Scanned meds */}
      <View className="rounded-2xl p-4 mb-4 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
        <Text className="text-[#0F172A] dark:text-white font-semibold text-sm mb-2">Your Scanned Medicines</Text>
        <View className="flex-row flex-wrap gap-2">
          {[...new Set(history)].map((m: string, i: number) => (
            <View key={i} className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Text style={{ color: "#8B5CF6", fontSize: 12, fontWeight: "600" }}>{m}</Text>
            </View>
          ))}
        </View>
      </View>

      {triggered.length === 0 ? (
        <View className="rounded-2xl p-4 bg-[#F0FDF4] border border-[#BBF7D0]">
          <View className="flex-row items-center gap-2">
            <CheckCircle size={20} color="#10B981" />
            <Text style={{ color: "#065F46", fontWeight: "700", fontSize: 14 }}>No Known Interactions Detected</Text>
          </View>
          <Text style={{ color: "#374151", fontSize: 13, marginTop: 6, lineHeight: 18 }}>
            No dangerous combinations found among your scanned medicines. Always consult your doctor before combining medications.
          </Text>
        </View>
      ) : (
        <>
          <View className="rounded-2xl p-3 mb-3 bg-[#FEF2F2] border border-[#FECACA]">
            <View className="flex-row items-center gap-2">
              <ShieldAlert size={16} color="#EF4444" />
              <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 13 }}>
                {triggered.length} Interaction{triggered.length > 1 ? "s" : ""} Found in Your History
              </Text>
            </View>
          </View>
          {triggered.map((w, i) => <WarningCard key={w.id} warning={w} index={i} />)}
        </>
      )}
    </Animated.View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function DangerAlerts() {
  const [tab,    setTab]    = useState<Tab>("static");
  const [search, setSearch] = useState("");
  const headerAnim = useFadeSlideIn(0);
  const tabAnim    = useFadeSlideIn(80);

  const filtered = STATIC_WARNINGS.filter((w) =>
    search === "" ||
    w.title.toLowerCase().includes(search.toLowerCase()) ||
    w.drugs.some((d) => d.toLowerCase().includes(search.toLowerCase()))
  );

  // Sort: high first
  const sorted = [...filtered].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <ScrollView
      className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]"
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View style={headerAnim} className="flex-row items-center gap-3 mb-6">
        <View className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{ backgroundColor: "#EF4444", shadowColor: "#EF4444", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 }}>
          <AlertTriangle size={22} color="white" />
        </View>
        <View>
          <Text className="text-2xl font-bold text-[#0F172A] dark:text-white" style={{ letterSpacing: -0.4 }}>
            Danger Alerts
          </Text>
          <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm">
            Drug interactions & safety warnings
          </Text>
        </View>
      </Animated.View>

      {/* Tabs */}
      <Animated.View style={tabAnim}
        className="flex-row bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-1 mb-5"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
        <TabButton label="Warnings" icon={ShieldAlert} active={tab === "static"}  onPress={() => setTab("static")} />
        <TabButton label="AI Check"  icon={Zap}         active={tab === "ai"}     onPress={() => setTab("ai")} />
        <TabButton label="My Meds"   icon={History}     active={tab === "history"} onPress={() => setTab("history")} />
      </Animated.View>

      {/* Static warnings */}
      {tab === "static" && (
        <>
          <View className="flex-row items-center gap-2 mb-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] px-3 py-2.5">
            <Search size={16} color="#94A3B8" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search medicines..."
              placeholderTextColor="#94A3B8"
              className="flex-1 text-[#0F172A] dark:text-white text-sm"
            />
            {search ? <Pressable onPress={() => setSearch("")}><X size={14} color="#94A3B8" /></Pressable> : null}
          </View>
          <View className="flex-row gap-2 mb-4">
            {(["high", "medium", "low"] as Severity[]).map((s) => {
              const cfg = SEVERITY_CONFIG[s];
              const count = sorted.filter((w) => w.severity === s).length;
              return (
                <View key={s} className="flex-1 rounded-xl p-2.5 items-center border"
                  style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}>
                  <Text style={{ color: cfg.color, fontWeight: "800", fontSize: 18 }}>{count}</Text>
                  <Text style={{ color: cfg.color, fontSize: 10, fontWeight: "600" }}>{cfg.label}</Text>
                </View>
              );
            })}
          </View>
          {sorted.map((w, i) => <WarningCard key={w.id} warning={w} index={i} />)}
          {sorted.length === 0 && (
            <View className="items-center py-12">
              <Text className="text-[#94A3B8] text-sm">No warnings found for "{search}"</Text>
            </View>
          )}
        </>
      )}

      {tab === "ai"      && <AIChecker />}
      {tab === "history" && <HistoryAlerts />}

      {/* Disclaimer */}
      <View className="mt-4 p-4 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA]">
        <View className="flex-row items-center gap-2 mb-1">
          <Info size={14} color="#F59E0B" />
          <Text style={{ color: "#92400E", fontWeight: "700", fontSize: 12 }}>Medical Disclaimer</Text>
        </View>
        <Text style={{ color: "#78350F", fontSize: 12, lineHeight: 17 }}>
          This information is for awareness only and does not replace professional medical advice. Always consult a licensed doctor or pharmacist before making any changes to your medication.
        </Text>
      </View>
    </ScrollView>
  );
}