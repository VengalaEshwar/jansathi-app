import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import {
  Sparkles,
  Users,
  Wallet,
  GraduationCap,
  Heart,
  Home,
  Baby,
  Briefcase,
  CheckCircle,
  ChevronRight,
} from "lucide-react-native";

interface Scheme {
  id: string;
  name: string;
  category: "finance" | "education" | "health" | "housing" | "women" | "employment";
  description: string;
  eligibility: string[];
  benefits: string;
  matchScore: number;
  ministry: string;
  deadline?: string;
}

const mockSchemes: Scheme[] = [
  {
    id: "1",
    name: "PM Kisan Samman Nidhi",
    category: "finance",
    description: "Direct income support of ₹6,000 per year to farmer families",
    eligibility: ["Small farmers", "Aadhaar required"],
    benefits: "₹6,000/year",
    matchScore: 95,
    ministry: "Ministry of Agriculture",
  },
  {
    id: "2",
    name: "Ayushman Bharat - PMJAY",
    category: "health",
    description: "Health insurance up to ₹5 lakh per family",
    eligibility: ["BPL families", "SECC listed"],
    benefits: "₹5 lakh cover",
    matchScore: 88,
    ministry: "Ministry of Health",
  },
  {
    id: "3",
    name: "PM Awas Yojana",
    category: "housing",
    description: "Subsidy for building permanent houses",
    eligibility: ["Low income", "No pucca house"],
    benefits: "₹1.2–2.5 lakh",
    matchScore: 82,
    ministry: "Ministry of Housing",
  },
];

const categoryIcons: any = {
  finance: Wallet,
  education: GraduationCap,
  health: Heart,
  housing: Home,
  women: Baby,
  employment: Briefcase,
};

export default function SchemeFinder() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredSchemes = mockSchemes.filter((s) => {
    const matchCategory =
      selectedCategory === "all" || s.category === selectedCategory;
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleApply = (scheme: Scheme) => {
    Alert.alert("Apply", `Opening application for ${scheme.name}`);
  };

  const handleDetails = (scheme: Scheme) => {
    Alert.alert("Details", `Showing details for ${scheme.name}`);
  };

  const CategoryTab = ({ value, label }: any) => (
    <Pressable
      onPress={() => setSelectedCategory(value)}
      className={`px-4 py-2 rounded-full mr-2 ${
        selectedCategory === value ? "bg-primary" : "bg-secondary"
      }`}
    >
      <Text
        className={`text-sm ${
          selectedCategory === value ? "text-white" : "text-foreground"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center gap-3 mb-2">
            <View className="w-12 h-12 rounded-xl bg-primary items-center justify-center">
              <Sparkles size={22} color="white" />
            </View>
            <View>
              <Text className="text-2xl font-bold">Scheme Finder</Text>
              <Text className="text-muted">
                Discover government schemes for you
              </Text>
            </View>
          </View>
        </View>

        {/* Profile Summary */}
        <View className="p-4 rounded-2xl bg-primary mb-5">
          <View className="flex-row items-center gap-3 mb-3">
            <Users size={18} color="white" />
            <Text className="text-white font-semibold">
              Profile Based Suggestions
            </Text>
          </View>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-white text-xl font-bold">
                {mockSchemes.length}
              </Text>
              <Text className="text-white/80 text-xs">Schemes Found</Text>
            </View>
            <View>
              <Text className="text-white text-xl font-bold">
                {mockSchemes.filter((s) => s.matchScore >= 80).length}
              </Text>
              <Text className="text-white/80 text-xs">High Match</Text>
            </View>
            <View>
              <Text className="text-white text-xl font-bold">₹15L+</Text>
              <Text className="text-white/80 text-xs">Benefits</Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <TextInput
          placeholder="Search schemes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="border border-border rounded-lg px-3 py-2 mb-3"
        />

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <CategoryTab value="all" label="All" />
          <CategoryTab value="finance" label="Finance" />
          <CategoryTab value="health" label="Health" />
          <CategoryTab value="education" label="Education" />
          <CategoryTab value="housing" label="Housing" />
          <CategoryTab value="women" label="Women" />
          <CategoryTab value="employment" label="Jobs" />
        </ScrollView>

        {/* Scheme Cards */}
        {filteredSchemes.map((scheme) => {
          const Icon = categoryIcons[scheme.category] || Sparkles;
          return (
            <View
              key={scheme.id}
              className="p-4 rounded-2xl bg-card border border-border mb-4"
            >
              <View className="flex-row gap-3">
                <View className="w-12 h-12 rounded-xl bg-primary items-center justify-center">
                  <Icon size={22} color="white" />
                </View>

                <View className="flex-1">
                  <View className="flex-row justify-between">
                    <Text className="font-semibold text-lg">{scheme.name}</Text>
                    <Text className="font-bold text-primary">
                      {scheme.matchScore}%
                    </Text>
                  </View>

                  <Text className="text-xs text-muted mb-1">
                    {scheme.ministry}
                  </Text>

                  <Text className="text-sm text-muted mb-2">
                    {scheme.description}
                  </Text>

                  <View className="mb-2">
                    {scheme.eligibility.slice(0, 2).map((e) => (
                      <View
                        key={e}
                        className="flex-row items-center gap-1"
                      >
                        <CheckCircle size={14} color="green" />
                        <Text className="text-xs text-muted">{e}</Text>
                      </View>
                    ))}
                  </View>

                  <Text className="text-xs font-semibold text-green-600 mb-2">
                    {scheme.benefits}
                  </Text>

                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => handleApply(scheme)}
                      className="flex-1 bg-primary rounded-lg px-3 py-2 flex-row justify-center items-center"
                    >
                      <Text className="text-white mr-1">Apply</Text>
                      <ChevronRight size={14} color="white" />
                    </Pressable>

                    <Pressable
                      onPress={() => handleDetails(scheme)}
                      className="flex-1 border border-border rounded-lg px-3 py-2 items-center"
                    >
                      <Text>Details</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        {filteredSchemes.length === 0 && (
          <View className="items-center py-10">
            <Sparkles size={40} color="gray" />
            <Text className="mt-2 font-semibold">No schemes found</Text>
            <Text className="text-muted">
              Try changing filters or search
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
