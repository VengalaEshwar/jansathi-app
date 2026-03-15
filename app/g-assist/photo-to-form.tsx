// app/g-assist/photo-to-form.tsx
import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  View, Text, ScrollView, Pressable, Animated,
  ActivityIndicator, TextInput, Linking, Modal,
  useWindowDimensions, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft, Download, Send, History,
  ChevronDown, ChevronUp, CheckCircle, Camera, FileText,
} from "lucide-react-native";
import { apiUploadImage, apiRequest } from "@/integrations/api/client";
import { ImageUpload } from "@/components/ImageUpload";
import { HeroSection } from "@/components/HeroSection";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateDbUser } from "@/store/slices/authSlice";
import { useToast } from "@/hooks/useToast";

// ─── Types ──────────────────────────────────────────────────────────────────────
interface FormField {
  id: string; label: string; type: string;
  required: boolean; placeholder: string;
  value: string; preFilledFromProfile: boolean;
}
interface HistoryItem {
  _id: string; pdfUrl: string;
  formFields: { label: string; value: string }[];
  createdAt: string;
}

// ─── Spacing constants ──────────────────────────────────────────────────────────
// Rule: NEVER use className for gap/margin between sibling elements —
// NativeWind v4 gap/margin classes are unreliable on web. Always use style={}.
const S = {
  gap6:  { gap: 6  } as const,
  gap8:  { gap: 8  } as const,
  gap10: { gap: 10 } as const,
  gap12: { gap: 12 } as const,
  gap14: { gap: 14 } as const,
  mb4:   { marginBottom: 4  } as const,
  mb6:   { marginBottom: 6  } as const,
  mb8:   { marginBottom: 8  } as const,
  mb10:  { marginBottom: 10 } as const,
  mb12:  { marginBottom: 12 } as const,
  mb14:  { marginBottom: 14 } as const,
  mb16:  { marginBottom: 16 } as const,
  mb20:  { marginBottom: 20 } as const,
  mb24:  { marginBottom: 24 } as const,
  mb32:  { marginBottom: 32 } as const,
};

// ─── useFadeSlideIn ──────────────────────────────────────────────────────────────
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

