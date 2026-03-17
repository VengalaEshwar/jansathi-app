// components/DraggableChatbot.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, Pressable, Modal, ScrollView,
  TextInput, ActivityIndicator, Animated,
  PanResponder, useWindowDimensions, Platform,
} from "react-native";
import { MessageCircle, Send, X } from "lucide-react-native";
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
  "use no memo"; 

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
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: welcomeMessage }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const pathname = usePathname();

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const position = useRef(new Animated.ValueXY({ x: screenWidth - BUTTON_SIZE - 16, y: screenHeight - BUTTON_SIZE - 96 })).current;
  const currentPos = useRef({ x: screenWidth - BUTTON_SIZE - 16, y: screenHeight - BUTTON_SIZE - 96 });
  const isDragging = useRef(false);

  const animateScale = (toValue: number) => {
    Animated.spring(scaleAnim, { toValue, useNativeDriver: true, friction: 5, tension: 100 }).start();
  };

  useEffect(() => { setIsOpen(false); }, [pathname]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
    onPanResponderGrant: () => {
      isDragging.current = false;
      position.setOffset({ x: currentPos.current.x, y: currentPos.current.y });
      position.setValue({ x: 0, y: 0 });
      animateScale(0.92);
    },
    onPanResponderMove: (_, g) => {
      if (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4) isDragging.current = true;
      const nx = clamp(currentPos.current.x + g.dx, EDGE_PADDING, screenWidth - BUTTON_SIZE - EDGE_PADDING);
      const ny = clamp(currentPos.current.y + g.dy, EDGE_PADDING, screenHeight - BUTTON_SIZE - EDGE_PADDING);
      position.setValue({ x: nx - currentPos.current.x, y: ny - currentPos.current.y });
    },
    onPanResponderRelease: (_, g) => {
      position.flattenOffset();
      animateScale(1);
      setTimeout(() => { isDragging.current = false; }, 50);
      const nx = clamp(currentPos.current.x + g.dx, EDGE_PADDING, screenWidth - BUTTON_SIZE - EDGE_PADDING);
      const ny = clamp(currentPos.current.y + g.dy, EDGE_PADDING, screenHeight - BUTTON_SIZE - EDGE_PADDING);
      const snapX = nx + BUTTON_SIZE / 2 < screenWidth / 2 ? EDGE_PADDING : screenWidth - BUTTON_SIZE - EDGE_PADDING;
      Animated.spring(position, { toValue: { x: snapX, y: ny }, useNativeDriver: false }).start();
      currentPos.current = { x: snapX, y: ny };
    },
  })).current;

  // -- Web Mouse Events --
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
    const msg = input.trim();
    setInput(""); setMessages(p => [...p, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const reply = await onSendMessage(msg, messages);
      setMessages(p => [...p, { role: "assistant", content: reply }]);
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100); }
  }, [input, loading, messages]);

  const ChatPanel = (
    <View style={{ backgroundColor: cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: "75%", elevation: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#8B5CF6", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MessageCircle size={20} color="white" />
          <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>{title}</Text>
        </View>
        <Pressable onPress={() => setIsOpen(false)} style={{ padding: 4 }}><X size={20} color="white" /></Pressable>
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {messages.map((m, i) => (
          <View key={i} style={{ marginBottom: 14, alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            <View style={{ 
              paddingHorizontal: 16, 
              paddingVertical: 10, 
              borderRadius: 20, 
              maxWidth: "85%", 
              backgroundColor: m.role === "user" ? "#8B5CF6" : bubbleBg,
              // MESSAGE TAIL EFFECT
              borderBottomRightRadius: m.role === "user" ? 4 : 20, 
              borderBottomLeftRadius: m.role === "user" ? 20 : 4,
              // Shadow for bubbles
              elevation: 2,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2
            }}>
              <Text style={{ color: m.role === "user" ? "white" : textPri, fontSize: 14, lineHeight: 20 }}>{m.content}</Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={{ padding: 12, borderRadius: 20, borderBottomLeftRadius: 4, backgroundColor: bubbleBg, width: 50, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#8B5CF6" />
          </View>
        )}
      </ScrollView>

      <View style={{ flexDirection: "row", padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: border, alignItems: 'center' }}>
        <TextInput 
          value={input} 
          onChangeText={setInput} 
          placeholder={placeholder} 
          placeholderTextColor={textMuted}
          style={{ 
            flex: 1, 
            color: textPri, 
            backgroundColor: isDark ? "#0F172A" : "#F1F5F9", 
            borderRadius: 15, 
            paddingHorizontal: 15, 
            paddingVertical: 8,
            fontSize: 14
          }} 
        />
        <Pressable 
          onPress={sendMessage}
          style={{ backgroundColor: "#8B5CF6", width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
        >
          <Send size={18} color="white" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <>
      <Animated.View
        style={[
          { position: "absolute", zIndex: 999 }, 
          Platform.OS === 'web' ? { left: webPos.x, top: webPos.y } : position.getLayout(),
          { transform: [{ scale: scaleAnim }] }
        ]}
        {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
        onMouseDown={onWebMouseDown}
        // @ts-ignore
        onMouseEnter={() => animateScale(1.1)}
        onMouseLeave={() => animateScale(1)}
      >
        <Pressable 
          onPressIn={() => animateScale(0.92)}
          onPressOut={() => animateScale(1)}
          onPress={() => { if (!isDragging.current) setIsOpen(true); }}
          style={{ 
            width: BUTTON_SIZE, 
            height: BUTTON_SIZE, 
            borderRadius: BUTTON_SIZE / 2, 
            backgroundColor: "#8B5CF6", 
            alignItems: "center", 
            justifyContent: "center",
            elevation: 10,
            shadowColor: "#8B5CF6",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.45,
            shadowRadius: 12,
          }}
        >
          {isOpen ? <X size={24} color="white" /> : <MessageCircle size={26} color="white" />}
        </Pressable>
      </Animated.View>

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          {ChatPanel}
        </View>
      </Modal>
    </>
  );
}