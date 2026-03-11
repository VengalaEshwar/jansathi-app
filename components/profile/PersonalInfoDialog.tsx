import { useEffect, useState } from "react";
import {
  View, Text, Modal, Pressable, TextInput, ActivityIndicator,
} from "react-native";
import { apiRequest } from "@/integrations/api/client";
import { useToast } from "@/hooks/useToast";

interface PersonalInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const PersonalInfoDialog = ({ open, onOpenChange, userId }: PersonalInfoDialogProps) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    age: "",
    location: "",
    phone: "",
  });

  useEffect(() => {
    if (open && userId) loadProfile();
  }, [open, userId]);

  const loadProfile = async () => {
    try {
      const data = await apiRequest("/auth/profile");
      if (data.user) {
        const nameParts = (data.user.name || "").split(" ");
        setFormData({
          first_name: nameParts[0] || "",
          last_name: nameParts.slice(1).join(" ") || "",
          age: data.user.age?.toString() || "",
          location: data.user.location || "",
          phone: data.user.phone || "",
        });
      }
    } catch {
      toast.error("Error loading profile");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiRequest("/auth/profile", "PUT", {
        name: `${formData.first_name} ${formData.last_name}`.trim(),
        age: formData.age ? parseInt(formData.age) : null,
        location: formData.location,
        phone: formData.phone,
      });
      toast.success("Profile updated successfully");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={open} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 items-center justify-center">
        <View className="bg-light-card dark:bg-card w-[90%] rounded-2xl p-4">
          <Text className="text-xl font-bold mb-4 text-light-foreground dark:text-foreground">Personal Information</Text>

          <View className="flex-row gap-3 mb-3">
            <TextInput
              placeholder="First Name"
              placeholderTextColor="#94A3B8"
              value={formData.first_name}
              onChangeText={(v) => setFormData({ ...formData, first_name: v })}
              className="flex-1 border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-foreground dark:text-foreground"
            />
            <TextInput
              placeholder="Last Name"
              placeholderTextColor="#94A3B8"
              value={formData.last_name}
              onChangeText={(v) => setFormData({ ...formData, last_name: v })}
              className="flex-1 border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-foreground dark:text-foreground"
            />
          </View>

          <TextInput
            placeholder="Age"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={formData.age}
            onChangeText={(v) => setFormData({ ...formData, age: v })}
            className="border border-light-border dark:border-border rounded-lg px-3 py-2 mb-3 text-light-foreground dark:text-foreground"
          />
          <TextInput
            placeholder="City, State"
            placeholderTextColor="#94A3B8"
            value={formData.location}
            onChangeText={(v) => setFormData({ ...formData, location: v })}
            className="border border-light-border dark:border-border rounded-lg px-3 py-2 mb-3 text-light-foreground dark:text-foreground"
          />
          <TextInput
            placeholder="+91 XXXXXXXXXX"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(v) => setFormData({ ...formData, phone: v })}
            className="border border-light-border dark:border-border rounded-lg px-3 py-2 mb-4 text-light-foreground dark:text-foreground"
          />

          <View className="flex-row justify-end gap-3">
            <Pressable onPress={() => onOpenChange(false)} className="px-4 py-2 rounded-lg border border-light-border dark:border-border">
              <Text className="text-light-foreground dark:text-foreground">Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSubmit} disabled={loading} className="px-4 py-2 rounded-lg bg-primary">
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white">Save Changes</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};