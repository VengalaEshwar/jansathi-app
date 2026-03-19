// app/profile/personal-info.tsx
import { useEffect, useState, useRef, useCallback, memo } from "react";
import {
  View, Text, ScrollView, Pressable, Animated,
  TextInput, ActivityIndicator, useWindowDimensions, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from "lucide-react-native";
import { apiRequest } from "@/integrations/api/client";
import { useAppDispatch } from "@/store/hooks";
import { updateDbUser } from "@/store/slices/authSlice";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import { useSound } from "@/hooks/useSound";

interface ExtraField { label: string; value: string; }

const INPUT_CLASS = "border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3.5 py-3 mb-3 text-[#0F172A] dark:text-white bg-white dark:bg-[#1E293B] text-sm";

const S = {
  gap8:  { gap: 8  } as const,
  gap10: { gap: 10 } as const,
  mb4:   { marginBottom: 4  } as const,
  mb8:   { marginBottom: 8  } as const,
  mb12:  { marginBottom: 12 } as const,
  mb16:  { marginBottom: 16 } as const,
};

// ── ExtraFieldRow — extracted so hooks are at component level ──────────────────
const ExtraFieldRow = memo(({
  field, index, isEditing, editLabel, editValue,
  onStartEdit, onSaveEdit, onCancelEdit, onDelete,
  onEditLabelChange, onEditValueChange,
  t, pi,
}: {
  field: ExtraField; index: number; isEditing: boolean;
  editLabel: string; editValue: string;
  onStartEdit: (i: number) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (i: number) => void;
  onEditLabelChange: (v: string) => void;
  onEditValueChange: (v: string) => void;
  t: any; pi: any;
}) => {
  // ✅ useRef at component level — never inside .map()
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, S.mb12]}>
      <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl"
        style={{ padding: 14 }}>
        {isEditing ? (
          <View>
            <TextInput placeholder={pi.labelPlaceholder} placeholderTextColor="#94A3B8"
              value={editLabel} onChangeText={onEditLabelChange} className={INPUT_CLASS} />
            <TextInput placeholder={pi.valuePlaceholder} placeholderTextColor="#94A3B8"
              value={editValue} onChangeText={onEditValueChange} className={INPUT_CLASS} />
            <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
              <AnimatedPressable onPress={onCancelEdit} soundType="soft"
                style={{ padding: 8, borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0" }}
                className="dark:border-[#334155]">
                <X size={15} color="#94A3B8" />
              </AnimatedPressable>
              <AnimatedPressable onPress={onSaveEdit} soundType="mechanical"
                style={{ padding: 8, borderRadius: 10, backgroundColor: "#8B5CF6" }}>
                <Check size={15} color="white" />
              </AnimatedPressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
            onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text className="text-[#94A3B8] text-xs" style={S.mb4}>{field.label}</Text>
              <Text className="text-[#0F172A] dark:text-white font-semibold text-sm">{field.value}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <AnimatedPressable onPress={() => onStartEdit(index)} soundType="soft"
                style={{ padding: 8, borderRadius: 12, backgroundColor: "#8B5CF610", borderWidth: 1, borderColor: "#8B5CF630" }}>
                <Pencil size={13} color="#8B5CF6" />
              </AnimatedPressable>
              <AnimatedPressable onPress={() => onDelete(index)} soundType="soft"
                style={{ padding: 8, borderRadius: 12, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" }}
                className="dark:bg-red-900/20 dark:border-red-800">
                <Trash2 size={13} color="#EF4444" />
              </AnimatedPressable>
            </View>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
});

export default function PersonalInfo() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { t }    = useTranslation();
  const pi       = t.personalInfo;
  const toast    = useToast();
  const { confirm }   = useConfirm();
  const { playClick } = useSound();
  const { width }     = useWindowDimensions();
  const isWide        = width >= 700;
  const isLarge       = width >= 1100;

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

  // ── Correct width formula ──────────────────────────────────────────────────
  const containerWidth = isLarge ? 1100 : isWide ? 860 : undefined;
  const sidePad = containerWidth ? Math.max(24, (width - containerWidth) / 2) : 20;

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

  const startEdit  = useCallback((index: number) => { playClick("soft"); setEditingIndex(index); setEditLabel(extraFields[index].label); setEditValue(extraFields[index].value); }, [extraFields, playClick]);
  const saveEdit   = useCallback(() => { if (!editLabel.trim() || !editValue.trim()) return; const u = [...extraFields]; u[editingIndex!] = { label: editLabel, value: editValue }; setExtraFields(u); setEditingIndex(null); }, [editLabel, editValue, editingIndex, extraFields]);
  const cancelEdit = useCallback(() => { setEditingIndex(null); setEditLabel(""); setEditValue(""); }, []);

  const handleDelete = useCallback((index: number) => confirm({
    title: pi.deleteField, message: pi.deleteConfirm, variant: "danger",
    confirmText: t.common.delete, cancelText: t.common.cancel,
    onConfirm: () => setExtraFields(extraFields.filter((_, i) => i !== index)),
  }), [extraFields, pi, t, confirm]);

  const saveNewField = useCallback(() => {
    if (!newLabel.trim() || !newValue.trim()) return;
    setExtraFields([...extraFields, { label: newLabel, value: newValue }]);
    setNewLabel(""); setNewValue(""); setAddingNew(false);
  }, [newLabel, newValue, extraFields]);

  if (loading) return (
    <View className="flex-1 items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text className="text-[#94A3B8] mt-2">{t.common.loading}</Text>
    </View>
  );

  // 2-col field pairs on wide screens
  const basicFieldPairs = [
    [
      { placeholder: pi.firstName, value: firstName, onChange: setFirstName, keyboardType: "default" },
      { placeholder: pi.lastName,  value: lastName,  onChange: setLastName,  keyboardType: "default" },
    ],
    [
      { placeholder: pi.phone, value: phone, onChange: setPhone, keyboardType: "phone-pad" },
      { placeholder: pi.age,   value: age,   onChange: setAge,   keyboardType: "numeric"   },
    ],
    [
      { placeholder: pi.dob,    value: dob,    onChange: setDob,    keyboardType: "default" },
      { placeholder: pi.gender, value: gender, onChange: setGender, keyboardType: "default" },
    ],
  ];

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Sticky header bar */}
      <View className="flex-row items-center border-b border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A]"
        style={{ paddingHorizontal: sidePad, paddingTop: 16, paddingBottom: 12 }}>
        <AnimatedPressable onPress={() => router.back()} soundType="soft" style={{ marginRight: 12 }}>
          <ArrowLeft size={20} color="#8B5CF6" />
        </AnimatedPressable>
        <Text className="flex-1 text-[17px] font-extrabold text-[#0F172A] dark:text-white">{pi.title}</Text>
        {/* Save button — pure style */}
        <AnimatedPressable onPress={handleSave} disabled={saving} soundType="mechanical"
          style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: "#8B5CF6",
            shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}>
          {saving
            ? <ActivityIndicator color="white" size="small" />
            : <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>{t.common.save}</Text>}
        </AnimatedPressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Centered content container */}
        <View style={{
          paddingHorizontal: sidePad, paddingTop: 20,
          ...(containerWidth ? { maxWidth: containerWidth + sidePad * 2, alignSelf: "center" as const, width: "100%" } : {}),
        }}>
          {Platform.OS === "web" && <View style={{ height: 8 }} />}

          {/* Basic info section */}
          <Text className="text-primary text-xs font-bold ml-0.5 mb-3 mt-1"
            style={{ letterSpacing: 1.2 }}>{pi.basicInfo.toUpperCase()}</Text>

          {/* On wide: 2-col pairs. On mobile: single col */}
          {isWide ? (
            <>
              {basicFieldPairs.map((pair, ri) => (
                <View key={ri} style={{ flexDirection: "row", gap: 12 }}>
                  {pair.map((f, fi) => (
                    <TextInput key={fi} placeholder={f.placeholder} placeholderTextColor="#94A3B8"
                      value={f.value} onChangeText={f.onChange} keyboardType={f.keyboardType as any}
                      className={`${INPUT_CLASS} flex-1`} />
                  ))}
                </View>
              ))}
            </>
          ) : (
            <>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput placeholder={pi.firstName} placeholderTextColor="#94A3B8" value={firstName} onChangeText={setFirstName} className={`${INPUT_CLASS} flex-1`} />
                <TextInput placeholder={pi.lastName}  placeholderTextColor="#94A3B8" value={lastName}  onChangeText={setLastName}  className={`${INPUT_CLASS} flex-1`} />
              </View>
              <TextInput placeholder={pi.phone}  placeholderTextColor="#94A3B8" value={phone}  onChangeText={setPhone}  keyboardType="phone-pad" className={INPUT_CLASS} />
              <TextInput placeholder={pi.age}    placeholderTextColor="#94A3B8" value={age}    onChangeText={setAge}    keyboardType="numeric"   className={INPUT_CLASS} />
              <TextInput placeholder={pi.dob}    placeholderTextColor="#94A3B8" value={dob}    onChangeText={setDob}    className={INPUT_CLASS} />
              <TextInput placeholder={pi.gender} placeholderTextColor="#94A3B8" value={gender} onChangeText={setGender} className={INPUT_CLASS} />
            </>
          )}

          <TextInput placeholder={pi.address} placeholderTextColor="#94A3B8" value={address} onChangeText={setAddress} multiline numberOfLines={2} className={INPUT_CLASS} />
          <TextInput placeholder={pi.location} placeholderTextColor="#94A3B8" value={location} onChangeText={setLocation} className={INPUT_CLASS} />

          {/* Additional fields header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 8 }}>
            <Text className="text-primary text-xs font-bold ml-0.5" style={{ letterSpacing: 1.2 }}>
              {pi.additionalDetails.toUpperCase()}
            </Text>
            <AnimatedPressable onPress={() => { playClick("mechanical"); setAddingNew(true); }} soundType="mechanical"
              style={{ flexDirection: "row", alignItems: "center", gap: 4,
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: "#8B5CF6",
                shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 }}>
              <Plus size={13} color="white" />
              <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>{pi.addField}</Text>
            </AnimatedPressable>
          </View>

          {/* Extra fields — ExtraFieldRow component avoids hook-in-map violation */}
          {isWide ? (
            // 2-col on wide
            (() => {
              const pairs: ExtraField[][] = [];
              for (let i = 0; i < extraFields.length; i += 2) pairs.push(extraFields.slice(i, i + 2));
              return pairs.map((pair, ri) => (
                <View key={ri} style={{ flexDirection: "row", gap: 12 }}>
                  {pair.map((field, fi) => {
                    const idx = ri * 2 + fi;
                    return (
                      <View key={idx} style={{ flex: 1 }}>
                        <ExtraFieldRow
                          field={field} index={idx}
                          isEditing={editingIndex === idx}
                          editLabel={editLabel} editValue={editValue}
                          onStartEdit={startEdit} onSaveEdit={saveEdit} onCancelEdit={cancelEdit}
                          onDelete={handleDelete}
                          onEditLabelChange={setEditLabel} onEditValueChange={setEditValue}
                          t={t} pi={pi}
                        />
                      </View>
                    );
                  })}
                  {pair.length === 1 && <View style={{ flex: 1 }} />}
                </View>
              ));
            })()
          ) : (
            extraFields.map((field, index) => (
              <ExtraFieldRow
                key={index}
                field={field} index={index}
                isEditing={editingIndex === index}
                editLabel={editLabel} editValue={editValue}
                onStartEdit={startEdit} onSaveEdit={saveEdit} onCancelEdit={cancelEdit}
                onDelete={handleDelete}
                onEditLabelChange={setEditLabel} onEditValueChange={setEditValue}
                t={t} pi={pi}
              />
            ))
          )}

          {/* Add new field form */}
          {addingNew && (
            <View className="bg-white dark:bg-[#1E293B] border-2 border-primary rounded-2xl"
              style={{ padding: 14, marginBottom: 12 }}>
              <Text style={{ color: "#8B5CF6", fontWeight: "700", fontSize: 14, marginBottom: 10 }}>{pi.newField}</Text>
              <TextInput placeholder={pi.labelPlaceholder} placeholderTextColor="#94A3B8" value={newLabel} onChangeText={setNewLabel} className={INPUT_CLASS} />
              <TextInput placeholder={pi.valuePlaceholder} placeholderTextColor="#94A3B8" value={newValue} onChangeText={setNewValue} className={INPUT_CLASS} />
              <View style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end" }}>
                <AnimatedPressable onPress={() => { setAddingNew(false); setNewLabel(""); setNewValue(""); }} soundType="soft"
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" }}
                  className="dark:border-[#334155]">
                  <Text style={{ color: "#94A3B8", fontWeight: "600", fontSize: 13 }}>{t.common.cancel}</Text>
                </AnimatedPressable>
                <AnimatedPressable onPress={saveNewField} soundType="mechanical"
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: "#8B5CF6",
                    shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 }}>
                  <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>{t.common.save}</Text>
                </AnimatedPressable>
              </View>
            </View>
          )}

          {extraFields.length === 0 && !addingNew && (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <Text className="text-[#94A3B8] text-sm text-center">{pi.noExtra}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}