import { ScrollView, View, Text, Pressable } from "react-native";
import { Heart, Target, Users, Mail, Globe } from "lucide-react-native";

export default function AboutUs() {
  return (
    <ScrollView className="flex-1 bg-background"
    contentContainerStyle={{ paddingBottom : 40}}
    >
      <View className="p-4 pb-16">

        {/* Header */}
        <View className="items-center mb-12">
          <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-4">
            <Heart size={32} color="white" />
          </View>
          <Text className="text-3xl font-bold mb-2">About JanSathi</Text>
          <Text className="text-muted text-center">
            Empowering citizens with accessible healthcare and government
            services through AI
          </Text>
        </View>

        {/* Mission */}
        <View className="bg-primary rounded-2xl p-5 mb-10">
          <View className="flex-row items-center mb-3">
            <Target size={24} color="white" />
            <Text className="text-white text-xl font-bold ml-2">
              Our Mission
            </Text>
          </View>
          <Text className="text-white/90 leading-relaxed">
            JanSathi is dedicated to breaking down barriers in healthcare and
            government services access. We use AI so every citizen can
            understand medicines, navigate government procedures, and get
            proper support.
          </Text>
        </View>

        {/* Features */}
        <View className="gap-4 mb-10">
          <FeatureCard
            icon={Heart}
            title="Health Literacy"
            desc="We help verify medicines, understand prescriptions, and provide
            healthcare info in local languages using OCR and voice tools."
          />
          <FeatureCard
            icon={Users}
            title="Government Access"
            desc="Our AI simplifies government services from form filling to
            finding schemes and volunteers for complex cases."
          />
        </View>

        {/* Values */}
        <Text className="text-xl font-bold text-center mb-6">Our Values</Text>

        <View className="gap-4 mb-12">
          <ValueBox icon={Globe} title="Accessibility" text="Multi-language and voice-first design" />
          <ValueBox icon={Heart} title="Compassion" text="Built with empathy for real people" />
          <ValueBox icon={Users} title="Community" text="Connecting citizens and volunteers" />
        </View>

        {/* Contact */}
        <View className="bg-secondary rounded-2xl p-5 items-center mb-12">
          <Mail size={36} color="#4f46e5" />
          <Text className="text-xl font-bold mt-3">Get in Touch</Text>
          <Text className="text-muted text-center mt-2 mb-4">
            Have questions or feedback? Our team is here to help.
          </Text>

          <Pressable className="bg-primary px-6 py-3 rounded-xl">
            <Text className="text-white font-semibold">Contact Us</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View className="flex-row flex-wrap gap-3">
          <StatBox value="10+" label="Languages" />
          <StatBox value="5" label="Health Tools" />
          <StatBox value="5" label="G-Assist Features" />
          <StatBox value="24/7" label="AI Support" />
        </View>

      </View>
    </ScrollView>
  );
}

/* ----------- Components ----------- */

function FeatureCard({ icon: Icon, title, desc }: any) {
  return (
    <View className="bg-card p-4 rounded-xl border border-border">
      <View className="flex-row items-center mb-2">
        <Icon size={20} color="#4f46e5" />
        <Text className="font-semibold ml-2">{title}</Text>
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
      <Text className="font-semibold">{title}</Text>
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
