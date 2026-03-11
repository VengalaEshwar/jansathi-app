import { ScrollView, View, Text, Pressable } from "react-native";
import { Heart, Target, Users, Mail, Globe } from "lucide-react-native";
import { useTranslation } from "@/hooks/useTranslation";

export default function AboutUs() {
  const { t } = useTranslation();

  return (
    <ScrollView
      className="flex-1 bg-light-background dark:bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="p-4 pb-16">

        <View className="items-center mb-12">
          <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-4">
            <Heart size={32} color="white" />
          </View>
          <Text className="text-3xl font-bold mb-2 text-light-foreground dark:text-foreground">
            {t.about.title}
          </Text>
          <Text className="text-muted text-center">{t.about.subtitle}</Text>
        </View>

        <View className="bg-primary rounded-2xl p-5 mb-10">
          <View className="flex-row items-center mb-3">
            <Target size={24} color="white" />
            <Text className="text-white text-xl font-bold ml-2">
              {t.about.mission}
            </Text>
          </View>
          <Text className="text-white/90 leading-relaxed">
            {t.about.missionText}
          </Text>
        </View>

        <View className="gap-4 mb-10">
          <FeatureCard
            icon={Heart}
            title={t.about.healthLiteracy}
            desc={t.about.healthLiteracyDesc}
          />
          <FeatureCard
            icon={Users}
            title={t.about.govAccess}
            desc={t.about.govAccessDesc}
          />
        </View>

        <Text className="text-xl font-bold text-center mb-6 text-light-foreground dark:text-foreground">
          {t.about.ourValues}
        </Text>

        <View className="gap-4 mb-12">
          <ValueBox
            icon={Globe}
            title={t.about.accessibility}
            text={t.about.accessibilityText}
          />
          <ValueBox
            icon={Heart}
            title={t.about.compassion}
            text={t.about.compassionText}
          />
          <ValueBox
            icon={Users}
            title={t.about.community}
            text={t.about.communityText}
          />
        </View>

        <View className="bg-secondary rounded-2xl p-5 items-center mb-12">
          <Mail size={36} color="#4f46e5" />
          <Text className="text-xl font-bold mt-3 text-light-foreground dark:text-foreground">
            {t.about.getInTouch}
          </Text>
          <Text className="text-muted text-center mt-2 mb-4">
            {t.about.getInTouchDesc}
          </Text>
          <Pressable className="bg-primary px-6 py-3 rounded-xl">
            <Text className="text-white font-semibold">{t.about.contactUs}</Text>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap gap-3">
          <StatBox value="10+" label={t.about.languages} />
          <StatBox value="5" label={t.about.healthTools} />
          <StatBox value="5" label={t.about.gAssistFeatures} />
          <StatBox value="24/7" label={t.about.aiSupport} />
        </View>

      </View>
    </ScrollView>
  );
}

function FeatureCard({ icon: Icon, title, desc }: any) {
  return (
    <View className="bg-light-card dark:bg-card p-4 rounded-xl border border-light-border dark:border-border">
      <View className="flex-row items-center mb-2">
        <Icon size={20} color="#4f46e5" />
        <Text className="font-semibold ml-2 text-light-foreground dark:text-foreground">{title}</Text>
      </View>
      <Text className="text-muted text-sm">{desc}</Text>
    </View>
  );
}

function ValueBox({ icon: Icon, title, text }: any) {
  return (
    <View className="bg-secondary p-4 rounded-xl items-center">
      <View className="w-12 h-12 bg-primary rounded-xl items-center justify-center mb-2">
        <Icon size={22} color="white" />
      </View>
      <Text className="font-semibold text-light-foreground dark:text-foreground">{title}</Text>
      <Text className="text-muted text-sm text-center">{text}</Text>
    </View>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 min-w-[45%] bg-primary rounded-xl p-4 items-center">
      <Text className="text-white text-2xl font-bold">{value}</Text>
      <Text className="text-white/80 text-sm">{label}</Text>
    </View>
  );
}