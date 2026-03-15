// app/g-assist/step-guides.tsx
import { useEffect, useRef, useState, useCallback, memo } from "react";
import {
  View, Text, ScrollView, Pressable, Animated,
  TextInput, ActivityIndicator, useWindowDimensions, Platform,
} from "react-native";
import {
  BookOpen, Sparkles, ChevronRight, Search, X,
  CreditCard, FileText, Users, Home, Car, Briefcase,
  Heart, GraduationCap, CheckCircle, Clock, AlertCircle,
  ArrowRight, ArrowLeft,
} from "lucide-react-native";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { HeroSection } from "@/components/HeroSection";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter } from "expo-router";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab      = "guides" | "ai";
type Category = "identity" | "health" | "education" | "property" | "business" | "welfare";

interface Step {
  number: number; title: string; description: string;
  tip?: string; duration?: string;
}
interface Guide {
  id: string; title: string; category: Category;
  description: string; totalTime: string;
  difficulty: "Easy" | "Medium" | "Hard";
  steps: Step[]; requirements: string[];
}

// ─── Static data ──────────────────────────────────────────────────────────────
const GUIDES: Guide[] = [
  {
    id: "aadhaar", title: "Aadhaar Card Enrollment", category: "identity",
    description: "Register for your Aadhaar card at a nearby enrollment centre.",
    totalTime: "1–2 hours", difficulty: "Easy",
    requirements: ["Proof of Identity (Birth certificate / School ID / Passport)", "Proof of Address (Ration card / Bank passbook / Utility bill)", "Recent passport-size photograph (optional — biometric taken at centre)"],
    steps: [
      { number: 1, title: "Find Enrollment Centre", description: "Visit uidai.gov.in or call 1947 to locate the nearest Aadhaar enrollment centre. Many post offices and banks are authorised centres.", tip: "Carry original documents — photocopies alone are not accepted.", duration: "10 min" },
      { number: 2, title: "Fill Enrollment Form", description: "Collect the Aadhaar Enrollment Form at the centre. Fill in your full name, address, date of birth, mobile number, and email.", tip: "Write your name exactly as it appears on your identity proof.", duration: "10 min" },
      { number: 3, title: "Document Verification", description: "Submit your filled form along with original identity and address proof documents. The operator will verify them.", duration: "15 min" },
      { number: 4, title: "Biometric Capture", description: "Your photograph, all 10 fingerprints, and iris scans will be captured. This is free of charge.", tip: "Clean your fingers before fingerprint scanning for better accuracy.", duration: "10 min" },
      { number: 5, title: "Collect Acknowledgement Slip", description: "You will receive an enrollment acknowledgement slip with a 14-digit Enrollment ID (EID). Keep this safe.", duration: "5 min" },
      { number: 6, title: "Download e-Aadhaar", description: "After 90 days, download your e-Aadhaar from uidai.gov.in using your EID and registered mobile number. Physical card is sent by post.", tip: "You can use e-Aadhaar immediately — it is equally valid as the physical card.", duration: "5 min" },
    ],
  },
  {
    id: "pan", title: "PAN Card Application", category: "identity",
    description: "Apply for a Permanent Account Number (PAN) card online via NSDL or UTIITSL.",
    totalTime: "15–30 min online + 15 days delivery", difficulty: "Medium",
    requirements: ["Aadhaar card", "Proof of date of birth", "Passport-size photograph", "₹107 application fee (online payment)"],
    steps: [
      { number: 1, title: "Choose Application Portal", description: "Go to onlineservices.nsdl.com or www.myutiitsl.com. Both are official government-authorised portals.", duration: "2 min" },
      { number: 2, title: "Select Form 49A", description: "For Indian citizens, choose 'New PAN – Indian Citizen (Form 49A)'. Fill in personal details, contact information, and income source.", tip: "Use Form 49AA if you are a foreign citizen.", duration: "15 min" },
      { number: 3, title: "Upload Documents", description: "Upload scanned copies of your identity proof, address proof, and date of birth proof in JPG/PDF format (max 300KB each).", duration: "10 min" },
      { number: 4, title: "Pay Application Fee", description: "Pay ₹107 (Indian address) or ₹1,017 (foreign address) using debit/credit card or net banking.", duration: "5 min" },
      { number: 5, title: "e-KYC via Aadhaar", description: "If you verify via Aadhaar OTP, your PAN is typically issued within 48 hours as an e-PAN. Physical card takes 15 days.", tip: "Save your 15-digit acknowledgement number for tracking.", duration: "5 min" },
      { number: 6, title: "Track & Receive", description: "Track status at tin.tin.nsdl.com. Physical PAN card is dispatched by India Post Speed Post.", duration: "15 days" },
    ],
  },
  {
    id: "ration", title: "Ration Card Application", category: "welfare",
    description: "Apply for a new ration card to access subsidised food grains under the National Food Security Act.",
    totalTime: "30 min application + 30 days processing", difficulty: "Medium",
    requirements: ["Aadhaar cards of all family members", "Proof of residence", "Income certificate", "Gas connection details (if applicable)", "Passport-size photos of head of household"],
    steps: [
      { number: 1, title: "Visit Food Department Office", description: "Go to your nearest Tehsil or Block-level Food & Civil Supplies office, or visit your state's food department portal.", duration: "Travel time" },
      { number: 2, title: "Obtain Application Form", description: "Collect the ration card application form (Form A for APL / Form B for BPL). Available free of cost.", duration: "5 min" },
      { number: 3, title: "Fill Family Details", description: "List all family members with their names, ages, Aadhaar numbers, and relationship to head of household.", tip: "Include even newborns — they are entitled to ration benefits.", duration: "15 min" },
      { number: 4, title: "Attach Documents", description: "Attach self-attested copies of Aadhaar, residence proof, income certificate, and recent photos.", duration: "10 min" },
      { number: 5, title: "Submit & Get Receipt", description: "Submit the form at the office. Collect an acknowledgement receipt with application number.", duration: "15 min" },
      { number: 6, title: "Verification Visit", description: "A field officer may visit your home to verify your residence and household details.", duration: "1–2 weeks" },
      { number: 7, title: "Collect Ration Card", description: "After approval (usually 30 days), collect your ration card from the office or it will be delivered to your address.", tip: "You can also check status on your state's food department website.", duration: "30 days" },
    ],
  },
  {
    id: "voter-id", title: "Voter ID (EPIC) Registration", category: "identity",
    description: "Register as a voter and obtain your Elector Photo Identity Card (EPIC).",
    totalTime: "20 min online + 30 days processing", difficulty: "Easy",
    requirements: ["Aadhaar card", "Proof of age (18+ years)", "Proof of residence at the address you want to register", "Passport-size photograph"],
    steps: [
      { number: 1, title: "Visit Voter Portal", description: "Go to voters.eci.gov.in — the official Election Commission of India portal. You can also use the Voter Helpline App.", duration: "2 min" },
      { number: 2, title: "Fill Form 6", description: "Click 'Register as New Voter' and fill Form 6 with your name, address, date of birth, and constituency details.", duration: "15 min" },
      { number: 3, title: "Upload Documents", description: "Upload your photo, age proof, and address proof. Documents should be clear scans in JPG/PNG format.", duration: "5 min" },
      { number: 4, title: "Submit Application", description: "Submit and note your reference number. No fees required.", tip: "Applications close before election season. Apply early.", duration: "2 min" },
      { number: 5, title: "BLO Verification", description: "A Booth Level Officer (BLO) will visit your address to verify your details in person.", duration: "1–2 weeks" },
      { number: 6, title: "Receive Voter ID", description: "Your Voter ID card will be delivered by post. You can also download the e-EPIC from the voter portal immediately after approval.", duration: "30 days" },
    ],
  },
  {
    id: "driving-licence", title: "Driving Licence Application", category: "identity",
    description: "Apply for a learner's licence and then a permanent driving licence through Parivahan Sewa.",
    totalTime: "2–4 weeks", difficulty: "Medium",
    requirements: ["Aadhaar / Identity proof", "Address proof", "Age proof (18+ for motorised vehicles)", "Passport-size photos", "Application fee (varies by state, ~₹200–500)"],
    steps: [
      { number: 1, title: "Apply for Learner's Licence", description: "Visit parivahan.gov.in → Driving Licence → Apply for Learner's Licence. Fill in personal and vehicle class details.", duration: "20 min" },
      { number: 2, title: "Book LL Test Slot", description: "Choose your nearest RTO and book a slot for the Learner's Licence test (online computer-based test).", duration: "5 min" },
      { number: 3, title: "Pass the LL Test", description: "Appear at the RTO on your scheduled date. The test has 15 questions on traffic rules and signs. Pass mark is 9/15.", tip: "Study the official Highway Code booklet available at the RTO.", duration: "30 min" },
      { number: 4, title: "Practice for 30 Days", description: "Use your Learner's Licence to practice driving. You must wait 30 days before applying for a Permanent Licence.", duration: "30 days" },
      { number: 5, title: "Apply for Permanent Licence", description: "After 30 days, apply for Driving Licence Test on parivahan.gov.in. Book your RTO driving test slot.", duration: "10 min" },
      { number: 6, title: "Pass Driving Test", description: "Appear at the RTO with your vehicle. The inspector will test your driving skills in a designated area.", duration: "15 min" },
      { number: 7, title: "Receive Driving Licence", description: "After passing, your permanent DL is sent by post. You can also download a digital copy from DigiLocker.", duration: "7–10 days" },
    ],
  },
  {
    id: "pm-kisan", title: "PM-KISAN Registration", category: "welfare",
    description: "Register for the PM Kisan Samman Nidhi scheme — ₹6,000/year directly to farmers' bank accounts.",
    totalTime: "30 min", difficulty: "Easy",
    requirements: ["Aadhaar card linked to mobile number", "Bank account (linked to Aadhaar)", "Land ownership documents (Khasra / Khatauni)", "Mobile number"],
    steps: [
      { number: 1, title: "Visit PM-KISAN Portal", description: "Go to pmkisan.gov.in and click on 'Farmers Corner' → 'New Farmer Registration'.", duration: "2 min" },
      { number: 2, title: "Enter Aadhaar Details", description: "Enter your Aadhaar number and registered mobile number. An OTP will be sent for verification.", duration: "5 min" },
      { number: 3, title: "Fill Personal & Land Details", description: "Enter your name, bank account number, IFSC code, and land holding details (survey number, area).", tip: "Bank account must be linked with Aadhaar for direct benefit transfer.", duration: "15 min" },
      { number: 4, title: "Upload Land Documents", description: "Upload a copy of your land ownership document (Khasra-Khatauni). The format should be clear and readable.", duration: "5 min" },
      { number: 5, title: "Submit Registration", description: "Review all details and submit. You will receive an application reference number.", duration: "2 min" },
      { number: 6, title: "Verification by Patwari", description: "Local agricultural officer (Patwari) will verify your land records. This may take 2–4 weeks.", duration: "2–4 weeks" },
      { number: 7, title: "Receive Benefits", description: "After approval, ₹2,000 is transferred directly to your bank account every 4 months (3 instalments per year).", tip: "Check your status at pmkisan.gov.in → Beneficiary Status.", duration: "Upon approval" },
    ],
  },
];

