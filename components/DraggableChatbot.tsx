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
import { usePathname } from "expo-router";

const BUTTON_SIZE = 56;
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
}: DraggableChatbotProps) {
  "use no memo"; // Prevents hook mismatch errors during PanResponder interactions

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const theme = useAppSelector((s: any) => s.app?.theme ?? "dark");
  const isDark = theme === "dark";

  // -- Theme Colors --
  const cardBg = isDark ? "#1E293B" : "white";
  const border = isDark ? "#334155" : "#E2E8F0";
  const textPri = isDark ? "#F1F5F9" : "#0F172A";
  const textMuted = isDark ? "#94A3B8" : "#64748B";
  const bubbleBg = isDark ? "#334155" : "#F1F5F9";

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);

  // -- Position Refs --
  const position = useRef(new Animated.ValueXY({
    x: screenWidth - BUTTON_SIZE - 16,
    y: screenHeight - BUTTON_SIZE - 96,
  })).current;

  const currentPos = useRef({
    x: screenWidth - BUTTON_SIZE - 16,
    y: screenHeight - BUTTON_SIZE - 96,
  });

  const dimsRef = useRef({ width: screenWidth, height: screenHeight });
  const isDragging = useRef(false);

  // Handle Navigation Change
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      setIsOpen(false);
    }
  }, [pathname]);

  // Sync dimensions
  useEffect(() => {
    dimsRef.current = { width: screenWidth, height: screenHeight };
    // Re-snap on resize
    const maxX = screenWidth - BUTTON_SIZE - EDGE_PADDING;
    const snapX = currentPos.current.x + BUTTON_SIZE / 2 < screenWidth / 2
      ? EDGE_PADDING : maxX;
    
    Animated.spring(position, { 
      toValue: { x: snapX, y: clamp(currentPos.current.y, EDGE_PADDING, screenHeight - BUTTON_SIZE - EDGE_PADDING) }, 
      useNativeDriver: false 
    }).start();
  }, [screenWidth, screenHeight]);

  // -- PanResponder (Native) --
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
      const nx = clamp(currentPos.current.x + g.dx, EDGE_PADDING, width - BUTTON_SIZE - EDGE_PADDING);
      const ny = clamp(currentPos.current.y + g.dy, EDGE_PADDING, height - BUTTON_SIZE - EDGE_PADDING);
      position.setValue({ x: nx - currentPos.current.x, y: ny - currentPos.current.y });
    },
    onPanResponderRelease: (_, g) => {
      position.flattenOffset();
      setTimeout(() => { isDragging.current = false; }, 50);
      const { width, height } = dimsRef.current;
      const nx = clamp(currentPos.current.x + g.dx, EDGE_PADDING, width - BUTTON_SIZE - EDGE_PADDING);
      const ny = clamp(currentPos.current.y + g.dy, EDGE_PADDING, height - BUTTON_SIZE - EDGE_PADDING);
      const snapX = nx + BUTTON_SIZE / 2 < width / 2 ? EDGE_PADDING : width - BUTTON_SIZE - EDGE_PADDING;
      Animated.spring(position, { toValue: { x: snapX, y: ny }, useNativeDriver: false }).start();
      currentPos.current = { x: snapX, y: ny };
    },
    onPanResponderTerminate: () => { position.flattenOffset(); },
  })).current;

  // -- Web Drag Support --
  const [webPos, setWebPos] = useState({ x: screenWidth - BUTTON_SIZE - 16, y: screenHeight - BUTTON_SIZE - 96 });
  const onWebMouseDown = (e: any) => {
    if (Platform.OS !== 'web') return;
    const startX = e.clientX - webPos.x;
    const startY = e.clientY - webPos.y;
    const onMove = (me: MouseEvent) => {
      isDragging.current = true;
      setWebPos({
        x: clamp(me.clientX - startX, EDGE_PADDING, window.innerWidth - BUTTON_SIZE - EDGE_PADDING),
        y: clamp(me.clientY - startY, EDGE_PADDING, window.innerHeight - BUTTON_SIZE - EDGE_PADDING)
      });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setTimeout(() => { isDragging.current = false; }, 50);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput(""); setError(null);
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const reply = await onSendMessage(userMsg, messages);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      setError(err.message || sendFailedMessage);
    } finally { setLoading(false); }
  }, [input, loading, messages, onSendMessage]);

  const ChatPanel = (
    <View style={{ backgroundColor: cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: "75%", elevation: 12 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#8B5CF6", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
            <MessageCircle size={16} color="white" />
          </View>
          <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>{title}</Text>
        </View>
        <AnimatedPressable onPress={() => setIsOpen(false)} soundType="soft" style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
          <X size={18} color="white" />
        </AnimatedPressable>
      </View>

      {/* Messages */}
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {messages.map((m, i) => (
          <View key={i} style={{ marginBottom: 12, alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            <View style={{ padding: 12, borderRadius: 18, maxWidth: "82%", backgroundColor: m.role === "user" ? "#8B5CF6" : bubbleBg, borderBottomRightRadius: m.role === "user" ? 4 : 18, borderBottomLeftRadius: m.role === "user" ? 18 : 4 }}>
              <Text style={{ color: m.role === "user" ? "white" : textPri }}>{m.content}</Text>
            </View>
          </View>
        ))}
        {loading && <ActivityIndicator size="small" color="#8B5CF6" style={{ alignSelf: 'flex-start' }} />}
      </ScrollView>

      {/* Input Row */}
      <View style={{ flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: border }}>
        <TextInput value={input} onChangeText={setInput} placeholder={placeholder} placeholderTextColor={textMuted} onSubmitEditing={sendMessage} editable={!loading} style={{ flex: 1, borderWidth: 1.5, borderColor: border, borderRadius: 14, padding: 10, color: textPri }} />
        <AnimatedPressable onPress={sendMessage} disabled={!input.trim() || loading} style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center" }}>
          <Send size={18} color="white" />
        </AnimatedPressable>
      </View>
    </View>
  );

  return (
    <>
      <Animated.View
        style={[{ position: "absolute", width: BUTTON_SIZE, height: BUTTON_SIZE, zIndex: 999 }, 
          Platform.OS === 'web' ? { left: webPos.x, top: webPos.y } : position.getLayout()
        ]}
        {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
        // @ts-ignore - Web only
        onMouseDown={onWebMouseDown}
      >
        <Pressable 
          onPress={() => { if (!isDragging.current) setIsOpen(true); }}
          style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, borderRadius: BUTTON_SIZE / 2, backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center", elevation: 8 }}>
          <MessageCircle size={26} color="white" />
        </Pressable>
      </Animated.View>

      <Modal visible={isOpen} animationType="slide" transparent onRequestClose={() => setIsOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          {ChatPanel}
        </View>
      </Modal>
    </>
  );
}