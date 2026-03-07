import { View, Text, Pressable, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

interface ImageUploadProps {
  onImageSelect: (imageUri: string) => void; // now returns URI not base64
  onClear?: () => void;
  disabled?: boolean;
}


export const ImageUpload = ({
  onImageSelect,
  onClear,
  disabled = false,
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  const pickFromGallery = async () => {
    if (disabled) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Gallery permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
    });

    handleResult(result);
  };

  const takePhoto = async () => {
    if (disabled) return;

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert("Camera permission required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });

    handleResult(result);
  };

  const handleResult = (result: ImagePicker.ImagePickerResult) => {
  if (!result.canceled && result.assets[0]) {
    const uri = result.assets[0].uri;
    setPreview(uri);
    onImageSelect(uri); // send URI directly
  }
};

  const handleClear = () => {
    setPreview(null);
    onClear?.();
  };

  return (
    <View className="space-y-4">
      {preview ? (
        <View>
          <Image source={{ uri: preview }} className="w-full h-64 rounded-xl" />

          <Pressable
            onPress={handleClear}
            className="bg-destructive mt-3 py-2 rounded-lg"
          >
            <Text className="text-white text-center font-semibold">
              Remove Image
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-row gap-4">
          <Pressable
            onPress={takePhoto}
            disabled={disabled}
            className="flex-1 border border-border rounded-xl p-4 items-center"
          >
            <Text className="text-primary font-semibold">Take Photo</Text>
          </Pressable>

          <Pressable
            onPress={pickFromGallery}
            disabled={disabled}
            className="flex-1 border border-border rounded-xl p-4 items-center"
          >
            <Text className="text-primary font-semibold">Upload Image</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};
