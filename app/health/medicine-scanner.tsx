// app/health/medicine-scanner.tsx
import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  View, Text, ScrollView, Pressable, Animated,
  ActivityIndicator, Image, Modal, Platform, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft, Volume2, VolumeX, History,
  X, ChevronDown, ChevronUp, Scan, FileText,
} from "lucide-react-native";
import * as Speech from "expo-speech";
import Markdown from "react-native-markdown-display";
import { apiUploadImage, apiRequest } from "@/integrations/api/client";
import { ImageUpload } from "@/components/ImageUpload";
import { HeroSection } from "@/components/HeroSection";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { useSound } from "@/hooks/useSound";

interface HistoryItem { _id: string; imageUrl: string; result: string; createdAt: string; }

const S = {
  gap8:  { gap: 8  } as const, gap10: { gap: 10 } as const,
  mb6:   { marginBottom: 6  } as const, mb8:  { marginBottom: 8  } as const,
  mb10:  { marginBottom: 10 } as const, mb12: { marginBottom: 12 } as const,
  mb16:  { marginBottom: 16 } as const, mb20: { marginBottom: 20 } as const,
};

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

const mdStyle = {
  body:      { color: "#374151" },
  heading2:  { color: "#8B5CF6", fontSize: 15, fontWeight: "700" as const, marginTop: 8, marginBottom: 4 },
  strong:    { fontWeight: "700" as const },
  paragraph: { color: "#374151", marginBottom: 4, lineHeight: 20 },
  list_item: { color: "#374151" },
};

const HistoryCard = memo(({ item, isExpanded, onToggle, onPreview, onSpeak, isSpeaking }: {
  item: HistoryItem; isExpanded: boolean;
  onToggle:  (id: string) => void;
  onPreview: (url: string) => void;
  onSpeak:   (text: string) => void;
  isSpeaking: boolean;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const handleToggle  = useCallback(() => onToggle(item._id),       [item._id, onToggle]);
  const handlePreview = useCallback(() => onPreview(item.imageUrl), [item.imageUrl, onPreview]);
  const handleSpeak   = useCallback(() => onSpeak(item.result),     [item.result, onSpeak]);
  return (
    <Animated.View style={[{ transform: [{ scale }] }, S.mb10]}>
      <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{ borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
        <Pressable onPress={handleToggle}
          onPressIn={() =>  Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
          onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
          style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 12 }}>
          <Pressable onPress={handlePreview} hitSlop={4}>
            <Image source={{ uri: item.imageUrl }} style={{ width: 52, height: 52, borderRadius: 12 }} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text className="text-[#0F172A] dark:text-white font-semibold" style={{ fontSize: 13 }}>
              {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
            <Text className="text-[#94A3B8]" style={{ fontSize: 11, marginTop: 2 }}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
          {isExpanded ? <ChevronUp size={15} color="#94A3B8" /> : <ChevronDown size={15} color="#94A3B8" />}
        </Pressable>
        {isExpanded && (
          <View className="border-t border-[#E2E8F0] dark:border-[#334155]"
            style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingVertical: 10 }}>
              <AnimatedPressable onPress={handleSpeak} soundType="soft">
                {isSpeaking ? <VolumeX size={20} color="#EF4444" /> : <Volume2 size={20} color="#8B5CF6" />}
              </AnimatedPressable>
            </View>
            <Markdown style={mdStyle}>{item.result}</Markdown>
          </View>
        )}
      </View>
    </Animated.View>
  );
});

