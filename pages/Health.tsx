import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Scan, FileText, AlertTriangle, MapPin, Bell } from "lucide-react-native";
import { Card } from "@/components/Card";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";

const Health = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useToast();

  const healthFeatures = [
    {
      icon: Scan,
      title: t.health.medicineScanner,
      description: t.health.medicineScannerDesc,
      action: () => router.push("/health/medicine-scanner"),
    },
    {
      icon: FileText,
      title: t.health.prescriptionReader,
      description: t.health.prescriptionReaderDesc,
      action: () => router.push("/health/prescription-reader"),
    },
    {
      icon: AlertTriangle,
      title: t.health.dangerAlerts,
      description: t.health.dangerAlertsDesc,
      action: () => toast.success(t.profile.comingSoon),
    },
    {
      icon: MapPin,
      title: t.health.nearbyClinics,
      description: t.health.nearbyClinicsDesc,
      action: () => router.push("/health/nearby-clinics"),
    },
    {
      icon: Bell,
      title: t.health.healthNotifications,
      description: t.health.healthNotificationsDesc,
      action: () => router.push("/health/health-notifications"),
    },
  ];

  return (
    <ScrollView className="flex-1 bg-light-background dark:bg-background px-4 py-6">
      <Text className="text-2xl font-bold mb-4 text-light-foreground dark:text-foreground">
        {t.health.title}
      </Text>

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