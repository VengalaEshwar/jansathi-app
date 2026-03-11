import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
  PanResponder,
  useWindowDimensions,
} from "react-native";
import { MessageCircle, Send, X } from "lucide-react-native";

const BUTTON_SIZE = 56;
const EDGE_PADDING = 8;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type Message = { role: "user" | "assistant"; content: string };

interface DraggableChatbotProps {
  title: string;
  welcomeMessage: string;
  placeholder: string;
  sendFailedMessage: string;
  onSendMessage: (
    message: string,
    history: Message[]
  ) => Promise<string>;
}

export const DraggableChatbot = ({
  title,
  welcomeMessage,
  placeholder,
  sendFailedMessage,
  onSendMessage,
}: DraggableChatbotProps) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const position = useRef(
    new Animated.ValueXY({
      x: screenWidth - BUTTON_SIZE - 16,
      y: screenHeight - BUTTON_SIZE - 96,
    })
  ).current;

  const currentPos = useRef({
    x: screenWidth - BUTTON_SIZE - 16,
    y: screenHeight - BUTTON_SIZE - 96,
  });

  useEffect(() => {
    const maxX = screenWidth - BUTTON_SIZE - EDGE_PADDING;
    const maxY = screenHeight - BUTTON_SIZE - EDGE_PADDING;

    const clampedX = clamp(currentPos.current.x, EDGE_PADDING, maxX);
    const clampedY = clamp(currentPos.current.y, EDGE_PADDING, maxY);

    const snapX =
      clampedX + BUTTON_SIZE / 2 < screenWidth / 2
        ? EDGE_PADDING
        : screenWidth - BUTTON_SIZE - EDGE_PADDING;

    Animated.spring(position, {
      toValue: { x: snapX, y: clampedY },
      useNativeDriver: false,
      friction: 7,
      tension: 80,
    }).start();

    currentPos.current = { x: snapX, y: clampedY };
  }, [screenWidth, screenHeight]);

  const dimsRef = useRef({ width: screenWidth, height: screenHeight });
  useEffect(() => {
    dimsRef.current = { width: screenWidth, height: screenHeight };
  }, [screenWidth, screenHeight]);

  const isDragging = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,

      onPanResponderGrant: () => {
        isDragging.current = false;
        position.setOffset({
          x: currentPos.current.x,
          y: currentPos.current.y,
        });
        position.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4) {
          isDragging.current = true;
        }
        const { width, height } = dimsRef.current;
        const newX = clamp(
          currentPos.current.x + g.dx,
          EDGE_PADDING,
          width - BUTTON_SIZE - EDGE_PADDING
        );
        const newY = clamp(
          currentPos.current.y + g.dy,
          EDGE_PADDING,
          height - BUTTON_SIZE - EDGE_PADDING
        );
        position.setValue({
          x: newX - currentPos.current.x,
          y: newY - currentPos.current.y,
        });
      },

      onPanResponderRelease: (_, g) => {
        position.flattenOffset();
        setTimeout(() => {
          isDragging.current = false;
        }, 50);

        const { width, height } = dimsRef.current;
        const newX = clamp(
          currentPos.current.x + g.dx,
          EDGE_PADDING,
          width - BUTTON_SIZE - EDGE_PADDING
        );
        const newY = clamp(
          currentPos.current.y + g.dy,
          EDGE_PADDING,
          height - BUTTON_SIZE - EDGE_PADDING
        );

        const snapX =
          newX + BUTTON_SIZE / 2 < width / 2
            ? EDGE_PADDING
            : width - BUTTON_SIZE - EDGE_PADDING;

        Animated.spring(position, {
          toValue: { x: snapX, y: newY },
          useNativeDriver: false,
          friction: 6,
          tension: 80,
        }).start();

        currentPos.current = { x: snapX, y: newY };
      },

      onPanResponderTerminate: () => {
        position.flattenOffset();
      },
    })
  ).current;

  const handleFabPress = () => {
    if (!isDragging.current) {
      setIsOpen(true);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const reply = await onSendMessage(userMessage, messages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setError(err.message || sendFailedMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            zIndex: 999,
          },
          position.getLayout(),
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPress={handleFabPress}
          className="w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
          style={{ elevation: 6 }}
        >
          <MessageCircle size={26} color="white" />
        </Pressable>
      </Animated.View>

      <Modal visible={isOpen} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-light-card dark:bg-card rounded-t-2xl h-[75%]">
            <View className="flex-row justify-between items-center p-4 bg-primary rounded-t-2xl">
              <Text className="text-white font-semibold text-lg">{title}</Text>
              <Pressable onPress={() => setIsOpen(false)}>
                <X size={20} color="white" />
              </Pressable>
            </View>

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
                        m.role === "user" ? "text-white" : "text-light-foreground dark:text-foreground"
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

              {error && (
                <View className="items-center mt-1">
                  <Text className="text-destructive text-xs">{error}</Text>
                </View>
              )}
            </ScrollView>

            <View className="p-3 border-t border-light-border dark:border-border flex-row gap-2">
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                className="flex-1 border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-foreground dark:text-foreground"
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
    </>
  );
};