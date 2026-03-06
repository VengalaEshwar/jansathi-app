import { useEffect, useState } from "react";
import {
  View, Text, Modal, Pressable, Switch, ActivityIndicator, Alert,
} from "react-native";
import { apiRequest } from "@/integrations/api/client";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const NotificationsDialog = ({ open, onOpenChange, userId }: NotificationsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    enabled: true,
    medicationReminders: true,
    appointmentAlerts: true,
    governmentUpdates: true,
  });

  useEffect(() => {
    if (open && userId) loadSettings();
  }, [open, userId]);

  const loadSettings = async () => {
    try {
      const data = await apiRequest("/auth/profile");
      if (data.user?.notifications) setSettings(data.user.notifications);
    } catch {
      Alert.alert("Error", "Error loading notification settings");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiRequest("/auth/profile", "PUT", { notifications: settings });
      Alert.alert("Success", "Notification settings updated");
      onOpenChange(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error updating settings");
    } finally {
      setLoading(false);
    }
  };

  const Row = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <View className="flex-row justify-between items-center py-2">
      <Text className="text-foreground">{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );

  return (
    <Modal visible={open} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 items-center justify-center">
        <View className="bg-card w-[90%] rounded-2xl p-4">
          <Text className="text-xl font-bold mb-4 text-foreground">Notification Settings</Text>

          <Row label="Enable Notifications" value={settings.enabled}
            onChange={(v) => setSettings({ ...settings, enabled: v })} />
          <Row label="Medication Reminders" value={settings.medicationReminders}
            onChange={(v) => setSettings({ ...settings, medicationReminders: v })} />
          <Row label="Appointment Alerts" value={settings.appointmentAlerts}
            onChange={(v) => setSettings({ ...settings, appointmentAlerts: v })} />
          <Row label="Government Updates" value={settings.governmentUpdates}
            onChange={(v) => setSettings({ ...settings, governmentUpdates: v })} />

          <View className="flex-row justify-end gap-3 mt-4">
            <Pressable onPress={() => onOpenChange(false)} className="px-4 py-2 rounded-lg border border-border">
              <Text className="text-foreground">Cancel</Text>
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