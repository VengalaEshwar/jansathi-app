// components/VoiceInput.tsx
import { useState, useCallback, memo } from "react";
import { ActivityIndicator } from "react-native";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useAppSelector } from "@/store/hooks";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInput = memo(({ onTranscript, disabled }: VoiceInputProps) => {
  const [recording,    setRecording]    = useState<Audio.Recording | null>(null);
  const [isRecording,  setIsRecording]  = useState(false);
  const theme  = useAppSelector((s: any) => s.app?.theme ?? "dark");
  const isDark = theme === "dark";

  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) { alert("Microphone permission required"); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch (err) { console.log("Failed to start recording", err); }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    setRecording(null);
    // TODO: send audio URI to transcription API
    onTranscript("This is a simulated voice input text.");
  }, [recording, onTranscript]);

  return (
    <AnimatedPressable
      onPress={isRecording ? stopRecording : startRecording}
      disabled={disabled}
      soundType="soft"
      style={{
        width: 48, height: 48, borderRadius: 24,
        alignItems: "center", justifyContent: "center",
        backgroundColor: isRecording ? "#EF4444" : isDark ? "#1E293B" : "white",
        borderWidth: 1.5,
        borderColor: isRecording ? "#EF4444" : isDark ? "#334155" : "#E2E8F0",
        shadowColor: isRecording ? "#EF4444" : "#000",
        shadowOffset: { width: 0, height: isRecording ? 4 : 2 },
        shadowOpacity: isRecording ? 0.35 : 0.06,
        shadowRadius: isRecording ? 10 : 6,
        elevation: isRecording ? 5 : 2,
      }}>
      {isRecording
        ? <MicOff size={20} color="white" />
        : <Mic    size={20} color="#8B5CF6" />}
    </AnimatedPressable>
  );
});

// ── TextToSpeech ──────────────────────────────────────────────────────────────
interface TextToSpeechProps {
  text: string;
  language?: string;
}

export const TextToSpeech = memo(({ text, language = "en-IN" }: TextToSpeechProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const theme  = useAppSelector((s: any) => s.app?.theme ?? "dark");
  const isDark = theme === "dark";

  const handlePress = useCallback(() => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    Speech.speak(text.replace(/[#*|]/g, ""), {
      language,
      rate: 0.9,
      onDone:    () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError:   () => setIsSpeaking(false),
    });
  }, [isSpeaking, text, language]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      soundType="soft"
      style={{
        width: 40, height: 40, borderRadius: 12,
        alignItems: "center", justifyContent: "center",
        backgroundColor: isSpeaking ? "#8B5CF615" : isDark ? "#1E293B" : "white",
        borderWidth: 1.5,
        borderColor: isSpeaking ? "#8B5CF650" : isDark ? "#334155" : "#E2E8F0",
      }}>
      {isSpeaking
        ? <ActivityIndicator size="small" color="#8B5CF6" />
        : <Volume2 size={18} color="#8B5CF6" />}
    </AnimatedPressable>
  );
});