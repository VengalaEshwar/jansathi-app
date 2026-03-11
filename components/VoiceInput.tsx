import { useState } from "react";
import { Pressable, ActivityIndicator } from "react-native";
import { Mic, MicOff, Volume2 } from "lucide-react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInput = ({ onTranscript, disabled }: VoiceInputProps) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert("Microphone permission required");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.log("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    console.log("Audio recorded at:", uri);

    onTranscript("This is a simulated voice input text.");
  };

  return (
    <Pressable
      onPress={isRecording ? stopRecording : startRecording}
      disabled={disabled}
      className={`w-12 h-12 rounded-full items-center justify-center ${
        isRecording
          ? "bg-red-500"
          : "bg-light-card dark:bg-card border border-light-border dark:border-border"
      }`}
    >
      {isRecording ? (
        <MicOff size={20} color="white" />
      ) : (
        <Mic size={20} color="#8B5CF6" />
      )}
    </Pressable>
  );
};

export const TextToSpeech = ({ text }: { text: string }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = () => {
    setIsSpeaking(true);
    Speech.speak(text, {
      language: "en",
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  return (
    <Pressable
      onPress={speak}
      disabled={isSpeaking}
      className="w-10 h-10 rounded-full items-center justify-center border border-light-border dark:border-border bg-light-card dark:bg-card"
    >
      {isSpeaking ? (
        <ActivityIndicator size="small" color="#8B5CF6" />
      ) : (
        <Volume2 size={18} color="#8B5CF6" />
      )}
    </Pressable>
  );
};