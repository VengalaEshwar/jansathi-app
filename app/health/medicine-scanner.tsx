import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Volume2,VolumeX } from "lucide-react-native";
import * as Speech from "expo-speech";
import Markdown from "react-native-markdown-display";
import { apiUploadImage } from "@/integrations/api/client";
import { ImageUpload } from "@/components/ImageUpload";

export default function MedicineScanner() {

  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");
const [isSpeaking, setIsSpeaking] = useState(false);
  const handleAnalyze = async (imageUri: string) => {
    setIsAnalyzing(true);
    setSelectedImage(imageUri);
    setAnalysis("");

    try {
      const data = await apiUploadImage("/ocr/medicine", imageUri);
      setAnalysis(data.analysis);
      Alert.alert("Success", "Medicine analyzed successfully");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to analyze medicine");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const speakAnalysis = () => {
  if (!analysis) return;

  if (isSpeaking) {
    Speech.stop();
    setIsSpeaking(false);
    return;
  }

  setIsSpeaking(true);
  Speech.speak(analysis.replace(/[#*|]/g, ""), {
    language: "en",
    rate: 0.9,
    onDone: () => setIsSpeaking(false),
    onStopped: () => setIsSpeaking(false),
    onError: () => setIsSpeaking(false),
  });
};

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Back Button */}
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center mb-5"
        >
          <ArrowLeft size={20} color="#6b7280" />
          <Text className="ml-2 text-muted">Back to Health</Text>
        </Pressable>

        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-1">
            Medicine Scanner
          </Text>
          <Text className="text-muted">
            Scan medicine strips or bottles to verify and get details
          </Text>
        </View>

        {/* Image Upload */}
        <ImageUpload
          onImageSelect={handleAnalyze}
          onClear={() => {
            setAnalysis("");
            setSelectedImage("");
          }}
          disabled={isAnalyzing}
        />

        {/* Loading */}
        {isAnalyzing && (
          <View className="mt-6 p-6 rounded-2xl bg-secondary border border-border items-center">
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text className="mt-2 text-lg text-foreground">
              Analyzing medicine...
            </Text>
          </View>
        )}

        {/* Result */}
        {analysis !== "" && (
          <View className="mt-6">
            <View className="p-5 rounded-2xl bg-card border border-border">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-foreground text-lg font-semibold">
                  Analysis Report
                </Text>
                <Pressable onPress={speakAnalysis}>
                  {isSpeaking
                    ? <VolumeX size={22} color="#EF4444" />
                    : <Volume2 size={22} color="#8B5CF6" />
                  }
                </Pressable>
              </View>

              <Markdown
                style={{
                  body: { color: "#FFFFFF" },
                  heading2: {
                    color: "#A78BFA",
                    fontSize: 16,
                    fontWeight: "bold",
                    marginTop: 8,
                    marginBottom: 4,
                  },
                  strong: { color: "#FFFFFF", fontWeight: "bold" },
                  table: { borderWidth: 1, borderColor: "#334155" },
                  th: { backgroundColor: "#1E293B", padding: 6 },
                  td: { padding: 6, color: "#FFFFFF" },
                  tr: { borderBottomWidth: 1, borderColor: "#334155" },
                  bullet_list: { marginVertical: 4 },
                  list_item: { color: "#FFFFFF" },
                  paragraph: { color: "#FFFFFF", marginBottom: 4 },
                }}
              >
                {analysis}
              </Markdown>
            </View>

            <View className="mt-3 p-4 rounded-xl bg-secondary border border-border">
              <Text className="text-muted text-sm">
                💡 Tap the speaker icon to hear the analysis read aloud.
              </Text>
            </View>
          </View>
        )}

        {/* Instructions */}
        {!selectedImage && !isAnalyzing && (
          <View className="mt-6 p-5 rounded-2xl bg-secondary border border-border">
            <Text className="font-semibold mb-2 text-foreground">
              How to use:
            </Text>
            <Text className="text-muted text-sm">
              • Take a clear photo of the medicine strip or bottle{"\n"}
              • Ensure barcode, expiry date, and batch number are visible{"\n"}
              • Upload the image for instant analysis{"\n"}
              • Get authenticity, expiry, and safety warnings
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}