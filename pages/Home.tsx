import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Heart, Sparkles, User, Info, ArrowRight } from "lucide-react-native";
import { Card } from "@/components/Card";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";


import * as Notifications from "expo-notifications";
import { useToast } from "@/hooks/useToast";

const TestNotificationButton = () => {
  const toast = useToast();

  const handleTest = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      toast.error("Enable notifications in your phone settings.");
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "💊 Medicine Reminder",
        body: "Time to take Paracetamol - 500mg",
        data: { test: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
      },
    });

    toast.success("Notification in 10s — background the app now!");
  };

  return (
    <Pressable
      onPress={handleTest}
      style={{
        backgroundColor: "#8B5CF6", borderRadius: 12,
        padding: 14, alignItems: "center", margin: 16,
      }}
    >
      <Text style={{ color: "white", fontWeight: "700" }}>
        🔔 Test Notification (10s)
      </Text>
    </Pressable>
  );
};


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
     { __DEV__ && <TestNotificationButton />}
    </ScrollView>
  );
};

export default Home;