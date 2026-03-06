import { View, Text, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Camera, Mic, Sparkles, BookOpen, Users } from "lucide-react-native";
import { Card } from "@/components/Card";

const GAssist = () => {
  const router = useRouter();

  const gAssistFeatures = [
    {
      icon: Camera,
      title: "Photo-to-Form AI",
      description: "Upload documents and auto-fill forms",
      action: () => router.push("/g-assist/photo-to-form"),
    },
    {
      icon: Mic,
      title: "Voice Chatbot",
      description: "Talk to AI in Indian languages",
      action: () => router.push("/g-assist/voice-chatbot"),
    },
    {
      icon: Sparkles,
      title: "Scheme Finder",
      description: "Find schemes you’re eligible for",
      action: () => router.push("/g-assist/scheme-finder"),
    },
    {
      icon: BookOpen,
      title: "Step Guides",
      description: "Guides to complete government procedures",
      action: () => Alert.alert("Coming Soon"),
    },
    {
      icon: Users,
      title: "Volunteer Network",
      description: "Get help from NGOs and volunteers",
      action: () => Alert.alert("Coming Soon"),
    },
  ];

  return (
    <ScrollView className="flex-1 bg-background px-4 py-6">
      <Text className="text-2xl font-bold mb-4">Government Assist</Text>

      {gAssistFeatures.map((f) => (
        <Card
          key={f.title}
          icon={f.icon}
          title={f.title}
          description={f.description}
          onPress={f.action}
        />
      ))}
    </ScrollView>
  );
};

export default GAssist;
