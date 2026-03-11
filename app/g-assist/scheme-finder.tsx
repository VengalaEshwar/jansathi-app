import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Sparkles,
  CheckCircle,
} from "lucide-react-native";
import { apiRequest } from "@/integrations/api/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";

/* ─── Types ─────────────────────────────────────────────── */
interface Scheme {
  _id: string;
  name: string;
  short_title: string;
  description: string;
  category: string[];
  state: string[];
  tags: string[];
  level: string;
  slug: string;
  matchScore?: number;
}

interface EligibilityForm {
  age: string;
  gender: string;
  caste: string;
  state: string;
  occupation: string;
  income: string;
  isDisabled: boolean;
  isStudent: boolean;
  isVeteran: boolean;
}

/* ─── Constants ──────────────────────────────────────────── */
const CATEGORIES = [
  "All",
  "Agriculture,Rural & Environment",
  "Banking,Financial Services and Insurance",
  "Business & Entrepreneurship",
  "Education & Learning",
  "Health & Wellness",
  "Housing & Shelter",
  "Skills & Employment",
  "Social welfare & Empowerment",
  "Sports & Culture",
  "Women and Child",
];

const INDIAN_STATES = [
  "All", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

const CATEGORY_EMOJI: Record<string, string> = {
  "All": "🌐",
  "Agriculture,Rural & Environment": "🌾",
  "Banking,Financial Services and Insurance": "🏦",
  "Business & Entrepreneurship": "💼",
  "Education & Learning": "📚",
  "Health & Wellness": "🏥",
  "Housing & Shelter": "🏠",
  "Skills & Employment": "🔧",
  "Social welfare & Empowerment": "🤝",
  "Sports & Culture": "🎭",
  "Women and Child": "👩‍👧",
};

/* ─── Main Component ─────────────────────────────────────── */
export default function SchemeFinder() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const ts = t.scheme;
  const toast = useToast();

  // Browse state
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // UI toggles
  const [showCategories, setShowCategories] = useState(true);

  // Eligibility state
  const [mode, setMode] = useState<"browse" | "eligible">("browse");
  const [eligibleSchemes, setEligibleSchemes] = useState<Scheme[]>([]);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [eligibilityDone, setEligibilityDone] = useState(false);
  const [form, setForm] = useState<EligibilityForm>({
    age: "",
    gender: "",
    caste: "",
    state: "",
    occupation: "",
    income: "",
    isDisabled: false,
    isStudent: false,
    isVeteran: false,
  });

  // Filter & State Picker modals
  const [showFilter, setShowFilter] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);

  // Scheme detail modal
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);

  /* ── Browse: fetch schemes ── */
  const fetchSchemes = useCallback(async (
    p: number = 1,
    overrides?: { category?: string; state?: string; search?: string }
  ) => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: "10",
        search: overrides?.search !== undefined ? overrides.search : search,
        category: overrides?.category !== undefined ? overrides.category : selectedCategory,
        state: overrides?.state !== undefined ? overrides.state : selectedState,
      });
      const data = await apiRequest(`/schemes?${params}`);
      setSchemes(data.schemes);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(p);
      setShowCategories(false);
    } catch (e: any) {
      toast.error(e.message || ts.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, selectedState]);

  /* ── Eligibility check ── */
  const checkEligibility = async () => {
    if (!form.age || !form.gender || !form.state) {
      toast.error(ts.requiredDesc);
      return;
    }
    setIsCheckingEligibility(true);
    setEligibilityDone(false);
    try {
      const data = await apiRequest("/schemes/eligible", "POST", {
        ...form,
        age: parseInt(form.age),
        language,
      });
      setEligibleSchemes(data.schemes);
      setEligibilityDone(true);
    } catch (e: any) {
      toast.error(e.message || ts.eligibilityFailed);
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  /* ── Render scheme card ── */
  const renderSchemeCard = (scheme: Scheme, showScore = false) => (
    <Pressable
      key={scheme._id || scheme.slug}
      onPress={() => setSelectedScheme(scheme)}
      className="mb-3 bg-light-card dark:bg-card border border-light-border dark:border-border rounded-2xl p-4"
    >
      {/* Header */}
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-light-foreground dark:text-foreground font-bold text-sm" numberOfLines={2}>
            {scheme.name}
          </Text>
          <Text className="text-primary text-xs mt-0.5">{scheme.short_title}</Text>
        </View>
        <View className="items-end gap-1">
          <View className="bg-primary/20 px-2 py-0.5 rounded-full">
            <Text className="text-primary text-xs">{scheme.level}</Text>
          </View>
          {showScore && scheme.matchScore !== undefined && (
            <View className="bg-green-500/20 px-2 py-0.5 rounded-full">
              <Text className="text-green-400 text-xs">⭐ {scheme.matchScore} {ts.match}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Description */}
      <Text className="text-muted text-xs leading-relaxed" numberOfLines={3}>
        {scheme.description}
      </Text>

      {/* Tags */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
        <View className="flex-row gap-1">
          {scheme.tags.slice(0, 4).map((tag) => (
            <View key={tag} className="bg-secondary px-2 py-0.5 rounded-full">
              <Text className="text-muted text-xs">{tag}</Text>
            </View>
          ))}
          {scheme.tags.length > 4 && (
            <View className="bg-secondary px-2 py-0.5 rounded-full">
              <Text className="text-muted text-xs">+{scheme.tags.length - 4}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Categories */}
      <View className="flex-row flex-wrap gap-1 mt-2">
        {scheme.category.map((cat) => (
          <Text key={cat} className="text-xs text-muted">
            {CATEGORY_EMOJI[cat] || "📋"} {cat.split(",")[0]}
          </Text>
        ))}
      </View>
    </Pressable>
  );

  /* ── Picker helper ── */
  const PickerRow = ({
    label,
    options,
    value,
    onChange,
  }: {
    label: string;
    options: { label: string; value: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <View className="mb-4">
      <Text className="text-light-foreground dark:text-foreground text-sm font-semibold mb-2">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => onChange(value === opt.value ? "" : opt.value)}
              className={`px-3 py-2 rounded-xl border ${
                value === opt.value
                  ? "bg-primary border-primary"
                  : "bg-secondary border-light-border dark:border-border"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  value === opt.value ? "text-white" : "text-muted"
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const ToggleRow = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <Pressable
      onPress={() => onChange(!value)}
      className={`flex-row items-center justify-between p-3 rounded-xl border mb-2 ${
        value ? "bg-primary/10 border-primary" : "bg-secondary border-light-border dark:border-border"
      }`}
    >
      <Text className="text-light-foreground dark:text-foreground text-sm">{label}</Text>
      <View
        className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
          value ? "bg-primary border-primary" : "border-light-border dark:border-border"
        }`}
      >
        {value && <CheckCircle size={12} color="white" />}
      </View>
    </Pressable>
  );

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <View className="flex-1 bg-light-background dark:bg-background">

      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Pressable onPress={() => router.back()} className="flex-row items-center mb-4">
          <ArrowLeft size={20} color="#6b7280" />
          <Text className="ml-2 text-muted">{t.common.back}</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-light-foreground dark:text-foreground">{ts.title}</Text>
        <Text className="text-muted text-sm mt-1">
          {total > 0 ? `${total} ${ts.schemesAvailable}` : ts.subtitle}
        </Text>
      </View>

      {/* Mode Toggle */}
      <View className="flex-row mx-4 mb-3 bg-secondary rounded-xl p-1">
        <Pressable
          onPress={() => setMode("browse")}
          className={`flex-1 py-2.5 rounded-lg items-center ${mode === "browse" ? "bg-primary" : ""}`}
        >
          <Text className={`text-sm font-semibold ${mode === "browse" ? "text-white" : "text-muted"}`}>
            📋 {ts.browseAll}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode("eligible")}
          className={`flex-1 py-2.5 rounded-lg items-center ${mode === "eligible" ? "bg-primary" : ""}`}
        >
          <Text className={`text-sm font-semibold ${mode === "eligible" ? "text-white" : "text-muted"}`}>
            ✨ {ts.checkEligibility}
          </Text>
        </Pressable>
      </View>

      {/* ── BROWSE MODE ── */}
      {mode === "browse" && (
        <View className="flex-1">
          {/* Search Bar */}
          <View className="flex-row mx-4 mb-2 gap-2">
            <View className="flex-1 flex-row items-center bg-light-card dark:bg-card border border-light-border dark:border-border rounded-xl px-3">
              <Search size={16} color="#6b7280" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={ts.searchPlaceholder}
                placeholderTextColor="#6b7280"
                className="flex-1 py-2.5 px-2 text-light-foreground dark:text-foreground text-sm"
                onSubmitEditing={() => fetchSchemes(1)}
                returnKeyType="search"
              />
              {search ? (
                <Pressable onPress={() => { setSearch(""); }}>
                  <X size={16} color="#6b7280" />
                </Pressable>
              ) : null}
            </View>
            <Pressable
              onPress={() => setShowFilter(true)}
              className={`px-3 rounded-xl border items-center justify-center ${
                selectedCategory || selectedState
                  ? "bg-primary border-primary"
                  : "bg-light-card dark:bg-card border-light-border dark:border-border"
              }`}
            >
              <Filter size={18} color={selectedCategory || selectedState ? "white" : "#6b7280"} />
            </Pressable>
            <Pressable
              onPress={() => fetchSchemes(1)}
              className="bg-primary px-4 rounded-xl items-center justify-center"
            >
              <Text className="text-white text-sm font-semibold">{ts.go}</Text>
            </Pressable>
          </View>

          {/* Categories Toggle Header */}
          <Pressable
            onPress={() => setShowCategories(!showCategories)}
            className="flex-row justify-between items-center px-5 py-2"
          >
            <Text className="text-light-foreground dark:text-foreground text-sm font-semibold">
              {selectedCategory && !showCategories
                ? `${ts.categorySelected}: ${selectedCategory.split(",")[0]}`
                : ts.categoriesLabel}
            </Text>
            {showCategories ? (
              <ChevronUp size={18} color="#6b7280" />
            ) : (
              <ChevronDown size={18} color="#6b7280" />
            )}
          </Pressable>

          {/* Category Quick Filter Grid */}
          {showCategories && (
            <View className="mb-2 px-4">
              <View className="flex-row flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = cat === "All" ? selectedCategory === "" : selectedCategory === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => {
                        let nextCategory = "";
                        if (cat !== "All") {
                          nextCategory = selectedCategory === cat ? "" : cat;
                        }
                        setSelectedCategory(nextCategory);
                        fetchSchemes(1, { category: nextCategory });
                      }}
                      className={`px-3 py-1.5 rounded-full border ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "bg-light-card dark:bg-card border-light-border dark:border-border"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          isSelected ? "text-white" : "text-muted"
                        }`}
                      >
                        {CATEGORY_EMOJI[cat] || "📋"} {cat.split(",")[0].split("&")[0].trim()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Schemes List */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text className="text-muted mt-3">{ts.loading}</Text>
            </View>
          ) : !hasSearched ? (
            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-5xl mb-4">🏛️</Text>
              <Text className="text-light-foreground dark:text-foreground font-bold text-lg text-center mb-2">
                {ts.exploreTitle}
              </Text>
              <Text className="text-muted text-center text-sm mb-6">
                {ts.exploreDesc}
              </Text>
              <Pressable
                onPress={() => fetchSchemes(1)}
                className="bg-primary px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">{ts.browseAllButton}</Text>
              </Pressable>
            </View>
          ) : schemes.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-4xl mb-3">🔍</Text>
              <Text className="text-light-foreground dark:text-foreground font-semibold">{ts.noResults}</Text>
              <Text className="text-muted text-sm mt-1">{ts.tryDifferent}</Text>
            </View>
          ) : (
            <FlatList
              data={schemes}
              keyExtractor={(item) => item._id || item.slug}
              contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
              renderItem={({ item }) => renderSchemeCard(item)}
              ListFooterComponent={
                totalPages > 1 ? (
                  <View className="flex-row items-center justify-center gap-3 mt-4">
                    <Pressable
                      onPress={() => fetchSchemes(page - 1)}
                      disabled={page === 1}
                      className={`p-2 rounded-xl border ${
                        page === 1 ? "border-light-border dark:border-border opacity-40" : "border-primary bg-primary/10"
                      }`}
                    >
                      <ChevronLeft size={20} color={page === 1 ? "#6b7280" : "#8B5CF6"} />
                    </Pressable>
                    <Text className="text-light-foreground dark:text-foreground font-semibold">
                      {page} / {totalPages}
                    </Text>
                    <Pressable
                      onPress={() => fetchSchemes(page + 1)}
                      disabled={page === totalPages}
                      className={`p-2 rounded-xl border ${
                        page === totalPages ? "border-light-border dark:border-border opacity-40" : "border-primary bg-primary/10"
                      }`}
                    >
                      <ChevronRight size={20} color={page === totalPages ? "#6b7280" : "#8B5CF6"} />
                    </Pressable>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      )}

      {/* ── ELIGIBILITY MODE ── */}
      {mode === "eligible" && (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {!eligibilityDone ? (
            <View>
              <View className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-6">
                <View className="flex-row items-center mb-2">
                  <Sparkles size={20} color="#8B5CF6" />
                  <Text className="text-primary font-bold ml-2 text-base">
                    {ts.eligibilityChecker}
                  </Text>
                </View>
                <Text className="text-muted text-sm">
                  {ts.eligibilityDesc}
                </Text>
              </View>

              {/* Age */}
              <View className="mb-4">
                <Text className="text-light-foreground dark:text-foreground text-sm font-semibold mb-2">
                  {ts.age} <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={form.age}
                  onChangeText={(v) => setForm({ ...form, age: v })}
                  placeholder={ts.agePlaceholder}
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  className="border border-light-border dark:border-border rounded-xl px-3 py-2.5 text-light-foreground dark:text-foreground bg-light-card dark:bg-card"
                />
              </View>

              {/* Gender */}
              <PickerRow
                label={`${ts.gender} *`}
                value={form.gender}
                onChange={(v) => setForm({ ...form, gender: v })}
                options={[
                  { label: ts.male, value: "male" },
                  { label: ts.female, value: "female" },
                  { label: ts.other, value: "other" },
                ]}
              />

              {/* Caste */}
              <PickerRow
                label={ts.category}
                value={form.caste}
                onChange={(v) => setForm({ ...form, caste: v })}
                options={[
                  { label: ts.general, value: "general" },
                  { label: "OBC", value: "obc" },
                  { label: "SC", value: "sc" },
                  { label: "ST", value: "st" },
                ]}
              />

              {/* State - Modal Picker */}
              <View className="mb-4">
                <Text className="text-light-foreground dark:text-foreground text-sm font-semibold mb-2">
                  {ts.state} <Text className="text-red-500">*</Text>
                </Text>
                <Pressable
                  onPress={() => setShowStatePicker(true)}
                  className="border border-light-border dark:border-border rounded-xl px-3 py-3 bg-light-card dark:bg-card"
                >
                  <Text className={form.state ? "text-light-foreground dark:text-foreground" : "text-muted"}>
                    {form.state || ts.selectState}
                  </Text>
                </Pressable>
              </View>

              {/* Occupation */}
              <PickerRow
                label={ts.occupation}
                value={form.occupation}
                onChange={(v) => setForm({ ...form, occupation: v })}
                options={[
                  { label: ts.student, value: "student" },
                  { label: ts.farmer, value: "farmer" },
                  { label: ts.entrepreneur, value: "entrepreneur" },
                  { label: ts.labourer, value: "labourer" },
                  { label: ts.unemployed, value: "unemployed" },
                  { label: ts.govtEmployee, value: "government" },
                ]}
              />

              {/* Income */}
              <PickerRow
                label={ts.incomeLevel}
                value={form.income}
                onChange={(v) => setForm({ ...form, income: v })}
                options={[
                  { label: ts.bpl, value: "bpl" },
                  { label: ts.lowIncome, value: "low" },
                  { label: ts.middleIncome, value: "middle" },
                ]}
              />

              {/* Toggles */}
              <Text className="text-light-foreground dark:text-foreground text-sm font-semibold mb-2">
                {ts.additionalCriteria}
              </Text>
              <ToggleRow
                label={ts.disabled}
                value={form.isDisabled}
                onChange={(v) => setForm({ ...form, isDisabled: v })}
              />
              <ToggleRow
                label={ts.isStudent}
                value={form.isStudent}
                onChange={(v) => setForm({ ...form, isStudent: v })}
              />
              <ToggleRow
                label={ts.isVeteran}
                value={form.isVeteran}
                onChange={(v) => setForm({ ...form, isVeteran: v })}
              />

              {/* Submit */}
              <Pressable
                onPress={checkEligibility}
                disabled={isCheckingEligibility}
                className="bg-primary py-3.5 rounded-xl items-center mt-6 flex-row justify-center gap-2"
              >
                {isCheckingEligibility ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Sparkles size={18} color="white" />
                    <Text className="text-white font-bold ml-2">
                      {ts.findEligible}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            <View>
              {/* Results header */}
              <View className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-5">
                <Text className="text-green-400 font-bold text-lg">
                  🎉 {eligibleSchemes.length} {ts.schemesFound}
                </Text>
                <Text className="text-muted text-sm mt-1">
                  {ts.eligibleDesc}
                </Text>
              </View>

              {eligibleSchemes.length === 0 ? (
                <View className="items-center py-10">
                  <Text className="text-4xl mb-3">😕</Text>
                  <Text className="text-light-foreground dark:text-foreground font-semibold">{ts.noMatches}</Text>
                  <Text className="text-muted text-sm mt-1 text-center">
                    {ts.noMatchesDesc}
                  </Text>
                </View>
              ) : (
                eligibleSchemes.map((s) => renderSchemeCard(s, true))
              )}

              <Pressable
                onPress={() => {
                  setEligibilityDone(false);
                  setEligibleSchemes([]);
                }}
                className="mt-4 py-3 rounded-xl border border-primary items-center"
              >
                <Text className="text-primary font-semibold">{ts.checkAgain}</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Filter Modal ── */}
      <Modal visible={showFilter} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-light-card dark:bg-card rounded-t-2xl p-5 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-light-foreground dark:text-foreground font-bold text-lg">{ts.filters}</Text>
              <Pressable onPress={() => setShowFilter(false)}>
                <X size={22} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView>
              <Text className="text-light-foreground dark:text-foreground font-semibold mb-2">{ts.stateFilter}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                <View className="flex-row gap-2">
                  {INDIAN_STATES.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setSelectedState(selectedState === s ? "" : s)}
                      className={`px-3 py-1.5 rounded-full border ${
                        selectedState === s
                          ? "bg-primary border-primary"
                          : "bg-secondary border-light-border dark:border-border"
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          selectedState === s ? "text-white" : "text-muted"
                        }`}
                      >
                        {s}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </ScrollView>

            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={() => {
                  setSelectedCategory("");
                  setSelectedState("");
                }}
                className="flex-1 py-3 rounded-xl border border-light-border dark:border-border items-center"
              >
                <Text className="text-muted font-semibold">{ts.clearAll}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowFilter(false);
                  fetchSchemes(1);
                }}
                className="flex-1 py-3 rounded-xl bg-primary items-center"
              >
                <Text className="text-white font-semibold">{ts.apply}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── State Selection Modal for Eligibility ── */}
      <Modal visible={showStatePicker} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-light-card dark:bg-card rounded-t-2xl max-h-[70%] p-4 pb-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-light-foreground dark:text-foreground font-bold text-lg">{ts.selectStateTitle}</Text>
              <Pressable onPress={() => setShowStatePicker(false)}>
                <X size={22} color="#6b7280" />
              </Pressable>
            </View>
            <FlatList
              data={INDIAN_STATES.filter((s) => s !== "All")}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  className={`py-3 px-2 border-b border-light-border dark:border-border ${
                    form.state === item ? "bg-primary/10 rounded-lg" : ""
                  }`}
                  onPress={() => {
                    setForm({ ...form, state: item });
                    setShowStatePicker(false);
                  }}
                >
                  <Text
                    className={`text-base ${
                      form.state === item ? "text-primary font-bold" : "text-light-foreground dark:text-foreground"
                    }`}
                  >
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ── Scheme Detail Modal ── */}
      <Modal visible={!!selectedScheme} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-light-card dark:bg-card rounded-t-2xl max-h-[85%]">
            {/* Header */}
            <View className="flex-row justify-between items-start p-4 border-b border-light-border dark:border-border">
              <View className="flex-1 mr-3">
                <Text className="text-light-foreground dark:text-foreground font-bold text-base">
                  {selectedScheme?.name}
                </Text>
                <Text className="text-primary text-sm mt-0.5">
                  {selectedScheme?.short_title}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedScheme(null)}>
                <X size={22} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {/* Level & State badges */}
              <View className="flex-row gap-2 mb-4">
                <View className="bg-primary/20 px-3 py-1 rounded-full">
                  <Text className="text-primary text-xs font-semibold">
                    {selectedScheme?.level}
                  </Text>
                </View>
                {selectedScheme?.state.slice(0, 2).map((s) => (
                  <View key={s} className="bg-secondary px-3 py-1 rounded-full">
                    <Text className="text-muted text-xs">{s}</Text>
                  </View>
                ))}
              </View>

              <Text className="text-light-foreground dark:text-foreground font-semibold mb-2">{ts.about}</Text>
              <Text className="text-muted text-sm leading-relaxed mb-4">
                {selectedScheme?.description}
              </Text>

              <Text className="text-light-foreground dark:text-foreground font-semibold mb-2">{ts.categories}</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {selectedScheme?.category.map((cat) => (
                  <View key={cat} className="bg-primary/10 px-3 py-1 rounded-full">
                    <Text className="text-primary text-xs">
                      {CATEGORY_EMOJI[cat] || "📋"} {cat}
                    </Text>
                  </View>
                ))}
              </View>

              <Text className="text-light-foreground dark:text-foreground font-semibold mb-2">{ts.tags}</Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {selectedScheme?.tags.map((tag) => (
                  <View key={tag} className="bg-secondary border border-light-border dark:border-border px-2 py-1 rounded-lg">
                    <Text className="text-muted text-xs">{tag}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}