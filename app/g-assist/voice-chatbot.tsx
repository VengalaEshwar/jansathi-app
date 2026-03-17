// app/g-assist/voice-chatbot.tsx
import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  View, Text, ScrollView, Pressable, Animated, ActivityIndicator,
  Platform, TextInput, KeyboardAvoidingView, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Mic, MicOff, Volume2, VolumeX, ArrowLeft, Send, ChevronUp, ChevronDown } from "lucide-react-native";
import * as Speech from "expo-speech";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addMessage, setThinking } from "@/store/slices/chatSlice";
import { HeroSection } from "@/components/HeroSection";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/useToast";
import { useSound } from "@/hooks/useSound";
import { useJanSathi } from "@/hooks/useJanSathi";
import type { Language } from "@/translations";

let ExpoSpeechRecognitionModule: any;
let useSpeechRecognitionEvent: any;
if (Platform.OS !== "web") {
  try {
    const SR = require("expo-speech-recognition");
    ExpoSpeechRecognitionModule = SR.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent   = SR.useSpeechRecognitionEvent;
  } catch {}
}
if (!useSpeechRecognitionEvent) useSpeechRecognitionEvent = (_e: string, _cb: any) => {};

const isNativeVoiceAvailable = !!ExpoSpeechRecognitionModule && Platform.OS !== "web";
const isWebVoiceAvailable    = () => Platform.OS === "web" && typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
const LANG_CODES: Record<string, string> = {
  en: "en-IN", hi: "hi-IN", te: "te-IN", ta: "ta-IN",
  kn: "kn-IN", ml: "ml-IN", mr: "mr-IN", bn: "bn-IN",
  gu: "gu-IN", pa: "pa-IN", ur: "ur-IN", or: "or-IN",
};
// getLangCode only used for speech recognition input lang — TTS always uses en-IN
const getLangCode = (lang: string) => LANG_CODES[lang] ?? "en-IN";

const S = {
  gap6: { gap: 6 } as const, gap8: { gap: 8 } as const, gap10: { gap: 10 } as const,
  mb4: { marginBottom: 4 } as const, mb6: { marginBottom: 6 } as const,
  mb8: { marginBottom: 8 } as const, mb10: { marginBottom: 10 } as const,
  mb12: { marginBottom: 12 } as const, mb16: { marginBottom: 16 } as const,
};

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

const MessageBubble = memo(({ msg, t }: { msg: any; t: any }) => {
  const isUser = msg.role === "user";
  return (
    <View style={[{ maxWidth: "80%" }, S.mb10, isUser ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]}>
      {!isUser && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <Volume2 size={11} color="#8B5CF6" />
          <Text style={{ fontSize: 11, color: "#8B5CF6" }}>{t.chat.botName}</Text>
        </View>
      )}
      <View className={isUser ? "bg-primary" : "bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"}
        style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16,
          borderTopRightRadius: isUser ? 4 : 16, borderTopLeftRadius: isUser ? 16 : 4,
          shadowColor: isUser ? "#8B5CF6" : "#000", shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isUser ? 0.15 : 0.05, shadowRadius: 6, elevation: 2 }}>
        <Text style={{ fontSize: 14, lineHeight: 20, color: isUser ? "white" : undefined }}
          className={isUser ? "" : "text-[#0F172A] dark:text-white"}>
          {msg.content}
        </Text>
      </View>
      <Text style={{ fontSize: 11, color: "#94A3B8", marginTop: 4, paddingHorizontal: 4 }}>
        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </View>
  );
});

