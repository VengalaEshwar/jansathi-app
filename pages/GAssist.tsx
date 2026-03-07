import { View, Text, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Camera, Mic, Sparkles, BookOpen, Users } from "lucide-react-native";
import { Card } from "@/components/Card";
import { useTranslation } from "@/hooks/useTranslation";

const GAssist = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const gAssistFeatures = [
    {
      icon: Camera,
      title: t.gAssist.photoForm,
      description: t.gAssist.photoFormDesc,
      action: () => router.push("/g-assist/photo-to-form"),
    },
    {
      icon: Mic,
      title: t.gAssist.voiceChat,
      description: t.gAssist.voiceChatDesc,
      action: () => router.push("/g-assist/voice-chatbot"),
    },
    {
      icon: Sparkles,
      title: t.gAssist.schemeFinder,
      description: t.gAssist.schemeFinderDesc,
      action: () => router.push("/g-assist/scheme-finder"),
    },
    {
      icon: BookOpen,
      title: t.gAssist.stepGuides,
      description: t.gAssist.stepGuidesDesc,
      action: () => Alert.alert(t.profile.comingSoon),
    },
    {
      icon: Users,
      title: t.gAssist.volunteer,
      description: t.gAssist.volunteerDesc,
      action: () => Alert.alert(t.profile.comingSoon),
    },
  ];

  return (
    <ScrollView className="flex-1 bg-background px-4 py-6">
      <Text className="text-2xl font-bold mb-4 text-foreground">
        {t.gAssist.title}
      </Text>

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