// app/health/nearby-clinics.tsx
import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  View, Text, Pressable, ActivityIndicator,
  Linking, FlatList, Platform, Animated, useWindowDimensions,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import {
  ArrowLeft, MapPin, Phone, Navigation,
  Clock, ChevronDown, ChevronUp, Map, RefreshCw,
} from "lucide-react-native";
import { HeroSection } from "@/components/HeroSection";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { useSound } from "@/hooks/useSound";

// ─── Map imports (native only) ────────────────────────────────────────────────
let MapView: any, Marker: any, PROVIDER_GOOGLE: any;
if (Platform.OS !== "web") {
  try {
    const Maps  = require("react-native-maps");
    MapView        = Maps.default;
    Marker         = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch {}
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Clinic {
  id: string; name: string; address: string;
  phone: string | null; website: string | null;
  openingHours: string | null;
  location: { latitude: number; longitude: number };
  type: string;
}

const RADIUS_OPTIONS = [2000, 5000, 10000, 20000];

// ─── Spacing constants ────────────────────────────────────────────────────────
const S = {
  gap6:  { gap: 6  } as const,
  gap8:  { gap: 8  } as const,
  gap10: { gap: 10 } as const,
  mb4:   { marginBottom: 4  } as const,
  mb6:   { marginBottom: 6  } as const,
  mb8:   { marginBottom: 8  } as const,
  mb10:  { marginBottom: 10 } as const,
  mb12:  { marginBottom: 12 } as const,
  mb16:  { marginBottom: 16 } as const,
};

// ─── useFadeIn ────────────────────────────────────────────────────────────────
const useFadeIn = (delay = 0) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 360, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true, speed: 14, bounciness: 5 }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getTypeEmoji = (type: string) => {
  if (type === "hospital") return "🏥";
  if (type === "pharmacy") return "💊";
  if (type === "doctors" || type === "doctor") return "👨‍⚕️";
  return "🏨";
};

const getDistanceValue = (clinic: Clinic, lat: number, lon: number): number => {
  const R = 6371;
  const dLat = ((clinic.location.latitude - lat) * Math.PI) / 180;
  const dLon = ((clinic.location.longitude - lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat * Math.PI) / 180) *
    Math.cos((clinic.location.latitude * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── ClinicCard ───────────────────────────────────────────────────────────────
const ClinicCard = memo(({
  clinic, isExpanded, distanceLabel, onToggle,
  onCall, onDirections, onMaps, onPin, t,
}: {
  clinic: Clinic; isExpanded: boolean; distanceLabel: string;
  onToggle: (id: string) => void;
  onCall: (phone: string) => void;
  onDirections: (c: Clinic) => void;
  onMaps: (c: Clinic) => void;
  onPin: (c: Clinic) => void;
  t: any;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const handleToggle     = useCallback(() => onToggle(clinic.id),     [clinic.id, onToggle]);
  const handleCall       = useCallback(() => onCall(clinic.phone!),    [clinic.phone, onCall]);
  const handleDirections = useCallback(() => onDirections(clinic),    [clinic, onDirections]);
  const handleMaps       = useCallback(() => onMaps(clinic),          [clinic, onMaps]);
  const handlePin        = useCallback(() => onPin(clinic),           [clinic, onPin]);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, S.mb12]}>
      <View
        className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{
          borderRadius: 16, overflow: "hidden",
          shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
        }}
      >
        {/* Header row */}
        <Pressable
          onPress={handleToggle}
          onPressIn={() =>  Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
          onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
          // @ts-ignore
          onHoverIn={() =>  { if (Platform.OS === "web") Animated.spring(scale, { toValue: 1.015, useNativeDriver: true, speed: 28, bounciness: 8 }).start(); }}
          onHoverOut={() => { if (Platform.OS === "web") Animated.spring(scale, { toValue: 1,     useNativeDriver: true, speed: 22, bounciness: 8 }).start(); }}
          style={{ padding: 16 }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                className="text-[#0F172A] dark:text-white font-bold"
                style={{ fontSize: 15, marginBottom: 4 }}
                numberOfLines={2}
              >
                {getTypeEmoji(clinic.type)} {clinic.name}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <MapPin size={11} color="#94A3B8" />
                <Text className="text-[#94A3B8] text-xs" style={{ flex: 1 }} numberOfLines={2}>
                  {clinic.address}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <Text style={{ color: "#8B5CF6", fontSize: 13, fontWeight: "700" }}>
                {distanceLabel}
              </Text>
              {isExpanded
                ? <ChevronUp   size={15} color="#94A3B8" />
                : <ChevronDown size={15} color="#94A3B8" />}
            </View>
          </View>

          {clinic.openingHours && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}>
              <Clock size={11} color="#94A3B8" />
              <Text className="text-[#94A3B8] text-xs" numberOfLines={1}>{clinic.openingHours}</Text>
            </View>
          )}
        </Pressable>

        {/* Expanded details */}
        {isExpanded && (
          <View
            className="border-t border-[#E2E8F0] dark:border-[#334155]"
            style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12 }}
          >
            {clinic.openingHours && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Clock size={13} color="#8B5CF6" />
                <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs">{clinic.openingHours}</Text>
              </View>
            )}

            {clinic.website && (
              <Pressable onPress={() => Linking.openURL(clinic.website!)} style={S.mb8}>
                <Text className="text-primary text-xs" style={{ textDecorationLine: "underline" }} numberOfLines={1}>
                  🌐 {clinic.website}
                </Text>
              </Pressable>
            )}

            {/* Action buttons — all pure style={}  */}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              {clinic.phone && (
                <AnimatedPressable
                  onPress={handleCall}
                  soundType="mechanical"
                  style={{
                    flex: 1, flexDirection: "row", alignItems: "center",
                    justifyContent: "center", gap: 6,
                    paddingVertical: 10, borderRadius: 12,
                    backgroundColor: "#10B981",
                    shadowColor: "#10B981", shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
                  }}
                >
                  <Phone size={14} color="white" />
                  <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>{t.clinics.call}</Text>
                </AnimatedPressable>
              )}

              <AnimatedPressable
                onPress={handleDirections}
                soundType="mechanical"
                style={{
                  flex: 1, flexDirection: "row", alignItems: "center",
                  justifyContent: "center", gap: 6,
                  paddingVertical: 10, borderRadius: 12,
                  backgroundColor: "#8B5CF6",
                  shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
                }}
              >
                <Navigation size={14} color="white" />
                <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>{t.clinics.directions}</Text>
              </AnimatedPressable>

              {Platform.OS !== "web" && (
                <>
                  <AnimatedPressable
                    onPress={handleMaps}
                    soundType="soft"
                    style={{
                      flex: 1, flexDirection: "row", alignItems: "center",
                      justifyContent: "center", gap: 6,
                      paddingVertical: 10, borderRadius: 12,
                      backgroundColor: "#3B82F6",
                      shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
                    }}
                  >
                    <Map size={14} color="white" />
                    <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>{t.clinics.maps}</Text>
                  </AnimatedPressable>

                  <AnimatedPressable
                    onPress={handlePin}
                    soundType="soft"
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: 12,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: "#F1F5F9",
                    }}
                    className="dark:bg-[#334155]"
                  >
                    <Text className="text-[#0F172A] dark:text-white" style={{ fontSize: 13 }}>
                      📍 {t.clinics.pin}
                    </Text>
                  </AnimatedPressable>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function NearbyClinics() {
  const router        = useRouter();
  const { t }         = useTranslation();
  const toast         = useToast();
  const { playClick } = useSound();
  const mapRef        = useRef<any>(null);
  const { width }     = useWindowDimensions();
  const isWide        = width >= 700;
  const isLarge       = width >= 1024;

  const [userLocation,   setUserLocation]   = useState<{ latitude: number; longitude: number } | null>(null);
  const [clinics,        setClinics]        = useState<Clinic[]>([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [isFetching,     setIsFetching]     = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [expandedId,     setExpandedId]     = useState<string | null>(null);
  const [radius,         setRadius]         = useState(5000);
  const [view,           setView]           = useState<"map" | "list">("list");

  const headerAnim = useFadeIn(0);
  const bodyAnim   = useFadeIn(100);

  const containerWidth = isLarge ? 900 : isWide ? 720 : undefined;
  const sidePad = containerWidth
    ? Math.max(16, (width - containerWidth) / 2)
    : 16;

  useEffect(() => { fetchLocationAndClinics(); }, []);

  const fetchLocationAndClinics = async () => {
    setIsLoading(true); setClinics([]);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        toast.error(`${t.clinics.permissionDenied}: ${t.clinics.permissionDesc}`);
        setIsLoading(false); return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(coords);
      await fetchClinics(coords.latitude, coords.longitude, radius);
    } catch (e: any) {
      toast.error(e.message || t.clinics.locationFailed);
    } finally { setIsLoading(false); }
  };

  const fetchClinics = async (lat: number, lon: number, r: number) => {
    setIsFetching(true);
    try {
      const query = `[out:json][timeout:25];(node["amenity"="hospital"](around:${r},${lat},${lon});node["amenity"="clinic"](around:${r},${lat},${lon});node["amenity"="doctors"](around:${r},${lat},${lon});node["amenity"="pharmacy"](around:${r},${lat},${lon});node["healthcare"="clinic"](around:${r},${lat},${lon});node["healthcare"="hospital"](around:${r},${lat},${lon});node["healthcare"="doctor"](around:${r},${lat},${lon}););out body;`;
      const response = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: query });
      const data = await response.json();
      const results: Clinic[] = (data.elements || [])
        .filter((el: any) => el.tags?.name)
        .map((el: any) => ({
          id: String(el.id), name: el.tags.name,
          address: [el.tags["addr:street"], el.tags["addr:housenumber"], el.tags["addr:city"]].filter(Boolean).join(", ") || t.clinics.addressNotAvailable,
          phone: el.tags.phone || el.tags["contact:phone"] || null,
          website: el.tags.website || el.tags["contact:website"] || null,
          openingHours: el.tags.opening_hours || null,
          location: { latitude: el.lat, longitude: el.lon },
          type: el.tags.amenity || el.tags.healthcare || "clinic",
        }));
      setClinics(results.sort((a, b) => getDistanceValue(a, lat, lon) - getDistanceValue(b, lat, lon)));
    } catch (e: any) {
      toast.error(e.message || t.clinics.fetchFailed);
    } finally { setIsFetching(false); }
  };

  const handleRadiusChange = useCallback((r: number) => {
    playClick("soft");
    setRadius(r);
    if (userLocation) fetchClinics(userLocation.latitude, userLocation.longitude, r);
  }, [userLocation, playClick]);

  const getDistanceLabel = useCallback((clinic: Clinic): string => {
    if (!userLocation) return "";
    const dist = getDistanceValue(clinic, userLocation.latitude, userLocation.longitude);
    return dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`;
  }, [userLocation]);

  const handleCall       = useCallback((phone: string) => Linking.openURL(`tel:${phone.split(";")[0].trim()}`), []);
  const handleDirections = useCallback((clinic: Clinic) => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${clinic.location.latitude},${clinic.location.longitude}&travelmode=driving`), []);
  const handleMaps       = useCallback((clinic: Clinic) => {
    const geoUrl = `geo:${clinic.location.latitude},${clinic.location.longitude}?q=${encodeURIComponent(clinic.name)}`;
    Linking.canOpenURL(geoUrl).then((s) => s
      ? Linking.openURL(geoUrl)
      : Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.name)}&center=${clinic.location.latitude},${clinic.location.longitude}`)
    );
  }, []);
  const handlePin = useCallback((clinic: Clinic) => {
    setView("map");
    setTimeout(() => mapRef.current?.animateToRegion({ ...clinic.location, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500), 300);
  }, []);
  const handleToggleExpand = useCallback((id: string) => setExpandedId(prev => prev === id ? null : id), []);

  // ── Loading state ──
  if (isLoading) {
    return (
      <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A] items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-[#94A3B8]" style={{ marginTop: 12 }}>{t.clinics.finding}</Text>
      </View>
    );
  }

  return (
    <ScrollView
              contentContainerStyle={{
                // Centered container on wide screens
                ...(containerWidth
                  ? { maxWidth: containerWidth + sidePad * 2, alignSelf: "center" as const, width: "100%" }
                  : {}),
              }}
              showsVerticalScrollIndicator={false}
            >
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A] pb-10">

      {/* ── Header ── */}
      <Animated.View
        style={[headerAnim, { paddingHorizontal: sidePad, paddingTop: 16, paddingBottom: 8 }]}
        className="bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-[#334155]"
      >
        {Platform.OS === "web" && <View style={{ height: 8 }} />}

        {/* Back */}
        <AnimatedPressable
          onPress={() => router.back()}
          soundType="soft"
          style={[{ flexDirection: "row", alignItems: "center" }, S.gap6, S.mb12]}
        >
          <ArrowLeft size={18} color="#8B5CF6" />
          <Text className="text-[#8B5CF6] font-semibold text-sm">{t.common.back}</Text>
        </AnimatedPressable>

        {/* HeroSection */}
        <HeroSection
          icon={MapPin}
          title={t.clinics.title}
          subtitle={isFetching ? t.clinics.searching : `${clinics.length} ${t.common.found}`}
          gradientColors={["#10B981", "#3B82F6"]}
          delay={0}
        />
        {Platform.OS === "web" && <View style={{ height: 8 }} />}

        {/* Map / List toggle */}
        <View
          className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
          style={{
            flexDirection: "row", borderRadius: 16, padding: 4,
            marginBottom: 8,
            shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
          }}
        >
          {Platform.OS !== "web" && (
            <Pressable
              onPress={() => { playClick("soft"); setView("map"); }}
              style={{
                flex: 1, paddingVertical: 13, borderRadius: 12,
                alignItems: "center", justifyContent: "center",
                backgroundColor: view === "map" ? "#8B5CF6" : "transparent",
                ...(view === "map" ? {
                  shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
                } : {}),
              }}
            >
              <Text style={{ fontWeight: "700", fontSize: 13, color: view === "map" ? "white" : "#64748B" }}>
                🗺 {t.clinics.mapView}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => { playClick("soft"); setView("list"); }}
            style={{
              flex: 1, paddingVertical: 13, borderRadius: 12,
              alignItems: "center", justifyContent: "center",
              backgroundColor: view === "list" ? "#8B5CF6" : "transparent",
              ...(view === "list" ? {
                shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
              } : {}),
            }}
          >
            <Text style={{ fontWeight: "700", fontSize: 13, color: view === "list" ? "white" : "#64748B" }}>
              📋 {t.clinics.listView} ({clinics.length})
            </Text>
          </Pressable>
        </View>

        {/* Radius pills */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
          {RADIUS_OPTIONS.map((r) => {
            const isSelected = radius === r;
            return (
              <AnimatedPressable
                key={r}
                onPress={() => handleRadiusChange(r)}
                soundType="soft"
                style={{
                  flex: 1, paddingVertical: 9, borderRadius: 99,
                  alignItems: "center", borderWidth: 1,
                  backgroundColor: isSelected ? "#8B5CF6" : "transparent",
                  borderColor: isSelected ? "#8B5CF6" : "#E2E8F0",
                  ...(isSelected ? {
                    shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
                  } : {}),
                }}
                className={isSelected ? "" : "dark:border-[#334155]"}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: isSelected ? "white" : "#64748B" }}>
                  {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        {/* Fetching indicator */}
        {isFetching && (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 4 }}>
            <ActivityIndicator size="small" color="#8B5CF6" />
            <Text className="text-[#94A3B8] text-xs" style={{ marginLeft: 8 }}>{t.clinics.searching}</Text>
          </View>
        )}
      </Animated.View>

      {/* ══════════ MAP VIEW ══════════ */}
      {view === "map" && userLocation && Platform.OS !== "web" && (
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={{ ...userLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
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

          {/* Map popup card */}
          {selectedClinic && (
            <View
              className="absolute bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
              style={{
                bottom: 16, left: 16, right: 16,
                borderRadius: 20, padding: 16,
                shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <Text className="text-[#0F172A] dark:text-white font-bold" style={{ fontSize: 15, flex: 1, marginRight: 8 }} numberOfLines={2}>
                  {getTypeEmoji(selectedClinic.type)} {selectedClinic.name}
                </Text>
                <Text style={{ color: "#8B5CF6", fontWeight: "700", fontSize: 13 }}>{getDistanceLabel(selectedClinic)}</Text>
              </View>
              <Text className="text-[#94A3B8] text-sm" style={S.mb12}>{selectedClinic.address}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {selectedClinic.phone && (
                  <AnimatedPressable onPress={() => handleCall(selectedClinic.phone!)} soundType="mechanical"
                    style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: "#10B981" }}>
                    <Phone size={14} color="white" />
                    <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>{t.clinics.call}</Text>
                  </AnimatedPressable>
                )}
                <AnimatedPressable onPress={() => handleDirections(selectedClinic)} soundType="mechanical"
                  style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: "#8B5CF6" }}>
                  <Navigation size={14} color="white" />
                  <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>{t.clinics.directions}</Text>
                </AnimatedPressable>
                <AnimatedPressable onPress={() => handleMaps(selectedClinic)} soundType="soft"
                  style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: "#3B82F6" }}>
                  <Map size={14} color="white" />
                  <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>{t.clinics.maps}</Text>
                </AnimatedPressable>
                <AnimatedPressable onPress={() => setSelectedClinic(null)} soundType="soft"
                  style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F5F9" }}
                  className="dark:bg-[#334155]">
                  <Text className="text-[#64748B] dark:text-[#94A3B8]" style={{ fontSize: 16 }}>✕</Text>
                </AnimatedPressable>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ══════════ LIST VIEW ══════════ */}
      {view === "list" && (
        <Animated.View style={[bodyAnim, { flex: 1 }]}>
          <FlatList
            data={clinics}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: sidePad,
              paddingTop: 12,
              paddingBottom: 100,
              // Centered on wide screens
              ...(containerWidth
                ? { maxWidth: containerWidth + sidePad * 2, alignSelf: "center" as const, width: "100%" }
                : {}),
            }}
            numColumns={isWide ? 2 : 1}
            key={isWide ? "wide" : "narrow"}
            columnWrapperStyle={isWide ? { gap: 14 } : undefined}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: 80 }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🏥</Text>
                <Text className="text-[#0F172A] dark:text-white font-semibold text-base" style={S.mb6}>
                  {t.clinics.noResults}
                </Text>
                <Text className="text-[#94A3B8] text-sm text-center">{t.clinics.tryRefresh}</Text>
              </View>
            }
            renderItem={({ item: clinic }) => (
              <View style={isWide ? { flex: 1 } : undefined}>
                <ClinicCard
                  clinic={clinic}
                  isExpanded={expandedId === clinic.id}
                  distanceLabel={getDistanceLabel(clinic)}
                  onToggle={handleToggleExpand}
                  onCall={handleCall}
                  onDirections={handleDirections}
                  onMaps={handleMaps}
                  onPin={handlePin}
                  t={t}
                />
              </View>
            )}
          />
        </Animated.View>
      )}

      {/* ── Refresh FAB ── */}
      <AnimatedPressable
        onPress={() => { playClick("mechanical"); fetchLocationAndClinics(); }}
        soundType="mechanical"
        style={{
          position: "absolute", bottom: 24, right: 24,
          flexDirection: "row", alignItems: "center", gap: 6,
          paddingHorizontal: 18, paddingVertical: 12, borderRadius: 99,
          backgroundColor: "#8B5CF6",
          shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
        }}
      >
        <RefreshCw size={15} color="white" />
        <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>{t.common.refresh}</Text>
      </AnimatedPressable>
    </View>

            </ScrollView>
  );
}