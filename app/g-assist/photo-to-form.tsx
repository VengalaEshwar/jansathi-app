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
import { useTranslation } from "@/hooks/useTranslation";

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
}

export default function PhotoToForm() {
  const router = useRouter();
  const { t } = useTranslation();

  const [step, setStep] = useState<"upload" | "fill" | "done">("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [imageId, setImageId] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const handleExtract = async (imageUri: string) => {
    setIsLoading(true);
    try {
      const data = await apiUploadImage("/form/extract", imageUri);
      setFields(data.fields);
      setImageId(data.imageId);
      const initialData: Record<string, string> = {};
      data.fields.forEach((f: FormField) => {
        initialData[f.label] = "";
      });
      setFormData(initialData);
      setStep("fill");
    } catch (e: any) {
      Alert.alert(t.common.error, e.message || t.photoForm.extractFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const missingRequired = fields.filter(
      (f) => f.required && !formData[f.label]?.trim()
    );

    if (missingRequired.length > 0) {
      Alert.alert(
        t.photoForm.requiredFields,
        `${t.photoForm.pleaseFill}: ${missingRequired.map((f) => f.label).join(", ")}`
      );
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiRequest("/form/fill", "POST", { imageId, formData });
      setDownloadUrl(data.downloadUrl);
      setStep("done");
    } catch (e: any) {
      Alert.alert(t.common.error, e.message || t.photoForm.fillFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const url = `${BASE_URL}/form/download/${downloadUrl.split("/").pop()}?token=${token}`;
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert(t.common.error, t.photoForm.downloadFailed);
    }
  };

  const steps = [t.photoForm.step1, t.photoForm.step2, t.photoForm.step3];
  const stepKeys = ["upload", "fill", "done"];

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Back */}
        <Pressable
          onPress={() => router.replace("/g-assist")}
          className="flex-row items-center mb-6"
        >
          <ArrowLeft size={20} color="#6b7280" />
          <Text className="ml-2 text-muted">{t.photoForm.backToAssist}</Text>
        </Pressable>

        {/* Title */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">
            {t.photoForm.title}
          </Text>
          <Text className="text-muted mt-1">{t.photoForm.subtitle}</Text>
        </View>

        {/* Step Indicator */}
        <View className="flex-row justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <View
              key={s}
              className={`flex-1 py-2 rounded-lg items-center ${
                step === stepKeys[i] ? "bg-primary" : "bg-secondary"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  step === stepKeys[i] ? "text-white" : "text-muted"
                }`}
              >
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
                <Text className="mt-2 text-foreground">{t.photoForm.extracting}</Text>
              </View>
            )}
            <View className="bg-secondary p-4 rounded-xl mt-6">
              <Text className="font-semibold text-foreground mb-2">
                {t.photoForm.howToUse}
              </Text>
              <Text className="text-muted text-sm">{t.photoForm.instructions}</Text>
            </View>
          </View>
        )}

        {/* Step 2: Fill Fields */}
        {step === "fill" && (
          <View>
            <Text className="text-lg font-semibold text-foreground mb-4">
              {t.photoForm.fillDetails} ({fields.length} {t.photoForm.fieldsFound})
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
                  onChangeText={(v) =>
                    setFormData({ ...formData, [field.label]: v })
                  }
                  keyboardType={
                    field.type === "number"
                      ? "numeric"
                      : field.type === "phone"
                      ? "phone-pad"
                      : field.type === "email"
                      ? "email-address"
                      : "default"
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
                  <Text className="text-white font-semibold ml-2">
                    {t.photoForm.generateForm}
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => setStep("upload")}
              className="mt-3 py-2 items-center"
            >
              <Text className="text-muted">{t.photoForm.uploadDifferent}</Text>
            </Pressable>
          </View>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-green-500 items-center justify-center mb-4">
              <Text className="text-4xl">✅</Text>
            </View>

            <Text className="text-2xl font-bold text-foreground mb-2">
              {t.photoForm.formFilled}
            </Text>
            <Text className="text-muted text-center mb-8">
              {t.photoForm.formFilledDesc}
            </Text>

            <Pressable
              onPress={handleDownload}
              className="bg-primary px-8 py-4 rounded-xl flex-row items-center gap-2 w-full justify-center"
            >
              <Download size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                {t.photoForm.download}
              </Text>
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
              <Text className="text-primary">{t.photoForm.fillAnother}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}