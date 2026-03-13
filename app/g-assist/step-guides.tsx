import { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, Pressable, Animated,
  TextInput, ActivityIndicator, useWindowDimensions,
} from "react-native";
import {
  BookOpen, Sparkles, ChevronDown, ChevronUp,
  ChevronRight, Search, X, CreditCard, FileText,
  Users, Home, Car, Briefcase, Heart, GraduationCap,
  CheckCircle, Clock, AlertCircle, ArrowRight,
} from "lucide-react-native";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab     = "guides" | "ai";
type Category = "identity" | "health" | "education" | "property" | "business" | "welfare";

interface Step {
  number: number;
  title: string;
  description: string;
  tip?: string;
  duration?: string;
}

interface Guide {
  id: string;
  title: string;
  category: Category;
  description: string;
  totalTime: string;
  difficulty: "Easy" | "Medium" | "Hard";
  steps: Step[];
  requirements: string[];
}

// ─── Static guide data ────────────────────────────────────────────────────────
const GUIDES: Guide[] = [
  {
    id: "aadhaar",
    title: "Aadhaar Card Enrollment",
    category: "identity",
    description: "Register for your Aadhaar card at a nearby enrollment centre.",
    totalTime: "1–2 hours",
    difficulty: "Easy",
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
    id: "pan",
    title: "PAN Card Application",
    category: "identity",
    description: "Apply for a Permanent Account Number (PAN) card online via NSDL or UTIITSL.",
    totalTime: "15–30 min online + 15 days delivery",
    difficulty: "Medium",
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
    id: "ration",
    title: "Ration Card Application",
    category: "welfare",
    description: "Apply for a new ration card to access subsidised food grains under the National Food Security Act.",
    totalTime: "30 min application + 30 days processing",
    difficulty: "Medium",
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
    id: "voter-id",
    title: "Voter ID (EPIC) Registration",
    category: "identity",
    description: "Register as a voter and obtain your Elector Photo Identity Card (EPIC).",
    totalTime: "20 min online + 30 days processing",
    difficulty: "Easy",
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
    id: "driving-licence",
    title: "Driving Licence Application",
    category: "identity",
    description: "Apply for a learner's licence and then a permanent driving licence through Parivahan Sewa.",
    totalTime: "2–4 weeks",
    difficulty: "Medium",
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
    id: "pm-kisan",
    title: "PM-KISAN Registration",
    category: "welfare",
    description: "Register for the PM Kisan Samman Nidhi scheme — ₹6,000/year directly to farmers' bank accounts.",
    totalTime: "30 min",
    difficulty: "Easy",
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
  identity:  { label: "Identity",  icon: CreditCard,    color: "#3B82F6" },
  health:    { label: "Health",    icon: Heart,          color: "#EF4444" },
  education: { label: "Education", icon: GraduationCap,  color: "#8B5CF6" },
  property:  { label: "Property",  icon: Home,           color: "#F59E0B" },
  business:  { label: "Business",  icon: Briefcase,      color: "#10B981" },
  welfare:   { label: "Welfare",   icon: Users,          color: "#EC4899" },
};

const DIFF_COLOR = { Easy: "#10B981", Medium: "#F59E0B", Hard: "#EF4444" };

// ─── Hooks ────────────────────────────────────────────────────────────────────
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

// ─── Guide card (collapsed) ───────────────────────────────────────────────────
const GuideCard = ({ guide, index, onOpen }: { guide: Guide; index: number; onOpen: () => void }) => {
  const anim = useFadeSlideIn(index * 70);
  const scale = useRef(new Animated.Value(1)).current;
  const cfg   = CATEGORY_CONFIG[guide.category];
  const IconComp = cfg.icon;

  return (
    <Animated.View style={[anim, { marginBottom: 12 }]}>
      <Pressable
        onPress={onOpen}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 22, bounciness: 8 }).start()}
        className="rounded-2xl p-4 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 }}
      >
        <View className="flex-row items-start gap-3">
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: cfg.color + "18", borderWidth: 1, borderColor: cfg.color + "30", alignItems: "center", justifyContent: "center" }}>
            <IconComp size={22} color={cfg.color} />
          </View>
          <View className="flex-1">
            <Text className="text-[#0F172A] dark:text-white font-bold text-sm mb-1">{guide.title}</Text>
            <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs leading-4 mb-2">{guide.description}</Text>
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-1">
                <Clock size={11} color="#94A3B8" />
                <Text style={{ color: "#94A3B8", fontSize: 11 }}>{guide.totalTime}</Text>
              </View>
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20, backgroundColor: DIFF_COLOR[guide.difficulty] + "20" }}>
                <Text style={{ color: DIFF_COLOR[guide.difficulty], fontSize: 10, fontWeight: "700" }}>{guide.difficulty}</Text>
              </View>
              <Text style={{ color: "#94A3B8", fontSize: 11 }}>{guide.steps.length} steps</Text>
            </View>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ─── Guide detail (full steps) ────────────────────────────────────────────────
