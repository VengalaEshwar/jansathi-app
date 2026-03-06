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

    // ⚠️ Here you normally send audio to a Speech-to-Text API
    // For now we simulate transcription
    onTranscript("This is a simulated voice input text.");
  };

  return (
    <Pressable
      onPress={isRecording ? stopRecording : startRecording}
      disabled={disabled}
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: isRecording ? "#ef4444" : "#e5e7eb",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
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
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#ddd",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {isSpeaking ? (
        <ActivityIndicator size="small" />
      ) : (
        <Volume2 size={18} />
      )}
    </Pressable>
  );
};

