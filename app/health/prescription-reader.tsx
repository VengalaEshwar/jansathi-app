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
import { ArrowLeft, Volume2 } from "lucide-react-native";
import * as Speech from "expo-speech";

import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/ImageUpload";

export default function PrescriptionReader() {
  const router = useRouter();
  const [isReading, setIsReading] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");

  const handleRead = async (imageDataUrl: string) => {
    setIsReading(true);
    setSelectedImage(imageDataUrl);
    setPrescriptionText("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "read-prescription",
        {
          body: { image: imageDataUrl },
        }
      );

      if (error) throw error;

      setPrescriptionText(data.prescriptionText);
      Alert.alert("Success", "Prescription read successfully");
    } catch (e: any) {
      console.log("Read error:", e);
      Alert.alert("Error", e.message || "Failed to read prescription");
    } finally {
      setIsReading(false);
    }
  };

  const speakText = () => {
    if (!prescriptionText) return;
    Speech.speak(prescriptionText, {
      language: "en",
      pitch: 1,
      rate: 0.9,
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
          <Text className="text-2xl font-bold mb-1">
            Prescription Reader
          </Text>
          <Text className="text-muted">
            Upload handwritten prescriptions for OCR processing and audio
            instructions
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
            <ActivityIndicator size="large" />
            <Text className="mt-2 text-lg">Reading prescription...</Text>
          </View>
        )}

        {/* Result */}
        {prescriptionText !== "" && (
          <View className="mt-6 space-y-4">
            <View className="p-5 rounded-2xl bg-primary">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-white text-lg font-semibold">
                  Prescription Details
                </Text>

                <Pressable onPress={speakText}>
                  <Volume2 size={22} color="white" />
                </Pressable>
              </View>

              <Text className="text-white whitespace-pre-wrap">
                {prescriptionText}
              </Text>
            </View>

            <View className="p-4 rounded-xl bg-secondary border border-border">
              <Text className="text-muted text-sm">
                💡 Tap the speaker icon to hear the prescription read aloud.
              </Text>
            </View>
          </View>
        )}

        {/* Instructions */}
        {!selectedImage && !isReading && (
          <View className="mt-6 p-5 rounded-2xl bg-secondary border border-border">
            <Text className="font-semibold mb-2">How to use:</Text>
            <Text className="text-muted text-sm">
              • Take a clear photo of your prescription{"\n"}
              • Ensure handwriting is legible and well-lit{"\n"}
              • Upload the image for OCR processing{"\n"}
              • Listen to audio instructions
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
