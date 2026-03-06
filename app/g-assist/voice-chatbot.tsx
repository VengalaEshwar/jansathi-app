import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "@/integrations/supabase/client";
import { VoiceInput, TextToSpeech } from "@/components/VoiceInput";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function VoiceChatbot() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  // Height of your bottom tab bar
  const TAB_BAR_HEIGHT = 70;

  // Auto scroll when messages change
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keyboard animation handling
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("voice-chat", {
        body: {
          message: text,
          conversationHistory: messages,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e: any) {
      alert(e.message || "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1">
        {/* Header */}
        <View className="p-4 border-b border-border">
          <Pressable
            onPress={() => router.replace("/g-assist")}
            className="flex-row items-center mb-2"
          >
            <ArrowLeft size={20} />
            <Text className="ml-2">Back to G-Assist</Text>
          </Pressable>

          <Text className="text-2xl font-bold">Voice Chatbot</Text>
          <Text className="text-muted">
            Talk to our AI assistant in multiple Indian languages
          </Text>
        </View>

        {/* Chat Area */}
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          contentContainerStyle={{
            paddingBottom: 120, // Space for input bar
          }}
        >
          {messages.length === 0 && (
            <View className="p-4 rounded-xl bg-primary mt-4">
              <Text className="text-white font-semibold text-center mb-1">
                नमस्ते! Hello!
              </Text>
              <Text className="text-white/80 text-sm text-center">
                Ask me about government schemes, health services, or any public
                help.
              </Text>
            </View>
          )}

          {messages.map((msg, i) => (
            <View
              key={i}
              className={`p-3 rounded-xl mb-2 max-w-[80%] ${
                msg.role === "user"
                  ? "bg-primary self-end"
                  : "bg-secondary self-start"
              }`}
            >
              <View className="flex-row justify-between items-start gap-2">
                <Text
                  className={`${
                    msg.role === "user" ? "text-white" : "text-foreground"
                  }`}
                >
                  {msg.content}
                </Text>

                {msg.role === "assistant" && (
                  <TextToSpeech text={msg.content} />
                )}
              </View>
            </View>
          ))}

          {isLoading && (
            <View className="p-3 rounded-xl bg-secondary max-w-[80%] flex-row items-center gap-2">
              <ActivityIndicator />
              <Text className="text-sm text-muted">Thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Floating Input Bar */}
        <Animated.View
          className="absolute left-0 right-0 border-t border-border bg-background px-3 py-2"
          style={{
            bottom: Animated.add(
              keyboardHeight,
              new Animated.Value(TAB_BAR_HEIGHT + insets.bottom)
            ),
          }}
        >
          <View className="flex-row items-center gap-2">
            <VoiceInput
              onTranscript={(text) => sendMessage(text)}
              disabled={isLoading}
            />

            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type your message..."
              className="flex-1 border border-border rounded-lg px-3 py-2"
              editable={!isLoading}
            />

            <Pressable
              onPress={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              className="bg-primary p-3 rounded-lg"
            >
              <Send size={18} color="white" />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}
