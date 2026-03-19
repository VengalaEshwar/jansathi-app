import { useEffect, useState } from "react";
import {
  View, Text, Modal, Pressable, Switch, ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { apiRequest } from "@/integrations/api/client";
import { useToast } from "@/hooks/useToast";

interface AccessibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const AccessibilityDialog = ({ open, onOpenChange, userId }: AccessibilityDialogProps) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [settings, setSettings] = useState({
    text_size: "medium",
    high_contrast: false,
    screen_reader: false,
    voice_navigation: true,
  });

  useEffect(() => {
    if (open && userId) loadSettings();
  }, [open, userId]);

  const loadSettings = async () => {
    try {
      const data = await apiRequest("/auth/profile");
      if (data.user?.accessibility) {
        setSettings({
          text_size: data.user.accessibility.textSize || "medium",
          high_contrast: data.user.accessibility.highContrast || false,
          screen_reader: data.user.accessibility.screenReader || false,
          voice_navigation: data.user.accessibility.voiceNavigation ?? true,
        });
      }
    } catch {
      toast.error("Error loading accessibility settings");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiRequest("/auth/profile", "PUT", {
        accessibility: {
          textSize: settings.text_size,
          highContrast: settings.high_contrast,
          screenReader: settings.screen_reader,
          voiceNavigation: settings.voice_navigation,
        },
      });
      toast.success("Accessibility settings updated");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error updating settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center">
        <View className="bg-light-card dark:bg-card w-[90%] rounded-xl p-4">
          <Text className="text-xl font-bold mb-4 text-light-foreground dark:text-foreground">Accessibility Settings</Text>

          <View className="mb-4">
            <Text className="mb-1 font-medium text-light-foreground dark:text-foreground">Text Size</Text>
            <View className="border border-light-border dark:border-border rounded-lg">
              <Picker
                selectedValue={settings.text_size}
                onValueChange={(value) => setSettings({ ...settings, text_size: value })}
              >
                <Picker.Item label="Small" value="small" />
                <Picker.Item label="Medium" value="medium" />
                <Picker.Item label="Large" value="large" />
                <Picker.Item label="Extra Large" value="extra-large" />
              </Picker>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-light-foreground dark:text-foreground">High Contrast Mode</Text>
            <Switch
              value={settings.high_contrast}
              onValueChange={(v) => setSettings({ ...settings, high_contrast: v })}
            />
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-light-foreground dark:text-foreground">Screen Reader Support</Text>
            <Switch
              value={settings.screen_reader}
              onValueChange={(v) => setSettings({ ...settings, screen_reader: v })}
            />
          </View>

          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-light-foreground dark:text-foreground">Voice Navigation</Text>
            <Switch
              value={settings.voice_navigation}
              onValueChange={(v) => setSettings({ ...settings, voice_navigation: v })}
            />
          </View>

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