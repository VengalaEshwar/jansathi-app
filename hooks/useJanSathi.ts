// hooks/useJanSathi.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared command processor used by ALL 3 entry points:
//   1. VoiceAssistantFAB  — wake word detected → processCommand(stripped command)
//   2. GlobalChatbot      — every text message  → processCommand(message)
//   3. VoiceChatbot       — spoken/typed input  → processCommand(transcript)
//
// Returns { message, speakText?, navigateTo? }
// Automatically speaks the response via TTS and navigates when a route is found.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from "react";
import { Platform }               from "react-native";
import * as Speech                from "expo-speech";
import { useRouter, usePathname } from "expo-router";
import { apiRequest }             from "@/integrations/api/client";
import { useTranslation }         from "@/hooks/useTranslation";
import { useAppSelector }         from "@/store/hooks";
import { buildRouteMapForAPI, getScreenName } from "@/constants/routeMap";

export interface JanSathiResponse {
  message:    string;
  speakText?: string;
  navigateTo?: string;
}

export interface UseJanSathiOptions {
  /**
   * forceTTS = true  → always speak, regardless of voiceAssistantEnabled toggle.
   * Used by VoiceChatbot (which has its own TTS toggle) and VoiceAssistantFAB.
   */
  forceTTS?: boolean;
}

export function useJanSathi(options: UseJanSathiOptions = {}) {
  const router   = useRouter();
  const pathname = usePathname();
  const { t, language } = useTranslation();
  const voiceEnabled    = useAppSelector((s: any) => s.app?.voiceAssistantEnabled ?? false);

  const [isProcessing, setIsProcessing] = useState(false);
  const isSpeakingRef = useRef(false);

  // ── TTS ────────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!text?.trim()) return;

    if (Platform.OS === "web") {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const doSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const utt    = new SpeechSynthesisUtterance(text);
        utt.rate     = 0.9;
        utt.lang     = "en-IN";
        utt.voice    =
          voices.find((v) => v.lang === "en-IN")  ??
          voices.find((v) => v.lang === "en-GB")  ??
          voices.find((v) => v.lang.startsWith("en")) ??
          null;
        utt.onstart = () => { isSpeakingRef.current = true; };
        utt.onend   = () => { isSpeakingRef.current = false; };
        window.speechSynthesis.speak(utt);
      };
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          doSpeak();
          window.speechSynthesis.onvoiceschanged = null;
        };
      } else {
        doSpeak();
      }
    } else {
      Speech.stop();
      isSpeakingRef.current = true;
      Speech.speak(text, {
        language:  "en-IN",   // Always en-IN — backend returns Roman transliteration for HI/TE
        rate:      0.85,
        pitch:     1.0,
        onDone:    () => { isSpeakingRef.current = false; },
        onError:   () => { isSpeakingRef.current = false; },
        onStopped: () => { isSpeakingRef.current = false; },
      });
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    } else {
      Speech.stop();
    }
    isSpeakingRef.current = false;
  }, []);

  // ── Main processor ────────────────────────────────────────────────────────
  const processCommand = useCallback(async (
    message: string,
    conversationHistory: { role: "user" | "assistant"; content: string }[] = [],
  ): Promise<JanSathiResponse> => {
    if (!message.trim()) return { message: "" };

    setIsProcessing(true);
    try {
      const data = await apiRequest("/voice/command", "POST", {
        message,
        routeMap:           buildRouteMapForAPI(),
        language,
        currentRoute:       pathname,
        currentScreenName:  getScreenName(pathname),
        conversationHistory,
      });

      const response: JanSathiResponse = {
        message:    data.message   ?? "",
        speakText:  data.speakText ?? data.message ?? "",
        navigateTo: data.navigateTo ?? undefined,
      };

      // ── Speak ────────────────────────────────────────────────────────────
      const shouldSpeak = options.forceTTS || voiceEnabled;
      if (shouldSpeak && response.speakText) {
        speak(response.speakText);
      }

      // ── Navigate — small delay so TTS starts before transition ──────────
      if (response.navigateTo) {
        setTimeout(() => {
          try { router.push(response.navigateTo as any); } catch {}
        }, 420);
      }

      return response;
    } catch {
      const fallback = t.voiceAssistant?.notUnderstood ?? "Sorry, something went wrong.";
      if (options.forceTTS || voiceEnabled) speak(fallback);
      return { message: fallback };
    } finally {
      setIsProcessing(false);
    }
  }, [language, pathname, voiceEnabled, options.forceTTS, speak, router, t]);

  return {
    processCommand,
    isProcessing,
    speak,
    stopSpeaking,
    isSpeakingRef,
  };
}