export default function VoiceChatbot() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { messages, isThinking } = useAppSelector((s) => s.chat);
  const { t, language } = useTranslation();
  const toast           = useToast();
  const { playClick }   = useSound();
  const { width }       = useWindowDimensions();
  const isWide          = width >= 700;
  const isLarge         = width >= 1100;

  // forceTTS: true — voice chatbot always speaks responses
  const { processCommand } = useJanSathi({ forceTTS: true });

  const scrollRef        = useRef<ScrollView>(null);
  const webRecognitionRef = useRef<any>(null);

  const [isListening,   setIsListening]   = useState(false);
  const [isSpeaking,    setIsSpeaking]    = useState(false);
  const [transcript,    setTranscript]    = useState("");
  const [textInput,     setTextInput]     = useState("");
  const [hasPermission, setHasPermission] = useState(false);
  const [webVoiceSupported] = useState(isWebVoiceAvailable);
  const [showControls,  setShowControls]  = useState(true);

  const voiceAvailable = isNativeVoiceAvailable || webVoiceSupported;
  const headerAnim = useFadeIn(0);
  const bodyAnim   = useFadeIn(120);

  // ── Correct width formula ──────────────────────────────────────────────────
  const containerWidth = isLarge ? 1100 : isWide ? 860 : undefined;
  const sidePad = containerWidth ? Math.max(24, (width - containerWidth) / 2) : 20;

  useSpeechRecognitionEvent("start",  () => setIsListening(true));
  useSpeechRecognitionEvent("end",    () => setIsListening(false));
  useSpeechRecognitionEvent("result", (event: any) => {
    const text = event.results[0]?.transcript || "";
    setTranscript(text);
    if (event.isFinal && text.trim()) handleInput(text.trim());
  });
  useSpeechRecognitionEvent("error", () => setIsListening(false));

  useEffect(() => {
    if (isNativeVoiceAvailable) requestNativePermission(); else setHasPermission(true);
    return () => {
      if (isNativeVoiceAvailable) ExpoSpeechRecognitionModule.abort();
      if (webRecognitionRef.current) webRecognitionRef.current.abort();
      Speech.stop();
    };
  }, []);

  useEffect(() => { setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100); }, [messages]);

  const requestNativePermission = async () => {
    if (!ExpoSpeechRecognitionModule) return;
    try {
      const r = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (r.granted) setHasPermission(true);
      else toast.error(`${t.chat.micPermissionTitle}: ${t.chat.micPermissionDesc}`);
    } catch {}
  };

  const startWebListening = useCallback(() => {
    if (!webVoiceSupported) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = getLangCode(language); recognition.interimResults = true; recognition.continuous = false;
    recognition.onstart  = () => setIsListening(true);
    recognition.onend    = () => { setIsListening(false); setTranscript(""); };
    recognition.onresult = (event: any) => {
      const r = event.results[event.results.length - 1];
      const text = r[0].transcript; setTranscript(text);
      if (r.isFinal && text.trim()) handleInput(text.trim());
    };
    recognition.onerror = () => { setIsListening(false); setTranscript(""); };
    webRecognitionRef.current = recognition; recognition.start();
  }, [language, webVoiceSupported]);

  const stopWebListening = useCallback(() => {
    if (webRecognitionRef.current) { webRecognitionRef.current.stop(); webRecognitionRef.current = null; }
    setIsListening(false); setTranscript("");
  }, []);

  const startListening = useCallback(() => {
    if (isSpeaking || isThinking) return;
    if (Platform.OS === "web") startWebListening();
    else if (isNativeVoiceAvailable) try { ExpoSpeechRecognitionModule.start({ lang: getLangCode(language), interimResults: true, continuous: false }); } catch {}
  }, [isSpeaking, isThinking, language, startWebListening]);

  const stopListening = useCallback(() => {
    if (Platform.OS === "web") stopWebListening();
    else if (isNativeVoiceAvailable) try { ExpoSpeechRecognitionModule.stop(); } catch {}
    setIsListening(false); setTranscript("");
  }, [stopWebListening]);

  const toggleListening = useCallback(() => {
    playClick("soft"); if (isListening) stopListening(); else startListening();
  }, [isListening, startListening, stopListening, playClick]);

  const handleInput = useCallback(async (text: string) => {
    if (!text.trim()) return;
    if (isListening) stopListening();
    setTranscript(""); setTextInput("");

    // Detect script for language hint
    const isHindi  = /[\u0900-\u097F]/.test(text);
    const isTelugu = /[\u0C00-\u0C7F]/.test(text);
    const detectedLang: Language = isHindi ? "hi" : isTelugu ? "te" : language;
    void detectedLang; // used implicitly via useJanSathi language selector

    // Add user message to chat
    dispatch(addMessage({ role: "user", content: text, timestamp: new Date().toISOString() }));
    dispatch(setThinking(true));

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      // processCommand → /voice/command → { message, speakText?, navigateTo? }
      // Speaks via TTS (forceTTS: true) and navigates if a route is returned
      const response = await processCommand(text, history);
      dispatch(addMessage({
        role: "assistant",
        content: response.message,
        timestamp: new Date().toISOString(),
      }));
      // Update isSpeaking state for UI sync
      if (response.speakText) setIsSpeaking(true);
    } catch (e: any) {
      toast.error(e.message || t.chat.responseFailed);
    } finally {
      dispatch(setThinking(false));
    }
  }, [isListening, language, messages, dispatch, stopListening, processCommand, t, toast]);

  // speakText is Roman-script phonetic from backend — en-IN pronounces it correctly
  // e.g. "Namaste! Meeku ela sahayam cheyali?" — any English TTS reads this fine
  const speakResponse = useCallback((text: string) => {
    if (!text?.trim()) return;

    // ── Web ──────────────────────────────────────────────────────────────
    if (Platform.OS === "web") {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      const doSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const utt    = new SpeechSynthesisUtterance(text);
        utt.rate     = 0.9;
        utt.lang     = "en-IN";
        const voice  =
          voices.find((v) => v.lang === "en-IN") ??
          voices.find((v) => v.lang === "en-GB") ??
          voices.find((v) => v.lang.startsWith("en")) ??
          null;
        if (voice) utt.voice = voice;
        utt.onstart = () => setIsSpeaking(true);
        utt.onend   = () => setIsSpeaking(false);
        utt.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utt);
        setIsSpeaking(true);
      };
      if (window.speechSynthesis.getVoices().length > 0) {
        doSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          doSpeak();
          window.speechSynthesis.onvoiceschanged = null;
        };
      }
      return;
    }

    // ── Native — en-IN is pre-installed on all Android/iOS devices ────────
    setIsSpeaking(true);
    Speech.speak(text, {
      language:  "en-IN",
      pitch:     1.0,
      rate:      0.9,
      onDone:    () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError:   () => setIsSpeaking(false),
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    if (Platform.OS === "web") window.speechSynthesis?.cancel(); else Speech.stop();
    setIsSpeaking(false);
  }, []);

  const toggleControls = useCallback(() => { playClick("soft"); setShowControls((prev) => !prev); }, [playClick]);

  const getStatusText = () =>
    isThinking ? t.chat.thinking : isSpeaking ? t.chat.speaking :
    isListening ? (transcript || t.chat.listening) :
    !voiceAvailable ? t.chat.typeMessage :
    Platform.OS === "web" ? t.chat.clickMic : t.chat.tapMic;

  const getStatusColor = () =>
    isThinking ? "#F59E0B" : isSpeaking ? "#10B981" : isListening ? "#8B5CF6" : "#94A3B8";

  const canSend = !!textInput.trim() && !isThinking;

  return (
    <KeyboardAvoidingView className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}>

      {/* ── Header: back only (no HeroSection here — it goes in ScrollView) ── */}
      <Animated.View
        style={[headerAnim, {
          paddingHorizontal: sidePad,  // ← was hardcoded 10, now uses responsive sidePad
          paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1,
        }]}
        className="bg-[#F8FAFC] dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155]">
        {Platform.OS === "web" && <View style={{ height: 8 }} />}
        <AnimatedPressable onPress={() => router.back()} soundType="soft"
          style={[{ flexDirection: "row", alignItems: "center" }, S.gap6, S.mb12]}>
          <ArrowLeft size={18} color="#8B5CF6" />
          <Text className="text-[#8B5CF6] font-semibold text-sm">{t.common.back}</Text>
        </AnimatedPressable>
      </Animated.View>

      {/* ── Messages ── */}
      <Animated.View style={[bodyAnim, { flex: 1 }]}>
        <ScrollView ref={scrollRef}
          contentContainerStyle={{ paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}>

          {/* ── FULL WIDTH: HeroSection ── */}
          <View style={{ paddingHorizontal: sidePad, paddingTop: 16 }}>
            <HeroSection icon={Mic} title={t.chat.title} subtitle={t.chat.speakHint}
              gradientColors={["#6366F1", "#8B5CF6"]} delay={0} badge={language?.toUpperCase()} />
            {Platform.OS === "web" && <View style={{ height: 8 }} />}
          </View>

          {/* ── CENTERED MESSAGES ── */}
          <View style={{
            paddingHorizontal: sidePad,
            ...(containerWidth ? { maxWidth: containerWidth + sidePad * 2, alignSelf: "center" as const, width: "100%" } : {}),
          }}>
            {messages.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#8B5CF610",
                  alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Mic size={28} color="#8B5CF6" />
                </View>
                <Text className="font-bold text-[#0F172A] dark:text-white text-base" style={S.mb6}>{t.chat.botName}</Text>
                <Text className="text-[#64748B] dark:text-[#94A3B8] text-sm text-center" style={{ maxWidth: 260, lineHeight: 20 }}>
                  {t.chat.welcome}
                </Text>
              </View>
            )}
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} t={t} />)}
            {isThinking && (
              <View style={{ alignSelf: "flex-start", marginBottom: 10 }}>
                <View className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]"
                  style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10,
                    borderRadius: 16, borderTopLeftRadius: 4, gap: 8 }}>
                  <ActivityIndicator size="small" color="#8B5CF6" />
                  <Text className="text-[#94A3B8] text-sm">{t.chat.thinking}</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {/* ── Controls ── */}
      <View className="bg-[#F8FAFC] dark:bg-[#0F172A] border-t border-[#E2E8F0] dark:border-[#334155]"
        style={{ paddingHorizontal: sidePad, paddingBottom: showControls ? 28 : 16, paddingTop: 12 }}>
        <View style={containerWidth
          ? { maxWidth: containerWidth + sidePad * 2, alignSelf: "center" as const, width: "100%" }
          : undefined}>

          {/* Collapse toggle */}
          <View style={{ alignItems: "center", marginBottom: showControls ? 10 : 0 }}>
            <AnimatedPressable onPress={toggleControls} soundType="soft"
              className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-full"
              style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8,
                shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
                position: "absolute", top: -28 }}>
              {showControls ? <ChevronDown size={16} color="#8B5CF6" /> : <ChevronUp size={16} color="#8B5CF6" />}
            </AnimatedPressable>
          </View>

          {showControls && (
            <>
              <Text style={{ fontSize: 12, fontWeight: "600", color: getStatusColor(), textAlign: "center", marginBottom: 12 }}>
                {getStatusText()}
              </Text>

              {voiceAvailable && (
                <View style={{ alignItems: "center", marginBottom: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                    {isSpeaking && (
                      <AnimatedPressable onPress={stopSpeaking} soundType="soft"
                        style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center",
                          backgroundColor: "#EF4444", shadowColor: "#EF4444", shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.35, shadowRadius: 10, elevation: 4 }}>
                        <VolumeX size={20} color="white" />
                      </AnimatedPressable>
                    )}
                    <Pressable onPress={toggleListening} disabled={isThinking || isSpeaking || !hasPermission}
                      style={{ width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center",
                        borderWidth: 3,
                        backgroundColor: isListening ? "#8B5CF6" : "white",
                        borderColor: isListening ? "#A78BFA" : "#E2E8F0",
                        opacity: isThinking || isSpeaking || !hasPermission ? 0.5 : 1,
                        shadowColor: isListening ? "#8B5CF6" : "#000",
                        shadowOffset: { width: 0, height: isListening ? 6 : 3 },
                        shadowOpacity: isListening ? 0.4 : 0.08,
                        shadowRadius: isListening ? 14 : 8,
                        elevation: isListening ? 8 : 3 }}
                      className={isListening ? "" : "dark:bg-[#1E293B] dark:border-[#334155]"}>
                      {isListening ? <Mic size={30} color="white" /> : <MicOff size={30} color="#94A3B8" />}
                    </Pressable>
                  </View>
                  <Text style={{ color: "#94A3B8", fontSize: 11, marginTop: 8, textAlign: "center" }}>{t.chat.speakHint}</Text>
                </View>
              )}

              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput value={textInput} onChangeText={setTextInput}
                  placeholder={t.chat.typeMessage} placeholderTextColor="#94A3B8"
                  returnKeyType="send"
                  onSubmitEditing={() => { if (canSend) { playClick("mechanical"); handleInput(textInput); } }}
                  editable={!isThinking}
                  className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-white text-sm"
                  style={{ flex: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 }} />
                <AnimatedPressable onPress={() => { if (canSend) handleInput(textInput); }} disabled={!canSend} soundType="mechanical"
                  style={{ width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center",
                    backgroundColor: canSend ? "#8B5CF6" : "#E2E8F0", opacity: canSend ? 1 : 0.6,
                    ...(canSend ? { shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4 } : {}) }}
                  className={canSend ? "" : "dark:bg-[#334155]"}>
                  <Send size={18} color={canSend ? "white" : "#94A3B8"} />
                </AnimatedPressable>
              </View>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}