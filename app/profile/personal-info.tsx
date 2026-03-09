import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from "lucide-react-native";
import { apiRequest } from "@/integrations/api/client";
import { useAppDispatch } from "@/store/hooks";
import { updateDbUser } from "@/store/slices/authSlice";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";

interface ExtraField {
  label: string;
  value: string;
}

export default function PersonalInfo() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const pi = t.personalInfo;
  const toast = useToast();
  const { confirm } = useConfirm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");

  const [extraFields, setExtraFields] = useState<ExtraField[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editValue, setEditValue] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/auth/profile");
      if (data.success && data.user) {
        const nameParts = (data.user.name || "").split(" ");
        setFirstName(nameParts[0] || "");
        setLastName(nameParts.slice(1).join(" ") || "");
        setPhone(data.user.phone || "");
        setAge(data.user.personalInfo?.age?.toString() || "");
        setDob(data.user.personalInfo?.dob || "");
        setGender(data.user.personalInfo?.gender || "");
        setAddress(data.user.personalInfo?.address || "");
        setLocation(data.user.personalInfo?.location || "");
        setExtraFields(data.user.personalInfo?.extra || []);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await apiRequest("/auth/personal-info", "PATCH", {
        name: `${firstName} ${lastName}`.trim(),
        phone,
        personalInfo: {
          age: age ? parseInt(age) : null,
          dob,
          gender,
          address,
          location,
          extra: extraFields,
        },
      });
      if (data.success) {
        dispatch(updateDbUser(data.user));
        toast.success(pi.updateSuccess);
        router.back();
      }
    } catch (e: any) {
      toast.error(e.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditLabel(extraFields[index].label);
    setEditValue(extraFields[index].value);
  };

  const saveEdit = () => {
    if (!editLabel.trim() || !editValue.trim()) return;
    const updated = [...extraFields];
    updated[editingIndex!] = { label: editLabel, value: editValue };
    setExtraFields(updated);
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditLabel("");
    setEditValue("");
  };

  const handleDelete = (index: number) => {
    confirm({
      title: pi.deleteField,
      message: pi.deleteConfirm,
      variant: "danger",
      confirmText: t.common.delete,
      cancelText: t.common.cancel,
      onConfirm: () => setExtraFields(extraFields.filter((_, i) => i !== index)),
    });
  };

  const saveNewField = () => {
    if (!newLabel.trim() || !newValue.trim()) return;
    setExtraFields([...extraFields, { label: newLabel, value: newValue }]);
    setNewLabel("");
    setNewValue("");
    setAddingNew(false);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-muted mt-2">{t.common.loading}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">

      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={20} color="#6b7280" />
        </Pressable>
        <Text className="text-xl font-bold text-foreground flex-1">{pi.title}</Text>
        <Pressable onPress={handleSave} disabled={saving} className="bg-primary px-4 py-2 rounded-lg">
          {saving
            ? <ActivityIndicator color="white" size="small" />
            : <Text className="text-white font-semibold">{t.common.save}</Text>
          }
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        <Text className="text-foreground font-bold mb-3 text-base">{pi.basicInfo}</Text>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <TextInput
            placeholder={pi.firstName}
            placeholderTextColor="#94A3B8"
            value={firstName}
            onChangeText={setFirstName}
            style={{ flex: 1, minWidth: 120 }}
            className="border border-border rounded-lg px-3 py-3 text-foreground bg-card"
          />
          <TextInput
            placeholder={pi.lastName}
            placeholderTextColor="#94A3B8"
            value={lastName}
            onChangeText={setLastName}
            style={{ flex: 1, minWidth: 120 }}
            className="border border-border rounded-lg px-3 py-3 text-foreground bg-card"
          />
        </View>

        <TextInput
          placeholder={pi.phone}
          placeholderTextColor="#94A3B8"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          className="border border-border rounded-lg px-3 py-3 mb-3 text-foreground bg-card"
        />
        <TextInput
          placeholder={pi.age}
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
          className="border border-border rounded-lg px-3 py-3 mb-3 text-foreground bg-card"
        />
        <TextInput
          placeholder={pi.dob}
          placeholderTextColor="#94A3B8"
          value={dob}
          onChangeText={setDob}
          className="border border-border rounded-lg px-3 py-3 mb-3 text-foreground bg-card"
        />
        <TextInput
          placeholder={pi.gender}
          placeholderTextColor="#94A3B8"
          value={gender}
          onChangeText={setGender}
          className="border border-border rounded-lg px-3 py-3 mb-3 text-foreground bg-card"
        />
        <TextInput
          placeholder={pi.address}
          placeholderTextColor="#94A3B8"
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={2}
          className="border border-border rounded-lg px-3 py-3 mb-3 text-foreground bg-card"
        />
        <TextInput
          placeholder={pi.location}
          placeholderTextColor="#94A3B8"
          value={location}
          onChangeText={setLocation}
          className="border border-border rounded-lg px-3 py-3 mb-6 text-foreground bg-card"
        />

        {/* Extra Fields */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-foreground font-bold text-base">{pi.additionalDetails}</Text>
          <Pressable
            onPress={() => setAddingNew(true)}
            className="flex-row items-center gap-1 bg-primary px-3 py-2 rounded-lg"
          >
            <Plus size={14} color="white" />
            <Text className="text-white text-sm font-semibold">{pi.addField}</Text>
          </Pressable>
        </View>

        {extraFields.map((field, index) => (
          <View key={index} className="bg-card border border-border rounded-xl p-3 mb-3">
            {editingIndex === index ? (
              <View>
                <TextInput
                  placeholder={pi.labelPlaceholder}
                  placeholderTextColor="#94A3B8"
                  value={editLabel}
                  onChangeText={setEditLabel}
                  className="border border-border rounded-lg px-3 py-2 mb-2 text-foreground"
                />
                <TextInput
                  placeholder={pi.valuePlaceholder}
                  placeholderTextColor="#94A3B8"
                  value={editValue}
                  onChangeText={setEditValue}
                  className="border border-border rounded-lg px-3 py-2 mb-2 text-foreground"
                />
                <View className="flex-row gap-2 justify-end">
                  <Pressable onPress={cancelEdit} className="p-2 rounded-lg border border-border">
                    <X size={16} color="#64748B" />
                  </Pressable>
                  <Pressable onPress={saveEdit} className="p-2 rounded-lg bg-primary">
                    <Check size={16} color="white" />
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-muted text-xs mb-1">{field.label}</Text>
                  <Text className="text-foreground font-medium">{field.value}</Text>
                </View>
                <View className="flex-row gap-2">
                  <Pressable onPress={() => startEdit(index)} className="p-2 rounded-lg bg-secondary">
                    <Pencil size={14} color="#8B5CF6" />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(index)} className="p-2 rounded-lg bg-secondary">
                    <Trash2 size={14} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        ))}

        {addingNew && (
          <View className="bg-card border border-primary rounded-xl p-3 mb-3">
            <Text className="text-foreground font-semibold mb-2">{pi.newField}</Text>
            <TextInput
              placeholder={pi.labelPlaceholder}
              placeholderTextColor="#94A3B8"
              value={newLabel}
              onChangeText={setNewLabel}
              className="border border-border rounded-lg px-3 py-2 mb-2 text-foreground"
            />
            <TextInput
              placeholder={pi.valuePlaceholder}
              placeholderTextColor="#94A3B8"
              value={newValue}
              onChangeText={setNewValue}
              className="border border-border rounded-lg px-3 py-2 mb-2 text-foreground"
            />
            <View className="flex-row gap-2 justify-end">
              <Pressable
                onPress={() => { setAddingNew(false); setNewLabel(""); setNewValue(""); }}
                className="px-4 py-2 rounded-lg border border-border"
              >
                <Text className="text-foreground">{t.common.cancel}</Text>
              </Pressable>
              <Pressable onPress={saveNewField} className="px-4 py-2 rounded-lg bg-primary">
                <Text className="text-white font-semibold">{t.common.save}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {extraFields.length === 0 && !addingNew && (
          <Text className="text-muted text-sm text-center py-4">{pi.noExtra}</Text>
        )}

      </ScrollView>
    </View>
  );
}