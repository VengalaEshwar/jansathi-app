// app/health/danger-alerts.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, Animated,
  TextInput, ActivityIndicator, useWindowDimensions, Platform,
} from "react-native";
import {
  AlertTriangle, Zap, History, Search, ChevronDown,
  ChevronUp, X, ShieldAlert, Info, CheckCircle, ArrowLeft, RefreshCw,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useTranslation } from "@/hooks/useTranslation";
import { apiRequest } from "@/integrations/api/client";

type Severity = "high" | "medium" | "low";
type Tab      = "static" | "ai" | "history";

interface Warning {
  id: string; drugs: string[]; severity: Severity;
  title: string; description: string; whatToDo: string;
}

const STATIC_WARNINGS: Warning[] = [
  { id:"1",  drugs:["Aspirin","Ibuprofen"],        severity:"high",   title:"Aspirin + Ibuprofen",              description:"Taking both NSAIDs together significantly increases the risk of internal bleeding and stomach ulcers.",                                   whatToDo:"Never take both at the same time. Consult your doctor for safe alternatives." },
  { id:"2",  drugs:["Paracetamol","Alcohol"],      severity:"high",   title:"Paracetamol + Alcohol",            description:"Combining paracetamol with alcohol can cause severe liver damage, even at normal doses.",                                              whatToDo:"Avoid all alcohol while taking paracetamol. Wait at least 24 hours after your last drink." },
  { id:"3",  drugs:["Metformin","Alcohol"],        severity:"high",   title:"Metformin + Alcohol",              description:"Risk of lactic acidosis — a dangerous buildup of lactic acid in the blood.",                                                           whatToDo:"Diabetic patients should completely avoid alcohol while on Metformin." },
  { id:"4",  drugs:["Warfarin","Aspirin"],         severity:"high",   title:"Warfarin + Aspirin",               description:"Both thin the blood — together they dramatically increase bleeding risk, including internal bleeding.",                                  whatToDo:"Only combine under strict doctor supervision with regular INR monitoring." },
  { id:"5",  drugs:["Amoxicillin","Methotrexate"], severity:"medium", title:"Amoxicillin + Methotrexate",       description:"Amoxicillin can reduce kidney clearance of Methotrexate, raising its toxicity levels.",                                               whatToDo:"Inform your doctor if you are on Methotrexate before taking any antibiotic." },
  { id:"6",  drugs:["Atenolol","Verapamil"],       severity:"high",   title:"Atenolol + Verapamil",             description:"Both slow heart rate — together they can cause dangerous bradycardia or heart block.",                                                  whatToDo:"This combination requires close cardiac monitoring. Do not take without doctor supervision." },
  { id:"7",  drugs:["Ciprofloxacin","Antacids"],   severity:"medium", title:"Ciprofloxacin + Antacids",         description:"Antacids with calcium, magnesium or aluminium reduce absorption of ciprofloxacin by up to 90%.",                                       whatToDo:"Take ciprofloxacin at least 2 hours before or 6 hours after antacids." },
  { id:"8",  drugs:["Diazepam","Alcohol"],         severity:"high",   title:"Diazepam + Alcohol",               description:"Both are CNS depressants. Combined, they can cause severe sedation, respiratory depression, or coma.",                                 whatToDo:"Strictly avoid alcohol while taking any benzodiazepine like Diazepam." },
  { id:"9",  drugs:["Levothyroxine","Calcium"],    severity:"low",    title:"Levothyroxine + Calcium Supplements",description:"Calcium binds to Levothyroxine in the gut, reducing its absorption significantly.",                                                whatToDo:"Take Levothyroxine on an empty stomach, at least 4 hours apart from calcium supplements." },
  { id:"10", drugs:["Simvastatin","Amiodarone"],   severity:"high",   title:"Simvastatin + Amiodarone",         description:"Amiodarone inhibits the enzyme that breaks down Simvastatin, causing dangerous muscle damage (rhabdomyolysis).",                        whatToDo:"Dose of Simvastatin must not exceed 20mg if taking Amiodarone. Doctor adjustment required." },
];

