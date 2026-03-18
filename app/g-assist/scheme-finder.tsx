// app/g-assist/scheme-finder.tsx
import { useState, useCallback, useRef, useEffect, memo } from "react";
import {
  View, Text, ScrollView, FlatList, Pressable, Animated,
  TextInput, ActivityIndicator, Modal, useWindowDimensions, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft, Search, Filter, X, ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown, Sparkles, CheckCircle,
} from "lucide-react-native";
import { apiRequest } from "@/integrations/api/client";
import { HeroSection } from "@/components/HeroSection";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { useSound } from "@/hooks/useSound";

interface Scheme {
  _id: string; name: string; short_title: string; description: string;
  category: string[]; state: string[]; tags: string[];
  level: string; slug: string; matchScore?: number;
}
interface EligibilityForm {
  age: string; gender: string; caste: string; state: string;
  occupation: string; income: string;
  isDisabled: boolean; isStudent: boolean; isVeteran: boolean;
}

const CATEGORIES = [
  "All", "Agriculture,Rural & Environment",
  "Banking,Financial Services and Insurance",
  "Business & Entrepreneurship", "Education & Learning",
  "Health & Wellness", "Housing & Shelter",
  "Skills & Employment", "Social welfare & Empowerment",
  "Sports & Culture", "Women and Child",
];
const INDIAN_STATES = [
  "All","Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir",
  "Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim",
  "Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
];
const CAT_EMOJI: Record<string, string> = {
  "All": "🌐", "Agriculture,Rural & Environment": "🌾",
  "Banking,Financial Services and Insurance": "🏦", "Business & Entrepreneurship": "💼",
  "Education & Learning": "📚", "Health & Wellness": "🏥", "Housing & Shelter": "🏠",
  "Skills & Employment": "🔧", "Social welfare & Empowerment": "🤝",
  "Sports & Culture": "🎭", "Women and Child": "👩‍👧",
};

const S = {
  gap6:  { gap: 6  } as const, gap8:  { gap: 8  } as const,
  gap10: { gap: 10 } as const, gap12: { gap: 12 } as const,
  mb4:  { marginBottom: 4  } as const, mb6:  { marginBottom: 6  } as const,
  mb8:  { marginBottom: 8  } as const, mb10: { marginBottom: 10 } as const,
  mb12: { marginBottom: 12 } as const, mb14: { marginBottom: 14 } as const,
  mb16: { marginBottom: 16 } as const, mb20: { marginBottom: 20 } as const,
  mb24: { marginBottom: 24 } as const,
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

// eslint-disable-next-line react/display-name
const SchemeCard = memo(({ scheme, showScore = false, onPress }: {
  scheme: Scheme; showScore?: boolean; onPress: (s: Scheme) => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = useCallback(() => onPress(scheme), [scheme, onPress]);
  return (
    <Animated.View style={[{ transform: [{ scale }] }, S.mb12]}>
      <Pressable onPress={handlePress}
        onPressIn={() =>  Animated.spring(scale, { toValue: 0.97,  useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,     useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        // @ts-ignore
        onHoverIn={() =>  { if (Platform.OS === "web") Animated.spring(scale, { toValue: 1.02, useNativeDriver: true, speed: 28, bounciness: 8 }).start(); }}
        onHoverOut={() => { if (Platform.OS === "web") Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 8 }).start(); }}
        className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{ borderRadius: 16, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
        <View style={[{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, S.mb8]}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text className="font-bold text-sm text-[#0F172A] dark:text-white" numberOfLines={2}>{scheme.name}</Text>
            <Text className="text-primary text-xs" style={S.mb4}>{scheme.short_title}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <View className="bg-primary/10" style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
              <Text className="text-primary text-xs font-semibold">{scheme.level}</Text>
            </View>
            {showScore && scheme.matchScore !== undefined && (
              <View className="bg-green-100 dark:bg-green-900/30" style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
                <Text className="text-green-600 dark:text-green-400 text-xs font-semibold">⭐ {scheme.matchScore}</Text>
              </View>
            )}
          </View>
        </View>
        <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs leading-4" numberOfLines={3} style={S.mb8}>{scheme.description}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {scheme.tags.slice(0, 4).map((tag) => (
              <View key={tag} className="bg-[#F1F5F9] dark:bg-[#334155]" style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
                <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs">{tag}</Text>
              </View>
            ))}
            {scheme.tags.length > 4 && (
              <View className="bg-[#F1F5F9] dark:bg-[#334155]" style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
                <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs">+{scheme.tags.length - 4}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Pressable>
    </Animated.View>
  );
});

const PickerRow = memo(({ label, options, value, onChange }: {
  label: string; options: { label: string; value: string }[]; value: string; onChange: (v: string) => void;
}) => (
  <View style={S.mb14}>
    <Text className="text-[#0F172A] dark:text-white text-sm font-semibold" style={S.mb8}>{label}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <AnimatedPressable key={opt.value} onPress={() => onChange(isSelected ? "" : opt.value)} soundType="soft"
              style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99, borderWidth: 1,
                backgroundColor: isSelected ? "#8B5CF6" : "transparent",
                borderColor: isSelected ? "#8B5CF6" : "#E2E8F0",
                ...(isSelected ? { shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 } : {}) }}
              className={isSelected ? "" : "dark:border-[#334155]"}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: isSelected ? "white" : "#64748B" }}>{opt.label}</Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </ScrollView>
  </View>
));

