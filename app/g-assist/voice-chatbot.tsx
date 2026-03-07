import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Volume2,
  Send,
  VolumeX,
} from "lucide-react-native";
import * as Speech from "expo-speech";
import { apiRequest } from "@/integrations/api/client";

// Native speech recognition
let ExpoSpeechRecognitionModule: any;
let useSpeechRecognitionEvent: any;

if (Platform.OS !== "web") {
  try {
    const SpeechRecog = require("expo-speech-recognition");
    ExpoSpeechRecognitionModule = SpeechRecog.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = SpeechRecog.useSpeechRecognitionEvent;
  } catch (e) {
    console.log("Speech recognition not available");
  }
}

if (!useSpeechRecognitionEvent) {
  useSpeechRecognitionEvent = (_event: string, _cb: any) => {};
}

const isNativeVoiceAvailable =
  !!ExpoSpeechRecognitionModule && Platform.OS !== "web";

// Check web speech API availability
const isWebVoiceAvailable = () => {
  if (Platform.OS !== "web") return false;
  return (
    typeof window !== "undefined" &&
    !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    )
  );
};

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function VoiceChatbot() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const webRecognitionRef = useRef<any>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "नमस्ते! Hello! I am JanSathi AI. How can I help you today? आप हिंदी या English में बात कर सकते हैं।",
      timestamp: new Date(),
    },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [hasPermission, setHasPermission] = useState(false);
  const [webVoiceSupported] = useState(isWebVoiceAvailable);

  const voiceAvailable = isNativeVoiceAvailable || webVoiceSupported;

  // Native speech recognition events
  useSpeechRecognitionEvent("start", () => setIsListening(true));
  useSpeechRecognitionEvent("end", () => setIsListening(false));
  useSpeechRecognitionEvent("result", (event: any) => {
    const text = event.results[0]?.transcript || "";
    setTranscript(text);
    if (event.isFinal && text.trim()) {
      handleInput(text.trim());
    }
  });
  useSpeechRecognitionEvent("error", (event: any) => {
    console.log("Speech error:", event.error);
    setIsListening(false);
    if (event.error !== "aborted") {
      setTimeout(() => startListening(), 1000);
    }
  });

  useEffect(() => {
    if (isNativeVoiceAvailable) {
      requestNativePermission();
    } else {
      // On web or Expo Go, no permission needed
      setHasPermission(true);
    }
    return () => {
      if (isNativeVoiceAvailable) ExpoSpeechRecognitionModule.abort();
      if (webRecognitionRef.current) webRecognitionRef.current.abort();
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      100
    );
  }, [messages]);

  const requestNativePermission = async () => {
    if (!ExpoSpeechRecognitionModule) return;
    try {
      const result =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (result.granted) {
        setHasPermission(true);
        setTimeout(() => startListening(), 500);
      } else {
        Alert.alert(
          "Microphone Permission",
          "Please allow microphone access to use voice chat."
        );
      }
    } catch (e) {
      console.log("Permission error:", e);
    }
  };

  // ─── Web Speech API ───────────────────────────────────────────
  const startWebListening = () => {
    if (!webVoiceSupported) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      setTranscript("");
    };
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      setTranscript(text);
      if (result.isFinal && text.trim()) {
        handleInput(text.trim());
      }
    };
    recognition.onerror = (event: any) => {
      console.log("Web speech error:", event.error);
      setIsListening(false);
      setTranscript("");
    };

    webRecognitionRef.current = recognition;
    recognition.start();
  };

  const stopWebListening = () => {
    if (webRecognitionRef.current) {
      webRecognitionRef.current.stop();
      webRecognitionRef.current = null;
    }
    setIsListening(false);
    setTranscript("");
  };

  // ─── Unified controls ─────────────────────────────────────────
  const startListening = () => {
    if (isSpeaking || isThinking) return;
    if (Platform.OS === "web") {
      startWebListening();
    } else if (isNativeVoiceAvailable) {
      ExpoSpeechRecognitionModule.start({
        lang: language === "hi" ? "hi-IN" : "en-IN",
        interimResults: true,
        continuous: false,
      }).catch((e: any) => console.log("Start error:", e));
    }
  };

  const stopListening = () => {
    if (Platform.OS === "web") {
      stopWebListening();
    } else if (isNativeVoiceAvailable) {
      ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
      setTranscript("");
    }
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const toggleLanguage = () => {
    const newLang = language === "en" ? "hi" : "en";
    setLanguage(newLang);
    if (isListening) {
      stopListening();
      setTimeout(() => startListening(), 300);
    }
  };

  // ─── Handle message input ─────────────────────────────────────
  const handleInput = async (text: string) => {
    if (!text.trim()) return;
    if (isListening) stopListening();
    setTranscript("");
    setTextInput("");

    const isHindi = /[\u0900-\u097F]/.test(text);
    const detectedLang = isHindi ? "hi" : language;

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const data = await apiRequest("/chat", "POST", {
        message: text,
        conversationHistory: history,
        language: detectedLang,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      speakResponse(data.reply, detectedLang);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to get response");
    } finally {
      setIsThinking(false);
    }
  };

  const speakResponse = (text: string, lang: "en" | "hi") => {
    // Web TTS using browser API
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
        utterance.rate = 0.9;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
      return;
    }

    // Native TTS
    setIsSpeaking(true);
    Speech.speak(text, {
      language: lang === "hi" ? "hi-IN" : "en-IN",
      pitch: 1.0,
      rate: 0.9,
      onDone: () => {
        setIsSpeaking(false);
        if (isNativeVoiceAvailable) setTimeout(() => startListening(), 500);
      },
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const stopSpeaking = () => {
    if (Platform.OS === "web") {
      window.speechSynthesis?.cancel();
    } else {
      Speech.stop();
    }
    setIsSpeaking(false);
  };

  // ─── UI helpers ───────────────────────────────────────────────
  const getStatusText = () => {
    if (isThinking) return "Thinking...";
    if (isSpeaking) return "Speaking...";
    if (isListening) return transcript || "Listening...";
    if (!voiceAvailable) return "Type your message below";
    if (Platform.OS === "web") return "Click mic to speak";
    return "Tap mic to speak";
  };

  const getStatusColor = () => {
    if (isThinking) return "#F59E0B";
    if (isSpeaking) return "#10B981";
    if (isListening) return "#8B5CF6";
    return "#64748B";
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <ArrowLeft size={20} color="#6b7280" />
          <Text className="ml-2 text-muted">Back</Text>
        </Pressable>

        <Text className="text-foreground font-bold text-lg">
          AI Assistant
        </Text>

        <Pressable
          onPress={toggleLanguage}
          className="px-3 py-1 rounded-full bg-primary"
        >
          <Text className="text-white text-sm font-semibold">
            {language === "en" ? "EN" : "HI"}
          </Text>
        </Pressable>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 20 }}
      >
        {messages.map((msg, i) => (
          <View
            key={i}
            className={`mb-3 max-w-[80%] ${
              msg.role === "user" ? "self-end" : "self-start"
            }`}
          >
            {msg.role === "assistant" && (
              <View className="flex-row items-center mb-1">
                <Volume2 size={12} color="#8B5CF6" />
                <Text className="text-xs text-primary ml-1">JanSathi AI</Text>
              </View>
            )}
            <View
              className={`px-4 py-3 rounded-2xl ${
                msg.role === "user"
                  ? "bg-primary rounded-tr-sm"
                  : "bg-card border border-border rounded-tl-sm"
              }`}
            >
              <Text
                className={`text-sm leading-5 ${
                  msg.role === "user" ? "text-white" : "text-foreground"
                }`}
              >
                {msg.content}
              </Text>
            </View>
            <Text className="text-xs text-muted mt-1 px-1">
              {msg.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        ))}

        {isThinking && (
          <View className="self-start mb-3">
            <View className="px-4 py-3 rounded-2xl bg-card border border-border rounded-tl-sm flex-row items-center">
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text className="text-muted text-sm ml-2">Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Controls */}
      <View className="px-4 pb-6 pt-3 border-t border-border bg-background">
        {/* Status */}
        <Text
          style={{ color: getStatusColor() }}
          className="text-xs mb-3 font-medium text-center"
        >
          {getStatusText()}
        </Text>

        {/* Mic button — shown when voice available */}
        {voiceAvailable && (
          <View className="items-center mb-4">
            <View className="flex-row items-center gap-4">
              {isSpeaking && (
                <Pressable
                  onPress={stopSpeaking}
                  className="w-12 h-12 rounded-full bg-red-500 items-center justify-center"
                >
                  <VolumeX size={20} color="white" />
                </Pressable>
              )}
              <Pressable
                onPress={toggleListening}
                disabled={isThinking || isSpeaking || !hasPermission}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: isListening ? "#8B5CF6" : "#1E293B",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 3,
                  borderColor: isListening ? "#A78BFA" : "#334155",
                  opacity: isThinking || isSpeaking ? 0.5 : 1,
                }}
              >
                {isListening ? (
                  <Mic size={28} color="white" />
                ) : (
                  <MicOff size={28} color="#64748B" />
                )}
              </Pressable>
            </View>
            <Text className="text-muted text-xs mt-2 text-center">
              {language === "en"
                ? "Speak in English or Hindi"
                : "हिंदी या English में बोलें"}
            </Text>
          </View>
        )}

        {/* Text Input — always visible */}
        <View className="flex-row items-center gap-2">
          <TextInput
            value={textInput}
            onChangeText={setTextInput}
            placeholder={
              language === "hi" ? "अपना सवाल लिखें..." : "Type your message..."
            }
            placeholderTextColor="#94A3B8"
            className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-foreground text-sm"
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={() => handleInput(textInput)}
            editable={!isThinking}
          />
          <Pressable
            onPress={() => handleInput(textInput)}
            disabled={!textInput.trim() || isThinking}
            className="w-12 h-12 rounded-xl bg-primary items-center justify-center"
            style={{ opacity: !textInput.trim() || isThinking ? 0.5 : 1 }}
          >
            <Send size={18} color="white" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}