const GuideDetail = ({ guide, onClose }: { guide: Guide; onClose: () => void }) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const cfg = CATEGORY_CONFIG[guide.category];
  const IconComp = cfg.icon;

  const toggleStep = (n: number) =>
    setCompletedSteps((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n]);

  return (
    <View>
      {/* Back button */}
      <Pressable onPress={onClose} className="flex-row items-center gap-2 mb-4">
        <ChevronDown size={16} color="#8B5CF6" style={{ transform: [{ rotate: "90deg" }] }} />
        <Text style={{ color: "#8B5CF6", fontWeight: "600", fontSize: 14 }}>Back to Guides</Text>
      </Pressable>

      {/* Hero */}
      <View className="rounded-3xl p-5 mb-5 overflow-hidden"
        style={{ backgroundColor: cfg.color, shadowColor: cfg.color, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 14, elevation: 6 }}>
        <View style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.08)" }} />
        <View className="flex-row items-center gap-3 mb-3">
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
            <IconComp size={22} color="white" />
          </View>
          <View className="flex-1">
            <Text style={{ color: "white", fontWeight: "800", fontSize: 17, letterSpacing: -0.3 }}>{guide.title}</Text>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>{guide.description}</Text>
          </View>
        </View>
        <View className="flex-row gap-4">
          <View className="flex-row items-center gap-1.5">
            <Clock size={13} color="rgba(255,255,255,0.8)" />
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{guide.totalTime}</Text>
          </View>
          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.25)" }}>
            <Text style={{ color: "white", fontSize: 11, fontWeight: "700" }}>{guide.difficulty}</Text>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
            {completedSteps.length}/{guide.steps.length} done
          </Text>
        </View>
      </View>

      {/* Requirements */}
      <View className="rounded-2xl p-4 mb-5 bg-[#FFF7ED] border border-[#FED7AA]">
        <View className="flex-row items-center gap-2 mb-2">
          <AlertCircle size={15} color="#F59E0B" />
          <Text style={{ color: "#92400E", fontWeight: "700", fontSize: 13 }}>What You Need</Text>
        </View>
        {guide.requirements.map((r, i) => (
          <View key={i} className="flex-row items-start gap-2 mb-1">
            <Text style={{ color: "#F59E0B", fontSize: 14, lineHeight: 20 }}>•</Text>
            <Text style={{ color: "#78350F", fontSize: 13, lineHeight: 20, flex: 1 }}>{r}</Text>
          </View>
        ))}
      </View>

      {/* Steps */}
      <Text className="text-xs font-semibold uppercase tracking-widest text-[#8B5CF6] mb-3 ml-1">Steps</Text>
      {guide.steps.map((step) => {
        const done = completedSteps.includes(step.number);
        return (
          <Pressable key={step.number} onPress={() => toggleStep(step.number)}
            className="mb-3 rounded-2xl overflow-hidden border"
            style={{ borderColor: done ? "#BBF7D0" : "#E2E8F0", backgroundColor: done ? "#F0FDF4" : "white" }}>
            <View className="p-4 flex-row gap-3">
              {/* Step number / check */}
              <Pressable onPress={() => toggleStep(step.number)}
                style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center",
                  backgroundColor: done ? "#10B981" : cfg.color, marginTop: 1 }}>
                {done
                  ? <CheckCircle size={18} color="white" />
                  : <Text style={{ color: "white", fontWeight: "800", fontSize: 13 }}>{step.number}</Text>
                }
              </Pressable>
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text style={{ fontWeight: "700", fontSize: 14, color: done ? "#065F46" : "#0F172A", flex: 1 }}>{step.title}</Text>
                  {step.duration && (
                    <View className="flex-row items-center gap-1 ml-2">
                      <Clock size={10} color="#94A3B8" />
                      <Text style={{ color: "#94A3B8", fontSize: 10 }}>{step.duration}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 13, color: done ? "#374151" : "#64748B", lineHeight: 19 }}>{step.description}</Text>
                {step.tip && (
                  <View className="mt-2 flex-row items-start gap-1.5 p-2.5 rounded-lg" style={{ backgroundColor: cfg.color + "12" }}>
                    <Text style={{ color: cfg.color, fontSize: 13 }}>💡</Text>
                    <Text style={{ color: cfg.color, fontSize: 12, fontWeight: "500", flex: 1, lineHeight: 17 }}>{step.tip}</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        );
      })}

      {/* Completion banner */}
      {completedSteps.length === guide.steps.length && (
        <View className="mt-2 p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] items-center">
          <Text style={{ fontSize: 24, marginBottom: 6 }}>🎉</Text>
          <Text style={{ color: "#065F46", fontWeight: "800", fontSize: 15 }}>All Steps Completed!</Text>
          <Text style={{ color: "#374151", fontSize: 13, marginTop: 4, textAlign: "center" }}>
            You've completed all steps for {guide.title}.
          </Text>
        </View>
      )}
    </View>
  );
};

