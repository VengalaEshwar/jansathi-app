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
import { MessageCircle, Send, X } from "lucide-react-native";
import { apiRequest } from "@/integrations/api/client";
import { useTranslation } from "@/hooks/useTranslation";

export const ProfileChatbot = () => {
  const { t, language } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: t.profileChat.welcome,
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
        language,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error: any) {
      Alert.alert(t.common.error, error.message || t.profileChat.sendFailed);
    } finally {
      setLoading(false);
    }
  };

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
              {t.profileChat.title}
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
                    className={
                      m.role === "user" ? "text-white" : "text-foreground"
                    }
                  >
                    {m.content}
                  </Text>
                </View>
              </View>
            ))}

            {loading && (
              <View className="items-start">
                <View className="bg-secondary px-3 py-2 rounded-lg">
                  <ActivityIndicator color="#8B5CF6" />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View className="p-3 border-t border-border flex-row gap-2">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t.profileChat.placeholder}
              placeholderTextColor="#94A3B8"
              className="flex-1 border border-border rounded-lg px-3 py-2 text-foreground"
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              editable={!loading}
            />
            <Pressable
              onPress={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-primary px-3 py-2 rounded-lg items-center justify-center"
              style={{ opacity: !input.trim() || loading ? 0.5 : 1 }}
            >
              <Send size={18} color="white" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};