let SEV: Record<Severity, {
  cardBg:string; cardBorder:string; iconBg:string; iconBorder:string;
  pillBg:string; pillText:string; titleText:string; bodyText:string;
  whatBg:string; whatText:string; statBg:string; statBorder:string;
  statCount:string; statLabel:string; color:string; icon:any; label:string;
}> = {
  high: {
    cardBg:"bg-red-50 dark:bg-red-950/50", cardBorder:"border-red-200 dark:border-red-800",
    iconBg:"bg-red-100 dark:bg-red-900/50", iconBorder:"border-red-300 dark:border-red-700",
    pillBg:"bg-red-500", pillText:"text-white",
    titleText:"text-red-700 dark:text-red-300", bodyText:"text-red-900/75 dark:text-red-100/70",
    whatBg:"bg-white/70 dark:bg-white/10", whatText:"text-red-700 dark:text-red-300",
    statBg:"bg-red-50 dark:bg-red-950/50", statBorder:"border-red-200 dark:border-red-800",
    statCount:"text-red-600 dark:text-red-400", statLabel:"text-red-500 dark:text-red-400",
    color:"#EF4444", icon:ShieldAlert, label:"High Risk",
  },
  medium: {
    cardBg:"bg-amber-50 dark:bg-amber-950/50", cardBorder:"border-amber-200 dark:border-amber-800",
    iconBg:"bg-amber-100 dark:bg-amber-900/50", iconBorder:"border-amber-300 dark:border-amber-700",
    pillBg:"bg-amber-500", pillText:"text-white",
    titleText:"text-amber-700 dark:text-amber-300", bodyText:"text-amber-900/75 dark:text-amber-100/70",
    whatBg:"bg-white/70 dark:bg-white/10", whatText:"text-amber-700 dark:text-amber-300",
    statBg:"bg-amber-50 dark:bg-amber-950/50", statBorder:"border-amber-200 dark:border-amber-800",
    statCount:"text-amber-600 dark:text-amber-400", statLabel:"text-amber-500 dark:text-amber-400",
    color:"#F59E0B", icon:AlertTriangle, label:"Medium Risk",
  },
  low: {
    cardBg:"bg-blue-50 dark:bg-blue-950/50", cardBorder:"border-blue-200 dark:border-blue-800",
    iconBg:"bg-blue-100 dark:bg-blue-900/50", iconBorder:"border-blue-300 dark:border-blue-700",
    pillBg:"bg-blue-500", pillText:"text-white",
    titleText:"text-blue-700 dark:text-blue-300", bodyText:"text-blue-900/75 dark:text-blue-100/70",
    whatBg:"bg-white/70 dark:bg-white/10", whatText:"text-blue-700 dark:text-blue-300",
    statBg:"bg-blue-50 dark:bg-blue-950/50", statBorder:"border-blue-200 dark:border-blue-800",
    statCount:"text-blue-600 dark:text-blue-400", statLabel:"text-blue-500 dark:text-blue-400",
    color:"#3B82F6", icon:Info, label:"Low Risk",
  },
};

const useFadeIn = (delay = 0) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 360, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true, speed: 14, bounciness: 5 }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
};

