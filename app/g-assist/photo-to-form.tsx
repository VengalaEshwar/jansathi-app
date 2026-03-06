import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { ArrowLeft, Loader2, Copy } from "lucide-react-native";

import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/ImageUpload"; // we’ll make native version next

export default function PhotoToForm() {
  const router = useRouter();
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

  const handleExtract = async (imageBase64: string) => {
    setIsExtracting(true);
    setSelectedImage(imageBase64);
    setExtractedData("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "extract-form-data",
        {
          body: { image: imageBase64 },
        }
      );

      if (error) throw error;

      setExtractedData(data.extractedData);
      Alert.alert("Success", "Data extracted successfully");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to extract form data");
    } finally {
      setIsExtracting(false);
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(extractedData);
    Alert.alert("Copied", "Extracted data copied to clipboard");
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Back */}
        <Pressable
          onPress={() => router.replace("/g-assist")}
          className="flex-row items-center mb-6"
        >
          <ArrowLeft size={20} />
          <Text className="ml-2">Back to G-Assist</Text>
        </Pressable>

        {/* Title */}
        <View className="mb-6">
          <Text className="text-2xl font-bold">Photo-to-Form AI</Text>
          <Text className="text-muted mt-1">
            Upload documents and let AI extract form data
          </Text>
        </View>

        {/* Upload */}
        <ImageUpload
          onImageSelect={handleExtract}
          onClear={() => {
            setExtractedData("");
            setSelectedImage("");
          }}
          disabled={isExtracting}
        />

        {/* Loader */}
        {isExtracting && (
          <View className="flex-row items-center justify-center gap-2 p-6 rounded-xl bg-secondary mt-6">
            <ActivityIndicator />
            <Text>Extracting data...</Text>
          </View>
        )}

        {/* Result */}
        {extractedData !== "" && (
          <View className="mt-6 space-y-4">
            <View className="bg-primary p-4 rounded-2xl">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-white font-semibold text-lg">
                  Extracted Data
                </Text>
                <Pressable onPress={copyToClipboard}>
                  <Copy size={18} color="white" />
                </Pressable>
              </View>

              <Text className="text-white whitespace-pre-wrap">
                {extractedData}
              </Text>
            </View>

            <View className="bg-secondary p-3 rounded-xl">
              <Text className="text-sm text-muted">
                💡 Use the copy button to paste this data into government forms
              </Text>
            </View>
          </View>
        )}

        {/* Help */}
        {!selectedImage && !isExtracting && (
          <View className="bg-secondary p-4 rounded-xl mt-6">
            <Text className="font-semibold mb-2">How to use:</Text>
            <Text className="text-sm text-muted">
              • Upload Aadhaar, PAN, or any document{"\n"}
              • AI extracts relevant info{"\n"}
              • Copy extracted data{"\n"}
              • Paste directly into forms
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
