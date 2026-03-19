// app/health/prescription-reader.tsx
/* eslint-disable react/display-name */
import { useState, useEffect, useRef, memo, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, Animated, ActivityIndicator,
  Image, Modal, Platform, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Volume2, VolumeX, History, X, ChevronDown, ChevronUp, FileText } from "lucide-react-native";
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
  mb16:  { marginBottom: 16 } as const,
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

const HistoryCard = memo(({ item, isExpanded, onToggleExpand, onPreviewImage, onSpeak, isSpeakingThis, playClick }: {
  item: HistoryItem; isExpanded: boolean;
  onToggleExpand: (id: string) => void; onPreviewImage: (url: string) => void;
  onSpeak: (text: string) => void; isSpeakingThis: boolean; playClick: (type: string) => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }} className="mb-2.5">
      <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl overflow-hidden">
        <Pressable onPress={() => { playClick("soft"); onToggleExpand(item._id); }}
          onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
          onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
          className="flex-row items-center p-3 gap-3">
          <Pressable onPress={() => { playClick("soft"); onPreviewImage(item.imageUrl); }}>
            <Image source={{ uri: item.imageUrl }} style={{ width: 50, height: 50, borderRadius: 12 }} />
          </Pressable>
          <View className="flex-1">
            <Text className="font-semibold text-sm text-[#0F172A] dark:text-white">
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            <Text className="text-[#94A3B8] text-xs">{new Date(item.createdAt).toLocaleTimeString()}</Text>
          </View>
          {isExpanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
        </Pressable>
        {isExpanded && (
          <View className="px-4 pb-4 border-t border-[#E2E8F0] dark:border-[#334155]">
            <View className="flex-row justify-end mt-2 mb-2">
              <AnimatedPressable onPress={() => onSpeak(item.result)} soundType="soft">
                {isSpeakingThis ? <VolumeX size={18} color="#EF4444" /> : <Volume2 size={18} color="#8B5CF6" />}
              </AnimatedPressable>
            </View>
            <Markdown style={mdStyle}>{item.result}</Markdown>
          </View>
        )}
      </View>
    </Animated.View>
  );
});