const CATEGORY_CONFIG: Record<Category, { label: string; icon: any; color: string }> = {
  identity:  { label: "Identity",  icon: CreditCard,   color: "#3B82F6" },
  health:    { label: "Health",    icon: Heart,         color: "#EF4444" },
  education: { label: "Education", icon: GraduationCap, color: "#8B5CF6" },
  property:  { label: "Property",  icon: Home,          color: "#F59E0B" },
  business:  { label: "Business",  icon: Briefcase,     color: "#10B981" },
  welfare:   { label: "Welfare",   icon: Users,         color: "#EC4899" },
};

const DIFF_COLOR = { Easy: "#10B981", Medium: "#F59E0B", Hard: "#EF4444" };

// ─── Spacing constants — all gap/margin via style, never className ─────────────
const S = {
  gap4:  { gap: 4  } as const,
  gap6:  { gap: 6  } as const,
  gap8:  { gap: 8  } as const,
  gap10: { gap: 10 } as const,
  gap12: { gap: 12 } as const,
  gap14: { gap: 14 } as const,
  mb4:   { marginBottom: 4  } as const,
  mb6:   { marginBottom: 6  } as const,
  mb8:   { marginBottom: 8  } as const,
  mb10:  { marginBottom: 10 } as const,
  mb12:  { marginBottom: 12 } as const,
  mb14:  { marginBottom: 14 } as const,
  mb16:  { marginBottom: 16 } as const,
  mb20:  { marginBottom: 20 } as const,
  mb24:  { marginBottom: 24 } as const,
  mb32:  { marginBottom: 32 } as const,
};

