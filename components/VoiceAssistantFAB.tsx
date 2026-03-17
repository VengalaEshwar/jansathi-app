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

// ── Native-only ───────────────────────────────────────────────────────────────
let Voice: any = null;
if (Platform.OS !== "web") {
  try {
    Voice = require("@react-native-voice/voice").default;
    console.log("[VAB] voice loaded ✓");
  } catch (e) {
    console.warn("[VAB] voice not available:", e);
  }
}

function getWebSR(): any {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
}

// ── Wake words ────────────────────────────────────────────────────────────────
const WAKE_WORDS = [
  "hey jansathi", "hey jan sathi", "hey jansaathi", "hey jan saathi",
  "hey janjati", "hey jansati", "hey jan sati", "hey jansathy",
  "hey jansathin", "hey jan sathy", "hey jansatbi", "hey jansatri",
  "hey jansathi,", "hey jansathi.", "hey jan sathi,","agent Sathi","agent Sathy" ,"sathy", "Sathi",
  "jansathi", "jan sathi", "janjati", "jansati",
  "हे जनसाथी", "హే జనసాథి",
];

function containsWakeWord(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return WAKE_WORDS.some((w) => lower.includes(w));
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
  "use no memo"; // React Compiler opt-out — component has too many hooks for safe auto-memoization
  const { t }        = useTranslation();
  const voiceEnabled = useAppSelector((s: any) => s.app?.voiceAssistantEnabled ?? false);
  const isDark       = useAppSelector((s: any) => s.app?.theme === "dark");

  const { processCommand, isProcessing } = useJanSathi({ forceTTS: true });

  const [micState,   setMicState]   = useState<MicState>("idle");
  const [statusText, setStatusText] = useState("");

  // ── Web permission — use a ref so startWebListening never has it as a dep ─
  // (having webPermission in deps caused the mic loop bug)
  const [webPermission,    setWebPermission]    = useState<"unknown"|"granted"|"denied">("unknown");
  const webPermissionRef = useRef<"unknown"|"granted"|"denied">("unknown");
  useEffect(() => { webPermissionRef.current = webPermission; }, [webPermission]);

  // ── Stable refs ───────────────────────────────────────────────────────────
  const voiceEnabledRef = useRef(voiceEnabled);
  const isListeningRef  = useRef(false);
  const isProcessingRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webRecognRef    = useRef<any>(null);
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

  // ── Pulse animation ───────────────────────────────────────────────────────
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

  // ── Native drag (PanResponder) ────────────────────────────────────────────
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const initX      = screenWidth  - FAB_SIZE - 16;
  const initY      = screenHeight - FAB_SIZE - 164;
  const position   = useRef(new Animated.ValueXY({ x: initX, y: initY })).current;
  const currentPos = useRef({ x: initX, y: initY });
  const isDragging = useRef(false);
  const dimsRef    = useRef({ width: screenWidth, height: screenHeight });

  useEffect(() => { dimsRef.current = { width: screenWidth, height: screenHeight }; },
    [screenWidth, screenHeight]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const maxX  = screenWidth  - FAB_SIZE - EDGE_PAD;
    const maxY  = screenHeight - FAB_SIZE - EDGE_PAD;
    const cx    = clamp(currentPos.current.x, EDGE_PAD, maxX);
    const cy    = clamp(currentPos.current.y, EDGE_PAD, maxY);
    const snapX = cx + FAB_SIZE / 2 < screenWidth / 2 ? EDGE_PAD : screenWidth - FAB_SIZE - EDGE_PAD;
    Animated.spring(position, { toValue: { x: snapX, y: cy }, useNativeDriver: false, friction: 7, tension: 80 }).start();
    currentPos.current = { x: snapX, y: cy };
  }, [screenWidth, screenHeight]); // eslint-disable-line

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
      const { width, height } = dimsRef.current;
      const nx = clamp(currentPos.current.x + g.dx, EDGE_PAD, width  - FAB_SIZE - EDGE_PAD);
      const ny = clamp(currentPos.current.y + g.dy, EDGE_PAD, height - FAB_SIZE - EDGE_PAD);
      position.setValue({ x: nx - currentPos.current.x, y: ny - currentPos.current.y });
    },
    onPanResponderRelease: (_, g) => {
      position.flattenOffset();
      setTimeout(() => { isDragging.current = false; }, 50);
      const { width, height } = dimsRef.current;
      const nx    = clamp(currentPos.current.x + g.dx, EDGE_PAD, width  - FAB_SIZE - EDGE_PAD);
      const ny    = clamp(currentPos.current.y + g.dy, EDGE_PAD, height - FAB_SIZE - EDGE_PAD);
      const snapX = nx + FAB_SIZE / 2 < width / 2 ? EDGE_PAD : width - FAB_SIZE - EDGE_PAD;
      Animated.spring(position, { toValue: { x: snapX, y: ny }, useNativeDriver: false, friction: 6, tension: 80 }).start();
      currentPos.current = { x: snapX, y: ny };
    },
    onPanResponderTerminate: () => { position.flattenOffset(); },
  })).current;

  // ── Web drag (mouse events) ───────────────────────────────────────────────
  const webPos      = useRef({ x: (typeof window !== "undefined" ? window.innerWidth : 400) - FAB_SIZE - 16, y: (typeof window !== "undefined" ? window.innerHeight : 700) - FAB_SIZE - 164 });
  const webDragRef  = useRef(false);
  const webStartRef = useRef({ mx: 0, my: 0, fx: 0, fy: 0 });
  const [webPosState, setWebPosState] = useState({ x: webPos.current.x, y: webPos.current.y });

  const onWebMouseDown = useCallback((e: any) => {
    if (typeof window === "undefined") return;
    webDragRef.current  = false;
    webStartRef.current = { mx: e.clientX, my: e.clientY, fx: webPos.current.x, fy: webPos.current.y };
    const onMove = (me: MouseEvent) => {
      const dx = me.clientX - webStartRef.current.mx;
      const dy = me.clientY - webStartRef.current.my;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) webDragRef.current = true;
      const nx = clamp(webStartRef.current.fx + dx, EDGE_PAD, window.innerWidth  - FAB_SIZE - EDGE_PAD);
      const ny = clamp(webStartRef.current.fy + dy, EDGE_PAD, window.innerHeight - FAB_SIZE - EDGE_PAD);
      webPos.current = { x: nx, y: ny };
      setWebPosState({ x: nx, y: ny });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      setTimeout(() => { webDragRef.current = false; }, 60);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    e.preventDefault();
  }, []);

  // ── Restart scheduler ─────────────────────────────────────────────────────
  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null; }
  }, []);

  const startListeningRef = useRef<(silent?: boolean) => void>();

  const scheduleRestart = useCallback((delayMs: number) => {
    clearRestartTimer();
    restartTimerRef.current = setTimeout(() => {
      if (voiceEnabledRef.current && !isProcessingRef.current) {
        startListeningRef.current?.(true);
      }
    }, delayMs);
  }, [clearRestartTimer]);

  // ── Shared result handler ─────────────────────────────────────────────────
  const handleResult = useCallback(async (text: string) => {
    isListeningRef.current = false;
    console.log("[VAB] heard:", JSON.stringify(text));
    if (!text.trim()) { scheduleRestart(600); return; }

    if (containsWakeWord(text)) {
      const command = stripWakeWord(text);
      console.log("[VAB] wake word ✓  command:", JSON.stringify(command));
      if (!command) {
        setStatusText(t.voiceAssistant?.tapToSpeak ?? "What can I help you with?");
        setMicState("listening");
        scheduleRestart(800);
        return;
      }
      isProcessingRef.current = true;
      setMicState("processing");
      setStatusText(t.voiceAssistant?.processing ?? "Processing...");
      try {
        await processCommand(command);
      } finally {
        isProcessingRef.current = false;
        if (voiceEnabledRef.current) {
          setMicState("listening");
          setStatusText(t.voiceAssistant?.enabledDesc ?? "Listening...");
          scheduleRestart(900);
        }
      }
    } else {
      scheduleRestart(300);
    }
  }, [t, scheduleRestart, processCommand]);

  // ── Web permission request ────────────────────────────────────────────────
  const requestWebPermission = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setWebPermission("granted");
      webPermissionRef.current = "granted";
      setTimeout(() => startListeningRef.current?.(), 300);
    } catch {
      setWebPermission("denied");
      webPermissionRef.current = "denied";
      console.warn("[VAB] mic permission denied");
    }
  }, []);

  // ── Web SpeechRecognition loop ────────────────────────────────────────────
  // IMPORTANT: webPermission is read from webPermissionRef (not state)
  // so this callback never changes and never triggers the mic-loop bug
  const startWebListening = useCallback((silent = false) => {
    const SR = getWebSR();
    if (!SR) return;
    if (isListeningRef.current)  return;
    if (isProcessingRef.current) return;
    if (!voiceEnabledRef.current) return;
    if (webPermissionRef.current === "denied")  return;
    if (webPermissionRef.current === "unknown") return; // wait for tap

    if (webRecognRef.current) {
      try { webRecognRef.current.abort(); } catch {}
      webRecognRef.current = null;
    }

    const recognition          = new SR();
    recognition.lang           = "en-IN";
    recognition.continuous     = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      if (!silent) {
        setMicState("listening");
        setStatusText(t.voiceAssistant?.enabledDesc ?? "Listening for 'Hey JanSathi...'");
      }
    };

    recognition.onresult = (event: any) => {
      const result = event.results?.[event.results.length - 1];
      const text   = (result?.[0]?.transcript ?? "").trim();
      // onresult fires before onend — clear the ref so onend doesn't restart too
      webRecognRef.current = null;
      handleResult(text);
    };

    recognition.onerror = (event: any) => {
      console.log("[VAB] SR error:", event.error);
      isListeningRef.current = false;
      webRecognRef.current   = null;
      if (voiceEnabledRef.current && !isProcessingRef.current) {
        const isNormal = event.error === "no-speech" || event.error === "aborted";
        scheduleRestart(isNormal ? 500 : 1500);
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      // Only restart from onend if onresult did NOT already handle it
      // (webRecognRef is null after onresult fires, so this check prevents double-restart)
      if (webRecognRef.current !== null) return;
      if (voiceEnabledRef.current && !isProcessingRef.current) {
        scheduleRestart(500);
      }
    };

    try {
      recognition.start();
      webRecognRef.current = recognition;
    } catch (err: any) {
      console.warn("[VAB] SR start failed:", err?.message);
      isListeningRef.current = false;
      scheduleRestart(1500);
    }
  // NO webPermission in deps — read from ref instead to avoid loop
  }, [t, handleResult, scheduleRestart]); // eslint-disable-line

  const stopWebListening = useCallback(() => {
    if (webRecognRef.current) {
      try { webRecognRef.current.abort(); } catch {}
      webRecognRef.current = null;
    }
    isListeningRef.current = false;
  }, []);

  // ── Native voice loop ─────────────────────────────────────────────────────
  const startNativeListening = useCallback(async (silent = false) => {
    if (!Voice || isListeningRef.current || isProcessingRef.current || !voiceEnabledRef.current) return;
    try {
      try { await Voice.destroy(); } catch {}
      await Voice.start("en-IN");
      isListeningRef.current = true;
      if (!silent) {
        setMicState("listening");
        setStatusText(t.voiceAssistant?.enabledDesc ?? "Listening for 'Hey JanSathi...'");
      }
    } catch (err: any) {
      console.warn("[VAB] Voice.start failed:", err?.message);
      isListeningRef.current = false;
      scheduleRestart(2000);
    }
  }, [t, scheduleRestart]);

  const stopNativeListening = useCallback(async () => {
    if (!Voice) return;
    isListeningRef.current = false;
    try { await Voice.stop(); }    catch {}
    try { await Voice.destroy(); } catch {}
  }, []);

  // ── Unified start / stop ──────────────────────────────────────────────────
  const startListening = useCallback((silent = false) => {
    if (Platform.OS === "web") startWebListening(silent);
    else                       startNativeListening(silent);
  }, [startWebListening, startNativeListening]);

  const stopListening = useCallback(() => {
    clearRestartTimer();
    if (Platform.OS === "web") stopWebListening();
    else                       stopNativeListening();
    setMicState("idle");
    setStatusText("");
  }, [clearRestartTimer, stopWebListening, stopNativeListening]);

  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  // Ref so FAB press handler can call stopListening without stale closure
  const stopListeningRef = useRef<() => void>();
  useEffect(() => { stopListeningRef.current = stopListening; }, [stopListening]);

  // ── Native Voice events (registered once on mount) ────────────────────────
  useEffect(() => {
    if (!Voice || Platform.OS === "web") return;
    Voice.onSpeechResults = (e: any) => { handleResult((e.value?.[0] ?? "").trim()); };
    Voice.onSpeechError   = (e: any) => {
      isListeningRef.current = false;
      const code  = String(e?.error?.code ?? "");
      const delay = (code === "7" || code === "13") ? 500 : 1500;
      if (voiceEnabledRef.current && !isProcessingRef.current) scheduleRestart(delay);
    };
    Voice.onSpeechEnd = () => {};
    return () => {
      Voice.onSpeechResults = undefined;
      Voice.onSpeechError   = undefined;
      Voice.onSpeechEnd     = undefined;
      stopNativeListening();
    };
  }, []); // eslint-disable-line

  // ── Enable / disable ──────────────────────────────────────────────────────
  useEffect(() => {
    if (voiceEnabled) {
      const timer = setTimeout(() => startListeningRef.current?.(), 600);
      return () => clearTimeout(timer);
    } else {
      stopListening();
    }
  }, [voiceEnabled, stopListening]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — never return null (React Compiler requires stable hook count).
  // Return empty fragment when disabled so hook count is always the same.
  // ─────────────────────────────────────────────────────────────────────────

  if (!voiceEnabled) return <></>;  // ← NOT null

  const isActive  = micState === "listening";
  const isWorking = micState === "processing" || isProcessing;

  const needsActivation = Platform.OS === "web" && webPermission === "unknown";
  const permDenied      = Platform.OS === "web" && webPermission === "denied";

  const fabBg     = needsActivation ? (isDark ? "#1E293B" : "white")
                  : isActive        ? "#8B5CF6"
                  : isWorking       ? "#F59E0B"
                  : isDark          ? "#1E293B" : "white";
  const fabBorder = needsActivation ? "#8B5CF6"
                  : isActive        ? "#A78BFA"
                  : isWorking       ? "#FCD34D"
                  : isDark          ? "#334155" : "#E2E8F0";
  const iconColor = (isActive || isWorking) ? "white"
                  : needsActivation          ? "#8B5CF6"
                  : isDark                   ? "#94A3B8" : "#64748B";

  const displayStatus = permDenied      ? "Mic blocked in browser"
                      : needsActivation ? "Tap to activate mic"
                      : micState === "idle" && voiceEnabled ? "Tap to resume"
                      : statusText;
  const showLabel = isActive || isWorking || needsActivation || permDenied || (micState === "idle" && voiceEnabled);

  const StatusLabel = showLabel && !!displayStatus ? (
    <View style={{
      backgroundColor: isDark ? "#1E293B" : "white",
      borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
      borderWidth: 1, borderColor: needsActivation ? "#8B5CF6" : fabBorder,
      maxWidth: 180, marginBottom: 4,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    }}>
      <Text style={{ fontSize: 10, fontWeight: "600", textAlign: "center",
        color: needsActivation ? "#8B5CF6" : isDark ? "#CBD5E1" : "#64748B",
      }} numberOfLines={1}>{displayStatus}</Text>
    </View>
  ) : null;

  const fabStyle = {
    width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2,
    backgroundColor: fabBg,
    borderWidth: needsActivation ? 2 : 1.5, borderColor: fabBorder,
    alignItems: "center" as const, justifyContent: "center" as const,
    shadowColor:   isActive ? "#8B5CF6" : isWorking ? "#F59E0B" : needsActivation ? "#8B5CF6" : "#000",
    shadowOffset:  { width: 0, height: isActive ? 6 : 3 },
    shadowOpacity: isActive ? 0.4 : needsActivation ? 0.25 : 0.12,
    shadowRadius:  isActive ? 14 : needsActivation ? 10 : 8,
    elevation:     isActive ? 8 : needsActivation ? 6 : 4,
  };

  // ── Web ───────────────────────────────────────────────────────────────────
  if (Platform.OS === "web") {
    return (
      <View style={{
        position: "fixed" as any,
        left: webPosState.x, top: webPosState.y,
        zIndex: 9998, alignItems: "center",
      }}>
        {StatusLabel}
        <View
          // @ts-ignore
          onMouseDown={onWebMouseDown}
          style={{ cursor: "grab" } as any}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              onPress={() => {
                if (webDragRef.current) return;
                if (needsActivation) { requestWebPermission(); return; }
                // Tap while active → stop mic
                if (isActive || isWorking) { stopListeningRef.current?.(); return; }
                // Tap while idle (manually stopped) → resume
                if (micState === "idle") { startListeningRef.current?.(); return; }
              }}
              style={fabStyle}>
              {isActive || isWorking ? <Mic size={22} color={iconColor} /> : <MicOff size={22} color={iconColor} />}
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ── Native ────────────────────────────────────────────────────────────────
  return (
    <>
      {showLabel && !!displayStatus && (
        <Animated.View style={{
          position: "absolute", zIndex: 1000, alignItems: "center",
          left: position.x,
          top:  Animated.subtract(position.y, new Animated.Value(34)),
        }}>
          {StatusLabel}
        </Animated.View>
      )}
      <Animated.View
        style={[{ position: "absolute", width: FAB_SIZE, height: FAB_SIZE, zIndex: 999 }, position.getLayout()]}
        {...panResponder.panHandlers}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable
            onPress={() => {
              if (isDragging.current) return;
              if (needsActivation) { requestWebPermission(); return; }
              // Tap while active → stop mic
              if (isActive || isWorking) { stopListeningRef.current?.(); return; }
              // Tap while idle (manually stopped) → resume
              if (micState === "idle") { startListeningRef.current?.(); return; }
            }}
            style={fabStyle}>
            {isActive || isWorking ? <Mic size={22} color={iconColor} /> : <MicOff size={22} color={iconColor} />}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </>
  );
}