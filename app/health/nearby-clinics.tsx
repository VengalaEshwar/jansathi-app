import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Linking,
  FlatList,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Navigation,
  Clock,
  ChevronDown,
  ChevronUp,
  Map,
} from "lucide-react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";

let MapView: any, Marker: any, PROVIDER_GOOGLE: any;
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  location: { latitude: number; longitude: number };
  type: string;
}

const RADIUS_OPTIONS = [2000, 5000, 10000, 20000];

export default function NearbyClinics() {
  const router = useRouter();
  const { t } = useTranslation();
  const mapRef = useRef<any>(null);
  const toast = useToast();

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [radius, setRadius] = useState(5000);
  const [view, setView] = useState<"map" | "list">("list");

  useEffect(() => {
    fetchLocationAndClinics();
  }, []);

  const fetchLocationAndClinics = async () => {
    setIsLoading(true);
    setClinics([]);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        toast.error(`${t.clinics.permissionDenied}: ${t.clinics.permissionDesc}`);
        setIsLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setUserLocation(coords);
      await fetchClinics(coords.latitude, coords.longitude, radius);
    } catch (e: any) {
      toast.error(e.message || t.clinics.locationFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClinics = async (lat: number, lon: number, r: number) => {
    setIsFetching(true);
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:${r},${lat},${lon});
          node["amenity"="clinic"](around:${r},${lat},${lon});
          node["amenity"="doctors"](around:${r},${lat},${lon});
          node["amenity"="pharmacy"](around:${r},${lat},${lon});
          node["healthcare"="clinic"](around:${r},${lat},${lon});
          node["healthcare"="hospital"](around:${r},${lat},${lon});
          node["healthcare"="doctor"](around:${r},${lat},${lon});
        );
        out body;
      `;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });

      const data = await response.json();

      const results: Clinic[] = (data.elements || [])
        .filter((el: any) => el.tags?.name)
        .map((el: any) => ({
          id: String(el.id),
          name: el.tags.name,
          address:
            [
              el.tags["addr:street"],
              el.tags["addr:housenumber"],
              el.tags["addr:city"],
            ]
              .filter(Boolean)
              .join(", ") || t.clinics.addressNotAvailable,
          phone: el.tags.phone || el.tags["contact:phone"] || null,
          website: el.tags.website || el.tags["contact:website"] || null,
          openingHours: el.tags.opening_hours || null,
          location: { latitude: el.lat, longitude: el.lon },
          type: el.tags.amenity || el.tags.healthcare || "clinic",
        }));

      const sorted = results.sort((a, b) => {
        const distA = getDistanceValue(a, lat, lon);
        const distB = getDistanceValue(b, lat, lon);
        return distA - distB;
      });

      setClinics(sorted);
    } catch (e: any) {
      toast.error(e.message || t.clinics.fetchFailed);
    } finally {
      setIsFetching(false);
    }
  };

  const handleRadiusChange = (r: number) => {
    setRadius(r);
    if (userLocation) {
      fetchClinics(userLocation.latitude, userLocation.longitude, r);
    }
  };

  const getDistanceValue = (clinic: Clinic, lat: number, lon: number): number => {
    const R = 6371;
    const dLat = ((clinic.location.latitude - lat) * Math.PI) / 180;
    const dLon = ((clinic.location.longitude - lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((clinic.location.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const getDistanceLabel = (clinic: Clinic): string => {
    if (!userLocation) return "";
    const dist = getDistanceValue(
      clinic,
      userLocation.latitude,
      userLocation.longitude
    );
    return dist < 1
      ? `${(dist * 1000).toFixed(0)}m`
      : `${dist.toFixed(1)}km`;
  };

  const handleCall = (phone: string) => {
    const firstNumber = phone.split(";")[0].trim();
    Linking.openURL(`tel:${firstNumber}`);
  };

  const handleDirections = (clinic: Clinic) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${clinic.location.latitude},${clinic.location.longitude}&travelmode=driving`;
    Linking.openURL(url);
  };

  const openGoogleMaps = (clinic: Clinic) => {
    const geoUrl = `geo:${clinic.location.latitude},${clinic.location.longitude}?q=${encodeURIComponent(clinic.name)}`;
    Linking.canOpenURL(geoUrl).then((supported) => {
      if (supported) {
        Linking.openURL(geoUrl);
      } else {
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          clinic.name
        )}&center=${clinic.location.latitude},${clinic.location.longitude}`;
        Linking.openURL(webUrl);
      }
    });
  };

  const focusMap = (clinic: Clinic) => {
    setView("map");
    setTimeout(() => {
      mapRef.current?.animateToRegion(
        { ...clinic.location, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        500
      );
    }, 300);
  };

  const getTypeEmoji = (type: string) => {
    if (type === "hospital") return "🏥";
    if (type === "pharmacy") return "💊";
    if (type === "doctors" || type === "doctor") return "👨‍⚕️";
    return "🏨";
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-muted mt-3">{t.clinics.finding}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Pressable onPress={() => router.back()} className="flex-row items-center">
          <ArrowLeft size={20} color="#6b7280" />
          <Text className="ml-2 text-muted">{t.common.back}</Text>
        </Pressable>
        <Text className="text-foreground font-bold text-lg">{t.clinics.title}</Text>
        <Text className="text-muted text-sm">
          {isFetching ? "..." : `${clinics.length} ${t.common.found}`}
        </Text>
      </View>

      {/* Map / List Toggle */}
      <View className="flex-row mx-4 mb-2 bg-secondary rounded-xl p-1">
        {Platform.OS !== "web" && (
          <Pressable
            onPress={() => setView("map")}
            className={`flex-1 py-2 rounded-lg items-center ${view === "map" ? "bg-primary" : ""}`}
          >
            <Text className={view === "map" ? "text-white font-semibold" : "text-muted"}>
              🗺 {t.clinics.mapView}
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => setView("list")}
          className={`flex-1 py-2 rounded-lg items-center ${view === "list" ? "bg-primary" : ""}`}
        >
          <Text className={view === "list" ? "text-white font-semibold" : "text-muted"}>
            📋 {t.clinics.listView} ({clinics.length})
          </Text>
        </Pressable>
      </View>

      {/* Radius Selector */}
      <View className="flex-row mx-4 mb-2 gap-2">
        {RADIUS_OPTIONS.map((r) => (
          <Pressable
            key={r}
            onPress={() => handleRadiusChange(r)}
            className={`flex-1 py-2 rounded-xl items-center border ${
              radius === r ? "bg-primary border-primary" : "bg-secondary border-border"
            }`}
          >
            <Text className={`text-xs font-semibold ${radius === r ? "text-white" : "text-muted"}`}>
              {r >= 1000 ? `${r / 1000}km` : `${r}m`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Fetching indicator */}
      {isFetching && (
        <View className="flex-row items-center justify-center py-2">
          <ActivityIndicator size="small" color="#8B5CF6" />
          <Text className="text-muted text-xs ml-2">{t.clinics.searching}</Text>
        </View>
      )}

      {/* Map View */}
      {view === "map" && userLocation && Platform.OS !== "web" && (
        <View className="flex-1">
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={{
              ...userLocation,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker coordinate={userLocation} title={t.clinics.you} pinColor="blue" />
            {clinics.map((clinic) => (
              <Marker
                key={clinic.id}
                coordinate={clinic.location}
                title={clinic.name}
                description={clinic.address}
                pinColor="red"
                onPress={() => setSelectedClinic(clinic)}
              />
            ))}
          </MapView>

          {selectedClinic && (
            <View className="absolute bottom-4 left-4 right-4 bg-card border border-border rounded-2xl p-4">
              <View className="flex-row justify-between items-start mb-1">
                <Text className="text-foreground font-bold text-base flex-1 mr-2">
                  {getTypeEmoji(selectedClinic.type)} {selectedClinic.name}
                </Text>
                <Text className="text-primary font-semibold text-sm">
                  {getDistanceLabel(selectedClinic)}
                </Text>
              </View>
              <Text className="text-muted text-sm mb-3">{selectedClinic.address}</Text>
              <View className="flex-row gap-2">
                {selectedClinic.phone && (
                  <Pressable
                    onPress={() => handleCall(selectedClinic.phone!)}
                    className="flex-1 bg-green-600 py-2 rounded-xl flex-row items-center justify-center"
                  >
                    <Phone size={14} color="white" />
                    <Text className="text-white text-sm ml-1">{t.clinics.call}</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => handleDirections(selectedClinic)}
                  className="flex-1 bg-primary py-2 rounded-xl flex-row items-center justify-center"
                >
                  <Navigation size={14} color="white" />
                  <Text className="text-white text-sm ml-1">{t.clinics.directions}</Text>
                </Pressable>
                <Pressable
                  onPress={() => openGoogleMaps(selectedClinic)}
                  className="flex-1 bg-blue-600 py-2 rounded-xl flex-row items-center justify-center"
                >
                  <Map size={14} color="white" />
                  <Text className="text-white text-sm ml-1">{t.clinics.maps}</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedClinic(null)}
                  className="px-3 py-2 bg-secondary rounded-xl items-center justify-center"
                >
                  <Text className="text-muted text-sm">✕</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}

      {/* List View */}
      {view === "list" && (
        <FlatList
          data={clinics}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-4xl mb-3">🏥</Text>
              <Text className="text-foreground font-semibold">{t.clinics.noResults}</Text>
              <Text className="text-muted text-sm mt-1">{t.clinics.tryRefresh}</Text>
            </View>
          }
          renderItem={({ item: clinic }) => (
            <View className="mb-3 bg-card border border-border rounded-2xl overflow-hidden">
              <Pressable
                onPress={() => setExpandedId(expandedId === clinic.id ? null : clinic.id)}
                className="p-4"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 mr-3">
                    <Text className="text-foreground font-bold text-base">
                      {getTypeEmoji(clinic.type)} {clinic.name}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <MapPin size={11} color="#6b7280" />
                      <Text className="text-muted text-xs ml-1 flex-1" numberOfLines={2}>
                        {clinic.address}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-primary text-sm font-semibold">
                      {getDistanceLabel(clinic)}
                    </Text>
                    {expandedId === clinic.id ? (
                      <ChevronUp size={16} color="#6b7280" />
                    ) : (
                      <ChevronDown size={16} color="#6b7280" />
                    )}
                  </View>
                </View>
                {clinic.openingHours && (
                  <View className="flex-row items-center mt-2">
                    <Clock size={11} color="#6b7280" />
                    <Text className="text-muted text-xs ml-1" numberOfLines={1}>
                      {clinic.openingHours}
                    </Text>
                  </View>
                )}
              </Pressable>

              {expandedId === clinic.id && (
                <View className="px-4 pb-4 border-t border-border pt-3 gap-2">
                  {clinic.openingHours && (
                    <View className="flex-row items-center">
                      <Clock size={13} color="#8B5CF6" />
                      <Text className="text-muted text-xs ml-2">{clinic.openingHours}</Text>
                    </View>
                  )}
                  {clinic.website && (
                    <Pressable onPress={() => Linking.openURL(clinic.website!)}>
                      <Text className="text-primary text-xs underline" numberOfLines={1}>
                        🌐 {clinic.website}
                      </Text>
                    </Pressable>
                  )}
                  <View className="flex-row gap-2 mt-1">
                    {clinic.phone && (
                      <Pressable
                        onPress={() => handleCall(clinic.phone!)}
                        className="flex-1 bg-green-600 py-2 rounded-xl flex-row items-center justify-center"
                      >
                        <Phone size={14} color="white" />
                        <Text className="text-white text-sm ml-1">{t.clinics.call}</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => handleDirections(clinic)}
                      className="flex-1 bg-primary py-2 rounded-xl flex-row items-center justify-center"
                    >
                      <Navigation size={14} color="white" />
                      <Text className="text-white text-sm ml-1">{t.clinics.directions}</Text>
                    </Pressable>
                    {Platform.OS !== "web" && (
                      <>
                        <Pressable
                          onPress={() => openGoogleMaps(clinic)}
                          className="flex-1 bg-blue-600 py-2 rounded-xl flex-row items-center justify-center"
                        >
                          <Map size={14} color="white" />
                          <Text className="text-white text-sm ml-1">{t.clinics.maps}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => focusMap(clinic)}
                          className="flex-1 bg-secondary py-2 rounded-xl items-center justify-center"
                        >
                          <Text className="text-foreground text-sm">📍 {t.clinics.pin}</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}
        />
      )}

      {/* Refresh */}
      <Pressable
        onPress={fetchLocationAndClinics}
        className="absolute bottom-4 right-4 bg-primary px-4 py-3 rounded-full"
      >
        <Text className="text-white font-semibold">🔄 {t.common.refresh}</Text>
      </Pressable>
    </View>
  );
}