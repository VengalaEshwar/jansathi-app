// components/DraggableChatbot.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, Pressable, Modal, ScrollView,
  TextInput, ActivityIndicator, Animated,
  PanResponder, useWindowDimensions, Platform,
} from "react-native";
import { MessageCircle, Send, X } from "lucide-react-native";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useAppSelector } from "@/store/hooks";

const BUTTON_SIZE  = 56;
const EDGE_PADDING = 8;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

type Message = { role: "user" | "assistant"; content: string };

interface DraggableChatbotProps {
  title: string;
  welcomeMessage: string;
  placeholder: string;
  sendFailedMessage: string;
  onSendMessage: (message: string, history: Message[]) => Promise<string>;
}

export function DraggableChatbot({
  title, welcomeMessage, placeholder, sendFailedMessage, onSendMessage,
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const theme  = useAppSelector((s: any) => s.app?.theme ?? "dark");
  const isDark = theme === "dark";

  // ── Theme-aware colors ──────────────────────────────────────────────────────
  const bg        = isDark ? "#0F172A" : "#F8FAFC";
  const cardBg    = isDark ? "#1E293B" : "white";
  const border    = isDark ? "#334155" : "#E2E8F0";
  const textPri   = isDark ? "#F1F5F9" : "#0F172A";
  const textMuted = isDark ? "#94A3B8" : "#64748B";
  const bubbleBg  = isDark ? "#334155" : "#F1F5F9"; // assistant bubble

  const [isOpen,   setIsOpen]   = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: welcomeMessage },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  const position = useRef(new Animated.ValueXY({
    x: screenWidth - BUTTON_SIZE - 16,
    y: screenHeight - BUTTON_SIZE - 96,
  })).current;

  const currentPos = useRef({
    x: screenWidth - BUTTON_SIZE - 16,
    y: screenHeight - BUTTON_SIZE - 96,
  });

  const dimsRef = useRef({ width: screenWidth, height: screenHeight });
  useEffect(() => { dimsRef.current = { width: screenWidth, height: screenHeight }; }, [screenWidth, screenHeight]);

  // Re-snap on resize
  useEffect(() => {
    const maxX = screenWidth - BUTTON_SIZE - EDGE_PADDING;
    const maxY = screenHeight - BUTTON_SIZE - EDGE_PADDING;
    const clampedX = clamp(currentPos.current.x, EDGE_PADDING, maxX);
    const clampedY = clamp(currentPos.current.y, EDGE_PADDING, maxY);
    const snapX = clampedX + BUTTON_SIZE / 2 < screenWidth / 2
      ? EDGE_PADDING
      : screenWidth - BUTTON_SIZE - EDGE_PADDING;
    Animated.spring(position, { toValue: { x: snapX, y: clampedY }, useNativeDriver: false, friction: 7, tension: 80 }).start();
    currentPos.current = { x: snapX, y: clampedY };
  }, [screenWidth, screenHeight]);

  const isDragging = useRef(false);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,

    onPanResponderGrant: () => {
      isDragging.current = false;
      position.setOffset({ x: currentPos.current.x, y: currentPos.current.y });
      position.setValue({ x: 0, y: 0 });
    },

    onPanResponderMove: (_, g) => {
      if (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4) isDragging.current = true;
      const { width, height } = dimsRef.current;
      const newX = clamp(currentPos.current.x + g.dx, EDGE_PADDING, width  - BUTTON_SIZE - EDGE_PADDING);
      const newY = clamp(currentPos.current.y + g.dy, EDGE_PADDING, height - BUTTON_SIZE - EDGE_PADDING);
      position.setValue({ x: newX - currentPos.current.x, y: newY - currentPos.current.y });
    },

    onPanResponderRelease: (_, g) => {
      position.flattenOffset();
      setTimeout(() => { isDragging.current = false; }, 50);
      const { width, height } = dimsRef.current;
      const newX = clamp(currentPos.current.x + g.dx, EDGE_PADDING, width  - BUTTON_SIZE - EDGE_PADDING);
      const newY = clamp(currentPos.current.y + g.dy, EDGE_PADDING, height - BUTTON_SIZE - EDGE_PADDING);
      const snapX = newX + BUTTON_SIZE / 2 < width / 2 ? EDGE_PADDING : width - BUTTON_SIZE - EDGE_PADDING;
      Animated.spring(position, { toValue: { x: snapX, y: newY }, useNativeDriver: false, friction: 6, tension: 80 }).start();
      currentPos.current = { x: snapX, y: newY };
    },

    onPanResponderTerminate: () => { position.flattenOffset(); },
  })).current;

  const handleFabPress = useCallback(() => {
    if (!isDragging.current) setIsOpen(true);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput(""); setError(null);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const reply = await onSendMessage(userMessage, messages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      setError(err.message || sendFailedMessage);
    } finally { setLoading(false); }
  }, [input, loading, messages, onSendMessage, sendFailedMessage]);

  // Don't render FAB on web — fixed position doesn't work the same way
  // if (Platform.OS === "web") return null;

  return (
    <>
      {/* ── Draggable FAB ── */}
      <Animated.View
        style={[{ position: "absolute", width: BUTTON_SIZE, height: BUTTON_SIZE, zIndex: 999 }, position.getLayout()]}
        {...panResponder.panHandlers}>
        <Pressable onPress={handleFabPress}
          style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, borderRadius: BUTTON_SIZE / 2,
            backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center",
            shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 8 }}>
          <MessageCircle size={26} color="white" />
        </Pressable>
      </Animated.View>

      {/* ── Chat Modal ── */}
      <Modal visible={isOpen} animationType="slide" transparent onRequestClose={() => setIsOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: "75%",
            shadowColor: "#000", shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 12 }}>

            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center",
              padding: 16, backgroundColor: "#8B5CF6", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                  <MessageCircle size={16} color="white" />
                </View>
                <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>{title}</Text>
              </View>
              <AnimatedPressable onPress={() => setIsOpen(false)} soundType="soft"
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                <X size={18} color="white" />
              </AnimatedPressable>
            </View>

            {/* Messages */}
            <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}>
              {messages.map((m, i) => (
                <View key={i} style={{ marginBottom: 12, alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <View style={{
                    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18,
                    maxWidth: "82%",
                    backgroundColor: m.role === "user" ? "#8B5CF6" : bubbleBg,
                    // User message — round bottom-right less; assistant — round bottom-left less
                    borderBottomRightRadius: m.role === "user" ? 4 : 18,
                    borderBottomLeftRadius:  m.role === "user" ? 18 : 4,
                  }}>
                    <Text style={{ color: m.role === "user" ? "white" : textPri, fontSize: 14, lineHeight: 20 }}>
                      {m.content}
                    </Text>
                  </View>
                </View>
              ))}

              {loading && (
                <View style={{ alignItems: "flex-start", marginBottom: 12 }}>
                  <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, borderBottomLeftRadius: 4, backgroundColor: bubbleBg }}>
                    <ActivityIndicator size="small" color="#8B5CF6" />
                  </View>
                </View>
              )}

              {error && (
                <View style={{ alignItems: "center", marginTop: 4 }}>
                  <Text style={{ color: "#EF4444", fontSize: 12 }}>{error}</Text>
                </View>
              )}
            </ScrollView>

            {/* Input row */}
            <View style={{ flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: border }}>
              <TextInput
                value={input} onChangeText={setInput}
                placeholder={placeholder} placeholderTextColor={textMuted}
                onSubmitEditing={sendMessage} returnKeyType="send"
                editable={!loading} multiline={false}
                style={{ flex: 1, borderWidth: 1.5, borderColor: border, borderRadius: 14,
                  paddingHorizontal: 14, paddingVertical: 10,
                  backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                  color: textPri, fontSize: 14 }}
              />
              <AnimatedPressable onPress={sendMessage} disabled={!input.trim() || loading} soundType="mechanical"
                style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: "#8B5CF6",
                  alignItems: "center", justifyContent: "center",
                  opacity: !input.trim() || loading ? 0.45 : 1,
                  shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 }}>
                <Send size={18} color="white" />
              </AnimatedPressable>
            </View>

          </View>
        </View>
      </Modal>
    </>
  );
}