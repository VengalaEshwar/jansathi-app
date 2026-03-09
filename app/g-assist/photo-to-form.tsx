import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  Linking,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft, Download, Send, History,
  ChevronDown, ChevronUp, X, CheckCircle,
} from "lucide-react-native";
import { apiUploadImage, apiRequest } from "@/integrations/api/client";
import { ImageUpload } from "@/components/ImageUpload";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateDbUser } from "@/store/slices/authSlice";

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
  value: string;
  preFilledFromProfile: boolean;
}

interface HistoryItem {
  _id: string;
  pdfUrl: string;
  formFields: { label: string; value: string }[];
  createdAt: string;
}

export default function PhotoToForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const dbUser = useAppSelector((s) => s.auth.dbUser);
  const dispatch = useAppDispatch();

  const [step, setStep] = useState<"upload" | "fill" | "done">("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [imageId, setImageId] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  // Save to profile prompt
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newFields, setNewFields] = useState<{ label: string; value: string }[]>([]);
  const [selectedToSave, setSelectedToSave] = useState<Record<string, boolean>>({});

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await apiRequest("/form/history");
      if (data.success) setHistory(data.history);
    } catch (e) {
      console.log("Failed to load form history:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleExtract = async (imageUri: string) => {
    setIsLoading(true);
    try {
      const data = await apiUploadImage("/form/extract", imageUri);
      setFields(data.fields);
      setImageId(data.imageId);
      const initialData: Record<string, string> = {};
      data.fields.forEach((f: FormField) => {
        initialData[f.label] = f.value || "";
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

    // Find fields that are new or changed compared to profile
    const profileExtra = dbUser?.personalInfo?.extra || [];
    const fieldsToMaybeSave = fields.filter((f) => {
      const value = formData[f.label]?.trim();
      if (!value) return false;
      if (f.preFilledFromProfile) return false; // already in profile
      // Not in profile core fields and not in extra
      const inExtra = profileExtra.find(
        (e) => e.label.toLowerCase() === f.label.toLowerCase()
      );
      return !inExtra;
    }).map((f) => ({ label: f.label, value: formData[f.label] }));

    if (fieldsToMaybeSave.length > 0) {
      setNewFields(fieldsToMaybeSave);
      const initialSelected: Record<string, boolean> = {};
      fieldsToMaybeSave.forEach((f) => { initialSelected[f.label] = true; });
      setSelectedToSave(initialSelected);
      setSaveModalOpen(true);
    } else {
      await submitForm([]);
    }
  };

  const submitForm = async (saveToProfile: { label: string; value: string }[]) => {
    setSaveModalOpen(false);
    setIsLoading(true);
    try {
      const data = await apiRequest("/form/fill", "POST", {
        imageId,
        formData,
        saveToProfile,
      });
      if (data.success) {
        setPdfUrl(data.pdfUrl);
        setStep("done");
        loadHistory();

        // Update Redux if saved to profile
        if (saveToProfile.length > 0 && dbUser) {
          const updatedExtra = [
            ...(dbUser.personalInfo?.extra || []),
            ...saveToProfile,
          ];
          dispatch(updateDbUser({
            personalInfo: { ...dbUser.personalInfo, extra: updatedExtra },
          }));
        }
      }
    } catch (e: any) {
      Alert.alert(t.common.error, e.message || t.photoForm.fillFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [t.photoForm.step1, t.photoForm.step2, t.photoForm.step3];
  const stepKeys = ["upload", "fill", "done"];

  return (
    <View className="flex-1 bg-background pb-14">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Back */}
        <Pressable onPress={() => router.replace("/g-assist")} className="flex-row items-center mb-6">
          <ArrowLeft size={20} color="#6b7280" />
          <Text className="ml-2 text-muted">{t.photoForm.backToAssist}</Text>
        </Pressable>

        {/* Title */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">{t.photoForm.title}</Text>
          <Text className="text-muted mt-1">{t.photoForm.subtitle}</Text>
        </View>

        {/* Step Indicator */}
        <View className="flex-row justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <View key={s} className={`flex-1 py-2 rounded-lg items-center ${step === stepKeys[i] ? "bg-primary" : "bg-secondary"}`}>
              <Text className={`text-sm font-semibold ${step === stepKeys[i] ? "text-white" : "text-muted"}`}>
                {i + 1}. {s}
              </Text>
            </View>
          ))}
        </View>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <View>
            <ImageUpload onImageSelect={handleExtract} onClear={() => {}} disabled={isLoading} />
            {isLoading && (
              <View className="mt-6 p-6 rounded-2xl bg-secondary items-center">
                <ActivityIndicator color="#8B5CF6" />
                <Text className="mt-2 text-foreground">{t.photoForm.extracting}</Text>
              </View>
            )}
            <View className="bg-secondary p-4 rounded-xl mt-6">
              <Text className="font-semibold text-foreground mb-2">{t.photoForm.howToUse}</Text>
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
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-foreground font-medium">
                    {field.label}
                    {field.required && <Text className="text-red-500"> *</Text>}
                  </Text>
                  {field.preFilledFromProfile && (
                    <View className="bg-primary/20 px-2 py-0.5 rounded-full">
                      <Text className="text-primary text-xs">Auto-filled</Text>
                    </View>
                  )}
                </View>
                <TextInput
                  placeholder={field.placeholder}
                  value={formData[field.label] || ""}
                  onChangeText={(v) => setFormData({ ...formData, [field.label]: v })}
                  keyboardType={
                    field.type === "number" ? "numeric"
                    : field.type === "phone" ? "phone-pad"
                    : field.type === "email" ? "email-address"
                    : "default"
                  }
                  style={{
                    borderWidth: 1,
                    borderColor: field.preFilledFromProfile ? "#8B5CF6" : "#334155",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: "#F8FAFC",
                    backgroundColor: field.preFilledFromProfile ? "rgba(139,92,246,0.1)" : "#1E293B",
                  }}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            ))}

            <Pressable
              onPress={handleSubmit}
              disabled={isLoading}
              className="bg-primary py-3 rounded-xl items-center mt-4 flex-row justify-center gap-2"
            >
              {isLoading
                ? <ActivityIndicator color="white" />
                : <>
                    <Send size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">{t.photoForm.generateForm}</Text>
                  </>
              }
            </Pressable>

            <Pressable onPress={() => setStep("upload")} className="mt-3 py-2 items-center">
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
            <Text className="text-2xl font-bold text-foreground mb-2">{t.photoForm.formFilled}</Text>
            <Text className="text-muted text-center mb-8">{t.photoForm.formFilledDesc}</Text>

            <Pressable
              onPress={() => Linking.openURL(pdfUrl)}
              className="bg-primary px-8 py-4 rounded-xl flex-row items-center gap-2 w-full justify-center"
            >
              <Download size={20} color="white" />
              <Text className="text-white font-semibold ml-2">{t.photoForm.download}</Text>
            </Pressable>

            <Pressable
              onPress={() => { setStep("upload"); setFields([]); setFormData({}); setImageId(""); setPdfUrl(""); }}
              className="mt-4 py-2 items-center"
            >
              <Text className="text-primary">{t.photoForm.fillAnother}</Text>
            </Pressable>
          </View>
        )}

        {/* History */}
        <View className="mt-8">
          <View className="flex-row items-center gap-2 mb-3">
            <History size={18} color="#8B5CF6" />
            <Text className="text-foreground font-bold text-base">Recent Forms</Text>
          </View>

          {historyLoading ? (
            <ActivityIndicator color="#8B5CF6" />
          ) : history.length === 0 ? (
            <Text className="text-muted text-sm">No previous forms</Text>
          ) : (
            history.map((item) => (
              <View key={item._id} className="bg-card border border-border rounded-xl mb-3 overflow-hidden">
                <Pressable
                  onPress={() => setExpandedId(expandedId === item._id ? null : item._id)}
                  className="flex-row items-center p-3 gap-3"
                >
                  <View className="flex-1">
                    <Text className="text-foreground font-medium text-sm">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                    <Text className="text-muted text-xs">
                      {item.formFields.length} fields
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => Linking.openURL(item.pdfUrl)}
                    className="bg-primary/20 px-3 py-1 rounded-lg mr-2"
                  >
                    <Text className="text-primary text-xs font-semibold">PDF</Text>
                  </Pressable>
                  {expandedId === item._id
                    ? <ChevronUp size={16} color="#64748B" />
                    : <ChevronDown size={16} color="#64748B" />
                  }
                </Pressable>

                {expandedId === item._id && (
                  <View className="px-4 pb-4 border-t border-border">
                    {item.formFields.map((f, i) => (
                      <View key={i} className="py-2 border-b border-border/50">
                        <Text className="text-muted text-xs">{f.label}</Text>
                        <Text className="text-foreground text-sm font-medium">{f.value || "—"}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* Save to Profile Modal */}
      <Modal visible={saveModalOpen}  transparent animationType="slide" onRequestClose={() => setSaveModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }} >
          
          <View style={{ backgroundColor: "#1E293B", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <View className="flex-row items-center gap-2 mb-2">
              <CheckCircle size={20} color="#8B5CF6" />
              <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>Save for Future Use?</Text>
            </View>
            <Text style={{ color: "#94A3B8", marginBottom: 16 }}>
              These new details can be saved to your profile so they auto-fill next time.
            </Text>

           <ScrollView
  style={{ maxHeight: 240 }}
  showsVerticalScrollIndicator={true}
  nestedScrollEnabled={true}
>
  {newFields.map((f) => (
    <Pressable
      key={f.label}
      onPress={() => setSelectedToSave({ ...selectedToSave, [f.label]: !selectedToSave[f.label] })}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 10,
        backgroundColor: selectedToSave[f.label] ? "rgba(139,92,246,0.15)" : "#0F172A",
        borderWidth: 1,
        borderColor: selectedToSave[f.label] ? "#8B5CF6" : "#334155",
        marginBottom: 8,
      }}
    >
      <View style={{
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: selectedToSave[f.label] ? "#8B5CF6" : "transparent",
        borderWidth: 2, borderColor: "#8B5CF6",
        alignItems: "center", justifyContent: "center", marginRight: 12,
      }}>
        {selectedToSave[f.label] && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "white" }} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#94A3B8", fontSize: 11 }}>{f.label}</Text>
        <Text style={{ color: "white", fontWeight: "600" }}>{f.value}</Text>
      </View>
    </Pressable>
  ))}
</ScrollView>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <Pressable
                onPress={() => submitForm([])}
                style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#334155", alignItems: "center" }}
              >
                <Text style={{ color: "#94A3B8", fontWeight: "600" }}>Skip</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const toSave = newFields.filter((f) => selectedToSave[f.label]);
                  submitForm(toSave);
                }}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: "#8B5CF6", alignItems: "center" }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>Save & Continue</Text>
              </Pressable>
            </View>
          </View>

        </View>
      </Modal>

    </View>
  );
}