const ToggleRow = memo(({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) => (
  <AnimatedPressable onPress={() => onChange(!value)} soundType="soft" style={S.mb8}>
    <View 
      style={{ 
        flexDirection: "row", 
        alignItems: "center", 
        justifyContent: "space-between",
        padding: 14, 
        borderRadius: 14, 
        borderWidth: 1,
        backgroundColor: value ? "#8B5CF610" : "transparent",
        borderColor: value ? "#8B5CF6" : "#E2E8F0" 
      }}
      className={value ? "" : "dark:border-[#334155]"}
    >
      <Text 
        className="text-sm text-[#0F172A] dark:text-white" 
        style={{ flex: 1, marginRight: 12 }}
      >
        {label}
      </Text>
      
      <View style={{ 
        width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: "#8B5CF6",
        alignItems: "center", justifyContent: "center",
        backgroundColor: value ? "#8B5CF6" : "transparent",
        ...(value ? { shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 3 } : {}) 
      }}>
        {value && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "white" }} />}
      </View>
    </View>
  </AnimatedPressable>
));

export default function SchemeFinder() {
  const router          = useRouter();
  const { t, language } = useTranslation();
  const ts              = t.scheme;
  const toast           = useToast();
  const { playClick }   = useSound();
  const { width }       = useWindowDimensions();
  const isWide          = width >= 700;
  const isLarge         = width >= 1100;

  const [schemes,          setSchemes]          = useState<Scheme[]>([]);
  const [total,            setTotal]            = useState(0);
  const [totalPages,       setTotalPages]       = useState(0);
  const [page,             setPage]             = useState(1);
  const [isLoading,        setIsLoading]        = useState(false);
  const [search,           setSearch]           = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedState,    setSelectedState]    = useState("");
  const [hasSearched,      setHasSearched]      = useState(false);
  const [showCategories,   setShowCategories]   = useState(true);
  const [mode,             setMode]             = useState<"browse" | "eligible">("browse");
  const [eligibleSchemes,  setEligibleSchemes]  = useState<Scheme[]>([]);
  const [isCheckingElig,   setIsCheckingElig]   = useState(false);
  const [eligibilityDone,  setEligibilityDone]  = useState(false);
  const [form,             setForm]             = useState<EligibilityForm>({
    age: "", gender: "", caste: "", state: "", occupation: "", income: "",
    isDisabled: false, isStudent: false, isVeteran: false,
  });
  const [showFilter,       setShowFilter]       = useState(false);
  const [showStatePicker, setShowStatePicker]   = useState(false);
  const [selectedScheme,   setSelectedScheme]   = useState<Scheme | null>(null);

  const headerAnim = useFadeIn(0);
  const bodyAnim   = useFadeIn(120);

  const containerWidth = isLarge ? 1100 : isWide ? 860 : undefined;
  const sidePad = containerWidth ? Math.max(24, (width - containerWidth) / 2) : 20;

  const fetchSchemes = useCallback(async (p = 1, overrides?: { category?: string; state?: string; search?: string }) => {
    setIsLoading(true); setHasSearched(true);
    try {
      const params = new URLSearchParams({
        page: String(p), limit: "10",
        search:   overrides?.search   !== undefined ? overrides.search   : search,
        category: overrides?.category !== undefined ? overrides.category : selectedCategory,
        state:    overrides?.state    !== undefined ? overrides.state    : selectedState,
      });
      const data = await apiRequest(`/schemes?${params}`);
      setSchemes(data.schemes); setTotal(data.total);
      setTotalPages(data.totalPages); setPage(p); setShowCategories(false);
    } catch (e: any) { toast.error(e.message || ts.loadFailed); }
    finally { setIsLoading(false); }
  }, [search, selectedCategory, selectedState]);

  const checkEligibility = useCallback(async () => {
    if (!form.age || !form.gender || !form.state) { toast.error(ts.requiredDesc); return; }
    setIsCheckingElig(true); setEligibilityDone(false);
    try {
      const data = await apiRequest("/schemes/eligible", "POST", { ...form, age: parseInt(form.age), language });
      setEligibleSchemes(data.schemes); setEligibilityDone(true);
    } catch (e: any) { toast.error(e.message || ts.eligibilityFailed); }
    finally { setIsCheckingElig(false); }
  }, [form, language, ts]);

  const handleSchemePress = useCallback((s: Scheme) => setSelectedScheme(s), []);

  return (
    <ScrollView className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]" showsVerticalScrollIndicator={false}>

      {/* ── FULL WIDTH: web spacer + back + HeroSection ── */}
      <Animated.View style={[headerAnim, { paddingHorizontal: sidePad, paddingTop: 16 }]}
        className="bg-[#F8FAFC] dark:bg-[#0F172A]">
        {Platform.OS === "web" && <View style={{ height: 8 }} />}

        {/* Back */}
        <AnimatedPressable onPress={() => router.back()} soundType="soft"
          style={[{ flexDirection: "row", alignItems: "center" }, S.gap6, S.mb12]}>
          <ArrowLeft size={18} color="#8B5CF6" />
          <Text className="text-[#8B5CF6] font-semibold text-sm">{t.common.back}</Text>
        </AnimatedPressable>

        {/* HeroSection */}
        <HeroSection
          icon={Sparkles}
          title={ts.title}
          subtitle={total > 0 ? `${total} ${ts.schemesAvailable}` : ts.subtitle}
          gradientColors={["#6366F1", "#8B5CF6"]}
          delay={0}
        />
        {Platform.OS === "web" && <View style={{ height: 8 }} />}

        {/* Mode toggle */}
        <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
          style={{ flexDirection: "row", borderRadius: 16, padding: 4, marginBottom: 8,
            shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
          {([
            { key: "browse",   label: `📋 ${ts.browseAll}`        },
            { key: "eligible", label: `✨ ${ts.checkEligibility}` },
          ] as const).map((m) => {
            const isActive = mode === m.key;
            return (
              <AnimatedPressable key={m.key} onPress={() => setMode(m.key)} soundType="soft"
                style={{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center", justifyContent: "center",
                  backgroundColor: isActive ? "#8B5CF6" : "transparent",
                  ...(isActive ? { shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 } : {}) }}>
                <Text style={{ fontWeight: "700", fontSize: 13, color: isActive ? "white" : "#64748B" }}>{m.label}</Text>
              </AnimatedPressable>
            );
          })}
        </View>
      </Animated.View>

      {/* ══ BROWSE MODE ══ */}
      {mode === "browse" && (
        <Animated.View style={[bodyAnim, { flex: 1 }]} className="pb-14">

          {/* Search + filter */}
          <View style={{ flexDirection: "row", paddingHorizontal: sidePad, gap: 8, marginTop: 8, marginBottom: 6 }}>
            <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
              style={{ flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 10,
                shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
              <Search size={15} color="#94A3B8" />
              <TextInput value={search} onChangeText={setSearch} placeholder={ts.searchPlaceholder}
                placeholderTextColor="#94A3B8" className="text-[#0F172A] dark:text-white text-sm"
                style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8 }}
                onSubmitEditing={() => fetchSchemes(1)} returnKeyType="search" />
              {search ? <Pressable onPress={() => setSearch("")} hitSlop={8}><X size={14} color="#94A3B8" /></Pressable> : null}
            </View>
            <AnimatedPressable onPress={() => setShowFilter(true)} soundType="soft"
              style={{ paddingHorizontal: 14, paddingVertical: 13, borderRadius: 14, borderWidth: 1,
                alignItems: "center", justifyContent: "center",
                backgroundColor: selectedCategory || selectedState ? "#8B5CF6" : "white",
                borderColor: selectedCategory || selectedState ? "#8B5CF6" : "#E2E8F0",
                shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
              className={selectedCategory || selectedState ? "" : "dark:bg-[#1E293B] dark:border-[#334155]"}>
              <Filter size={17} color={selectedCategory || selectedState ? "white" : "#94A3B8"} />
            </AnimatedPressable>
            <AnimatedPressable onPress={() => fetchSchemes(1)} soundType="mechanical"
              style={{ paddingHorizontal: 20, paddingVertical: 13, borderRadius: 14, alignItems: "center", justifyContent: "center",
                backgroundColor: "#8B5CF6", shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4 }}>
              <Text style={{ color: "white", fontSize: 14, fontWeight: "700" }}>{ts.go}</Text>
            </AnimatedPressable>
          </View>

          {/* Categories toggle */}
          <Pressable onPress={() => { playClick("soft"); setShowCategories(!showCategories); }}
            style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: sidePad, paddingVertical: 8 }}>
            <Text className="text-[#0F172A] dark:text-white text-sm font-semibold">Categories</Text>
            {showCategories ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
          </Pressable>

          {/* Category pills */}
          {showCategories && (
            <View style={{ paddingHorizontal: sidePad, marginBottom: 8 }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIES.map((cat) => {
                  const isSelected = cat === "All" ? selectedCategory === "" : selectedCategory === cat;
                  return (
                    <AnimatedPressable key={cat}
                      onPress={() => { const next = cat !== "All" ? (selectedCategory === cat ? "" : cat) : ""; setSelectedCategory(next); fetchSchemes(1, { category: next }); }}
                      soundType="soft"
                      style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1,
                        backgroundColor: isSelected ? "#8B5CF6" : "transparent",
                        borderColor: isSelected ? "#8B5CF6" : "#E2E8F0",
                        ...(isSelected ? { shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 } : {}) }}
                      className={isSelected ? "" : "dark:border-[#334155] bg-white dark:bg-[#1E293B]"}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: isSelected ? "white" : "#64748B" }}>
                        {CAT_EMOJI[cat] || "📋"} {cat.split(",")[0].split("&")[0].trim()}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Results */}
          {isLoading ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text className="text-[#94A3B8]" style={{ marginTop: 10 }}>{ts.loading}</Text>
            </View>
          ) : !hasSearched ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingVertical: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 14 }}>🏛️</Text>
              <Text className="font-bold text-base text-[#0F172A] dark:text-white text-center" style={S.mb8}>{ts.exploreTitle}</Text>
              <Text className="text-[#64748B] dark:text-[#94A3B8] text-center text-sm" style={S.mb20}>{ts.exploreDesc}</Text>
              <AnimatedPressable onPress={() => fetchSchemes(1)} soundType="mechanical"
                style={{ paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, alignItems: "center",
                  backgroundColor: "#8B5CF6", shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6 }}>
                <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>{ts.browseAllButton}</Text>
              </AnimatedPressable>
            </View>
          ) : schemes.length === 0 ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>🔍</Text>
              <Text className="font-semibold text-[#0F172A] dark:text-white">{ts.noResults}</Text>
              <Text className="text-[#94A3B8] text-sm" style={{ marginTop: 4 }}>{ts.tryDifferent}</Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: sidePad, paddingTop: 4, paddingBottom: 100 }}>
              <View style={{ flexDirection: isWide ? "row" : "column", flexWrap: isWide ? "wrap" : "nowrap", justifyContent: "space-between" }}>
                {schemes.map((item) => (
                  <View key={item._id || item.slug} style={{ width: isWide ? "48%" : "100%" }}>
                    <SchemeCard scheme={item} onPress={handleSchemePress} />
                  </View>
                ))}
              </View>
              {totalPages > 1 && (
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 14 }}>
                  <AnimatedPressable onPress={() => fetchSchemes(page - 1)} disabled={page === 1} soundType="soft"
                    style={{ padding: 8, borderRadius: 12, borderWidth: 1,
                      borderColor: page === 1 ? "#E2E8F0" : "#8B5CF6",
                      backgroundColor: page === 1 ? "transparent" : "#8B5CF610",
                      opacity: page === 1 ? 0.4 : 1 }}>
                    <ChevronLeft size={18} color={page === 1 ? "#94A3B8" : "#8B5CF6"} />
                  </AnimatedPressable>
                  <Text className="font-semibold text-[#0F172A] dark:text-white">{page} / {totalPages}</Text>
                  <AnimatedPressable onPress={() => fetchSchemes(page + 1)} disabled={page === totalPages} soundType="soft"
                    style={{ padding: 8, borderRadius: 12, borderWidth: 1,
                      borderColor: page === totalPages ? "#E2E8F0" : "#8B5CF6",
                      backgroundColor: page === totalPages ? "transparent" : "#8B5CF610",
                      opacity: page === totalPages ? 0.4 : 1 }}>
                    <ChevronRight size={18} color={page === totalPages ? "#94A3B8" : "#8B5CF6"} />
                  </AnimatedPressable>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      )}

      {/* ══ ELIGIBILITY MODE ══ */}
      {mode === "eligible" && (
        <Animated.View style={[bodyAnim, { flex: 1 }]}>
          {Platform.OS === "web" && <View style={{ height: 8 }} />}
          <View style={{ paddingHorizontal: sidePad, paddingTop: 8, paddingBottom: 100 }}>
            {!eligibilityDone ? (
              <View>
                <View className="bg-primary/10 border border-primary/30" style={{ borderRadius: 16, padding: 16, marginBottom: 20 }}>
                  <View style={[{ flexDirection: "row", alignItems: "center" }, S.gap8, S.mb6]}>
                    <Sparkles size={18} color="#8B5CF6" />
                    <Text className="text-primary font-bold text-sm">{ts.eligibilityChecker}</Text>
                  </View>
                  <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm">{ts.eligibilityDesc}</Text>
                </View>
                <View style={S.mb14}>
                  <Text className="text-[#0F172A] dark:text-white text-sm font-semibold" style={S.mb8}>
                    {ts.age} <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput value={form.age} onChangeText={(v) => setForm({ ...form, age: v })}
                    placeholder={ts.agePlaceholder} placeholderTextColor="#94A3B8" keyboardType="numeric"
                    className="border-2 border-[#E2E8F0] dark:border-[#334155] rounded-xl text-[#0F172A] dark:text-white bg-white dark:bg-[#1E293B] text-sm"
                    style={{ paddingHorizontal: 14, paddingVertical: 12 }} />
                </View>
                <PickerRow label={`${ts.gender} *`} value={form.gender} onChange={(v) => setForm({ ...form, gender: v })}
                  options={[{ label: ts.male, value: "male" }, { label: ts.female, value: "female" }, { label: ts.other, value: "other" }]} />
                <PickerRow label={ts.category} value={form.caste} onChange={(v) => setForm({ ...form, caste: v })}
                  options={[{ label: ts.general, value: "general" }, { label: "OBC", value: "obc" }, { label: "SC", value: "sc" }, { label: "ST", value: "st" }]} />
                <View style={S.mb14}>
                  <Text className="text-[#0F172A] dark:text-white text-sm font-semibold" style={S.mb8}>
                    {ts.state} <Text className="text-red-500">*</Text>
                  </Text>
                  <AnimatedPressable onPress={() => setShowStatePicker(true)} soundType="soft"
                    className="border-2 border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B]"
                    style={{ borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
                    <Text className={form.state ? "text-[#0F172A] dark:text-white text-sm" : "text-[#94A3B8] text-sm"}>
                      {form.state || "Select State"}
                    </Text>
                  </AnimatedPressable>
                </View>
                <PickerRow label={ts.occupation} value={form.occupation} onChange={(v) => setForm({ ...form, occupation: v })}
                  options={[{ label: ts.student, value: "student" }, { label: ts.farmer, value: "farmer" },
                    { label: ts.entrepreneur, value: "entrepreneur" }, { label: ts.labourer, value: "labourer" },
                    { label: ts.unemployed, value: "unemployed" }, { label: ts.govtEmployee, value: "government" }]} />
                <PickerRow label={ts.incomeLevel} value={form.income} onChange={(v) => setForm({ ...form, income: v })}
                  options={[{ label: ts.bpl, value: "bpl" }, { label: ts.lowIncome, value: "low" }, { label: ts.middleIncome, value: "middle" }]} />
                <Text className="text-[#0F172A] dark:text-white text-sm font-semibold" style={S.mb8}>{ts.additionalCriteria}</Text>
                <ToggleRow label={ts.disabled}  value={form.isDisabled} onChange={(v) => setForm({ ...form, isDisabled: v })} />
                <ToggleRow label={ts.isStudent} value={form.isStudent}  onChange={(v) => setForm({ ...form, isStudent: v })} />
                <ToggleRow label={ts.isVeteran} value={form.isVeteran}  onChange={(v) => setForm({ ...form, isVeteran: v })} />
                <AnimatedPressable onPress={checkEligibility} disabled={isCheckingElig} soundType="mechanical"
                  style={{ marginTop: 16, paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center",
                    backgroundColor: "#8B5CF6", shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6 }}>
                  {isCheckingElig ? <ActivityIndicator color="white" /> : (
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Sparkles size={17} color="white" style={{ marginRight: 8 }} />
                      <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>{ts.findEligible}</Text>
                    </View>
                  )}
                </AnimatedPressable>
              </View>
            ) : (
              <View>
                <View className="bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800"
                  style={{ borderRadius: 16, padding: 16, marginBottom: 16 }}>
                  <Text className="text-green-700 dark:text-green-400 font-bold text-base" style={S.mb4}>
                    🎉 {eligibleSchemes.length} {ts.schemesFound}
                  </Text>
                  <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm">{ts.eligibleDesc}</Text>
                </View>
                {eligibleSchemes.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 40 }}>
                    <Text style={{ fontSize: 36, marginBottom: 10 }}>😕</Text>
                    <Text className="font-semibold text-[#0F172A] dark:text-white">{ts.noMatches}</Text>
                    <Text className="text-[#94A3B8] text-sm text-center" style={{ marginTop: 4 }}>{ts.noMatchesDesc}</Text>
                  </View>
                ) : (
                  eligibleSchemes.map((s) => <SchemeCard key={s._id} scheme={s} showScore onPress={handleSchemePress} />)
                )}
                <AnimatedPressable onPress={() => { setEligibilityDone(false); setEligibleSchemes([]); }} soundType="soft"
                  style={{ marginTop: 12, paddingVertical: 14, borderRadius: 16, borderWidth: 2, alignItems: "center", borderColor: "#8B5CF6" }}>
                  <Text style={{ color: "#8B5CF6", fontWeight: "600", fontSize: 14 }}>{ts.checkAgain}</Text>
                </AnimatedPressable>
              </View>
            )}
          </View>
        </Animated.View>
      )}

      {/* Filter Modal */}
      <Modal visible={showFilter} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View className="bg-white dark:bg-[#1E293B]"
            style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: "80%" }}>
            <View style={[{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, S.mb14]}>
              <Text className="text-[#0F172A] dark:text-white font-bold text-base">{ts.filters}</Text>
              <Pressable onPress={() => setShowFilter(false)} hitSlop={8}><X size={20} color="#94A3B8" /></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-[#0F172A] dark:text-white font-semibold text-sm" style={S.mb8}>{ts.stateFilter}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.mb14}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {INDIAN_STATES.map((s) => {
                    const isSelected = selectedState === s;
                    return (
                      <AnimatedPressable key={s} onPress={() => setSelectedState(isSelected ? "" : s)} soundType="soft"
                        style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1,
                          backgroundColor: isSelected ? "#8B5CF6" : "transparent",
                          borderColor: isSelected ? "#8B5CF6" : "#E2E8F0",
                          ...(isSelected ? { shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 } : {}) }}
                        className={isSelected ? "" : "dark:border-[#334155]"}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: isSelected ? "white" : "#64748B" }}>{s}</Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              </ScrollView>
            </ScrollView>
            <View style={[{ flexDirection: "row", marginTop: 14 }, S.gap10]}>
              <AnimatedPressable onPress={() => { setSelectedCategory(""); setSelectedState(""); }} soundType="soft"
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" }}
                className="dark:border-[#334155]">
                <Text className="text-[#94A3B8] font-semibold">{ts.clearAll}</Text>
              </AnimatedPressable>
              <AnimatedPressable onPress={() => { setShowFilter(false); fetchSchemes(1); }} soundType="mechanical"
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center",
                  backgroundColor: "#8B5CF6", shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 }}>
                <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>{ts.apply}</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* State Picker Modal */}
      <Modal visible={showStatePicker} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View className="bg-white dark:bg-[#1E293B]"
            style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "70%", padding: 16, paddingBottom: 40 }}>
            <View style={[{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, S.mb14]}>
              <Text className="text-[#0F172A] dark:text-white font-bold text-base">{ts.state}</Text>
              <Pressable onPress={() => setShowStatePicker(false)} hitSlop={8}><X size={20} color="#94A3B8" /></Pressable>
            </View>
            <FlatList data={INDIAN_STATES.filter((s) => s !== "All")} keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable onPress={() => { playClick("soft"); setForm({ ...form, state: item }); setShowStatePicker(false); }}
                  style={{ paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}
                  className={`dark:border-b-[#334155] ${form.state === item ? "bg-primary/10 rounded-xl" : ""}`}>
                  <Text style={{ fontSize: 14, color: form.state === item ? "#8B5CF6" : "#0F172A", fontWeight: form.state === item ? "700" : "400" }}
                    className="dark:text-white">{item}</Text>
                </Pressable>
              )} />
          </View>
        </View>
      </Modal>

      {/* Scheme Detail Modal */}
      <Modal visible={!!selectedScheme} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View className="bg-white dark:bg-[#1E293B]" style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "85%" }}>
            <View className="border-b border-[#E2E8F0] dark:border-[#334155]"
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 16 }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text className="font-bold text-sm text-[#0F172A] dark:text-white">{selectedScheme?.name}</Text>
                <Text className="text-primary text-xs" style={{ marginTop: 2 }}>{selectedScheme?.short_title}</Text>
              </View>
              <Pressable onPress={() => setSelectedScheme(null)} hitSlop={8}><X size={20} color="#94A3B8" /></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <View style={[{ flexDirection: "row", flexWrap: "wrap" }, S.gap8, S.mb14]}>
                <View className="bg-primary/10" style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
                  <Text className="text-primary text-xs font-semibold">{selectedScheme?.level}</Text>
                </View>
                {selectedScheme?.state.slice(0, 2).map((s) => (
                  <View key={s} className="bg-[#F1F5F9] dark:bg-[#334155]" style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
                    <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs">{s}</Text>
                  </View>
                ))}
              </View>
              <Text className="font-bold text-sm text-[#0F172A] dark:text-white" style={S.mb6}>{ts.about}</Text>
              <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm leading-5" style={S.mb14}>{selectedScheme?.description}</Text>
              <Text className="font-bold text-sm text-[#0F172A] dark:text-white" style={S.mb8}>{ts.categories}</Text>
              <View style={[{ flexDirection: "row", flexWrap: "wrap" }, S.gap8, S.mb14]}>
                {selectedScheme?.category.map((cat) => (
                  <View key={cat} className="bg-primary/10" style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
                    <Text className="text-primary text-xs">{CAT_EMOJI[cat] || "📋"} {cat}</Text>
                  </View>
                ))}
              </View>
              <Text className="font-bold text-sm text-[#0F172A] dark:text-white" style={S.mb8}>{ts.tags}</Text>
              <View style={[{ flexDirection: "row", flexWrap: "wrap" }, S.gap6]}>
                {selectedScheme?.tags.map((tag) => (
                  <View key={tag} className="bg-[#F1F5F9] dark:bg-[#334155] border border-[#E2E8F0] dark:border-[#334155]"
                    style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs">{tag}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}