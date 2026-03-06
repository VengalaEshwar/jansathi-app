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
import { ArrowLeft } from "lucide-react-native";

import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/ImageUpload";

export default function MedicineScanner() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");

  const handleAnalyze = async (imageDataUrl: string) => {
    setIsAnalyzing(true);
    setSelectedImage(imageDataUrl);
    setAnalysis("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "analyze-medicine",
        {
          body: { image: imageDataUrl },
        }
      );

      if (error) throw error;

      setAnalysis(data.analysis);
      Alert.alert("Success", "Medicine analyzed successfully");
    } catch (e: any) {
      console.log("Analyze error:", e);
      Alert.alert("Error", e.message || "Failed to analyze medicine");
    } finally {
      setIsAnalyzing(false);
    }
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
          <Text className="text-2xl font-bold mb-1">Medicine Scanner</Text>
          <Text className="text-muted">
            Scan medicine barcodes or strips to verify authenticity and check
            expiry
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
            <ActivityIndicator size="large" />
            <Text className="mt-2 text-lg">Analyzing medicine...</Text>
          </View>
        )}

        {/* Result */}
        {analysis !== "" && (
          <View className="mt-6 p-5 rounded-2xl bg-primary">
            <Text className="text-white text-lg font-semibold mb-3">
              Analysis Report
            </Text>
            <Text className="text-white whitespace-pre-wrap">{analysis}</Text>
          </View>
        )}

        {/* Instructions */}
        {!selectedImage && !isAnalyzing && (
          <View className="mt-6 p-5 rounded-2xl bg-secondary border border-border">
            <Text className="font-semibold mb-2">How to use:</Text>
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
