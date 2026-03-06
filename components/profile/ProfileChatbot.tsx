import { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Send, X } from "lucide-react-native";
import { apiRequest } from "@/integrations/api/client";

export const ProfileChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([
    {
      role: "assistant",
      content:
        "Hello! I can help you with your profile settings. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
    if (!input.trim() || loading) return;
  
    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
  
    try {
      const data = await apiRequest("/chat", "POST", {
        message: userMessage,
        conversationHistory: messages,
      });
  
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error sending message");
    } finally {
      setLoading(false);
    }
  };

  // Floating button
  if (!isOpen) {
    return (
      <Pressable
        onPress={() => setIsOpen(true)}
        className="absolute bottom-24 right-4 w-14 h-14 rounded-full bg-primary items-center justify-center"
      >
        <MessageCircle size={26} color="white" />
      </Pressable>
    );
  }

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-card rounded-t-2xl h-[75%]">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 bg-primary rounded-t-2xl">
            <Text className="text-white font-semibold text-lg">
              Profile Assistant
            </Text>
            <Pressable onPress={() => setIsOpen(false)}>
              <X size={20} color="white" />
            </Pressable>
          </View>

          {/* Messages */}
          <ScrollView className="flex-1 p-4">
            {messages.map((m, i) => (
              <View
                key={i}
                className={`mb-3 ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <View
                  className={`px-3 py-2 rounded-lg max-w-[80%] ${
                    m.role === "user" ? "bg-primary" : "bg-secondary"
                  }`}
                >
                  <Text
                    className={`${
                      m.role === "user" ? "text-white" : "text-foreground"
                    }`}
                  >
                    {m.content}
                  </Text>
                </View>
              </View>
            ))}

            {loading && (
              <View className="items-start">
                <View className="bg-secondary px-3 py-2 rounded-lg">
                  <ActivityIndicator />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View className="p-3 border-t border-border flex-row gap-2">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask about profile settings..."
              className="flex-1 border border-border rounded-lg px-3 py-2"
            />
            <Pressable
              onPress={sendMessage}
              className="bg-primary px-3 py-2 rounded-lg items-center justify-center"
            >
              <Send size={18} color="white" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
