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
import { supabase } from "@/integrations/supabase/client";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const NotificationsDialog = ({
  open,
  onOpenChange,
  userId,
}: NotificationsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    medication_reminders: true,
    appointment_alerts: true,
    government_updates: true,
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
        .select(
          "notifications_enabled, medication_reminders, appointment_alerts, government_updates"
        )
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      if (data) setSettings(data);
    } catch {
      Alert.alert("Error", "Error loading notification settings");
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

      Alert.alert("Success", "Notification settings updated");
      onOpenChange(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error updating settings");
    } finally {
      setLoading(false);
    }
  };

  const Row = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <View className="flex-row justify-between items-center py-2">
      <Text className="text-foreground">{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );

  return (
    <Modal visible={open} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 items-center justify-center">
        <View className="bg-card w-[90%] rounded-2xl p-4">
          <Text className="text-xl font-bold mb-4">
            Notification Settings
          </Text>

          <Row
            label="Enable Notifications"
            value={settings.notifications_enabled}
            onChange={(v) =>
              setSettings({ ...settings, notifications_enabled: v })
            }
          />

          <Row
            label="Medication Reminders"
            value={settings.medication_reminders}
            onChange={(v) =>
              setSettings({ ...settings, medication_reminders: v })
            }
          />

          <Row
            label="Appointment Alerts"
            value={settings.appointment_alerts}
            onChange={(v) =>
              setSettings({ ...settings, appointment_alerts: v })
            }
          />

          <Row
            label="Government Updates"
            value={settings.government_updates}
            onChange={(v) =>
              setSettings({ ...settings, government_updates: v })
            }
          />

          <View className="flex-row justify-end gap-3 mt-4">
            <Pressable
              onPress={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg border border-border"
            >
              <Text className="text-foreground">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-primary"
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
