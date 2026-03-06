import { View, Text, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Scan, FileText, AlertTriangle, MapPin, Bell } from "lucide-react-native";
import { Card } from "@/components/Card";

const Health = () => {
  const router = useRouter();

  const healthFeatures = [
    {
      icon: Scan,
      title: "Medicine Scanner",
      description: "Scan medicines and verify authenticity",
      action: () => router.push("/health/medicine-scanner"),
    },
    {
      icon: FileText,
      title: "Prescription Reader",
      description: "Read handwritten prescriptions",
      action: () => router.push("/health/prescription-reader"),
    },
    {
      icon: AlertTriangle,
      title: "Danger Alerts",
      description: "Warnings for unsafe drug combinations",
      action: () => Alert.alert("Coming Soon"),
    },
    {
      icon: MapPin,
      title: "Nearby Clinics",
      description: "Find healthcare centers near you",
      action: () => router.push("/health/nearby-clinics"),
    },
    {
      icon: Bell,
      title: "Health Notifications",
      description: "Medication reminders and alerts",
      action: () => Alert.alert("Coming Soon"),
    },
  ];

  return (
    <ScrollView className="flex-1 bg-background px-4 py-6">
      <Text className="text-2xl font-bold mb-4">Health Services</Text>

      {healthFeatures.map((f) => (
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

export default Health;
