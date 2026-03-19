// components/VoiceAssistantFAB.tsx
import {
  useEffect, useRef, useCallback, useState,
} from "react";
import {
  View, Text, Pressable, Animated, Platform,
  PanResponder, useWindowDimensions,
} from "react-native";
import { Mic, MicOff }    from "lucide-react-native";
import { useAppSelector } from "@/store/hooks";
import { useTranslation } from "@/hooks/useTranslation";
import { useJanSathi }    from "@/hooks/useJanSathi";

let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = (_e: string, _cb: any) => {};

if (Platform.OS !== "web") {
  try {
    const SR = require("expo-speech-recognition");
    ExpoSpeechRecognitionModule = SR.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent   = SR.useSpeechRecognitionEvent;
  } catch (e) {}
}

function getWebSR(): any {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
}

const WAKE_WORDS = ["hey jansathi", "hey jan sathi", "jansathi", "jan sathi", "हे जनसाथी", "హే జనసాథి"];

function containsWakeWord(text: string): boolean {
  return WAKE_WORDS.some((w) => text.toLowerCase().trim().includes(w));
}

function stripWakeWord(text: string): string {
  let result = text.toLowerCase().trim();
  const sorted = [...WAKE_WORDS].sort((a, b) => b.length - a.length);
  for (const w of sorted) result = result.replace(w, "").trim();
  return result.replace(/^[,،\.!\s]+/, "").trim();
}

type MicState = "idle" | "listening" | "processing";

