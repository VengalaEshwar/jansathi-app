import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Linking,
} from "react-native";
import {
  MapPin,
  Navigation,
  Star,
  Phone,
  Clock,
  Building2,
  Pill,
  Stethoscope,
} from "lucide-react-native";

interface Clinic {
  id: string;
  name: string;
  type: "hospital" | "clinic" | "pharmacy";
  address: string;
  distance: string;
  rating: number;
  reviews: number;
  phone: string;
  hours: string;
  isOpen: boolean;
  services: string[];
}

const mockClinics: Clinic[] = [
  {
    id: "1",
    name: "City General Hospital",
    type: "hospital",
    address: "123 Main Street, Sector 15",
    distance: "0.8 km",
    rating: 4.5,
    reviews: 234,
    phone: "+919876543210",
    hours: "24 Hours",
    isOpen: true,
    services: ["Emergency", "ICU", "Surgery"],
  },
  {
    id: "2",
    name: "HealthFirst Clinic",
    type: "clinic",
    address: "45 Park Avenue, Block B",
    distance: "1.2 km",
    rating: 4.2,
    reviews: 89,
    phone: "+919876543211",
    hours: "9 AM - 9 PM",
    isOpen: true,
    services: ["General Medicine", "Vaccination"],
  },
  {
    id: "3",
    name: "MedPlus Pharmacy",
    type: "pharmacy",
    address: "78 Market Road",
    distance: "0.5 km",
    rating: 4.0,
    reviews: 156,
    phone: "+919876543212",
    hours: "8 AM - 10 PM",
    isOpen: true,
    services: ["Medicines", "Delivery"],
  },
];

export default function NearbyClinics() {
  const [search, setSearch] = useState("");
  const [clinics, setClinics] = useState<Clinic[]>(mockClinics);

  useEffect(() => {
    const filtered = mockClinics.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.services.some((s) =>
          s.toLowerCase().includes(search.toLowerCase())
        )
    );
    setClinics(filtered);
  }, [search]);

  const getIcon = (type: string) => {
    if (type === "hospital") return <Building2 size={22} color="white" />;
    if (type === "pharmacy") return <Pill size={22} color="white" />;
    return <Stethoscope size={22} color="white" />;
  };

  const callClinic = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const directions = (name: string) => {
    Alert.alert("Directions", `Opening directions to ${name}`);
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="mb-4">
          <View className="flex-row items-center gap-2">
            <MapPin size={22} color="#7c3aed" />
            <Text className="text-2xl font-bold">Nearby Clinics</Text>
          </View>
          <Text className="text-muted mt-1">Sector 15, New Delhi</Text>
        </View>

        {/* Search */}
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search clinics or services..."
          className="border border-border rounded-xl px-4 py-2 mb-4 bg-card"
        />

        {/* Clinics List */}
        {clinics.map((clinic) => (
          <View
            key={clinic.id}
            className="bg-card border border-border rounded-xl p-4 mb-4"
          >
            <View className="flex-row gap-3">
              <View className="w-12 h-12 rounded-xl bg-primary items-center justify-center">
                {getIcon(clinic.type)}
              </View>

              <View className="flex-1">
                <Text className="font-bold text-lg">{clinic.name}</Text>
                <Text className="text-muted text-sm">{clinic.address}</Text>

                <View className="flex-row flex-wrap gap-3 mt-2">
                  <View className="flex-row items-center gap-1">
                    <Navigation size={14} />
                    <Text className="text-sm">{clinic.distance}</Text>
                  </View>

                  <View className="flex-row items-center gap-1">
                    <Star size={14} color="#facc15" />
                    <Text className="text-sm">
                      {clinic.rating} ({clinic.reviews})
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1">
                    <Clock size={14} />
                    <Text className="text-sm">{clinic.hours}</Text>
                  </View>
                </View>

                <View className="flex-row gap-2 mt-3">
                  <Pressable
                    onPress={() => directions(clinic.name)}
                    className="flex-1 bg-primary py-2 rounded-lg"
                  >
                    <Text className="text-white text-center">Directions</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => callClinic(clinic.phone)}
                    className="flex-1 border border-border py-2 rounded-lg"
                  >
                    <Text className="text-center">Call</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        ))}

        {clinics.length === 0 && (
          <View className="items-center mt-10">
            <MapPin size={40} color="gray" />
            <Text className="text-lg font-semibold mt-2">No results found</Text>
            <Text className="text-muted">Try a different search</Text>
          </View>
        )}

        {/* Info */}
        <View className="bg-primary rounded-xl p-4 mt-4">
          <Text className="text-white font-semibold text-lg mb-2">
            Finding Healthcare Near You
          </Text>
          <Text className="text-white/90">
            JanSathi helps you find verified hospitals, clinics and pharmacies.
            For emergencies call 108 or 112.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
