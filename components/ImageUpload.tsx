// components/ImageUpload.tsx
import { useState, useCallback, memo } from "react";
import { View, Text, Image, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImageIcon, X } from "lucide-react-native";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useAppSelector } from "@/store/hooks";

interface ImageUploadProps {
  onImageSelect: (imageUri: string) => void;
  onClear?: () => void;
  disabled?: boolean;
}

export const ImageUpload = memo(({ onImageSelect, onClear, disabled = false }: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const theme  = useAppSelector((s: any) => s.app?.theme ?? "dark");
  const isDark = theme === "dark";

  const cardBg  = isDark ? "#1E293B" : "white";
  const border  = isDark ? "#334155" : "#E2E8F0";
  const textMuted = isDark ? "#94A3B8" : "#64748B";

  const handleResult = useCallback((result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPreview(uri);
      onImageSelect(uri);
    }
  }, [onImageSelect]);

  const pickFromGallery = useCallback(async () => {
    if (disabled) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { alert("Gallery permission required"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true, quality: 0.8,
    });
    handleResult(result);
  }, [disabled, handleResult]);

  const takePhoto = useCallback(async () => {
    if (disabled || Platform.OS === "web") return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { alert("Camera permission required"); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, base64: true });
    handleResult(result);
  }, [disabled, handleResult]);

  const handleClear = useCallback(() => {
    setPreview(null);
    onClear?.();
  }, [onClear]);

  if (preview) {
    return (
      <View style={{ gap: 10 }}>
        <View style={{ borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: border }}>
          <Image source={{ uri: preview }} style={{ width: "100%", height: 220 }} resizeMode="cover" />
        </View>
        <AnimatedPressable onPress={handleClear} soundType="soft"
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
            paddingVertical: 12, borderRadius: 14, borderWidth: 1,
            backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}>
          <X size={15} color="#EF4444" />
          <Text style={{ color: "#EF4444", fontWeight: "600", fontSize: 14 }}>Remove Image</Text>
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {/* Drop zone hint */}
      <View style={{ borderWidth: 2, borderColor: border, borderStyle: "dashed", borderRadius: 16,
        padding: 24, alignItems: "center", backgroundColor: isDark ? "#0F172A" : "#F8FAFC" }}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: "#8B5CF618",
          alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <ImageIcon size={24} color="#8B5CF6" />
        </View>
        <Text style={{ color: isDark ? "#F1F5F9" : "#0F172A", fontWeight: "600", fontSize: 15, marginBottom: 4 }}>
          Add an Image
        </Text>
        <Text style={{ color: textMuted, fontSize: 12, textAlign: "center" }}>
          Take a photo or choose from gallery
        </Text>
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        {Platform.OS !== "web" && (
          <AnimatedPressable onPress={takePhoto} disabled={disabled} soundType="mechanical"
            style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
              paddingVertical: 14, borderRadius: 14, borderWidth: 1,
              backgroundColor: cardBg, borderColor: border,
              opacity: disabled ? 0.5 : 1,
              shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
            <Camera size={18} color="#8B5CF6" />
            <Text style={{ color: "#8B5CF6", fontWeight: "600", fontSize: 14 }}>Take Photo</Text>
          </AnimatedPressable>
        )}

        <AnimatedPressable onPress={pickFromGallery} disabled={disabled} soundType="mechanical"
          style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            paddingVertical: 14, borderRadius: 14, borderWidth: 1,
            backgroundColor: "#8B5CF6", borderColor: "#8B5CF6",
            opacity: disabled ? 0.5 : 1,
            shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 }}>
          <ImageIcon size={18} color="white" />
          <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>Upload Image</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
});