const FAB_SIZE = 52;
const EDGE_PAD = 8;
const clamp    = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export function VoiceAssistantFAB() {
  "use no memo"; 
  const { t }        = useTranslation();
  const voiceEnabled = useAppSelector((s: any) => s.app?.voiceAssistantEnabled ?? false);
  const isDark       = useAppSelector((s: any) => s.app?.theme === "dark");

  const { processCommand, isProcessing } = useJanSathi({ forceTTS: true });

  const [micState,   setMicState]   = useState<MicState>("idle");
  const [statusText, setStatusText] = useState("");

  const [webPermission, setWebPermission] = useState<"unknown"|"granted"|"denied">("unknown");
  const webPermissionRef = useRef<"unknown"|"granted"|"denied">("unknown");
  
  const voiceEnabledRef = useRef(voiceEnabled);
  const isListeningRef  = useRef(false);
  const isProcessingRef = useRef(false);

  useEffect(() => { webPermissionRef.current = webPermission; }, [webPermission]);
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    if (micState === "listening") {
      pulseLoop.current = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 750, useNativeDriver: true }),
      ]));
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 5 }).start();
    }
  }, [micState]);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // Starting position: Slightly higher than Chatbot to prevent overlap
  const initX      = screenWidth  - FAB_SIZE - 16;
  const initY      = screenHeight - FAB_SIZE - 180; 
  const position   = useRef(new Animated.ValueXY({ x: initX, y: initY })).current;
  const currentPos = useRef({ x: initX, y: initY });
  const isDragging = useRef(false);

  // ── RESIZE ADAPTABILITY (NATIVE) ──────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === "web") return;
    const maxX  = screenWidth  - FAB_SIZE - EDGE_PAD;
    const maxY  = screenHeight - FAB_SIZE - EDGE_PAD;
    
    const clampedY = clamp(currentPos.current.y, EDGE_PAD, maxY);
    const snapX = currentPos.current.x + FAB_SIZE / 2 < screenWidth / 2 ? EDGE_PAD : maxX;
    
    currentPos.current = { x: snapX, y: clampedY };
    Animated.spring(position, { toValue: { x: snapX, y: clampedY }, useNativeDriver: false, friction: 7, tension: 80 }).start();
  }, [screenWidth, screenHeight]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
    onPanResponderGrant: () => {
      isDragging.current = false;
      position.setOffset({ x: currentPos.current.x, y: currentPos.current.y });
      position.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: (_, g) => {
      if (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4) isDragging.current = true;
      const nx = clamp(currentPos.current.x + g.dx, EDGE_PAD, screenWidth  - FAB_SIZE - EDGE_PAD);
      const ny = clamp(currentPos.current.y + g.dy, EDGE_PAD, screenHeight - FAB_SIZE - EDGE_PAD);
      position.setValue({ x: nx - currentPos.current.x, y: ny - currentPos.current.y });
    },
    onPanResponderRelease: (_, g) => {
      position.flattenOffset();
      setTimeout(() => { isDragging.current = false; }, 50);
      const nx = clamp(currentPos.current.x + g.dx, EDGE_PAD, screenWidth  - FAB_SIZE - EDGE_PAD);
      const ny = clamp(currentPos.current.y + g.dy, EDGE_PAD, screenHeight - FAB_SIZE - EDGE_PAD);
      const snapX = nx + FAB_SIZE / 2 < screenWidth / 2 ? EDGE_PAD : screenWidth - FAB_SIZE - EDGE_PAD;
      Animated.spring(position, { toValue: { x: snapX, y: ny }, useNativeDriver: false, friction: 6, tension: 80 }).start();
      currentPos.current = { x: snapX, y: ny };
    },
  })).current;

  // ── RESIZE ADAPTABILITY (WEB) ─────────────────────────────────────────────
  const webPosRef = useRef({ x: screenWidth - FAB_SIZE - 16, y: screenHeight - FAB_SIZE - 180 });
  const [webPos, setWebPos] = useState({ x: webPosRef.current.x, y: webPosRef.current.y });

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onResize = () => {
      const maxX = window.innerWidth - FAB_SIZE - EDGE_PAD;
      const maxY = window.innerHeight - FAB_SIZE - EDGE_PAD;
      const clampedY = clamp(webPosRef.current.y, EDGE_PAD, maxY);
      const snapX = webPosRef.current.x + FAB_SIZE / 2 < window.innerWidth / 2 ? EDGE_PAD : maxX;
      webPosRef.current = { x: snapX, y: clampedY };
      setWebPos({ x: snapX, y: clampedY });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onWebMouseDown = useCallback((e: any) => {
    if (typeof window === "undefined") return;
    const startX = e.clientX - webPosRef.current.x;
    const startY = e.clientY - webPosRef.current.y;
    
    const onMove = (me: MouseEvent) => {
      isDragging.current = true;
      const nx = clamp(me.clientX - startX, EDGE_PAD, window.innerWidth  - FAB_SIZE - EDGE_PAD);
      const ny = clamp(me.clientY - startY, EDGE_PAD, window.innerHeight - FAB_SIZE - EDGE_PAD);
      webPosRef.current = { x: nx, y: ny };
      setWebPos({ x: nx, y: ny });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      const snapX = webPosRef.current.x + FAB_SIZE / 2 < window.innerWidth / 2 ? EDGE_PAD : window.innerWidth - FAB_SIZE - EDGE_PAD;
      webPosRef.current.x = snapX;
      setWebPos(p => ({ ...p, x: snapX }));
      setTimeout(() => { isDragging.current = false; }, 60);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  }, []);

  const handleResult = useCallback(async (text: string) => {
    isListeningRef.current = false;
    
    if (!text.trim()) { 
      setMicState("idle"); setStatusText(""); return; 
    }

    const command = containsWakeWord(text) ? stripWakeWord(text) : text;
    if (!command) { setMicState("idle"); setStatusText(""); return; }

    isProcessingRef.current = true;
    setMicState("processing"); setStatusText("Processing...");
    
    try { await processCommand(command); } 
    finally { isProcessingRef.current = false; setMicState("idle"); setStatusText(""); }
  }, [processCommand]);

  const requestWebPermission = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setWebPermission("denied"); setStatusText("Mic requires HTTPS/localhost"); return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setWebPermission("granted");
      startWebListening();
    } catch { setWebPermission("denied"); }
  }, []);

  const startNativeListening = useCallback(async () => {
    if (!ExpoSpeechRecognitionModule || isProcessingRef.current || !voiceEnabledRef.current) return;
    try {
      if (typeof ExpoSpeechRecognitionModule.requestPermissionsAsync === "function") {
        const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!permission.granted) { setMicState("idle"); setStatusText("Mic Permission Denied"); return; }
      }
      try { ExpoSpeechRecognitionModule.abort(); } catch {}
      
      isListeningRef.current = true; 
      ExpoSpeechRecognitionModule.start({ lang: "en-IN", interimResults: false, continuous: false });
    } catch (err: any) {
      isListeningRef.current = false; setMicState("idle"); setStatusText("");
    }
  }, []);

  const stopNativeListening = useCallback(() => {
    if (!ExpoSpeechRecognitionModule) return;
    isListeningRef.current = false;
    try { ExpoSpeechRecognitionModule.stop(); } catch {}
    setMicState("idle"); setStatusText("");
  }, []);

  useSpeechRecognitionEvent("start", () => {
    isListeningRef.current = true; setMicState("listening"); setStatusText("Listening...");
  });

  useSpeechRecognitionEvent("result", (event: any) => {
    const text = event.results[0]?.transcript || "";
    if (event.isFinal) handleResult(text);
  });

  useSpeechRecognitionEvent("error", () => {
    isListeningRef.current = false; setMicState("idle"); setStatusText("");
  });

  useSpeechRecognitionEvent("end", () => {
    isListeningRef.current = false;
    if (!isProcessingRef.current) { setMicState("idle"); setStatusText(""); }
  });

  const startWebListening = useCallback(() => {
    const SR = getWebSR();
    if (!SR || isProcessingRef.current || !voiceEnabledRef.current) return;
    const recognition = new SR();
    recognition.lang = "en-IN"; recognition.continuous = false; recognition.interimResults = false;
    recognition.onstart = () => { isListeningRef.current = true; setMicState("listening"); setStatusText("Listening..."); };
    recognition.onresult = (event: any) => {
      const text = (event.results?.[event.results.length - 1]?.[0]?.transcript ?? "").trim();
      handleResult(text);
    };
    recognition.onerror = () => { isListeningRef.current = false; setMicState("idle"); setStatusText(""); };
    recognition.onend = () => {
      isListeningRef.current = false;
      if (!isProcessingRef.current) { setMicState("idle"); setStatusText(""); }
    };
    try { recognition.start(); } catch { setMicState("idle"); }
  }, [handleResult]);

  const stopWebListening = useCallback(() => {
    isListeningRef.current = false; setMicState("idle"); setStatusText("");
  }, []);

  const stopListening = useCallback(() => {
    if (Platform.OS === "web") stopWebListening(); else stopNativeListening();
  }, [stopWebListening, stopNativeListening]);

  useEffect(() => { if (!voiceEnabled) stopListening(); }, [voiceEnabled, stopListening]);

  if (!voiceEnabled) return null;

  const isActive  = micState === "listening";
  const isWorking = micState === "processing" || isProcessing;
  const needsActivation = Platform.OS === "web" && webPermission === "unknown";

  const fabBg     = needsActivation ? (isDark ? "#1E293B" : "white") : isActive ? "#8B5CF6" : isWorking ? "#F59E0B" : isDark ? "#1E293B" : "white";
  const fabBorder = needsActivation ? "#8B5CF6" : isActive ? "#A78BFA" : isWorking ? "#FCD34D" : isDark ? "#334155" : "#E2E8F0";
  const iconColor = (isActive || isWorking) ? "white" : needsActivation ? "#8B5CF6" : isDark ? "#94A3B8" : "#64748B";

  const displayStatus = needsActivation ? "Tap to activate mic" : statusText;
  const showLabel = isActive || isWorking || needsActivation;

  const StatusLabel = showLabel && !!displayStatus ? (
    <View style={{
      backgroundColor: isDark ? "#1E293B" : "white", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
      borderWidth: 1, borderColor: needsActivation ? "#8B5CF6" : fabBorder, maxWidth: 180, marginBottom: 4,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    }}>
      <Text style={{ fontSize: 10, fontWeight: "600", textAlign: "center", color: needsActivation ? "#8B5CF6" : isDark ? "#CBD5E1" : "#64748B" }} numberOfLines={1}>
        {displayStatus}
      </Text>
    </View>
  ) : null;

  const fabStyle = {
    width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2,
    backgroundColor: fabBg, borderWidth: 1.5, borderColor: fabBorder,
    alignItems: "center" as const, justifyContent: "center" as const,
    shadowColor:   isActive ? "#8B5CF6" : isWorking ? "#F59E0B" : needsActivation ? "#8B5CF6" : "#000",
    shadowOffset:  { width: 0, height: isActive ? 6 : 3 }, shadowOpacity: isActive ? 0.4 : needsActivation ? 0.25 : 0.12,
    shadowRadius:  isActive ? 14 : needsActivation ? 10 : 8, elevation: isActive ? 8 : needsActivation ? 6 : 4,
  };

  const handleFabPress = () => {
    if (isDragging.current) return;
    if (needsActivation) { requestWebPermission(); return; }
    
    if (isActive || isWorking || isListeningRef.current) { stopListening(); } 
    else { if (Platform.OS === "web") startWebListening(); else startNativeListening(); }
  };

  if (Platform.OS === "web") {
    return (
      <View style={{ position: "fixed" as any, left: webPos.x, top: webPos.y, zIndex: 9998, alignItems: "center" }}>
        {StatusLabel}
        <View onMouseDown={onWebMouseDown} style={{ cursor: "grab" } as any}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable onPress={handleFabPress} style={fabStyle}>
              {isActive || isWorking ? <Mic size={22} color={iconColor} /> : <MicOff size={22} color={iconColor} />}
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <>
      {showLabel && !!displayStatus && (
        <Animated.View style={{ position: "absolute", zIndex: 1000, alignItems: "center", left: position.x, top: Animated.subtract(position.y, new Animated.Value(34)) }}>
          {StatusLabel}
        </Animated.View>
      )}
      <Animated.View style={[{ position: "absolute", width: FAB_SIZE, height: FAB_SIZE, zIndex: 999 }, position.getLayout()]} {...panResponder.panHandlers}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable onPress={handleFabPress} style={fabStyle}>
            {isActive || isWorking ? <Mic size={22} color={iconColor} /> : <MicOff size={22} color={iconColor} />}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </>
  );
}