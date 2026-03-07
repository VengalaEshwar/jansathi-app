import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  Linking,
} from "react-native";

import { useRouter } from "expo-router";
import { ArrowLeft, Download, Send } from "lucide-react-native";
import { apiUploadImage, apiRequest, BASE_URL } from "@/integrations/api/client";
import { ImageUpload } from "@/components/ImageUpload";
import { auth } from "@/integrations/firebase/client";

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
}

export default function PhotoToForm() {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "fill" | "done">("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [imageId, setImageId] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  // Step 1: Upload and extract fields
  const handleExtract = async (imageUri: string) => {
    setIsLoading(true);
    try {
      const data = await apiUploadImage("/form/extract", imageUri);
      setFields(data.fields);
      setImageId(data.imageId);

      // Initialize formData with empty values
      const initialData: Record<string, string> = {};
      data.fields.forEach((f: FormField) => {
        initialData[f.label] = "";
      });
      setFormData(initialData);
      setStep("fill");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to extract form fields");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Submit filled data
  const handleSubmit = async () => {
    const missingRequired = fields.filter(
      (f) => f.required && !formData[f.label]?.trim()
    );

    if (missingRequired.length > 0) {
      Alert.alert("Required Fields", `Please fill: ${missingRequired.map((f) => f.label).join(", ")}`);
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiRequest("/form/fill", "POST", { imageId, formData });
      setDownloadUrl(data.downloadUrl);
      setStep("done");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to fill form");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Download PDF
 const handleDownload = async () => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const url = `${BASE_URL}/form/download/${downloadUrl.split("/").pop()}?token=${token}`;
    await Linking.openURL(url);
  } catch (e: any) {
    Alert.alert("Error", "Failed to open PDF");
  }
};

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Back */}
        <Pressable onPress={() => router.replace("/g-assist")} className="flex-row items-center mb-6">
          <ArrowLeft size={20} />
          <Text className="ml-2 text-foreground">Back to G-Assist</Text>
        </Pressable>

        {/* Title */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">Photo-to-Form AI</Text>
          <Text className="text-muted mt-1">Upload a form and let AI help you fill it</Text>
        </View>

        {/* Step Indicator */}
        <View className="flex-row justify-center gap-2 mb-6">
          {["Upload", "Fill", "Done"].map((s, i) => (
            <View key={s} className={`flex-1 py-2 rounded-lg items-center ${
              step === s.toLowerCase() ? "bg-primary" : "bg-secondary"
            }`}>
              <Text className={`text-sm font-semibold ${
                step === s.toLowerCase() ? "text-white" : "text-muted"
              }`}>
                {i + 1}. {s}
              </Text>
            </View>
          ))}
        </View>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <View>
            <ImageUpload
              onImageSelect={handleExtract}
              onClear={() => {}}
              disabled={isLoading}
            />
            {isLoading && (
              <View className="mt-6 p-6 rounded-2xl bg-secondary items-center">
                <ActivityIndicator color="#8B5CF6" />
                <Text className="mt-2 text-foreground">Extracting form fields...</Text>
              </View>
            )}
            <View className="bg-secondary p-4 rounded-xl mt-6">
              <Text className="font-semibold text-foreground mb-2">How to use:</Text>
              <Text className="text-muted text-sm">
                • Upload a clear photo of any government form{"\n"}
                • AI will detect all fillable fields{"\n"}
                • Fill in your details{"\n"}
                • Download the completed form as PDF
              </Text>
            </View>
          </View>
        )}

        {/* Step 2: Fill Fields */}
        {step === "fill" && (
          <View>
            <Text className="text-lg font-semibold text-foreground mb-4">
              Fill in your details ({fields.length} fields found)
            </Text>

            {fields.map((field) => (
              <View key={field.id} className="mb-4">
                <Text className="text-foreground mb-1 font-medium">
                  {field.label}
                  {field.required && <Text className="text-red-500"> *</Text>}
                </Text>
                <TextInput
                  placeholder={field.placeholder}
                  value={formData[field.label] || ""}
                  onChangeText={(v) => setFormData({ ...formData, [field.label]: v })}
                  keyboardType={
                    field.type === "number" ? "numeric" :
                    field.type === "phone" ? "phone-pad" :
                    field.type === "email" ? "email-address" : "default"
                  }
                  className="border border-border rounded-lg px-3 py-2 text-foreground bg-card"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            ))}

            <Pressable
              onPress={handleSubmit}
              disabled={isLoading}
              className="bg-primary py-3 rounded-xl items-center mt-4 flex-row justify-center gap-2"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Send size={18} color="white" />
                  <Text className="text-white font-semibold ml-2">Generate Filled Form</Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => setStep("upload")}
              className="mt-3 py-2 items-center"
            >
              <Text className="text-muted">← Upload different form</Text>
            </Pressable>
          </View>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-green-500 items-center justify-center mb-4">
              <Text className="text-4xl">✅</Text>
            </View>

            <Text className="text-2xl font-bold text-foreground mb-2">Form Filled!</Text>
            <Text className="text-muted text-center mb-8">
              Your form has been filled successfully. Download the PDF below.
            </Text>

            <Pressable
              onPress={handleDownload}
              className="bg-primary px-8 py-4 rounded-xl flex-row items-center gap-2 w-full justify-center"
            >
              <Download size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Download Filled PDF</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setStep("upload");
                setFields([]);
                setFormData({});
                setImageId("");
                setDownloadUrl("");
              }}
              className="mt-4 py-2 items-center"
            >
              <Text className="text-primary">Fill Another Form</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}