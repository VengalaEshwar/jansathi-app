import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Mic, MicOff, Volume2 } from "lucide-react-native";
import * as Speech from "expo-speech";
import { apiRequest } from "@/integrations/api/client";

// Only import on native after build
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

// Fallback no-op hook for web/Expo Go
if (!useSpeechRecognitionEvent) {
  useSpeechRecognitionEvent = (_event: string, _cb: any) => {};
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function VoiceChatbot() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

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
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [hasPermission, setHasPermission] = useState(false);

  // Speech recognition events
  useSpeechRecognitionEvent("start", () => setIsListening(true));
  useSpeechRecognitionEvent("end", () => setIsListening(false));

  useSpeechRecognitionEvent("result", (event: any) => {
    const text = event.results[0]?.transcript || "";
    setTranscript(text);
    if (event.isFinal && text.trim()) {
      handleVoiceInput(text.trim());
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
    if (Platform.OS !== "web" && ExpoSpeechRecognitionModule) {
      requestPermission();
    }
    return () => {
      if (Platform.OS !== "web" && ExpoSpeechRecognitionModule) {
        ExpoSpeechRecognitionModule.abort();
      }
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const requestPermission = async () => {
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
          "Please allow microphone access to use voice chat.",
          [{ text: "OK" }]
        );
      }
    } catch (e) {
      console.log("Permission error:", e);
    }
  };

  const startListening = async () => {
    if (isSpeaking || isThinking || !ExpoSpeechRecognitionModule) return;
    try {
      await ExpoSpeechRecognitionModule.start({
        lang: language === "hi" ? "hi-IN" : "en-IN",
        interimResults: true,
        continuous: false,
      });
    } catch (e) {
      console.log("Start listening error:", e);
    }
  };

  const stopListening = () => {
    if (!ExpoSpeechRecognitionModule) return;
    ExpoSpeechRecognitionModule.stop();
    setIsListening(false);
    setTranscript("");
  };

  const handleVoiceInput = async (text: string) => {
    stopListening();
    setTranscript("");

    const isHindi = /[\u0900-\u097F]/.test(text);
    const detectedLang = isHindi ? "hi" : "en";

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
      setTimeout(() => startListening(), 500);
    } finally {
      setIsThinking(false);
    }
  };

  const speakResponse = (text: string, lang: "en" | "hi") => {
    setIsSpeaking(true);
    Speech.speak(text, {
      language: lang === "hi" ? "hi-IN" : "en-IN",
      pitch: 1.0,
      rate: 0.9,
      onDone: () => {
        setIsSpeaking(false);
        setTimeout(() => startListening(), 500);
      },
      onStopped: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        setTimeout(() => startListening(), 500);
      },
    });
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleLanguage = () => {
    const newLang = language === "en" ? "hi" : "en";
    setLanguage(newLang);
    if (isListening) {
      stopListening();
      setTimeout(() => startListening(), 300);
    }
  };

  const getStatusText = () => {
    if (Platform.OS === "web") return "Voice chat available on mobile only";
    if (!ExpoSpeechRecognitionModule) return "Rebuild app to enable voice";
    if (isThinking) return "Thinking...";
    if (isSpeaking) return "Speaking...";
    if (isListening) return transcript || "Listening...";
    return "Tap mic to start";
  };

  const getStatusColor = () => {
    if (isThinking) return "#F59E0B";
    if (isSpeaking) return "#10B981";
    if (isListening) return "#8B5CF6";
    return "#64748B";
  };

  return (
    <View className="flex-1 bg-background">
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
          Voice Assistant
        </Text>

        {/* Language Toggle */}
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
        contentContainerStyle={{ paddingVertical: 12 }}
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

      {/* Voice Control */}
      <View className="px-4 pb-8 pt-4 items-center border-t border-border">
        <Text
          style={{ color: getStatusColor() }}
          className="text-sm mb-4 font-medium"
        >
          {getStatusText()}
        </Text>

        {/* Mic Button */}
        <Pressable
          onPress={toggleListening}
          disabled={
            isThinking ||
            isSpeaking ||
            (!hasPermission && Platform.OS !== "web")
          }
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: isListening ? "#8B5CF6" : "#1E293B",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 3,
            borderColor: isListening ? "#A78BFA" : "#334155",
            opacity:
              isThinking || isSpeaking || Platform.OS === "web" ? 0.5 : 1,
          }}
        >
          {isListening ? (
            <Mic size={32} color="white" />
          ) : (
            <MicOff size={32} color="#64748B" />
          )}
        </Pressable>

        <Text className="text-muted text-xs mt-3 text-center">
          {Platform.OS === "web"
            ? "Voice chat requires mobile app"
            : language === "en"
            ? "Speak in English or Hindi"
            : "हिंदी या English में बोलें"}
        </Text>
      </View>
    </View>
  );
}