// ─── useFadeSlideIn ───────────────────────────────────────────────────────────
const useFadeSlideIn = (delay = 0) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 360, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true, speed: 14, bounciness: 5 }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
};

// ─── GuideCard ────────────────────────────────────────────────────────────────
const GuideCard = memo(({ guide, index, onOpen }: {
  guide: Guide; index: number; onOpen: () => void;
}) => {
  const anim     = useFadeSlideIn(index * 70);
  const scale    = useRef(new Animated.Value(1)).current;
  const cfg      = CATEGORY_CONFIG[guide.category];
  const IconComp = cfg.icon;

  return (
    // style marginBottom — never className mb-X (unreliable on web)
    <Animated.View style={[anim, S.mb12]}>
      <Pressable
        onPress={onOpen}
        onPressIn={() =>  Animated.spring(scale, { toValue: 0.97,  useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,     useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        // @ts-ignore — web only
        onHoverIn={() =>  { if (Platform.OS === "web") Animated.spring(scale, { toValue: 1.015, useNativeDriver: true, speed: 28, bounciness: 8 }).start(); }}
        onHoverOut={() => { if (Platform.OS === "web") Animated.spring(scale, { toValue: 1,     useNativeDriver: true, speed: 22, bounciness: 8 }).start(); }}
        className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{
          borderRadius: 16, padding: 16,
          shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          {/* Category icon */}
          <View style={{
            width: 46, height: 46, borderRadius: 14,
            backgroundColor: cfg.color + "18",
            borderWidth: 1, borderColor: cfg.color + "30",
            alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <IconComp size={22} color={cfg.color} />
          </View>

          {/* Content — flex:1 + minWidth:0 prevents text overflow out of card */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              className="text-[#0F172A] dark:text-white font-bold text-sm"
              style={S.mb4}
              numberOfLines={2}
            >
              {guide.title}
            </Text>
            <Text
              className="text-[#64748B] dark:text-[#94A3B8] text-xs leading-4"
              style={S.mb8}
              numberOfLines={2}
            >
              {guide.description}
            </Text>

            {/* Meta row */}
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Clock size={11} color="#94A3B8" />
                <Text style={{ color: "#94A3B8", fontSize: 11 }}>{guide.totalTime}</Text>
              </View>
              <View style={{
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
                backgroundColor: DIFF_COLOR[guide.difficulty] + "20",
              }}>
                <Text style={{ color: DIFF_COLOR[guide.difficulty], fontSize: 10, fontWeight: "700" }}>
                  {guide.difficulty}
                </Text>
              </View>
              <Text style={{ color: "#94A3B8", fontSize: 11 }}>{guide.steps.length} steps</Text>
            </View>
          </View>

          <ChevronRight size={16} color="#94A3B8" style={{ flexShrink: 0, marginTop: 2 }} />
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ─── StepRow ──────────────────────────────────────────────────────────────────
const StepRow = memo(({ step, done, color, onToggle }: {
  step: Step; done: boolean; color: string; onToggle: (n: number) => void;
}) => {
  const handleToggle = useCallback(() => onToggle(step.number), [step.number, onToggle]);
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, S.mb10]}>
      <Pressable
        onPress={handleToggle}
        onPressIn={() =>  Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        style={{
          borderRadius: 16, borderWidth: 1,
          borderColor: done ? "#BBF7D0" : "#E2E8F0",
          backgroundColor: done ? "#F0FDF4" : "white",
          overflow: "hidden",
        }}
        className={done ? "" : "dark:bg-[#1E293B] dark:border-[#334155]"}
      >
        <View style={{ padding: 14, flexDirection: "row", gap: 12 }}>
          {/* Step number / check circle */}
          <Pressable
            onPress={handleToggle}
            style={{
              width: 32, height: 32, borderRadius: 16,
              alignItems: "center", justifyContent: "center",
              backgroundColor: done ? "#10B981" : color,
              flexShrink: 0, marginTop: 1,
              shadowColor: done ? "#10B981" : color,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.35, shadowRadius: 6, elevation: 3,
            }}
          >
            {done
              ? <CheckCircle size={18} color="white" />
              : <Text style={{ color: "white", fontWeight: "800", fontSize: 13 }}>{step.number}</Text>
            }
          </Pressable>

          {/* Text content — flex:1 + minWidth:0 prevents overflow */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
              <Text
                style={{ fontWeight: "700", fontSize: 14, color: done ? "#065F46" : "#0F172A", flex: 1 }}
                numberOfLines={2}
              >
                {step.title}
              </Text>
              {step.duration && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginLeft: 8, flexShrink: 0 }}>
                  <Clock size={10} color="#94A3B8" />
                  <Text style={{ color: "#94A3B8", fontSize: 10 }}>{step.duration}</Text>
                </View>
              )}
            </View>

            <Text style={{ fontSize: 13, color: done ? "#374151" : "#64748B", lineHeight: 19 }}>
              {step.description}
            </Text>

            {step.tip && (
              <View style={{
                marginTop: 8, padding: 10, borderRadius: 10,
                backgroundColor: color + "12",
                flexDirection: "row", gap: 6, alignItems: "flex-start",
              }}>
                <Text style={{ fontSize: 13, flexShrink: 0 }}>💡</Text>
                {/* minWidth:0 on flex child prevents tip text overflow */}
                <Text style={{ color, fontSize: 12, fontWeight: "500", flex: 1, minWidth: 0, lineHeight: 17 }}>
                  {step.tip}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ─── GuideDetail ──────────────────────────────────────────────────────────────
const GuideDetail = memo(({ guide, onClose }: { guide: Guide; onClose: () => void }) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const cfg      = CATEGORY_CONFIG[guide.category];
  const IconComp = cfg.icon;
  const anim     = useFadeSlideIn(0);

  const toggleStep = useCallback((n: number) =>
    setCompletedSteps((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n]),
  []);

  return (
    <Animated.View style={anim}>
      {Platform.OS === "web" && <View style={{ height: 8 }} />}

      {/* Back */}
      <AnimatedPressable
        onPress={onClose}
        soundType="soft"
        style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 }}
      >
        <ArrowLeft size={16} color="#8B5CF6" />
        <Text style={{ color: "#8B5CF6", fontWeight: "600", fontSize: 14 }}>Back to Guides</Text>
      </AnimatedPressable>

      {/* Hero card */}
      <View
        style={{
          borderRadius: 20, padding: 20, marginBottom: 16,
          backgroundColor: cfg.color, overflow: "hidden",
          shadowColor: cfg.color, shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.32, shadowRadius: 14, elevation: 6,
        }}
      >
        {/* Decorative circle */}
        <View style={{
          position: "absolute", top: -20, right: -20,
          width: 100, height: 100, borderRadius: 50,
          backgroundColor: "rgba(255,255,255,0.08)",
        }} />

        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <View style={{
            width: 46, height: 46, borderRadius: 14,
            backgroundColor: "rgba(255,255,255,0.2)",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <IconComp size={22} color="white" />
          </View>
          {/* minWidth:0 prevents title overflowing hero card */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: "white", fontWeight: "800", fontSize: 17, letterSpacing: -0.3 }} numberOfLines={2}>
              {guide.title}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 }} numberOfLines={2}>
              {guide.description}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Clock size={13} color="rgba(255,255,255,0.8)" />
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{guide.totalTime}</Text>
          </View>
          <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.25)" }}>
            <Text style={{ color: "white", fontSize: 11, fontWeight: "700" }}>{guide.difficulty}</Text>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
            {completedSteps.length}/{guide.steps.length} done
          </Text>
        </View>
      </View>

      {/* Requirements */}
      <View style={{
        borderRadius: 16, padding: 16, marginBottom: 16,
        backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FED7AA",
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <AlertCircle size={15} color="#F59E0B" />
          <Text style={{ color: "#92400E", fontWeight: "700", fontSize: 13 }}>What You Need</Text>
        </View>
        {guide.requirements.map((r, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
            <Text style={{ color: "#F59E0B", fontSize: 14, lineHeight: 20, flexShrink: 0 }}>•</Text>
            {/* flex:1 + minWidth:0 prevents requirement text overflowing card */}
            <Text style={{ color: "#78350F", fontSize: 13, lineHeight: 20, flex: 1, minWidth: 0 }}>{r}</Text>
          </View>
        ))}
      </View>

      {/* Steps label */}
      <Text style={{
        fontSize: 11, fontWeight: "700", letterSpacing: 1.2,
        color: "#8B5CF6", marginBottom: 12, marginLeft: 4,
      }}>
        STEPS
      </Text>

      {guide.steps.map((step) => (
        <StepRow
          key={step.number}
          step={step}
          done={completedSteps.includes(step.number)}
          color={cfg.color}
          onToggle={toggleStep}
        />
      ))}

      {/* Completion banner */}
      {completedSteps.length === guide.steps.length && (
        <View style={{
          marginTop: 8, padding: 20, borderRadius: 16,
          backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0",
          alignItems: "center",
        }}>
          <Text style={{ fontSize: 28, marginBottom: 8 }}>🎉</Text>
          <Text style={{ color: "#065F46", fontWeight: "800", fontSize: 16, marginBottom: 4 }}>
            All Steps Completed!
          </Text>
          <Text style={{ color: "#374151", fontSize: 13, textAlign: "center" }}>
            You've completed all steps for {guide.title}.
          </Text>
        </View>
      )}
    </Animated.View>
  );
});

// ─── AI Guide Generator ───────────────────────────────────────────────────────
const SUGGESTIONS = [
  "How to apply for a birth certificate",
  "How to open a Jan Dhan bank account",
  "Steps to apply for old age pension",
  "How to register a small business (Udyam)",
  "Procedure for passport application",
  "How to apply for caste certificate",
];

const AIGuideGenerator = memo(() => {
  const [query,          setQuery]          = useState("");
  const [loading,        setLoading]        = useState(false);
  const [result,         setResult]         = useState<any>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const anim = useFadeSlideIn(0);

  const generate = useCallback(async (q: string) => {
    const question = q || query;
    if (!question.trim()) return;
    setLoading(true); setResult(null); setCompletedSteps([]);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a government services guide assistant for rural India. Generate clear, simple step-by-step guides.
Respond ONLY with valid JSON in this exact shape:
{"title":"procedure name","description":"1 sentence description","totalTime":"estimated time","difficulty":"Easy"|"Medium"|"Hard","requirements":["item1"],"steps":[{"number":1,"title":"step title","description":"what to do","tip":"optional tip","duration":"time estimate"}],"helpline":"helpline number if any","website":"official URL if any"}
Keep language very simple. Max 8 steps. Return ONLY the JSON.`,
          messages: [{ role: "user", content: question }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find((b: any) => b.type === "text")?.text ?? "";
      setResult(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch {
      setResult(null);
    } finally {
      setLoading(false); }
  }, [query]);

  const toggleStep = useCallback((n: number) =>
    setCompletedSteps((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n]),
  []);

  return (
    <Animated.View style={anim}>
      {Platform.OS === "web" && <View style={{ height: 8 }} />}

      {/* Input card */}
      <View
        className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{
          borderRadius: 16, padding: 16, marginBottom: 16,
          shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Sparkles size={16} color="#8B5CF6" />
          <Text className="text-[#0F172A] dark:text-white font-semibold text-sm">
            Ask about any government procedure
          </Text>
        </View>
        <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs" style={S.mb12}>
          Type a procedure name and AI will generate step-by-step instructions
        </Text>

        {/* Search row */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => generate(query)}
            placeholder="e.g. How to get a birth certificate..."
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
            className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-white text-sm"
            style={{ flex: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 }}
          />
          <AnimatedPressable
            onPress={() => generate(query)}
            disabled={!query.trim() || loading}
            soundType="mechanical"
            style={{
              paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12,
              alignItems: "center", justifyContent: "center",
              backgroundColor: !query.trim() ? "#E2E8F0" : "#8B5CF6",
              ...(!query.trim() ? {} : {
                shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
              }),
            }}
          >
            {loading
              ? <ActivityIndicator color="white" size="small" />
              : <ArrowRight size={18} color={!query.trim() ? "#94A3B8" : "white"} />
            }
          </AnimatedPressable>
        </View>

        {/* Suggestion chips */}
        <Text style={{ color: "#94A3B8", fontSize: 11, marginBottom: 8 }}>Try asking:</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {SUGGESTIONS.map((s) => (
            <AnimatedPressable
              key={s}
              onPress={() => { setQuery(s); generate(s); }}
              soundType="soft"
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
                borderWidth: 1, borderColor: "#8B5CF640",
                backgroundColor: "#8B5CF608",
              }}
            >
              <Text style={{ color: "#8B5CF6", fontSize: 11, fontWeight: "500" }}>{s}</Text>
            </AnimatedPressable>
          ))}
        </View>
      </View>

      {/* AI Result */}
      {result && (
        <View>
          {/* Hero */}
          <View style={{
            borderRadius: 16, padding: 16, marginBottom: 14,
            backgroundColor: "#8B5CF6", overflow: "hidden",
            shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
          }}>
            {/* Prevent title overflow */}
            <Text style={{ color: "white", fontWeight: "800", fontSize: 16, marginBottom: 4 }} numberOfLines={2}>
              {result.title}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 10 }} numberOfLines={3}>
              {result.description}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Clock size={12} color="rgba(255,255,255,0.7)" />
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{result.totalTime}</Text>
              </View>
              <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.2)" }}>
                <Text style={{ color: "white", fontSize: 11, fontWeight: "700" }}>{result.difficulty}</Text>
              </View>
            </View>
          </View>

          {/* Requirements */}
          {result.requirements?.length > 0 && (
            <View style={{
              borderRadius: 16, padding: 16, marginBottom: 14,
              backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FED7AA",
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <AlertCircle size={14} color="#F59E0B" />
                <Text style={{ color: "#92400E", fontWeight: "700", fontSize: 13 }}>What You Need</Text>
              </View>
              {result.requirements.map((r: string, i: number) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                  <Text style={{ color: "#F59E0B", fontSize: 14, flexShrink: 0 }}>•</Text>
                  {/* flex:1 + minWidth:0 prevents text overflow */}
                  <Text style={{ color: "#78350F", fontSize: 13, lineHeight: 19, flex: 1, minWidth: 0 }}>{r}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Steps */}
          {result.steps?.map((step: any) => (
            <StepRow
              key={step.number}
              step={step}
              done={completedSteps.includes(step.number)}
              color="#8B5CF6"
              onToggle={toggleStep}
            />
          ))}

          {/* Helpline / website */}
          {(result.helpline || result.website) && (
            <View style={{
              borderRadius: 16, padding: 16, marginTop: 4,
              backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE",
            }}>
              <Text style={{ color: "#1E40AF", fontWeight: "700", fontSize: 13, marginBottom: 8 }}>
                Useful Resources
              </Text>
              {result.helpline && (
                <Text style={{ color: "#1D4ED8", fontSize: 13, marginBottom: 4 }}>📞 Helpline: {result.helpline}</Text>
              )}
              {result.website && (
                <Text style={{ color: "#1D4ED8", fontSize: 13 }}>🌐 {result.website}</Text>
              )}
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StepGuides() {
  const [tab,          setTab]          = useState<Tab>("guides");
  const [search,       setSearch]       = useState("");
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const { width }  = useWindowDimensions();
  const isWide     = width >= 640;
  const isLarge    = width >= 1024;
  const router     = useRouter();
  const { t }      = useTranslation();

  const tabAnim    = useFadeSlideIn(80);
  const bodyAnim   = useFadeSlideIn(160);

  // Centered container — same pattern as danger-alerts.tsx
  const containerWidth = isLarge ? 900 : isWide ? 720 : undefined;
  const sidePad = 12

  const filtered = GUIDES.filter((g) =>
    search === "" ||
    g.title.toLowerCase().includes(search.toLowerCase()) ||
    g.description.toLowerCase().includes(search.toLowerCase())
  );

  const pairs: Guide[][] = [];
  for (let i = 0; i < filtered.length; i += 2) pairs.push(filtered.slice(i, i + 2));

  const handleOpenGuide  = useCallback((g: Guide) => setSelectedGuide(g), []);
  const handleCloseGuide = useCallback(() => setSelectedGuide(null), []);

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Centered inner container */}
        <View style={{
          paddingHorizontal: sidePad,
          paddingTop: 20,
          ...(containerWidth
            ? { maxWidth: containerWidth + sidePad * 2, alignSelf: "center" as const, width: "100%" }
            : {}),
        }}>
          {/* Web spacer — fixes NativeWind v4 first-child gap bug on web */}
          {Platform.OS === "web" && <View style={{ height: 8 }} />}

          {/* ── Back ── */}
          <AnimatedPressable
            onPress={() => router.back()}
            soundType="soft"
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 }}
          >
            <ArrowLeft size={18} color="#8B5CF6" />
            <Text className="text-[#8B5CF6] font-semibold text-sm">{t.common.back}</Text>
          </AnimatedPressable>

          {/* ── Hero ── */}
          <HeroSection
            icon={BookOpen}
            title={t.stepGuides.title}
            subtitle={t.stepGuides.subtitle}
            gradientColors={["#8B5CF6", "#6366F1"]}
            delay={0}
          />
          {/* Web spacer — gap between HeroSection and tab toggle below (mb-6 className unreliable on web) */}
          {Platform.OS === "web" && <View style={{ height: 8 }} />}

          {/* ── Tab Toggle — active pill fills parent, no alignItems on parent ── */}
          <Animated.View style={tabAnim}>
            <View
              className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
              style={{
                flexDirection: "row", borderRadius: 16, padding: 4,
                marginBottom: 20,
                shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
                // NO alignItems — children must stretch to fill full height
              }}
            >
              {([
                { key: "guides" as Tab, label: `📖 ${t.stepGuides.tabGuides}` },
                { key: "ai"     as Tab, label: `✨ ${t.stepGuides.tabAskAI}`  },
              ]).map((m) => {
                const isActive = tab === m.key;
                return (
                  <AnimatedPressable
                    key={m.key}
                    onPress={() => { setTab(m.key); if (m.key === "guides") setSelectedGuide(null); }}
                    soundType="soft"
                    style={{
                      flex: 1, paddingVertical: 13,
                      borderRadius: 12, alignItems: "center", justifyContent: "center",
                      backgroundColor: isActive ? "#8B5CF6" : "transparent",
                      ...(isActive ? {
                        shadowColor: "#8B5CF6",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
                      } : {}),
                    }}
                  >
                    <Text style={{ fontWeight: "700", fontSize: 13, color: isActive ? "white" : "#64748B" }}>
                      {m.label}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </Animated.View>

          {/* ══════════ GUIDES TAB ══════════ */}
          {tab === "guides" && (
            selectedGuide ? (
              <GuideDetail guide={selectedGuide} onClose={handleCloseGuide} />
            ) : (
              <Animated.View style={bodyAnim}>
                {Platform.OS === "web" && <View style={{ height: 8 }} />}

                {/* Search */}
                <View
                  className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
                  style={{
                    flexDirection: "row", alignItems: "center",
                    borderRadius: 12, paddingHorizontal: 12, marginBottom: 16,
                    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
                  }}
                >
                  <Search size={16} color="#94A3B8" />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder={t.stepGuides.searchPlaceholder}
                    placeholderTextColor="#94A3B8"
                    className="text-[#0F172A] dark:text-white text-sm"
                    style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8 }}
                  />
                  {search ? (
                    <Pressable onPress={() => setSearch("")} hitSlop={8}>
                      <X size={14} color="#94A3B8" />
                    </Pressable>
                  ) : null}
                </View>

                {/* Guide grid */}
                {filtered.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 48 }}>
                    <Text className="text-[#94A3B8] text-sm">
                      {t.stepGuides.noGuides} "{search}"
                    </Text>
                  </View>
                ) : isWide ? (
                  pairs.map((pair, ri) => (
                    <View key={ri} style={{ flexDirection: "row", gap: 14 }}>
                      {pair.map((g, gi) => (
                        <View key={g.id} style={{ flex: 1 }}>
                          <GuideCard guide={g} index={ri * 2 + gi} onOpen={() => handleOpenGuide(g)} />
                        </View>
                      ))}
                      {pair.length === 1 && <View style={{ flex: 1 }} />}
                    </View>
                  ))
                ) : (
                  filtered.map((g, i) => (
                    <GuideCard key={g.id} guide={g} index={i} onOpen={() => handleOpenGuide(g)} />
                  ))
                )}
              </Animated.View>
            )
          )}

          {/* ══════════ AI TAB ══════════ */}
          {tab === "ai" && <AIGuideGenerator />}

        </View>
      </ScrollView>
    </View>
  );
}