export default function PrescriptionReader() {
  const router          = useRouter();
  const { t, language } = useTranslation();
  const toast           = useToast();
  const { playClick }   = useSound();
  const { width }       = useWindowDimensions();
  const isWide          = width >= 700;
  const isLarge         = width >= 1100;

  const [isReading,         setIsReading]         = useState(false);
  const [prescriptionText,  setPrescriptionText]  = useState("");
  const [selectedImage,     setSelectedImage]     = useState("");
  const [isSpeaking,        setIsSpeaking]        = useState(false);
  const [history,           setHistory]           = useState<HistoryItem[]>([]);
  const [historyLoading,    setHistoryLoading]    = useState(false);
  const [expandedId,        setExpandedId]        = useState<string | null>(null);
  const [previewImage,      setPreviewImage]      = useState<string | null>(null);

  const bodyAnim    = useFadeSlideIn(200);
  const historyAnim = useFadeSlideIn(300);

  // ── Correct width formula ──────────────────────────────────────────────────
  const containerWidth = isLarge ? 1100 : isWide ? 860 : undefined;
  const sidePad = containerWidth ? Math.max(24, (width - containerWidth) / 2) : 20;

  const isSpeakingRef = useRef(isSpeaking);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try { const data = await apiRequest("/ocr/history/prescription"); if (data.success) setHistory(data.history); }
    catch {} finally { setHistoryLoading(false); }
  };

  const handleRead = async (imageDataUrl: string) => {
    setIsReading(true); setSelectedImage(imageDataUrl); setPrescriptionText("");
    try { const data = await apiUploadImage("/ocr/prescription", imageDataUrl); setPrescriptionText(data.prescriptionText); loadHistory(); }
    catch (e: any) { toast.error(e.message || t.prescription.readFailed); }
    finally { setIsReading(false); }
  };

  const handleToggleExpand = useCallback((id: string) => { setExpandedId((prev) => (prev === id ? null : id)); }, []);

  const speakText = useCallback((text: string) => {
    playClick("soft");
    if (isSpeakingRef.current) { Speech.stop(); setIsSpeaking(false); return; }
    const langCode = language === "hi" ? "hi-IN" : language === "te" ? "te-IN" : "en-IN";
    setIsSpeaking(true);
    Speech.speak(text.replace(/[#*|]/g, ""), {
      language: langCode, pitch: 1, rate: 0.9,
      onDone: () => setIsSpeaking(false), onStopped: () => setIsSpeaking(false), onError: () => setIsSpeaking(false),
    });
  }, [language, playClick]);

  // 2-col pairs for wide
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
            <Text className="text-[#8B5CF6] font-semibold text-sm">{t.prescription.backToHealth}</Text>
          </AnimatedPressable>

          <HeroSection icon={FileText} title={t.prescription.title} subtitle={t.prescription.subtitle}
            gradientColors={["#6366F1", "#8B5CF6"]} delay={0} />
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
            <ImageUpload onImageSelect={handleRead} onClear={() => { setPrescriptionText(""); setSelectedImage(""); }} disabled={isReading} />
          </Animated.View>

          {/* Web spacer — style only */}
          {Platform.OS === "web" && <View style={{ height: 8 }} />}

          {/* Loading */}
          {isReading && (
            <View className="mt-5 p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] items-center">
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text className="mt-3 font-semibold text-[#0F172A] dark:text-white">{t.prescription.reading}</Text>
            </View>
          )}

          {/* Result */}
          {prescriptionText !== "" && (
            <Animated.View style={useFadeSlideIn(0)} className="mt-5">
              <View className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="font-bold text-[15px] text-[#0F172A] dark:text-white">{t.prescription.details}</Text>
                  <AnimatedPressable onPress={() => speakText(prescriptionText)} soundType="soft">
                    {isSpeaking ? <VolumeX size={22} color="#EF4444" /> : <Volume2 size={22} color="#8B5CF6" />}
                  </AnimatedPressable>
                </View>
                <Markdown style={mdStyle}>{prescriptionText}</Markdown>
              </View>
              <View className="mt-2.5 p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Text className="text-[#8B5CF6] text-xs">{t.prescription.speakHint}</Text>
              </View>
              <AnimatedPressable onPress={() => { setPrescriptionText(""); setSelectedImage(""); }} soundType="mechanical"
                style={{ marginTop: 12, paddingVertical: 14, borderRadius: 14, alignItems: "center", backgroundColor: "#8B5CF6",
                  shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 }}>
                <Text style={{ color: "white", fontWeight: "700" }}>{t.prescription.scanNew}</Text>
              </AnimatedPressable>
            </Animated.View>
          )}

          {/* Instructions */}
          {!selectedImage && !isReading && (
            <Animated.View style={bodyAnim} className="mt-4">
              <View className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
                <Text className="font-bold mb-2 text-[#0F172A] dark:text-white">{t.prescription.howToUse}</Text>
                <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm leading-5">{t.prescription.instructions}</Text>
              </View>
            </Animated.View>
          )}

          {/* Web spacer — style only */}
          {Platform.OS === "web" && <View style={{ height: 8 }} />}

          {/* History */}
          <Animated.View style={historyAnim} className="mt-6">
            <View style={[{ flexDirection: "row", alignItems: "center" }, S.gap8, S.mb12]}>
              <View className="w-8 h-8 rounded-[10px] bg-primary/10 items-center justify-center">
                <History size={16} color="#8B5CF6" />
              </View>
              <Text className="font-bold text-[15px] text-[#0F172A] dark:text-white">{t.prescription.history}</Text>
            </View>

            {historyLoading ? (
              <ActivityIndicator color="#8B5CF6" />
            ) : history.length === 0 ? (
              <Text className="text-[#94A3B8] text-sm">{t.prescription.noHistory}</Text>
            ) : isWide ? (
              pairs.map((pair, ri) => (
                <View key={ri} style={{ flexDirection: "row", gap: 14 }}>
                  {pair.map((item) => (
                    <View key={item._id} style={{ flex: 1 }}>
                      <HistoryCard item={item} isExpanded={expandedId === item._id}
                        onToggleExpand={handleToggleExpand} onPreviewImage={setPreviewImage}
                        onSpeak={speakText} isSpeakingThis={isSpeaking && expandedId === item._id} playClick={playClick} />
                    </View>
                  ))}
                  {pair.length === 1 && <View style={{ flex: 1 }} />}
                </View>
              ))
            ) : (
              history.map((item) => (
                <HistoryCard key={item._id} item={item} isExpanded={expandedId === item._id}
                  onToggleExpand={handleToggleExpand} onPreviewImage={setPreviewImage}
                  onSpeak={speakText} isSpeakingThis={isSpeaking && expandedId === item._id} playClick={playClick} />
              ))
            )}
          </Animated.View>
        </View>
      </ScrollView>

      <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", alignItems: "center", justifyContent: "center" }}>
          <Pressable onPress={() => setPreviewImage(null)} style={{ position: "absolute", top: 50, right: 20, zIndex: 10 }}>
            <X size={28} color="white" />
          </Pressable>
          {previewImage && <Image source={{ uri: previewImage }} style={{ width: 320, height: 420, borderRadius: 16 }} resizeMode="contain" />}
        </View>
      </Modal>
    </View>
  );
}