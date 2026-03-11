import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Camera, Mic, Sparkles, BookOpen, Users } from "lucide-react-native";
import { Card } from "@/components/Card";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";

const GAssist = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useToast();

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
      action: () => toast.success(t.profile.comingSoon),
    },
    {
      icon: Users,
      title: t.gAssist.volunteer,
      description: t.gAssist.volunteerDesc,
      action: () => toast.success(t.profile.comingSoon),
    },
  ];

  return (
    <ScrollView className="flex-1 bg-light-background dark:bg-background px-4 py-6">
      <Text className="text-2xl font-bold mb-4 text-light-foreground dark:text-foreground">
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