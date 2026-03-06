import { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "@/integrations/supabase/client";

interface AccessibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const AccessibilityDialog = ({
  open,
  onOpenChange,
  userId,
}: AccessibilityDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    text_size: "medium",
    high_contrast: false,
    screen_reader: false,
    voice_navigation: true,
  });

  useEffect(() => {
    if (open && userId) {
      loadSettings();
    }
  }, [open, userId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("text_size, high_contrast, screen_reader, voice_navigation")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      if (data) setSettings(data);
    } catch {
      Alert.alert("Error", "Error loading accessibility settings");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        ...settings,
      });

      if (error) throw error;

      Alert.alert("Success", "Accessibility settings updated");
      onOpenChange(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error updating settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center">
        <View className="bg-white w-[90%] rounded-xl p-4">
          <Text className="text-xl font-bold mb-4">
            Accessibility Settings
          </Text>

          {/* Text Size */}
          <View className="mb-4">
            <Text className="mb-1 font-medium">Text Size</Text>
            <View className="border rounded-lg">
              <Picker
                selectedValue={settings.text_size}
                onValueChange={(value) =>
                  setSettings({ ...settings, text_size: value })
                }
              >
                <Picker.Item label="Small" value="small" />
                <Picker.Item label="Medium" value="medium" />
                <Picker.Item label="Large" value="large" />
                <Picker.Item label="Extra Large" value="extra-large" />
              </Picker>
            </View>
          </View>

          {/* High Contrast */}
          <View className="flex-row items-center justify-between mb-3">
            <Text>High Contrast Mode</Text>
            <Switch
              value={settings.high_contrast}
              onValueChange={(checked) =>
                setSettings({ ...settings, high_contrast: checked })
              }
            />
          </View>

          {/* Screen Reader */}
          <View className="flex-row items-center justify-between mb-3">
            <Text>Screen Reader Support</Text>
            <Switch
              value={settings.screen_reader}
              onValueChange={(checked) =>
                setSettings({ ...settings, screen_reader: checked })
              }
            />
          </View>

          {/* Voice Navigation */}
          <View className="flex-row items-center justify-between mb-6">
            <Text>Voice Navigation</Text>
            <Switch
              value={settings.voice_navigation}
              onValueChange={(checked) =>
                setSettings({ ...settings, voice_navigation: checked })
              }
            />
          </View>

          {/* Buttons */}
          <View className="flex-row justify-end gap-3">
            <Pressable
              onPress={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg border border-gray-300"
            >
              <Text>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-black"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white">Save</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
