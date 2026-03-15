// app/profile/personal-info.tsx
import { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, Pressable, Animated, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, User } from "lucide-react-native";
import { apiRequest } from "@/integrations/api/client";
import { useAppDispatch } from "@/store/hooks";
import { updateDbUser } from "@/store/slices/authSlice";
import { ScreenHeader } from "@/components/ScreenHeader";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import { useSound } from "@/hooks/useSound";

interface ExtraField { label: string; value: string; }

// Shared NativeWind input style
const INPUT_CLASS = "border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3.5 py-3 mb-3 text-[#0F172A] dark:text-white bg-white dark:bg-[#1E293B] text-sm";

export default function PersonalInfo() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { t }    = useTranslation();
  const pi       = t.personalInfo;
  const toast    = useToast();
  const { confirm } = useConfirm();
  const { playClick } = useSound();

  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [firstName,    setFirstName]    = useState("");
  const [lastName,     setLastName]     = useState("");
  const [phone,        setPhone]        = useState("");
  const [age,          setAge]          = useState("");
  const [dob,          setDob]          = useState("");
  const [gender,       setGender]       = useState("");
  const [address,      setAddress]      = useState("");
  const [location,     setLocation]     = useState("");
  const [extraFields,  setExtraFields]  = useState<ExtraField[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editLabel,    setEditLabel]    = useState("");
  const [editValue,    setEditValue]    = useState("");
  const [addingNew,    setAddingNew]    = useState(false);
  const [newLabel,     setNewLabel]     = useState("");
  const [newValue,     setNewValue]     = useState("");

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/auth/profile");
      if (data.success && data.user) {
        const nameParts = (data.user.name || "").split(" ");
        setFirstName(nameParts[0] || ""); setLastName(nameParts.slice(1).join(" ") || "");
        setPhone(data.user.phone || ""); setAge(data.user.personalInfo?.age?.toString() || "");
        setDob(data.user.personalInfo?.dob || ""); setGender(data.user.personalInfo?.gender || "");
        setAddress(data.user.personalInfo?.address || ""); setLocation(data.user.personalInfo?.location || "");
        setExtraFields(data.user.personalInfo?.extra || []);
      }
    } catch { toast.error(t.common.error); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    playClick("mechanical"); setSaving(true);
    try {
      const data = await apiRequest("/auth/personal-info", "PATCH", {
        name: `${firstName} ${lastName}`.trim(), phone,
        personalInfo: { age: age ? parseInt(age) : null, dob, gender, address, location, extra: extraFields },
      });
      if (data.success) { dispatch(updateDbUser(data.user)); toast.success(pi.updateSuccess); router.back(); }
    } catch (e: any) { toast.error(e.message || t.common.error); }
    finally { setSaving(false); }
  };

  const startEdit   = (index: number) => { playClick("soft"); setEditingIndex(index); setEditLabel(extraFields[index].label); setEditValue(extraFields[index].value); };
  const saveEdit    = () => { if (!editLabel.trim() || !editValue.trim()) return; const u = [...extraFields]; u[editingIndex!] = { label: editLabel, value: editValue }; setExtraFields(u); setEditingIndex(null); };
  const cancelEdit  = () => { setEditingIndex(null); setEditLabel(""); setEditValue(""); };
  const handleDelete = (index: number) => confirm({ title: pi.deleteField, message: pi.deleteConfirm, variant: "danger", confirmText: t.common.delete, cancelText: t.common.cancel, onConfirm: () => setExtraFields(extraFields.filter((_, i) => i !== index)) });
  const saveNewField = () => { if (!newLabel.trim() || !newValue.trim()) return; setExtraFields([...extraFields, { label: newLabel, value: newValue }]); setNewLabel(""); setNewValue(""); setAddingNew(false); };

  if (loading) return (
    <View className="flex-1 items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text className="text-[#94A3B8] mt-2">{t.common.loading}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Header bar */}
      <View className="flex-row items-center px-4 pt-4 pb-3 border-b border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A]">
        <AnimatedPressable onPress={() => router.back()} soundType="soft" className="mr-2.5">
          <ArrowLeft size={20} color="#8B5CF6" />
        </AnimatedPressable>
        <Text className="flex-1 text-[17px] font-extrabold text-[#0F172A] dark:text-white">{pi.title}</Text>
        <AnimatedPressable onPress={handleSave} disabled={saving} soundType="mechanical"
          className="bg-primary px-4 py-2 rounded-xl">
          {saving ? <ActivityIndicator color="white" size="small" /> : <Text className="text-white font-bold text-sm">{t.common.save}</Text>}
        </AnimatedPressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Basic info section label */}
        <Text className="text-xs font-bold tracking-widest text-primary mb-3 mt-1 ml-0.5">{pi.basicInfo.toUpperCase()}</Text>

        {/* Name row */}
        <View className="flex-row gap-2.5 mb-0">
          <TextInput placeholder={pi.firstName} placeholderTextColor="#94A3B8" value={firstName} onChangeText={setFirstName}
            className={`${INPUT_CLASS} flex-1`} />
          <TextInput placeholder={pi.lastName} placeholderTextColor="#94A3B8" value={lastName} onChangeText={setLastName}
            className={`${INPUT_CLASS} flex-1`} />
        </View>

        <TextInput placeholder={pi.phone}   placeholderTextColor="#94A3B8" value={phone}   onChangeText={setPhone}   keyboardType="phone-pad"    className={INPUT_CLASS} />
        <TextInput placeholder={pi.age}     placeholderTextColor="#94A3B8" value={age}     onChangeText={setAge}     keyboardType="numeric"      className={INPUT_CLASS} />
        <TextInput placeholder={pi.dob}     placeholderTextColor="#94A3B8" value={dob}     onChangeText={setDob}                                 className={INPUT_CLASS} />
        <TextInput placeholder={pi.gender}  placeholderTextColor="#94A3B8" value={gender}  onChangeText={setGender}                              className={INPUT_CLASS} />
        <TextInput placeholder={pi.address} placeholderTextColor="#94A3B8" value={address} onChangeText={setAddress} multiline numberOfLines={2}  className={INPUT_CLASS} />
        <TextInput placeholder={pi.location} placeholderTextColor="#94A3B8" value={location} onChangeText={setLocation}                          className={INPUT_CLASS} />

        {/* Additional fields header */}
        <View className="flex-row items-center justify-between mb-3 mt-1">
          <Text className="text-xs font-bold tracking-widest text-primary ml-0.5">{pi.additionalDetails.toUpperCase()}</Text>
          <AnimatedPressable onPress={() => { playClick("mechanical"); setAddingNew(true); }} soundType="mechanical"
            className="flex-row items-center gap-1 bg-primary px-3 py-1.5 rounded-xl">
            <Plus size={13} color="white" />
            <Text className="text-white text-xs font-bold">{pi.addField}</Text>
          </AnimatedPressable>
        </View>

        {extraFields.map((field, index) => {
          const scale = useRef(new Animated.Value(1)).current;
          return (
            <Animated.View key={index} style={{ transform: [{ scale }] }} className="mb-2.5">
              <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-3.5">
                {editingIndex === index ? (
                  <View>
                    <TextInput placeholder={pi.labelPlaceholder} placeholderTextColor="#94A3B8" value={editLabel} onChangeText={setEditLabel} className={INPUT_CLASS} />
                    <TextInput placeholder={pi.valuePlaceholder} placeholderTextColor="#94A3B8" value={editValue} onChangeText={setEditValue} className={INPUT_CLASS} />
                    <View className="flex-row gap-2 justify-end">
                      <AnimatedPressable onPress={cancelEdit} soundType="soft" className="p-2 rounded-lg border border-[#E2E8F0] dark:border-[#334155]">
                        <X size={15} color="#94A3B8" />
                      </AnimatedPressable>
                      <AnimatedPressable onPress={saveEdit} soundType="mechanical" className="p-2 rounded-lg bg-primary">
                        <Check size={15} color="white" />
                      </AnimatedPressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
                    onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
                    className="flex-row items-center justify-between"
                  >
                    <View className="flex-1">
                      <Text className="text-[#94A3B8] text-xs mb-0.5">{field.label}</Text>
                      <Text className="text-[#0F172A] dark:text-white font-semibold text-sm">{field.value}</Text>
                    </View>
                    <View className="flex-row gap-2">
                      <AnimatedPressable onPress={() => startEdit(index)} soundType="soft" className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                        <Pencil size={13} color="#8B5CF6" />
                      </AnimatedPressable>
                      <AnimatedPressable onPress={() => handleDelete(index)} soundType="soft" className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <Trash2 size={13} color="#EF4444" />
                      </AnimatedPressable>
                    </View>
                  </Pressable>
                )}
              </View>
            </Animated.View>
          );
        })}

        {addingNew && (
          <View className="bg-white dark:bg-[#1E293B] border-2 border-primary rounded-2xl p-3.5 mb-2.5">
            <Text className="text-primary font-bold text-sm mb-2.5">{pi.newField}</Text>
            <TextInput placeholder={pi.labelPlaceholder} placeholderTextColor="#94A3B8" value={newLabel} onChangeText={setNewLabel} className={INPUT_CLASS} />
            <TextInput placeholder={pi.valuePlaceholder} placeholderTextColor="#94A3B8" value={newValue} onChangeText={setNewValue} className={INPUT_CLASS} />
            <View className="flex-row gap-2.5 justify-end">
              <AnimatedPressable onPress={() => { setAddingNew(false); setNewLabel(""); setNewValue(""); }} soundType="soft"
                className="px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155]">
                <Text className="text-[#94A3B8] font-semibold text-sm">{t.common.cancel}</Text>
              </AnimatedPressable>
              <AnimatedPressable onPress={saveNewField} soundType="mechanical" className="px-3.5 py-2 rounded-xl bg-primary">
                <Text className="text-white font-bold text-sm">{t.common.save}</Text>
              </AnimatedPressable>
            </View>
          </View>
        )}

        {extraFields.length === 0 && !addingNew && (
          <View className="items-center py-6">
            <Text className="text-[#94A3B8] text-sm text-center">{pi.noExtra}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}