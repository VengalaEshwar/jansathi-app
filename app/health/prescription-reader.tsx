// app/health/prescription-reader.tsx
import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  History,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react-native";
import * as Speech from "expo-speech";
import { apiUploadImage, apiRequest } from "@/integrations/api/client";
import { ImageUpload } from "@/components/ImageUpload";
import Markdown from "react-native-markdown-display";
import { HeroSection } from "@/components/HeroSection";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { useSound } from "@/hooks/useSound";

interface HistoryItem {
  _id: string;
  imageUrl: string;
  result: string;
  createdAt: string;
}

const useFadeSlideIn = (delay = 0) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        speed: 14,
        bounciness: 5,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return { opacity, transform: [{ translateY }] };
};

interface HistoryCardProps {
  item: HistoryItem;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  setPreviewImage: (image: string | null) => void;
  speakText: (text: string) => void;
  isSpeaking: boolean;
  playClick: (type?: any) => void;
  mdStyle: any;
}

function HistoryCard({
  item,
  expandedId,
  setExpandedId,
  setPreviewImage,
  speakText,
  isSpeaking,
  playClick,
  mdStyle,
}: HistoryCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isExpanded = expandedId === item._id;

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: 10 }}>
      <View
        style={{
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "#E2E8F0",
          borderRadius: 18,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 2,
        }}
        className="dark:bg-[#1E293B] dark:border-[#334155]"
      >
        <Pressable
          onPress={() => {
            playClick("soft");
            setExpandedId(isExpanded ? null : item._id);
          }}
          onPressIn={() =>
            Animated.spring(scale, {
              toValue: 0.98,
              useNativeDriver: true,
              speed: 40,
              bounciness: 4,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
              speed: 22,
              bounciness: 8,
            }).start()
          }
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => {
              playClick("soft");
              setPreviewImage(item.imageUrl);
            }}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: 50, height: 50, borderRadius: 12 }}
            />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{ fontWeight: "600", fontSize: 13, color: "#0F172A" }}
              className="dark:text-white"
            >
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            <Text style={{ color: "#94A3B8", fontSize: 11 }}>
              {new Date(item.createdAt).toLocaleTimeString()}
            </Text>
          </View>

          {isExpanded ? (
            <ChevronUp size={16} color="#64748B" />
          ) : (
            <ChevronDown size={16} color="#64748B" />
          )}
        </Pressable>

        {isExpanded && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: 16,
              borderTopWidth: 1,
              borderTopColor: "#E2E8F0",
            }}
            className="dark:border-[#334155]"
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginVertical: 8,
              }}
            >
              <AnimatedPressable onPress={() => speakText(item.result)} soundType="soft">
                {isSpeaking ? (
                  <VolumeX size={18} color="#EF4444" />
                ) : (
                  <Volume2 size={18} color="#8B5CF6" />
                )}
              </AnimatedPressable>
            </View>

            <Markdown style={mdStyle}>{item.result}</Markdown>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default function PrescriptionReader() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const toast = useToast();
  const { playClick } = useSound();

  const [isReading, setIsReading] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const bodyAnim = useFadeSlideIn(200);
  const historyAnim = useFadeSlideIn(300);
  const resultAnim = useFadeSlideIn(0);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await apiRequest("/ocr/history/prescription");
      if (data.success) setHistory(data.history);
    } catch {
      // silent fail
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRead = async (imageDataUrl: string) => {
    setIsReading(true);
    setSelectedImage(imageDataUrl);
    setPrescriptionText("");

    try {
      const data = await apiUploadImage("/ocr/prescription", imageDataUrl);
      setPrescriptionText(data.prescriptionText);
      loadHistory();
    } catch (e: any) {
      toast.error(e.message || t.prescription.readFailed);
    } finally {
      setIsReading(false);
    }
  };

  const speakText = (text: string) => {
    playClick("soft");

    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    const langCode =
      language === "hi" ? "hi-IN" : language === "te" ? "te-IN" : "en-IN";

    setIsSpeaking(true);

    Speech.speak(text.replace(/[#*|]/g, ""), {
      language: langCode,
      pitch: 1,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const mdStyle = {
    body: { color: "#0F172A" },
    heading2: {
      color: "#8B5CF6",
      fontSize: 15,
      fontWeight: "700" as const,
      marginTop: 8,
      marginBottom: 4,
    },
    strong: { fontWeight: "700" as const },
    paragraph: {
      color: "#374151",
      marginBottom: 4,
      lineHeight: 20,
    },
    list_item: { color: "#374151" },
  };

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <AnimatedPressable
          onPress={() => router.back()}
          soundType="soft"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={18} color="#8B5CF6" />
          <Text style={{ color: "#8B5CF6", fontWeight: "600", fontSize: 14 }}>
            {t.prescription.backToHealth}
          </Text>
        </AnimatedPressable>

        {/* Hero */}
        <HeroSection
          icon={FileText}
          title={t.prescription.title}
          subtitle={t.prescription.subtitle}
          gradientColors={["#3B82F6", "#8B5CF6"]}
          delay={0}
        />

        {/* Upload */}
        <Animated.View style={bodyAnim}>
          <ImageUpload
            onImageSelect={handleRead}
            onClear={() => {
              setPrescriptionText("");
              setSelectedImage("");
            }}
            disabled={isReading}
          />
        </Animated.View>

        {/* Loading */}
        {isReading && (
          <View
            style={{
              marginTop: 20,
              padding: 24,
              borderRadius: 20,
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              alignItems: "center",
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 4,
            }}
            className="dark:bg-[#1E293B] dark:border-[#334155]"
          >
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text
              style={{ marginTop: 12, fontWeight: "600", color: "#0F172A" }}
              className="dark:text-white"
            >
              {t.prescription.reading}
            </Text>
          </View>
        )}

        {/* Result */}
        {prescriptionText !== "" && (
          <Animated.View style={resultAnim} className="mt-5">
            <View
              style={{
                padding: 20,
                borderRadius: 20,
                backgroundColor: "white",
                borderWidth: 1,
                borderColor: "#E2E8F0",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.07,
                shadowRadius: 10,
                elevation: 3,
              }}
              className="dark:bg-[#1E293B] dark:border-[#334155]"
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ fontWeight: "700", fontSize: 15, color: "#0F172A" }}
                  className="dark:text-white"
                >
                  {t.prescription.details}
                </Text>

                <AnimatedPressable
                  onPress={() => speakText(prescriptionText)}
                  soundType="soft"
                >
                  {isSpeaking ? (
                    <VolumeX size={22} color="#EF4444" />
                  ) : (
                    <Volume2 size={22} color="#8B5CF6" />
                  )}
                </AnimatedPressable>
              </View>

              <Markdown style={mdStyle}>{prescriptionText}</Markdown>
            </View>

            <View
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 14,
                backgroundColor: "#8B5CF610",
                borderWidth: 1,
                borderColor: "#8B5CF630",
              }}
            >
              <Text style={{ color: "#8B5CF6", fontSize: 12 }}>
                {t.prescription.speakHint}
              </Text>
            </View>

            <AnimatedPressable
              onPress={() => {
                setPrescriptionText("");
                setSelectedImage("");
              }}
              soundType="mechanical"
              style={{
                marginTop: 12,
                backgroundColor: "#8B5CF6",
                paddingVertical: 13,
                borderRadius: 14,
                alignItems: "center",
                shadowColor: "#8B5CF6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>
                {t.prescription.scanNew}
              </Text>
            </AnimatedPressable>
          </Animated.View>
        )}

        {/* Instructions */}
        {!selectedImage && !isReading && (
          <Animated.View style={bodyAnim}>
            <View
              style={{
                marginTop: 16,
                padding: 20,
                borderRadius: 20,
                backgroundColor: "white",
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
              className="dark:bg-[#1E293B] dark:border-[#334155]"
            >
              <Text
                style={{ fontWeight: "700", marginBottom: 8, color: "#0F172A" }}
                className="dark:text-white"
              >
                {t.prescription.howToUse}
              </Text>

              <Text
                style={{ color: "#64748B", fontSize: 13, lineHeight: 20 }}
                className="dark:text-[#94A3B8]"
              >
                {t.prescription.instructions}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* History */}
        <Animated.View style={historyAnim} className="mt-6">
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: "#8B5CF618",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <History size={16} color="#8B5CF6" />
            </View>

            <Text
              style={{ fontWeight: "700", fontSize: 15, color: "#0F172A" }}
              className="dark:text-white"
            >
              {t.prescription.history}
            </Text>
          </View>

          {historyLoading ? (
            <ActivityIndicator color="#8B5CF6" />
          ) : history.length === 0 ? (
            <Text style={{ color: "#94A3B8", fontSize: 13 }}>
              {t.prescription.noHistory}
            </Text>
          ) : (
            history.map((item) => (
              <HistoryCard
                key={item._id}
                item={item}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
                setPreviewImage={setPreviewImage}
                speakText={speakText}
                isSpeaking={isSpeaking}
                playClick={playClick}
                mdStyle={mdStyle}
              />
            ))
          )}
        </Animated.View>
      </ScrollView>

      {/* Preview Modal */}
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Pressable
            onPress={() => setPreviewImage(null)}
            style={{ position: "absolute", top: 50, right: 20, zIndex: 10 }}
          >
            <X size={28} color="white" />
          </Pressable>

          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={{ width: 320, height: 420, borderRadius: 16 }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}