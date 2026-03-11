import { useState, useEffect } from "react";
import {
  View, Text, Modal, Pressable, ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { apiRequest } from "@/integrations/api/client";
import { useToast } from "@/hooks/useToast";

interface LanguageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const languages = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिंदी (Hindi)" },
  { value: "bn", label: "বাংলা (Bengali)" },
  { value: "te", label: "తెలుగు (Telugu)" },
  { value: "mr", label: "मराठी (Marathi)" },
  { value: "ta", label: "தமிழ் (Tamil)" },
  { value: "gu", label: "ગુજરાતી (Gujarati)" },
  { value: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { value: "ml", label: "മലയാളം (Malayalam)" },
  { value: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
];

export const LanguageDialog = ({ open, onOpenChange, userId }: LanguageDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en");
  const toast = useToast();

  useEffect(() => {
    if (open && userId) loadLanguage();
  }, [open, userId]);

  const loadLanguage = async () => {
    try {
      const data = await apiRequest("/auth/profile");
      if (data.user?.language) setLanguage(data.user.language);
    } catch {
      toast.error("Error loading language preference");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiRequest("/auth/profile", "PUT", { language });
      toast.success("Language preference updated");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error updating language");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={open} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 items-center justify-center">
        <View className="bg-light-card dark:bg-card w-[90%] rounded-2xl p-4">
          <Text className="text-xl font-bold mb-4 text-light-foreground dark:text-foreground">Language Preferences</Text>
          <Text className="mb-2 font-medium text-light-foreground dark:text-foreground">Preferred Language</Text>

          <View className="border border-light-border dark:border-border rounded-lg mb-3">
            <Picker selectedValue={language} onValueChange={(v) => setLanguage(v)}>
              {languages.map((lang) => (
                <Picker.Item key={lang.value} label={lang.label} value={lang.value} />
              ))}
            </Picker>
          </View>

          <Text className="text-sm text-muted mb-4">
            This will be used for app interface and voice assistance.
          </Text>

          <View className="flex-row justify-end gap-3">
            <Pressable onPress={() => onOpenChange(false)} className="px-4 py-2 rounded-lg border border-light-border dark:border-border">
              <Text className="text-light-foreground dark:text-foreground">Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSubmit} disabled={loading} className="px-4 py-2 rounded-lg bg-primary">
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white">Save</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};