export default function MedicineScanner() {
  const router          = useRouter();
  const { t, language } = useTranslation();
  const toast           = useToast();
  const { playClick }   = useSound();
  const { width }       = useWindowDimensions();
  const isWide          = width >= 700;
  const isLarge         = width >= 1100;

  const [isAnalyzing,    setIsAnalyzing]    = useState(false);
  const [analysis,       setAnalysis]       = useState("");
  const [selectedImage,  setSelectedImage]  = useState("");
  const [isSpeaking,     setIsSpeaking]     = useState(false);
  const [history,        setHistory]        = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId,     setExpandedId]     = useState<string | null>(null);
  const [previewImage,   setPreviewImage]   = useState<string | null>(null);

  const bodyAnim    = useFadeSlideIn(160);
  const historyAnim = useFadeSlideIn(280);
  const resultAnim  = useFadeSlideIn(0);

  // ── Correct width formula ──────────────────────────────────────────────────
  const containerWidth = isLarge ? 1100 : isWide ? 860 : undefined;
  const sidePad = containerWidth ? Math.max(24, (width - containerWidth) / 2) : 20;

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try { const data = await apiRequest("/ocr/history/medicine"); if (data.success) setHistory(data.history); }
    catch {} finally { setHistoryLoading(false); }
  };

  const handleAnalyze = useCallback(async (imageUri: string) => {
    setIsAnalyzing(true); setSelectedImage(imageUri); setAnalysis("");
    try { const data = await apiUploadImage("/ocr/medicine", imageUri); setAnalysis(data.analysis); loadHistory(); }
    catch (e: any) { toast.error(e.message || t.medicine.analyzeFailed); }
    finally { setIsAnalyzing(false); }
  }, [t, toast]);

  const speakText = useCallback((text: string) => {
    playClick("soft");
    if (isSpeaking) { Speech.stop(); setIsSpeaking(false); return; }
    const langCode = language === "hi" ? "hi-IN" : language === "te" ? "te-IN" : "en-IN";
    setIsSpeaking(true);
    Speech.speak(text.replace(/[#*|]/g, ""), {
      language: langCode, rate: 0.9,
      onDone: () => setIsSpeaking(false), onStopped: () => setIsSpeaking(false), onError: () => setIsSpeaking(false),
    });
  }, [isSpeaking, language, playClick]);

  const handleToggleExpand = useCallback((id: string) => setExpandedId(p => p === id ? null : id), []);
  const handlePreview      = useCallback((url: string) => setPreviewImage(url), []);
  const handleReset        = useCallback(() => { setAnalysis(""); setSelectedImage(""); }, []);

  const pairs: HistoryItem[][] = [];
  for (let i = 0; i < history.length; i += 2) pairs.push(history.slice(i, i + 2));

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── FULL WIDTH: back + HeroSection ── */}
        <View style={{ paddingHorizontal: sidePad, paddingTop: 20 }}>
          {Platform.OS === "web" && <View style={{ height: 8 }} />}

          <AnimatedPressable onPress={() => router.back()} soundType="soft"
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}>
            <ArrowLeft size={18} color="#8B5CF6" />
            <Text style={{ color: "#8B5CF6", fontWeight: "600", fontSize: 14 }}>{t.medicine.backToHealth}</Text>
          </AnimatedPressable>

          <HeroSection icon={Scan} title={t.medicine.title} subtitle={t.medicine.subtitle}
            gradientColors={["#7C3AED", "#EC4899"]} delay={0} />
          {/* Web spacer — style only, NOT className="py-2" */}
          {Platform.OS === "web" && <View style={{ height: 8 }} />}
        </View>

        {/* ── CENTERED CONTENT ── */}
        <View style={{
          paddingHorizontal: sidePad,
          ...(containerWidth ? { maxWidth: containerWidth + sidePad * 2, alignSelf: "center" as const, width: "100%" } : {}),
        }}>

          {/* Upload */}
          <Animated.View style={bodyAnim}>
            <ImageUpload onImageSelect={handleAnalyze} onClear={handleReset} disabled={isAnalyzing} />
          </Animated.View>

          {/* Analyzing */}
          {isAnalyzing && (
            <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
              style={{ marginTop: 16, padding: 24, borderRadius: 20, alignItems: "center",
                shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4 }}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text className="text-[#0F172A] dark:text-white font-semibold" style={{ marginTop: 12 }}>{t.medicine.analyzing}</Text>
            </View>
          )}

          {/* Web spacer — style only */}
          {Platform.OS === "web" && <View style={{ height: 8 }} />}

          {/* Result */}
          {analysis !== "" && (
            <Animated.View style={[resultAnim, { marginTop: 20 }]}>
              {Platform.OS === "web" && <View style={{ height: 8 }} />}
              <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
                style={{ padding: 20, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3, marginBottom: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#8B5CF618", alignItems: "center", justifyContent: "center" }}>
                      <FileText size={16} color="#8B5CF6" />
                    </View>
                    <Text className="text-[#0F172A] dark:text-white font-bold" style={{ fontSize: 15 }}>{t.medicine.analysisReport}</Text>
                  </View>
                  <AnimatedPressable onPress={() => speakText(analysis)} soundType="soft">
                    {isSpeaking ? <VolumeX size={22} color="#EF4444" /> : <Volume2 size={22} color="#8B5CF6" />}
                  </AnimatedPressable>
                </View>
                <Markdown style={mdStyle}>{analysis}</Markdown>
              </View>
              <View style={{ padding: 12, borderRadius: 14, backgroundColor: "#8B5CF610", borderWidth: 1, borderColor: "#8B5CF630", marginBottom: 10 }}>
                <Text style={{ color: "#8B5CF6", fontSize: 12 }}>{t.medicine.speakHint}</Text>
              </View>
              <AnimatedPressable onPress={handleReset} soundType="mechanical"
                style={{ paddingVertical: 14, borderRadius: 14, alignItems: "center", backgroundColor: "#8B5CF6",
                  shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 }}>
                <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>{t.medicine.scanNew}</Text>
              </AnimatedPressable>
            </Animated.View>
          )}

          {/* Instructions */}
          {!selectedImage && !isAnalyzing && (
            <Animated.View style={bodyAnim}>
              <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
                style={{ marginTop: 16, padding: 20, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                <Text className="text-[#0F172A] dark:text-white font-bold" style={{ fontSize: 15, marginBottom: 8 }}>{t.medicine.howToUse}</Text>
                <Text className="text-[#64748B] dark:text-[#94A3B8]" style={{ fontSize: 13, lineHeight: 20 }}>{t.medicine.instructions}</Text>
              </View>
            </Animated.View>
          )}

          {/* Web spacer — style only */}
          {Platform.OS === "web" && <View style={{ height: 8 }} />}

          {/* History */}
          <Animated.View style={[historyAnim, { marginTop: 28 }]}>
            {Platform.OS === "web" && <View style={{ height: 8 }} />}
            <View style={[{ flexDirection: "row", alignItems: "center" }, S.gap10, S.mb16]}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#8B5CF618", alignItems: "center", justifyContent: "center" }}>
                <History size={16} color="#8B5CF6" />
              </View>
              <Text className="text-[#0F172A] dark:text-white font-bold" style={{ fontSize: 15 }}>{t.medicine.history}</Text>
            </View>

            {historyLoading ? (
              <View style={{ alignItems: "center", paddingVertical: 24 }}><ActivityIndicator color="#8B5CF6" /></View>
            ) : history.length === 0 ? (
              <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
                style={{ padding: 24, borderRadius: 16, alignItems: "center" }}>
                <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: "#8B5CF618", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <History size={24} color="#8B5CF6" />
                </View>
                <Text className="text-[#0F172A] dark:text-white font-bold" style={S.mb6}>{t.medicine.noHistory}</Text>
                <Text className="text-[#94A3B8] text-sm text-center">Scan a medicine above to see history here</Text>
              </View>
            ) : isWide ? (
              pairs.map((pair, ri) => (
                <View key={ri} style={{ flexDirection: "row", gap: 14 }}>
                  {pair.map((item) => (
                    <View key={item._id} style={{ flex: 1 }}>
                      <HistoryCard item={item} isExpanded={expandedId === item._id}
                        onToggle={handleToggleExpand} onPreview={handlePreview} onSpeak={speakText} isSpeaking={isSpeaking} />
                    </View>
                  ))}
                  {pair.length === 1 && <View style={{ flex: 1 }} />}
                </View>
              ))
            ) : (
              history.map((item) => (
                <HistoryCard key={item._id} item={item} isExpanded={expandedId === item._id}
                  onToggle={handleToggleExpand} onPreview={handlePreview} onSpeak={speakText} isSpeaking={isSpeaking} />
              ))
            )}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" }}>
          <Pressable onPress={() => setPreviewImage(null)} style={{ position: "absolute", top: 50, right: 20, zIndex: 10 }} hitSlop={16}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
              <X size={20} color="white" />
            </View>
          </Pressable>
          {previewImage && <Image source={{ uri: previewImage }} style={{ width: 320, height: 420, borderRadius: 16 }} resizeMode="contain" />}
        </View>
      </Modal>
    </View>
  );
}