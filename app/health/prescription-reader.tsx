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
import { ArrowLeft, Volume2, VolumeX } from "lucide-react-native";
import * as Speech from "expo-speech";
import { apiUploadImage } from "@/integrations/api/client";
import { ImageUpload } from "@/components/ImageUpload";
import Markdown from "react-native-markdown-display";
import { useTranslation } from "@/hooks/useTranslation";

export default function PrescriptionReader() {
  const router = useRouter();
  const { t, language } = useTranslation();

  const [isReading, setIsReading] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleRead = async (imageDataUrl: string) => {
    setIsReading(true);
    setSelectedImage(imageDataUrl);
    setPrescriptionText("");

    try {
      const data = await apiUploadImage("/ocr/prescription", imageDataUrl);
      setPrescriptionText(data.prescriptionText);
      Alert.alert(t.common.success, t.prescription.readSuccess);
    } catch (e: any) {
      Alert.alert(t.common.error, e.message || t.prescription.readFailed);
    } finally {
      setIsReading(false);
    }
  };

  const speakText = () => {
    if (!prescriptionText) return;

    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    const langCode =
      language === "hi" ? "hi-IN" : language === "te" ? "te-IN" : "en-IN";

    setIsSpeaking(true);
    Speech.speak(prescriptionText.replace(/[#*|]/g, ""), {
      language: langCode,
      pitch: 1,
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
          <Text className="ml-2 text-muted">{t.prescription.backToHealth}</Text>
        </Pressable>

        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold mb-1 text-foreground">
            {t.prescription.title}
          </Text>
          <Text className="text-muted">
            {t.prescription.subtitle}
          </Text>
        </View>

        {/* Image Upload */}
        <ImageUpload
          onImageSelect={handleRead}
          onClear={() => {
            setPrescriptionText("");
            setSelectedImage("");
          }}
          disabled={isReading}
        />

        {/* Loading */}
        {isReading && (
          <View className="mt-6 p-6 rounded-2xl bg-secondary border border-border items-center">
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text className="mt-2 text-lg text-foreground">
              {t.prescription.reading}
            </Text>
          </View>
        )}

        {/* Result */}
        {prescriptionText !== "" && (
          <View className="mt-6 space-y-4">
            <View className="p-5 rounded-2xl bg-card border border-border">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-foreground text-lg font-semibold">
                  {t.prescription.details}
                </Text>
                <Pressable onPress={speakText}>
                  {isSpeaking ? (
                    <VolumeX size={22} color="#EF4444" />
                  ) : (
                    <Volume2 size={22} color="#8B5CF6" />
                  )}
                </Pressable>
              </View>

              <Markdown
                style={{
                  body: { color: "#FFFFFF" },
                  heading2: {
                    color: "#A78BFA",
                    fontSize: 16,
                    fontWeight: "bold",
                  },
                  strong: { color: "#FFFFFF", fontWeight: "bold" },
                  table: { borderWidth: 1, borderColor: "#334155" },
                  th: { backgroundColor: "#1E293B", padding: 6 },
                  td: { padding: 6 },
                  tr: { borderBottomWidth: 1, borderColor: "#334155" },
                  bullet_list: { marginVertical: 4 },
                  list_item: { color: "#FFFFFF" },
                }}
              >
                {prescriptionText}
              </Markdown>
            </View>

            {/* Speak hint */}
            <View className="p-4 rounded-xl bg-secondary border border-border">
              <Text className="text-muted text-sm">
                {t.prescription.speakHint}
              </Text>
            </View>

            {/* Scan New Button */}
            <Pressable
              onPress={() => {
                setPrescriptionText("");
                setSelectedImage("");
              }}
              className="bg-primary py-3 rounded-xl items-center"
            >
              <Text className="text-white font-semibold">
                {t.prescription.scanNew}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Instructions */}
        {!selectedImage && !isReading && (
          <View className="mt-6 p-5 rounded-2xl bg-secondary border border-border">
            <Text className="font-semibold mb-2 text-foreground">
              {t.prescription.howToUse}
            </Text>
            <Text className="text-muted text-sm">
              {t.prescription.instructions}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}