// ─── HistoryCard ─────────────────────────────────────────────────────────────────
const HistoryCard = memo(({
  item, isExpanded, onToggle, onOpenPdf,
}: {
  item: HistoryItem;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onOpenPdf: (url: string) => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const handleToggle = useCallback(() => onToggle(item._id),   [item._id,   onToggle]);
  const handlePdf    = useCallback(() => onOpenPdf(item.pdfUrl), [item.pdfUrl, onOpenPdf]);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, S.mb12]}>
      <View
        className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{
          borderRadius: 16, overflow: "hidden",
          shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
        }}
      >
        <Pressable
          onPress={handleToggle}
          onPressIn={() =>  Animated.spring(scale, { toValue: 0.98,  useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
          onPressOut={() => Animated.spring(scale, { toValue: 1,     useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
          // @ts-ignore — web only prop
          onHoverIn={() =>  { if (Platform.OS === "web") Animated.spring(scale, { toValue: 1.015, useNativeDriver: true, speed: 28, bounciness: 8 }).start(); }}
          onHoverOut={() => { if (Platform.OS === "web") Animated.spring(scale, { toValue: 1,     useNativeDriver: true, speed: 22, bounciness: 8 }).start(); }}
          style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 12 }}
        >
          <View
            className="bg-primary/10"
            style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
          >
            <FileText size={18} color="#8B5CF6" />
          </View>

          <View style={{ flex: 1 }}>
            <Text className="font-semibold text-sm text-[#0F172A] dark:text-white">
              {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
            <Text className="text-[#94A3B8] text-xs" style={S.mb4}>
              {item.formFields.length} fields filled
            </Text>
          </View>

          <AnimatedPressable
            onPress={handlePdf}
            soundType="soft"
            style={{ marginRight: 6 }}
            className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-primary text-xs font-bold">PDF</Text>
          </AnimatedPressable>

          {isExpanded
            ? <ChevronUp   size={15} color="#94A3B8" />
            : <ChevronDown size={15} color="#94A3B8" />}
        </Pressable>

        {isExpanded && (
          <View
            className="border-t border-[#E2E8F0] dark:border-[#334155]"
            style={{ paddingHorizontal: 16, paddingBottom: 16 }}
          >
            {item.formFields.map((f, i) => (
              <View
                key={i}
                className="border-b border-[#F1F5F9] dark:border-[#334155]/50"
                style={[
                  { paddingVertical: 10 },
                  i === item.formFields.length - 1 ? { borderBottomWidth: 0 } : undefined,
                ]}
              >
                <Text className="text-[#94A3B8] text-xs" style={S.mb4}>{f.label}</Text>
                <Text className="text-[#0F172A] dark:text-white font-semibold text-sm">{f.value || "—"}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
});

// ─── FormFieldInput ──────────────────────────────────────────────────────────────
const FormFieldInput = memo(({ field, value, onChange, t }: {
  field: FormField; value: string;
  onChange: (label: string, value: string) => void;
  t: any;
}) => {
  const handleChange = useCallback((v: string) => onChange(field.label, v), [field.label, onChange]);
  return (
    <View style={S.mb16}>
      <View style={[{ flexDirection: "row", alignItems: "center" }, S.gap8, S.mb6]}>
        <Text className="font-semibold text-sm text-[#0F172A] dark:text-white">
          {field.label}
          {field.required && <Text className="text-red-500"> *</Text>}
        </Text>
        {field.preFilledFromProfile && (
          <View className="bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
            <Text className="text-primary text-xs font-semibold">{t.photoForm.autoFilled}</Text>
          </View>
        )}
      </View>
      <TextInput
        placeholder={field.placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={handleChange}
        keyboardType={
          field.type === "number" ? "numeric"       :
          field.type === "phone"  ? "phone-pad"     :
          field.type === "email"  ? "email-address" : "default"
        }
        className={`border-2 rounded-xl text-[#0F172A] dark:text-white text-sm ${
          field.preFilledFromProfile
            ? "border-primary/40 bg-primary/5 dark:bg-primary/10"
            : "border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B]"
        }`}
        style={{ paddingHorizontal: 16, paddingVertical: 12 }}
      />
    </View>
  );
});

// ─── StepIndicator ───────────────────────────────────────────────────────────────
const StepIndicator = memo(({ steps, stepKeys, currentStep }: {
  steps: string[]; stepKeys: string[]; currentStep: string;
}) => (
  <View style={[{ flexDirection: "row" }, S.gap8, S.mb24]}>
    {steps.map((s, i) => {
      const active = currentStep === stepKeys[i];
      const done   = stepKeys.indexOf(currentStep) > i;
      return (
        <View
          key={s}
          className={
            active ? "bg-primary border-primary" :
            done   ? "bg-primary/10 border-primary/30" :
                     "bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155]"
          }
          style={[
            { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1 },
            active ? {
              shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
            } : undefined,
          ]}
        >
          <Text
            style={{ fontSize: 12, fontWeight: "700" }}
            className={active ? "text-white" : done ? "text-primary" : "text-[#94A3B8]"}
          >
            {done ? "✓ " : `${i + 1}. `}{s}
          </Text>
        </View>
      );
    })}
  </View>
));

// ─── SaveModal ───────────────────────────────────────────────────────────────────
const SaveModal = memo(({
  visible, newFields, selectedToSave, onToggle, onSkip, onSave, t,
}: {
  visible: boolean;
  newFields: { label: string; value: string }[];
  selectedToSave: Record<string, boolean>;
  onToggle: (label: string) => void;
  onSkip: () => void;
  onSave: () => void;
  t: any;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onSkip}>
    <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
      <View
        className="bg-white dark:bg-[#1E293B]"
        style={{
          borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24,
          shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12, shadowRadius: 20, elevation: 10,
        }}
      >
        <View style={[{ flexDirection: "row", alignItems: "center" }, S.gap10, S.mb6]}>
          <View
            className="bg-primary/10"
            style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
          >
            <CheckCircle size={17} color="#8B5CF6" />
          </View>
          <Text className="text-[#0F172A] dark:text-white text-base font-bold" style={{ flex: 1 }}>
            {t.photoForm.saveForFuture}
          </Text>
        </View>
        <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm leading-5" style={S.mb16}>
          {t.photoForm.saveDesc}
        </Text>

        <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator nestedScrollEnabled>
          {newFields.map((f) => (
            <Pressable
              key={f.label}
              onPress={() => onToggle(f.label)}
              className={
                selectedToSave[f.label]
                  ? "bg-primary/10 border-primary"
                  : "bg-[#F8FAFC] dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155]"
              }
              style={[
                { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 2 },
                S.mb8,
              ]}
            >
              <View
                className={`border-primary ${selectedToSave[f.label] ? "bg-primary" : "bg-transparent"}`}
                style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center", marginRight: 12 }}
              >
                {selectedToSave[f.label] && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "white" }} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text className="text-[#94A3B8] text-xs" style={S.mb4}>{f.label}</Text>
                <Text className="text-[#0F172A] dark:text-white font-semibold text-sm">{f.value}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View style={[{ flexDirection: "row", marginTop: 16 }, S.gap10]}>
          <AnimatedPressable
            onPress={onSkip}
            soundType="soft"
            style={{ flex: 1 }}
            className="p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] items-center"
          >
            <Text className="text-[#94A3B8] font-semibold text-sm">{t.photoForm.skip}</Text>
          </AnimatedPressable>
          <AnimatedPressable
            onPress={onSave}
            soundType="mechanical"
            style={{
              flex: 1,
              shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
            }}
            className="p-3.5 rounded-xl bg-primary items-center"
          >
            <Text className="text-white font-bold text-sm">{t.photoForm.saveAndContinue}</Text>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  </Modal>
));

// ─── DoneStep ────────────────────────────────────────────────────────────────────
const DoneStep = memo(({ pdfUrl, onReset, t }: {
  pdfUrl: string; onReset: () => void; t: any;
}) => {
  const anim = useFadeSlideIn(0);
  return (
    <Animated.View style={[anim, { alignItems: "center", paddingVertical: 24 }]}>
      {/* Web spacer fix */}
      {Platform.OS === "web" && <View style={{ height: 8 }} />}

      <View
        style={{
          width: 80, height: 80, borderRadius: 40,
          alignItems: "center", justifyContent: "center",
          backgroundColor: "#10B981",
          shadowColor: "#10B981", shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4, shadowRadius: 18, elevation: 8,
          marginBottom: 20,
        }}
      >
        <CheckCircle size={38} color="white" />
      </View>

      <Text
        className="font-extrabold text-[#0F172A] dark:text-white"
        style={{ fontSize: 24, letterSpacing: -0.5, marginBottom: 8 }}
      >
        {t.photoForm.formFilled}
      </Text>
      <Text
        className="text-[#64748B] dark:text-[#94A3B8] text-sm leading-5 text-center"
        style={{ maxWidth: 280, marginBottom: 32 }}
      >
        {t.photoForm.formFilledDesc}
      </Text>

      <AnimatedPressable
        onPress={() => Linking.openURL(pdfUrl)}
        soundType="mechanical"
        style={{
          width: "100%",
          shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35, shadowRadius: 14, elevation: 6,
        }}
        className="bg-primary px-8 py-4 rounded-xl flex-row items-center justify-center gap-2.5"
      >
        <Download size={18} color="white" />
        <Text className="text-white font-bold text-sm">{t.photoForm.download}</Text>
      </AnimatedPressable>

      <AnimatedPressable
        onPress={onReset}
        soundType="soft"
        style={{ marginTop: 16, paddingVertical: 8 }}
      >
        <Text className="text-primary font-semibold text-sm">{t.photoForm.fillAnother}</Text>
      </AnimatedPressable>
    </Animated.View>
  );
});

// ─── Main Screen ─────────────────────────────────────────────────────────────────
export default function PhotoToForm() {
  const router    = useRouter();
  const { t }     = useTranslation();
  const dbUser    = useAppSelector((s) => s.auth.dbUser);
  const dispatch  = useAppDispatch();
  const toast     = useToast();
  const { width } = useWindowDimensions();
  const isWide    = width >= 700;
  const isLarge   = width >= 1024;

  const [step,           setStep]           = useState<"upload" | "fill" | "done">("upload");
  const [isLoading,      setIsLoading]      = useState(false);
  const [fields,         setFields]         = useState<FormField[]>([]);
  const [formData,       setFormData]       = useState<Record<string, string>>({});
  const [imageId,        setImageId]        = useState("");
  const [pdfUrl,         setPdfUrl]         = useState("");
  const [saveModalOpen,  setSaveModalOpen]  = useState(false);
  const [newFields,      setNewFields]      = useState<{ label: string; value: string }[]>([]);
  const [selectedToSave, setSelectedToSave] = useState<Record<string, boolean>>({});
  const [history,        setHistory]        = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId,     setExpandedId]     = useState<string | null>(null);

  // All hooks at top-level — never inside map/callbacks
  const headerAnim  = useFadeSlideIn(0);
  const bodyAnim    = useFadeSlideIn(160);
  const historyAnim = useFadeSlideIn(280);

  // Centered container — same pattern as danger-alerts.tsx reference
  // ScrollView gets NO horizontal padding — inner View handles it
  const containerWidth = isLarge ? 860 : isWide ? 680 : undefined;
  const sidePad = containerWidth
    ? Math.max(20, (width - containerWidth) / 2)
    : 20;

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await apiRequest("/form/history");
      if (data.success) setHistory(data.history);
    } catch {}
    finally { setHistoryLoading(false); }
  };

  const handleExtract = useCallback(async (imageUri: string) => {
    setIsLoading(true);
    try {
      const data = await apiUploadImage("/form/extract", imageUri);
      setFields(data.fields);
      setImageId(data.imageId);
      const init: Record<string, string> = {};
      data.fields.forEach((f: FormField) => { init[f.label] = f.value || ""; });
      setFormData(init);
      setStep("fill");
    } catch (e: any) {
      toast.error(e.message || t.photoForm.extractFailed);
    } finally { setIsLoading(false); }
  }, [t]);

  const handleFieldChange = useCallback((label: string, value: string) => {
    setFormData(prev => ({ ...prev, [label]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    const missing = fields.filter((f) => f.required && !formData[f.label]?.trim());
    if (missing.length > 0) {
      toast.error(`${t.photoForm.pleaseFill}: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    const profileExtra = dbUser?.personalInfo?.extra || [];
    const fieldsToMaybeSave = fields
      .filter((f) => {
        const val = formData[f.label]?.trim();
        if (!val || f.preFilledFromProfile) return false;
        return !profileExtra.find((e: any) => e.label.toLowerCase() === f.label.toLowerCase());
      })
      .map((f) => ({ label: f.label, value: formData[f.label] }));

    if (fieldsToMaybeSave.length > 0) {
      setNewFields(fieldsToMaybeSave);
      const init: Record<string, boolean> = {};
      fieldsToMaybeSave.forEach((f) => { init[f.label] = true; });
      setSelectedToSave(init);
      setSaveModalOpen(true);
    } else {
      await submitForm([]);
    }
  }, [fields, formData, dbUser, t]);

  const submitForm = useCallback(async (saveToProfile: { label: string; value: string }[]) => {
    setSaveModalOpen(false);
    setIsLoading(true);
    try {
      const data = await apiRequest("/form/fill", "POST", { imageId, formData, saveToProfile });
      if (data.success) {
        setPdfUrl(data.pdfUrl);
        setStep("done");
        loadHistory();
        if (saveToProfile.length > 0 && dbUser) {
          dispatch(updateDbUser({
            personalInfo: {
              ...dbUser.personalInfo,
              extra: [...(dbUser.personalInfo?.extra || []), ...saveToProfile],
            },
          }));
        }
      }
    } catch (e: any) {
      toast.error(e.message || t.photoForm.fillFailed);
    } finally { setIsLoading(false); }
  }, [imageId, formData, dbUser, dispatch, t]);

  const handleToggleExpand    = useCallback((id: string) =>    setExpandedId(prev => prev === id ? null : id), []);
  const handleOpenPdf         = useCallback((url: string) =>   Linking.openURL(url), []);
  const handleToggleSaveField = useCallback((label: string) => setSelectedToSave(prev => ({ ...prev, [label]: !prev[label] })), []);
  const handleSaveAndContinue = useCallback(() => {
    submitForm(newFields.filter((f) => selectedToSave[f.label]));
  }, [newFields, selectedToSave, submitForm]);
  const handleReset = useCallback(() => {
    setStep("upload"); setFields([]); setFormData({}); setImageId(""); setPdfUrl("");
  }, []);

  const steps    = [t.photoForm.step1, t.photoForm.step2, t.photoForm.step3];
  const stepKeys = ["upload", "fill", "done"];

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        // No paddingHorizontal on ScrollView — centering handled by inner View
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Centered inner container — maxWidth + alignSelf centers on web without breaking ScrollView */}
        <View
          style={{
            paddingHorizontal: 10,
          }}
        >

          {/* ── Back ── */}
          <AnimatedPressable
            onPress={() => router.replace("/g-assist")}
            soundType="soft"
            style={[{ flexDirection: "row", alignItems: "center" }, S.gap6, S.mb20]}
          >
            <ArrowLeft size={18} color="#8B5CF6" />
            <Text className="text-[#8B5CF6] font-semibold text-sm">{t.photoForm.backToAssist}</Text>
          </AnimatedPressable>

          {/* ── Hero ── */}
          <Animated.View style={[headerAnim, S.mb24]}>
            <HeroSection
              icon={Camera}
              title={t.photoForm.title}
              subtitle={t.photoForm.subtitle}
              gradientColors={["#6366F1", "#06B6D4"]}
              delay={0}
            />
          </Animated.View>

          {/* ── Step Indicator ── */}
          <StepIndicator steps={steps} stepKeys={stepKeys} currentStep={step} />

          {/* ══════════ UPLOAD STEP ══════════ */}
          {step === "upload" && (
            <Animated.View style={bodyAnim}>
              {/* Web spacer — fixes NativeWind v4 first-child spacing bug on web */}
              {Platform.OS === "web" && <View style={{ height: 8 }} />}

              <ImageUpload onImageSelect={handleExtract} onClear={() => {}} disabled={isLoading} />

              {isLoading && (
                <View
                  className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
                  style={{
                    marginTop: 16, padding: 24, borderRadius: 16, alignItems: "center",
                    shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1, shadowRadius: 12, elevation: 3,
                  }}
                >
                  <ActivityIndicator size="large" color="#8B5CF6" />
                  <Text className="font-semibold text-[#0F172A] dark:text-white" style={{ marginTop: 12 }}>
                    {t.photoForm.extracting}
                  </Text>
                  <Text className="text-[#94A3B8] text-xs" style={{ marginTop: 4 }}>
                    This may take a few seconds…
                  </Text>
                </View>
              )}

              <View
                className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
                style={{
                  marginTop: 16, padding: 20, borderRadius: 16,
                  shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
                }}
              >
                <Text
                  className="font-bold text-[#0F172A] dark:text-white"
                  style={{ fontSize: 15, marginBottom: 10 }}
                >
                  {t.photoForm.howToUse}
                </Text>
                <Text
                  className="text-[#64748B] dark:text-[#94A3B8] text-sm"
                  style={{ lineHeight: 22 }}
                >
                  {t.photoForm.instructions}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ══════════ FILL STEP ══════════ */}
          {step === "fill" && (
            <Animated.View style={bodyAnim}>
              {Platform.OS === "web" && <View style={{ height: 8 }} />}

              {/* Summary card */}
              <View
                className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
                style={{
                  flexDirection: "row", alignItems: "center", gap: 12,
                  padding: 16, borderRadius: 16, marginBottom: 20,
                  shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
                }}
              >
                <View
                  className="bg-primary/10"
                  style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
                >
                  <CheckCircle size={18} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text className="font-bold text-[#0F172A] dark:text-white" style={{ fontSize: 15 }}>
                    {t.photoForm.fillDetails}
                  </Text>
                  <Text className="text-[#94A3B8] text-xs" style={{ marginTop: 2 }}>
                    {fields.length} {t.photoForm.fieldsFound}
                  </Text>
                </View>
              </View>

              {/* Fields — row pairs on wide, single col on mobile */}
              {isWide ? (
                (() => {
                  const pairs: FormField[][] = [];
                  for (let i = 0; i < fields.length; i += 2) pairs.push(fields.slice(i, i + 2));
                  return pairs.map((pair, ri) => (
                    <View key={ri} style={{ flexDirection: "row", gap: 14 }}>
                      {pair.map((field) => (
                        <View key={field.id} style={{ flex: 1 }}>
                          <FormFieldInput
                            field={field}
                            value={formData[field.label] || ""}
                            onChange={handleFieldChange}
                            t={t}
                          />
                        </View>
                      ))}
                      {pair.length === 1 && <View style={{ flex: 1 }} />}
                    </View>
                  ));
                })()
              ) : (
                fields.map((field) => (
                  <FormFieldInput
                    key={field.id}
                    field={field}
                    value={formData[field.label] || ""}
                    onChange={handleFieldChange}
                    t={t}
                  />
                ))
              )}

              <AnimatedPressable
                onPress={handleSubmit}
                disabled={isLoading}
                soundType="mechanical"
                style={{
                  marginTop: 12,
                  shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35, shadowRadius: 14, elevation: 6,
                }}
                className="bg-primary py-4 rounded-xl items-center flex-row justify-center gap-2"
              >
                {isLoading
                  ? <ActivityIndicator color="white" />
                  : <>
                      <Send size={17} color="white" />
                      <Text className="text-white font-bold text-sm">{t.photoForm.generateForm}</Text>
                    </>
                }
              </AnimatedPressable>

              <AnimatedPressable
                onPress={() => setStep("upload")}
                soundType="soft"
                style={{ marginTop: 12, paddingVertical: 8, alignItems: "center" }}
              >
                <Text className="text-[#94A3B8] text-sm">{t.photoForm.uploadDifferent}</Text>
              </AnimatedPressable>
            </Animated.View>
          )}

          {/* ══════════ DONE STEP ══════════ */}
          {step === "done" && (
            <DoneStep pdfUrl={pdfUrl} onReset={handleReset} t={t} />
          )}

          {/* ══════════ HISTORY ══════════ */}
          <Animated.View style={[historyAnim, { marginTop: 32 }]}>
            {Platform.OS === "web" && <View style={{ height: 8 }} />}

            <View style={[{ flexDirection: "row", alignItems: "center" }, S.gap10, S.mb16]}>
              <View
                className="bg-primary/10"
                style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
              >
                <History size={16} color="#8B5CF6" />
              </View>
              <Text className="font-bold text-[#0F172A] dark:text-white" style={{ fontSize: 15 }}>
                {t.photoForm.recentForms}
              </Text>
            </View>

            {historyLoading ? (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <ActivityIndicator color="#8B5CF6" />
              </View>
            ) : history.length === 0 ? (
              <View
                className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
                style={{
                  padding: 24, borderRadius: 16, alignItems: "center",
                  shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
                }}
              >
                <View
                  className="bg-primary/10"
                  style={{ width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 }}
                >
                  <History size={26} color="#8B5CF6" />
                </View>
                <Text className="font-bold text-[#0F172A] dark:text-white text-base" style={S.mb6}>
                  {t.photoForm.noForms}
                </Text>
                <Text className="text-[#94A3B8] text-sm text-center">
                  Fill your first form above to see it here
                </Text>
              </View>
            ) : isWide ? (
              (() => {
                const pairs: HistoryItem[][] = [];
                for (let i = 0; i < history.length; i += 2) pairs.push(history.slice(i, i + 2));
                return pairs.map((pair, ri) => (
                  <View key={ri} style={{ flexDirection: "row", gap: 14 }}>
                    {pair.map((item) => (
                      <View key={item._id} style={{ flex: 1 }}>
                        <HistoryCard
                          item={item}
                          isExpanded={expandedId === item._id}
                          onToggle={handleToggleExpand}
                          onOpenPdf={handleOpenPdf}
                        />
                      </View>
                    ))}
                    {pair.length === 1 && <View style={{ flex: 1 }} />}
                  </View>
                ));
              })()
            ) : (
              history.map((item) => (
                <HistoryCard
                  key={item._id}
                  item={item}
                  isExpanded={expandedId === item._id}
                  onToggle={handleToggleExpand}
                  onOpenPdf={handleOpenPdf}
                />
              ))
            )}
          </Animated.View>

        </View>{/* end centered inner container */}
      </ScrollView>

      <SaveModal
        visible={saveModalOpen}
        newFields={newFields}
        selectedToSave={selectedToSave}
        onToggle={handleToggleSaveField}
        onSkip={() => submitForm([])}
        onSave={handleSaveAndContinue}
        t={t}
      />
    </View>
  );
}