const TabBtn = ({ label, icon: Icon, active, onPress }: { label: string; icon: any; active: boolean; onPress: () => void }) => {
  const s = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: s }] }}>
      <Pressable onPress={onPress}
        onPressIn={() => Animated.spring(s, { toValue: 0.95, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(s, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        className={`flex-row items-center justify-center gap-1.5 py-3 rounded-xl ${active ? "bg-red-500" : ""}`}>
        <Icon size={15} color={active ? "white" : "#64748B"} />
        <Text className={`text-xs font-bold ${active ? "text-white" : "text-[#64748B] dark:text-[#94A3B8]"}`}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
};

const WarningCard = ({ warning, delay = 0 }: { warning: Warning; delay?: number }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const anim  = useFadeIn(delay);
  const cfg   = SEV[warning.severity];
  const Icon  = cfg.icon;
  return (
    <Animated.View style={{ opacity: anim.opacity, transform: [{ scale }, { translateY: (anim.transform[0] as any).translateY }] }}>
      <Pressable onPress={() => setExpanded(v => !v)}
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        // @ts-ignore
        onHoverIn={() => { if (Platform.OS === "web") Animated.spring(scale, { toValue: 1.015, useNativeDriver: true, speed: 28, bounciness: 8 }).start(); }}
        onHoverOut={() => { if (Platform.OS === "web") Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 8 }).start(); }}
        className={`rounded-2xl border overflow-hidden ${cfg.cardBg} ${cfg.cardBorder}`}
        style={{ shadowColor: cfg.color, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 3 }}>
        <View className="p-4 flex-row items-start gap-3">
          <View className={`w-11 h-11 rounded-xl items-center justify-center border flex-shrink-0 ${cfg.iconBg} ${cfg.iconBorder}`}>
            <Icon size={20} color={cfg.color} />
          </View>
          <View className="flex-1 min-w-0">
            <View className="flex-row items-start justify-between gap-2 mb-2">
              <Text className={`font-bold text-[14px] leading-5 flex-1 ${cfg.titleText}`}>{warning.title}</Text>
              <View className={`px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.pillBg}`}>
                <Text className={`text-[11px] font-bold ${cfg.pillText}`}>{cfg.label}</Text>
              </View>
            </View>
            <Text className={`text-[13px] leading-[20px] ${cfg.bodyText}`} numberOfLines={expanded ? undefined : 2}>
              {warning.description}
            </Text>
            {expanded && (
              <View className={`mt-3 p-3 rounded-xl ${cfg.whatBg}`}>
                <View className="flex-row items-center gap-1.5 mb-1">
                  <CheckCircle size={13} color={cfg.color} />
                  <Text className={`font-bold text-xs ${cfg.whatText}`}>{t.dangerAlerts.whatToDo}</Text>
                </View>
                <Text className={`text-[13px] leading-5 ${cfg.whatText}`}>{warning.whatToDo}</Text>
              </View>
            )}
          </View>
          <View className="mt-1 flex-shrink-0">
            {expanded ? <ChevronUp size={16} color={cfg.color} /> : <ChevronDown size={16} color={cfg.color} />}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ── AI Checker — calls backend /ocr/check-interactions ───────────────────────
const AIChecker = ({ wide }: { wide: boolean }) => {
  const { t } = useTranslation();
  const [medicines, setMedicines] = useState<string[]>([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<any>(null);
  const [error,     setError]     = useState<string | null>(null);

  const addMedicine = useCallback(() => {
    const t = input.trim();
    if (t && !medicines.includes(t)) { setMedicines(p => [...p, t]); setResult(null); setError(null); }
    setInput("");
  }, [input, medicines]);

  const removeMedicine = useCallback((m: string) => {
    setMedicines(p => p.filter(x => x !== m)); setResult(null); setError(null);
  }, []);

  const checkInteractions = useCallback(async () => {
    if (medicines.length < 2) return;
    setLoading(true); setResult(null); setError(null);
    try {
      // ✅ Calls YOUR backend — Gemini primary, Groq fallback handled server-side
      const data = await apiRequest("/ocr/check-interactions", "POST", { medicines });
      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || "Unable to check interactions. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Unable to check interactions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [medicines]);

  const rCfg = result && !result.safe && result.riskLevel !== "none" ? SEV[result.riskLevel as Severity] : null;

  return (
    <View style={{ gap: 16 }}>
      <View className="rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] p-5"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
        <Text className="text-[#0F172A] dark:text-white font-bold text-base mb-1">{t.dangerAlerts.enterMedicines}</Text>
        <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm mb-4">{t.dangerAlerts.enterMedicinesDesc}</Text>

        <View className="flex-row gap-2 mb-4">
          <TextInput value={input} onChangeText={setInput} onSubmitEditing={addMedicine}
            placeholder={t.dangerAlerts.medicinePlaceholder} placeholderTextColor="#94A3B8" returnKeyType="done"
            className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-4 py-3 text-[#0F172A] dark:text-white text-sm" />
          <AnimatedPressable onPress={addMedicine} soundType="soft"
            style={{ paddingHorizontal: 20, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#8B5CF6" }}>
            <Text style={{ color: "white", fontWeight: "800", fontSize: 20 }}>+</Text>
          </AnimatedPressable>
        </View>

        {medicines.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {medicines.map(m => (
              <View key={m} className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25">
                <Text className="text-primary text-sm font-semibold">{m}</Text>
                <Pressable onPress={() => removeMedicine(m)} hitSlop={8}><X size={12} color="#8B5CF6" /></Pressable>
              </View>
            ))}
          </View>
        )}

        <AnimatedPressable onPress={checkInteractions} disabled={medicines.length < 2 || loading} soundType="mechanical"
          style={{
            borderRadius: 12, paddingVertical: 14, flexDirection: "row" as const,
            alignItems: "center" as const, justifyContent: "center" as const, gap: 8,
            backgroundColor: medicines.length < 2 ? "#E2E8F0" : "#EF4444",
          }}
          className={medicines.length < 2 ? "dark:bg-[#334155]" : ""}>
          {loading ? <ActivityIndicator color="white" size="small" /> : <>
            <Zap size={16} color={medicines.length < 2 ? "#94A3B8" : "white"} />
            <Text style={{ fontWeight: "700", fontSize: 14, color: medicines.length < 2 ? "#94A3B8" : "white" }}>
              {t.dangerAlerts.checkBtn}
            </Text>
          </>}
        </AnimatedPressable>

        {error && (
          <View className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
            <Text className="text-red-600 dark:text-red-400 text-sm">{error}</Text>
          </View>
        )}
      </View>

      {result && (
        <View className={`rounded-2xl border overflow-hidden ${
          result.safe || result.riskLevel === "none"
            ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800"
            : `${rCfg?.cardBg ?? ""} ${rCfg?.cardBorder ?? ""}`
        }`}>
          <View className="p-5">
            <View className="flex-row items-center gap-2.5 mb-3">
              {result.safe || result.riskLevel === "none"
                ? <CheckCircle size={22} color="#10B981" />
                : <ShieldAlert size={22} color={rCfg?.color} />}
              <Text className={`font-bold text-base flex-1 ${
                result.safe || result.riskLevel === "none"
                  ? "text-green-700 dark:text-green-300"
                  : rCfg?.titleText ?? ""
              }`}>
                {result.safe || result.riskLevel === "none"
                  ? t.dangerAlerts.noRisk
                  : `${rCfg?.label ?? t.dangerAlerts.highRisk} Detected`}
              </Text>
            </View>
            <Text className="text-[#374151] dark:text-[#CBD5E1] text-sm leading-5 mb-4">{result.summary}</Text>

            {result.interactions?.map((inter: any, i: number) => {
              const ic = SEV[inter.risk as Severity] ?? SEV.medium;
              return (
                <View key={i} className={`rounded-xl p-3.5 mb-2.5 ${ic.whatBg}`}>
                  <View className={`self-start px-2.5 py-1 rounded-full mb-2 ${ic.pillBg}`}>
                    <Text className={`text-xs font-bold ${ic.pillText}`}>{inter.pair}</Text>
                  </View>
                  <Text className="text-[#374151] dark:text-[#CBD5E1] text-sm leading-5 mb-2">{inter.effect}</Text>
                  <View className="flex-row items-start gap-1.5">
                    <CheckCircle size={13} color={ic.color} style={{ marginTop: 2 }} />
                    <Text className={`text-sm font-semibold flex-1 ${ic.whatText}`}>{inter.advice}</Text>
                  </View>
                </View>
              );
            })}

            <View className="mt-2 p-3.5 rounded-xl bg-white/50 dark:bg-white/5">
              <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm italic">💡 {result.generalAdvice}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// ── History Alerts — loads from backend /ocr/my-medicines ────────────────────
const HistoryAlerts = () => {
  const { t } = useTranslation();
  const [medicines,  setMedicines]  = useState<string[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [triggered,  setTriggered]  = useState<Warning[]>([]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // ✅ Fetches medicine names extracted from medicine scanner + prescription history
      const data = await apiRequest("/ocr/my-medicines");
      const names: string[] = data.medicines ?? [];
      setMedicines(names);

      // Cross-check against static warnings
      const found = STATIC_WARNINGS.filter(w =>
        w.drugs.every(d =>
          names.some(n => n.toLowerCase().includes(d.toLowerCase()) ||
                          d.toLowerCase().includes(n.toLowerCase()))
        )
      );
      setTriggered(found);
    } catch (err: any) {
      setError(err.message || "Failed to load your medicines");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <View className="rounded-2xl p-8 items-center bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text className="text-[#94A3B8] mt-3 text-sm">{t.common.loading}</Text>
    </View>
  );

  if (error) return (
    <View className="rounded-2xl p-6 items-center bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
      <Text className="text-red-600 dark:text-red-400 text-sm text-center mb-3">{error}</Text>
      <AnimatedPressable onPress={load} soundType="soft"
        style={{ flexDirection: "row", alignItems: "center", gap: 6,
          paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: "#EF4444" }}>
        <RefreshCw size={14} color="white" />
        <Text style={{ color: "white", fontWeight: "600", fontSize: 13 }}>Retry</Text>
      </AnimatedPressable>
    </View>
  );

  if (medicines.length === 0) return (
    <View className="rounded-2xl p-8 items-center bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
      style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
      <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
        <History size={30} color="#8B5CF6" />
      </View>
      <Text className="text-[#0F172A] dark:text-white font-bold text-lg mb-2">{t.dangerAlerts.noHistory}</Text>
      <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm text-center leading-5" style={{ maxWidth: 300 }}>
        {t.dangerAlerts.noHistoryDesc}
      </Text>
    </View>
  );

  return (
    <View style={{ gap: 12 }}>
      {/* Medicines list from scans */}
      <View className="rounded-2xl p-4 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <Text className="text-[#0F172A] dark:text-white font-semibold text-sm">
            {t.dangerAlerts.scannedMeds} ({medicines.length})
          </Text>
          <AnimatedPressable onPress={load} soundType="soft"
            style={{ padding: 6, borderRadius: 8, backgroundColor: "#8B5CF610" }}>
            <RefreshCw size={13} color="#8B5CF6" />
          </AnimatedPressable>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {medicines.map((m, i) => (
            <View key={i} className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25">
              <Text className="text-primary text-sm font-semibold">{m}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Interaction results */}
      {triggered.length === 0 ? (
        <View className="rounded-2xl p-5 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
          <View className="flex-row items-center gap-2.5 mb-2">
            <CheckCircle size={20} color="#10B981" />
            <Text className="text-green-700 dark:text-green-300 font-bold text-sm">{t.dangerAlerts.noInteractions}</Text>
          </View>
          <Text className="text-green-800/75 dark:text-green-100/70 text-sm leading-5">
            No dangerous combinations found among your scanned medicines. Always consult your doctor before combining medications.
          </Text>
        </View>
      ) : (
        <>
          <View className="rounded-2xl p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
            <View className="flex-row items-center gap-2">
              <ShieldAlert size={18} color="#EF4444" />
              <Text className="text-red-600 dark:text-red-400 font-bold text-sm">
                ⚠️ {triggered.length} {triggered.length > 1 ? t.dangerAlerts.interactionsFoundPlural : t.dangerAlerts.interactionsFound}
              </Text>
            </View>
          </View>
          {triggered.map((w, i) => (
            <View key={w.id} style={{ marginTop: 0 }}>
              <WarningCard warning={w} delay={i * 60} />
            </View>
          ))}
        </>
      )}
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function DangerAlerts() {
  const router    = useRouter();
  const { t }     = useTranslation();
  const { width } = useWindowDimensions();
  const isWide    = width >= 700;
  const isLarge   = width >= 1100;

  // Update severity labels with current language on every render
  SEV.high.label   = t.dangerAlerts.highRisk;
  SEV.medium.label = t.dangerAlerts.mediumRisk;
  SEV.low.label    = t.dangerAlerts.lowRisk;

  const [tab,    setTab]    = useState<Tab>("static");
  const [search, setSearch] = useState("");

  const headerAnim = useFadeIn(0);
  const tabAnim    = useFadeIn(80);
  const bodyAnim   = useFadeIn(160);

  const filtered = STATIC_WARNINGS.filter(w =>
    search === "" || w.title.toLowerCase().includes(search.toLowerCase()) ||
    w.drugs.some(d => d.toLowerCase().includes(search.toLowerCase()))
  );
  const sorted = [...filtered].sort((a, b) =>
    ({ high: 0, medium: 1, low: 2 }[a.severity]) - ({ high: 0, medium: 1, low: 2 }[b.severity])
  );
  const pairs: Warning[][] = [];
  for (let i = 0; i < sorted.length; i += 2) pairs.push(sorted.slice(i, i + 2));

  const containerWidth = isLarge ? 1100 : isWide ? 860 : undefined;
  const sidePad = containerWidth ? Math.max(24, (width - containerWidth) / 2) : 20;

  return (
    <ScrollView className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]"
      showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

      {/* ── FULL WIDTH: back + header ── */}
      <View style={{ paddingHorizontal: sidePad, paddingTop: 20 }}>
        {Platform.OS === "web" && <View style={{ height: 8 }} />}
        <AnimatedPressable onPress={() => router.back()} soundType="soft"
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 }}>
          <ArrowLeft size={18} color="#8B5CF6" />
          <Text className="text-[#8B5CF6] font-semibold text-sm">{t.common.back}</Text>
        </AnimatedPressable>
        <Animated.View style={headerAnim} className="flex-row items-center gap-4 mb-7">
          <View className="w-14 h-14 rounded-2xl bg-red-500 items-center justify-center"
            style={{ shadowColor: "#EF4444", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 }}>
            <AlertTriangle size={28} color="white" />
          </View>
          <View>
            <Text className="font-extrabold text-[#0F172A] dark:text-white"
              style={{ fontSize: isWide ? 28 : 22, letterSpacing: -0.5 }}>{t.dangerAlerts.title}</Text>
            <Text className="text-[#64748B] dark:text-[#94A3B8] mt-0.5" style={{ fontSize: isWide ? 15 : 13 }}>
              Drug interactions & safety warnings
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* ── CENTERED CONTENT ── */}
      <View style={{
        paddingHorizontal: sidePad,
        ...(containerWidth ? { maxWidth: containerWidth + sidePad * 2, alignSelf: "center" as const, width: "100%" } : {}),
      }}>
        {/* Tabs */}
        <Animated.View style={tabAnim}
          className="flex-row bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-1 mb-6"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
          <TabBtn label={t.dangerAlerts.tabWarnings} icon={ShieldAlert} active={tab === "static"}  onPress={() => setTab("static")} />
          <TabBtn label={t.dangerAlerts.tabAiCheck} icon={Zap}         active={tab === "ai"}      onPress={() => setTab("ai")} />
          <TabBtn label={t.dangerAlerts.tabMyMeds}  icon={History}     active={tab === "history"} onPress={() => setTab("history")} />
        </Animated.View>

        {/* Warnings Tab */}
        {tab === "static" && (
          <Animated.View style={bodyAnim}>
            <View className="flex-row items-center gap-2 mb-5 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-4"
              style={{ paddingVertical: isWide ? 14 : 10 }}>
              <Search size={17} color="#94A3B8" />
              <TextInput value={search} onChangeText={setSearch} placeholder={t.dangerAlerts.searchPlaceholder}
                placeholderTextColor="#94A3B8" className="flex-1 text-[#0F172A] dark:text-white"
                style={{ fontSize: isWide ? 15 : 13 }} />
              {search ? <Pressable onPress={() => setSearch("")}><X size={15} color="#94A3B8" /></Pressable> : null}
            </View>
            <View className="flex-row gap-3 mb-6">
              {(["high","medium","low"] as Severity[]).map(s => {
                const cfg   = SEV[s];
                const count = sorted.filter(w => w.severity === s).length;
                return (
                  <View key={s} className={`flex-1 rounded-2xl border items-center ${cfg.statBg} ${cfg.statBorder}`}
                    style={{ paddingVertical: isWide ? 16 : 12 }}>
                    <Text className={`font-extrabold ${cfg.statCount}`} style={{ fontSize: isWide ? 28 : 22 }}>{count}</Text>
                    <Text className={`font-semibold mt-0.5 ${cfg.statLabel}`} style={{ fontSize: isWide ? 13 : 11 }}>{cfg.label}</Text>
                  </View>
                );
              })}
            </View>
            {sorted.length === 0 ? (
              <View className="items-center py-16">
                <Text className="text-[#94A3B8] text-base">No warnings found for "{search}"</Text>
              </View>
            ) : isWide ? (
              pairs.map((pair, ri) => (
                <View key={ri} style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
                  {pair.map((w, wi) => <View key={w.id} style={{ flex: 1 }}><WarningCard warning={w} delay={(ri * 2 + wi) * 40} /></View>)}
                  {pair.length === 1 && <View style={{ flex: 1 }} />}
                </View>
              ))
            ) : (
              sorted.map((w, i) => <View key={w.id} className="mb-3"><WarningCard warning={w} delay={i * 40} /></View>)
            )}
          </Animated.View>
        )}

        {tab === "ai" && <Animated.View style={bodyAnim}><AIChecker wide={isWide} /></Animated.View>}

        {tab === "history" && (
          <Animated.View style={bodyAnim}>
            {Platform.OS === "web" && <View style={{ height: 8 }} />}
            <HistoryAlerts />
          </Animated.View>
        )}

        <View className="mt-6 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <View className="flex-row items-center gap-2 mb-1.5">
            <Info size={15} color="#F59E0B" />
            <Text className="text-amber-800 dark:text-amber-300 font-bold text-sm">{t.dangerAlerts.disclaimer}</Text>
          </View>
          <Text className="text-amber-900/75 dark:text-amber-100/70 leading-5" style={{ fontSize: isWide ? 14 : 12 }}>
            {t.dangerAlerts.disclaimerText}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}