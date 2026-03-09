import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Heart, Sparkles, User, Info, ArrowRight } from "lucide-react-native";
import { Card } from "@/components/Card";
import { useTranslation } from "@/hooks/useTranslation";

const Home = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const quickLinks = [
    {
      icon: Heart,
      title: t.home.healthServices,
      description: t.home.healthDesc,
      path: "/health",
      gradient: true,
    },
    {
      icon: Sparkles,
      title: t.home.govAssist,
      description: t.home.govDesc,
      path: "/g-assist",
      gradient: false,
    },
  ];

  return (
    <ScrollView className="flex-1 bg-background px-4 py-6 pb-16">
      <View className="items-center mb-10">
        <View className="w-20 h-20 rounded-2xl bg-primary items-center justify-center mb-5">
          <Sparkles size={36} color="white" />
        </View>

        <Text className="text-3xl font-bold mb-3 text-center text-foreground">
          {t.home.welcome}
        </Text>

        <Text className="text-muted text-center mb-6">
          {t.home.subtitle}
        </Text>

        <Pressable
          onPress={() => router.push("/health")}
          className="flex-row items-center bg-primary px-6 py-3 rounded-xl"
        >
          <Text className="text-white text-lg mr-2">{t.home.getStarted}</Text>
          <ArrowRight size={20} color="white" />
        </Pressable>
      </View>

      {quickLinks.map((l) => (
        <Card
          key={l.path}
          icon={l.icon}
          title={l.title}
          description={l.description}
          gradient={l.gradient}
          onPress={() => router.push(l.path)}
        />
      ))}

      <Card
        icon={User}
        title={t.home.yourProfile}
        description={t.home.profileDesc}
        onPress={() => router.push("/profile")}
      />

      <Card
        icon={Info}
        title={t.home.about}
        description={t.home.aboutDesc}
        onPress={() => router.push("/about")}
      />
    </ScrollView>
  );
};

export default Home;