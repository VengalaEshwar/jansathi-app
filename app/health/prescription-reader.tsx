import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Volume2, VolumeX, History, X, ChevronDown, ChevronUp } from "lucide-react-native";
import * as Speech from "expo-speech";
import { apiUploadImage, apiRequest } from "@/integrations/api/client";
import { ImageUpload } from "@/components/ImageUpload";
import Markdown from "react-native-markdown-display";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";

interface HistoryItem {
  _id: string;
  imageUrl: string;
  result: string;
  createdAt: string;
}

export default function PrescriptionReader() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const toast = useToast();

  const [isReading, setIsReading] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await apiRequest("/ocr/history/prescription");
      if (data.success) setHistory(data.history);
    } catch (e) {
      console.log("Failed to load history:", e);
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
      loadHistory(); // refresh history after new scan
    } catch (e: any) {
      toast.error(e.message || t.prescription.readFailed);
    } finally {
      setIsReading(false);
    }
  };

  const speakText = (text: string) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    const langCode = language === "hi" ? "hi-IN" : language === "te" ? "te-IN" : "en-IN";
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

  const markdownStyle = {
    body: { color: "#FFFFFF" },
    heading2: { color: "#A78BFA", fontSize: 16, fontWeight: "bold" },
    strong: { color: "#FFFFFF", fontWeight: "bold" },
    table: { borderWidth: 1, borderColor: "#334155" },
    th: { backgroundColor: "#1E293B", padding: 6 },
    td: { padding: 6 },
    tr: { borderBottomWidth: 1, borderColor: "#334155" },
    bullet_list: { marginVertical: 4 },
    list_item: { color: "#FFFFFF" },
  };

  return (
    <View className="flex-1 bg-light-background dark:bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Back */}
        <Pressable onPress={() => router.back()} className="flex-row items-center mb-5">
          <ArrowLeft size={20} color="#6b7280" />
          <Text className="ml-2 text-muted">{t.prescription.backToHealth}</Text>
        </Pressable>

        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold mb-1 text-light-foreground dark:text-foreground">{t.prescription.title}</Text>
          <Text className="text-muted">{t.prescription.subtitle}</Text>
        </View>

        {/* Image Upload */}
        <ImageUpload
          onImageSelect={handleRead}
          onClear={() => { setPrescriptionText(""); setSelectedImage(""); }}
          disabled={isReading}
        />

        {/* Loading */}
        {isReading && (
          <View className="mt-6 p-6 rounded-2xl bg-secondary border border-light-border dark:border-border items-center">
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text className="mt-2 text-lg text-light-foreground dark:text-foreground">{t.prescription.reading}</Text>
          </View>
        )}

        {/* Current Result */}
        {prescriptionText !== "" && (
          <View className="mt-6 space-y-4">
            <View className="p-5 rounded-2xl bg-light-card dark:bg-card border border-light-border dark:border-border">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-light-foreground dark:text-foreground text-lg font-semibold">{t.prescription.details}</Text>
                <Pressable onPress={() => speakText(prescriptionText)}>
                  {isSpeaking ? <VolumeX size={22} color="#EF4444" /> : <Volume2 size={22} color="#8B5CF6" />}
                </Pressable>
              </View>
              <Markdown style={markdownStyle}>{prescriptionText}</Markdown>
            </View>
            <View className="p-4 rounded-xl bg-secondary border border-light-border dark:border-border">
              <Text className="text-muted text-sm">{t.prescription.speakHint}</Text>
            </View>
            <Pressable
              onPress={() => { setPrescriptionText(""); setSelectedImage(""); }}
              className="bg-primary py-3 rounded-xl items-center"
            >
              <Text className="text-white font-semibold">{t.prescription.scanNew}</Text>
            </Pressable>
          </View>
        )}

        {/* Instructions */}
        {!selectedImage && !isReading && (
          <View className="mt-6 p-5 rounded-2xl bg-secondary border border-light-border dark:border-border">
            <Text className="font-semibold mb-2 text-light-foreground dark:text-foreground">{t.prescription.howToUse}</Text>
            <Text className="text-muted text-sm">{t.prescription.instructions}</Text>
          </View>
        )}

        {/* History */}
        <View className="mt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <History size={18} color="#8B5CF6" />
            <Text className="text-light-foreground dark:text-foreground font-bold text-base">{t.prescription.history}</Text>
          </View>

          {historyLoading ? (
            <ActivityIndicator color="#8B5CF6" />
          ) : history.length === 0 ? (
            <Text className="text-muted text-sm">{t.prescription.noHistory}</Text>
          ) : (
            history.map((item) => (
              <View key={item._id} className="bg-light-card dark:bg-card border border-light-border dark:border-border rounded-xl mb-3 overflow-hidden">
                {/* History item header */}
                <View className="bg-light-card dark:bg-card border border-light-border dark:border-border rounded-xl mb-3 overflow-hidden">
                <Pressable
                  onPress={() => setExpandedId(expandedId === item._id ? null : item._id)}
                  className="flex-row items-center p-3 gap-3"
                >
                  {/* Thumbnail */}
                  <Pressable onPress={() => setPreviewImage(item.imageUrl)}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{ width: 48, height: 48, borderRadius: 8 }}
                    />
                  </Pressable>
                  <View className="flex-1">
                    <Text className="text-light-foreground dark:text-foreground font-medium text-sm">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                    <Text className="text-muted text-xs">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                  {expandedId === item._id
                    ? <ChevronUp size={16} color="#64748B" />
                    : <ChevronDown size={16} color="#64748B" />
                  }
                </Pressable>

                {/* Expanded result */}
                {expandedId === item._id && (
                  <View className="px-4 pb-4 border-t border-light-border dark:border-border">
                    <View className="flex-row justify-end mt-2 mb-2">
                      <Pressable onPress={() => speakText(item.result)}>
                        {isSpeaking
                          ? <VolumeX size={18} color="#EF4444" />
                          : <Volume2 size={18} color="#8B5CF6" />
                        }
                      </Pressable>
                    </View>
                    <Markdown style={markdownStyle}>{item.result}</Markdown>
                  </View>
                )}
              </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* Image Preview Modal */}
      <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", alignItems: "center", justifyContent: "center" }}>
          <Pressable
            onPress={() => setPreviewImage(null)}
            style={{ position: "absolute", top: 50, right: 20, zIndex: 10 }}
          >
            <X size={28} color="white" />
          </Pressable>
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={{ width: 320, height: 420, borderRadius: 12 }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

    </View>
  );
}