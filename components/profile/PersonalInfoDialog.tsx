import { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "@/integrations/supabase/client";

interface PersonalInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const PersonalInfoDialog = ({
  open,
  onOpenChange,
  userId,
}: PersonalInfoDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    age: "",
    location: "",
    phone: "",
  });

  useEffect(() => {
    if (open && userId) {
      loadProfile();
    }
  }, [open, userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          age: data.age?.toString() || "",
          location: data.location || "",
          phone: data.phone || "",
        });
      }
    } catch {
      Alert.alert("Error", "Error loading profile");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        age: formData.age ? parseInt(formData.age) : null,
        location: formData.location,
        phone: formData.phone,
      });

      if (error) throw error;

      Alert.alert("Success", "Profile updated successfully");
      onOpenChange(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={open} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 items-center justify-center">
        <View className="bg-card w-[90%] rounded-2xl p-4">
          <Text className="text-xl font-bold mb-4">Personal Information</Text>

          {/* First & Last Name */}
          <View className="flex-row gap-3 mb-3">
            <TextInput
              placeholder="First Name"
              value={formData.first_name}
              onChangeText={(v) =>
                setFormData({ ...formData, first_name: v })
              }
              className="flex-1 border border-border rounded-lg px-3 py-2"
            />
            <TextInput
              placeholder="Last Name"
              value={formData.last_name}
              onChangeText={(v) =>
                setFormData({ ...formData, last_name: v })
              }
              className="flex-1 border border-border rounded-lg px-3 py-2"
            />
          </View>

          {/* Age */}
          <TextInput
            placeholder="Age"
            keyboardType="numeric"
            value={formData.age}
            onChangeText={(v) =>
              setFormData({ ...formData, age: v })
            }
            className="border border-border rounded-lg px-3 py-2 mb-3"
          />

          {/* Location */}
          <TextInput
            placeholder="City, State"
            value={formData.location}
            onChangeText={(v) =>
              setFormData({ ...formData, location: v })
            }
            className="border border-border rounded-lg px-3 py-2 mb-3"
          />

          {/* Phone */}
          <TextInput
            placeholder="+91 XXXXXXXXXX"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(v) =>
              setFormData({ ...formData, phone: v })
            }
            className="border border-border rounded-lg px-3 py-2 mb-4"
          />

          {/* Buttons */}
          <View className="flex-row justify-end gap-3">
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
                <Text className="text-white">Save Changes</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
