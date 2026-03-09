import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Volume2, VolumeX, History, X, ChevronDown, ChevronUp } from "lucide-react-native";
import * as Speech from "expo-speech";
import Markdown from "react-native-markdown-display";
import { apiUploadImage, apiRequest } from "@/integrations/api/client";
import { ImageUpload } from "@/components/ImageUpload";
import { useTranslation } from "@/hooks/useTranslation";

interface HistoryItem {
  _id: string;
  imageUrl: string;
  result: string;
  createdAt: string;
}

export default function MedicineScanner() {
  const router = useRouter();
  const { t, language } = useTranslation();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState("");
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
      const data = await apiRequest("/ocr/history/medicine");
      if (data.success) setHistory(data.history);
    } catch (e) {
      console.log("Failed to load history:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAnalyze = async (imageUri: string) => {
    setIsAnalyzing(true);
    setSelectedImage(imageUri);
    setAnalysis("");

    try {
      const data = await apiUploadImage("/ocr/medicine", imageUri);
      setAnalysis(data.analysis);
      loadHistory();
    } catch (e: any) {
      Alert.alert(t.common.error, e.message || t.medicine.analyzeFailed);
    } finally {
      setIsAnalyzing(false);
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
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const markdownStyle = {
    body: { color: "#FFFFFF" },
    heading2: { color: "#A78BFA", fontSize: 16, fontWeight: "bold", marginTop: 8, marginBottom: 4 },
    strong: { color: "#FFFFFF", fontWeight: "bold" },
    table: { borderWidth: 1, borderColor: "#334155" },
    th: { backgroundColor: "#1E293B", padding: 6 },
    td: { padding: 6, color: "#FFFFFF" },
    tr: { borderBottomWidth: 1, borderColor: "#334155" },
    bullet_list: { marginVertical: 4 },
    list_item: { color: "#FFFFFF" },
    paragraph: { color: "#FFFFFF", marginBottom: 4 },
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Back */}
        <Pressable onPress={() => router.back()} className="flex-row items-center mb-5">
          <ArrowLeft size={20} color="#6b7280" />
          <Text className="ml-2 text-muted">{t.medicine.backToHealth}</Text>
        </Pressable>

        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-1">{t.medicine.title}</Text>
          <Text className="text-muted">{t.medicine.subtitle}</Text>
        </View>

        {/* Image Upload */}
        <ImageUpload
          onImageSelect={handleAnalyze}
          onClear={() => { setAnalysis(""); setSelectedImage(""); }}
          disabled={isAnalyzing}
        />

        {/* Loading */}
        {isAnalyzing && (
          <View className="mt-6 p-6 rounded-2xl bg-secondary border border-border items-center">
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text className="mt-2 text-lg text-foreground">{t.medicine.analyzing}</Text>
          </View>
        )}

        {/* Current Result */}
        {analysis !== "" && (
          <View className="mt-6">
            <View className="p-5 rounded-2xl bg-card border border-border">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-foreground text-lg font-semibold">{t.medicine.analysisReport}</Text>
                <Pressable onPress={() => speakText(analysis)}>
                  {isSpeaking ? <VolumeX size={22} color="#EF4444" /> : <Volume2 size={22} color="#8B5CF6" />}
                </Pressable>
              </View>
              <Markdown style={markdownStyle}>{analysis}</Markdown>
            </View>
            <View className="mt-3 p-4 rounded-xl bg-secondary border border-border">
              <Text className="text-muted text-sm">{t.medicine.speakHint}</Text>
            </View>
            <Pressable
              onPress={() => { setAnalysis(""); setSelectedImage(""); }}
              className="mt-3 bg-primary py-3 rounded-xl items-center"
            >
              <Text className="text-white font-semibold">{t.medicine.scanNew}</Text>
            </Pressable>
          </View>
        )}

        {/* Instructions */}
        {!selectedImage && !isAnalyzing && (
          <View className="mt-6 p-5 rounded-2xl bg-secondary border border-border">
            <Text className="font-semibold mb-2 text-foreground">{t.medicine.howToUse}</Text>
            <Text className="text-muted text-sm">{t.medicine.instructions}</Text>
          </View>
        )}

        {/* History */}
        <View className="mt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <History size={18} color="#8B5CF6" />
            <Text className="text-foreground font-bold text-base">{t.medicine.history}</Text>
          </View>

          {historyLoading ? (
            <ActivityIndicator color="#8B5CF6" />
          ) : history.length === 0 ? (
            <Text className="text-muted text-sm">{t.medicine.noHistory}</Text>
          ) : (
            history.map((item) => (
              <View key={item._id} className="bg-card border border-border rounded-xl mb-3 overflow-hidden">
                <Pressable
                  onPress={() => setExpandedId(expandedId === item._id ? null : item._id)}
                  className="flex-row items-center p-3 gap-3"
                >
                  <Pressable onPress={() => setPreviewImage(item.imageUrl)}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{ width: 48, height: 48, borderRadius: 8 }}
                    />
                  </Pressable>
                  <View className="flex-1">
                    <Text className="text-foreground font-medium text-sm">
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

                {expandedId === item._id && (
                  <View className="px-4 pb-4 border-t border-border">
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