// ─── AI Guide Generator ───────────────────────────────────────────────────────
const AIGuideGenerator = () => {
  const [query,   setQuery]   = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<any>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const anim = useFadeSlideIn(0);

  const SUGGESTIONS = [
    "How to apply for a birth certificate",
    "How to open a Jan Dhan bank account",
    "Steps to apply for old age pension",
    "How to register a small business (Udyam)",
    "Procedure for passport application",
    "How to apply for caste certificate",
  ];

  const generate = async (q: string) => {
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
{
  "title": "procedure name",
  "description": "1 sentence description",
  "totalTime": "estimated time",
  "difficulty": "Easy" | "Medium" | "Hard",
  "requirements": ["item1", "item2"],
  "steps": [
    { "number": 1, "title": "step title", "description": "what to do", "tip": "optional helpful tip", "duration": "time estimate" }
  ],
  "helpline": "relevant helpline number if any",
  "website": "official website URL if any"
}
Keep language very simple. Max 8 steps. Return ONLY the JSON.`,
          messages: [{ role: "user", content: question }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find((b: any) => b.type === "text")?.text ?? "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setResult(parsed);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (n: number) =>
    setCompletedSteps((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n]);

  return (
    <Animated.View style={anim}>
      {/* Input */}
      <View className="rounded-2xl p-4 mb-4 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
        <View className="flex-row items-center gap-2 mb-1">
          <Sparkles size={16} color="#8B5CF6" />
          <Text className="text-[#0F172A] dark:text-white font-semibold">Ask about any government procedure</Text>
        </View>
        <Text className="text-[#64748B] dark:text-[#94A3B8] text-xs mb-3">
          Type a procedure name and AI will generate step-by-step instructions
        </Text>

        <View className="flex-row gap-2 mb-3">
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => generate(query)}
            placeholder="e.g. How to get a birth certificate..."
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
            className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-4 py-3 text-[#0F172A] dark:text-white text-sm"
          />
          <Pressable onPress={() => generate(query)} disabled={!query.trim() || loading}
            className="bg-primary px-4 rounded-xl items-center justify-center">
            {loading ? <ActivityIndicator color="white" size="small" /> : <ArrowRight size={18} color="white" />}
          </Pressable>
        </View>

        {/* Suggestions */}
        <Text style={{ color: "#94A3B8", fontSize: 11, marginBottom: 8 }}>Try asking:</Text>
        <View className="flex-row flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} onPress={() => { setQuery(s); generate(s); }}
              className="px-3 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-primary/5">
              <Text style={{ color: "#8B5CF6", fontSize: 11, fontWeight: "500" }}>{s}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* AI Result */}
      {result && (
        <View>
          {/* Hero */}
          <View className="rounded-2xl p-4 mb-4 bg-primary"
            style={{ shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 6 }}>
            <Text style={{ color: "white", fontWeight: "800", fontSize: 16, marginBottom: 4 }}>{result.title}</Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 10 }}>{result.description}</Text>
            <View className="flex-row gap-4">
              <View className="flex-row items-center gap-1.5">
                <Clock size={12} color="rgba(255,255,255,0.7)" />
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{result.totalTime}</Text>
              </View>
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)" }}>
                <Text style={{ color: "white", fontSize: 11, fontWeight: "700" }}>{result.difficulty}</Text>
              </View>
            </View>
          </View>

          {/* Requirements */}
          {result.requirements?.length > 0 && (
            <View className="rounded-2xl p-4 mb-4 bg-[#FFF7ED] border border-[#FED7AA]">
              <View className="flex-row items-center gap-2 mb-2">
                <AlertCircle size={14} color="#F59E0B" />
                <Text style={{ color: "#92400E", fontWeight: "700", fontSize: 13 }}>What You Need</Text>
              </View>
              {result.requirements.map((r: string, i: number) => (
                <View key={i} className="flex-row items-start gap-2 mb-1">
                  <Text style={{ color: "#F59E0B", fontSize: 14 }}>•</Text>
                  <Text style={{ color: "#78350F", fontSize: 13, lineHeight: 19, flex: 1 }}>{r}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Steps */}
          {result.steps?.map((step: any) => {
            const done = completedSteps.includes(step.number);
            return (
              <Pressable key={step.number} onPress={() => toggleStep(step.number)}
                className="mb-3 rounded-2xl border p-4 flex-row gap-3"
                style={{ borderColor: done ? "#BBF7D0" : "#E2E8F0", backgroundColor: done ? "#F0FDF4" : "white" }}>
                <Pressable onPress={() => toggleStep(step.number)}
                  style={{ width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center",
                    backgroundColor: done ? "#10B981" : "#8B5CF6", marginTop: 1 }}>
                  {done
                    ? <CheckCircle size={16} color="white" />
                    : <Text style={{ color: "white", fontWeight: "800", fontSize: 12 }}>{step.number}</Text>
                  }
                </Pressable>
                <View className="flex-1">
                  <Text style={{ fontWeight: "700", fontSize: 13, color: done ? "#065F46" : "#0F172A", marginBottom: 4 }}>{step.title}</Text>
                  <Text style={{ fontSize: 13, color: "#64748B", lineHeight: 18 }}>{step.description}</Text>
                  {step.tip && (
                    <View className="mt-2 p-2.5 rounded-lg bg-primary/8 flex-row gap-1.5 items-start">
                      <Text style={{ fontSize: 12 }}>💡</Text>
                      <Text style={{ color: "#8B5CF6", fontSize: 12, flex: 1, lineHeight: 16 }}>{step.tip}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}

          {/* Helpline / website */}
          {(result.helpline || result.website) && (
            <View className="rounded-2xl p-4 bg-[#EFF6FF] border border-[#BFDBFE]">
              <Text style={{ color: "#1E40AF", fontWeight: "700", fontSize: 13, marginBottom: 6 }}>Useful Resources</Text>
              {result.helpline && <Text style={{ color: "#1D4ED8", fontSize: 13, marginBottom: 2 }}>📞 Helpline: {result.helpline}</Text>}
              {result.website  && <Text style={{ color: "#1D4ED8", fontSize: 13 }}>🌐 {result.website}</Text>}
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function StepGuides() {
  const [tab,          setTab]          = useState<Tab>("guides");
  const [search,       setSearch]       = useState("");
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const { width } = useWindowDimensions();
  const isWide = width >= 640;

  const headerAnim = useFadeSlideIn(0);
  const tabAnim    = useFadeSlideIn(80);

  const filtered = GUIDES.filter((g) =>
    search === "" ||
    g.title.toLowerCase().includes(search.toLowerCase()) ||
    g.description.toLowerCase().includes(search.toLowerCase())
  );

  // 2-col grid on wide
  const pairs: Guide[][] = [];
  for (let i = 0; i < filtered.length; i += 2) pairs.push(filtered.slice(i, i + 2));

  return (
    <ScrollView
      className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]"
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View style={headerAnim} className="flex-row items-center gap-3 mb-6">
        <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center"
          style={{ shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 }}>
          <BookOpen size={22} color="white" />
        </View>
        <View>
          <Text className="text-2xl font-bold text-[#0F172A] dark:text-white" style={{ letterSpacing: -0.4 }}>
            Step-by-Step Guides
          </Text>
          <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm">
            Visual guides for government procedures
          </Text>
        </View>
      </Animated.View>

      {/* Tabs */}
      <Animated.View style={tabAnim}
        className="flex-row bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-1 mb-5"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
        <TabButton label="Guides"    icon={BookOpen}  active={tab === "guides"} onPress={() => { setTab("guides"); setSelectedGuide(null); }} />
        <TabButton label="Ask AI"    icon={Sparkles}  active={tab === "ai"}     onPress={() => setTab("ai")} />
      </Animated.View>

      {tab === "guides" && (
        selectedGuide ? (
          <GuideDetail guide={selectedGuide} onClose={() => setSelectedGuide(null)} />
        ) : (
          <>
            {/* Search */}
            <View className="flex-row items-center gap-2 mb-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] px-3 py-2.5">
              <Search size={16} color="#94A3B8" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search guides..."
                placeholderTextColor="#94A3B8"
                className="flex-1 text-[#0F172A] dark:text-white text-sm"
              />
              {search ? <Pressable onPress={() => setSearch("")}><X size={14} color="#94A3B8" /></Pressable> : null}
            </View>

            {/* Grid */}
            {isWide ? (
              pairs.map((pair, ri) => (
                <View key={ri} style={{ flexDirection: "row", gap: 14, marginBottom: 0 }}>
                  {pair.map((g, gi) => (
                    <View key={g.id} style={{ flex: 1 }}>
                      <GuideCard guide={g} index={ri * 2 + gi} onOpen={() => setSelectedGuide(g)} />
                    </View>
                  ))}
                  {pair.length === 1 && <View style={{ flex: 1 }} />}
                </View>
              ))
            ) : (
              filtered.map((g, i) => (
                <GuideCard key={g.id} guide={g} index={i} onOpen={() => setSelectedGuide(g)} />
              ))
            )}

            {filtered.length === 0 && (
              <View className="items-center py-12">
                <Text className="text-[#94A3B8] text-sm">No guides found for "{search}"</Text>
              </View>
            )}
          </>
        )
      )}

      {tab === "ai" && <AIGuideGenerator />}
    </ScrollView>
  );
}