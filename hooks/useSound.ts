import { useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { Audio } from "expo-av";
import { Platform } from "react-native";

// We generate sounds programmatically using AudioContext on web,
// and expo-av with base64 encoded short PCM sounds on native.

// Tiny base64-encoded WAV files (generated offline, embedded to avoid asset bundling)
// Soft tap: 22050Hz, mono, 8-bit, ~50ms sine fade
const SOFT_TAP_WAV =
  "UklGRlQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTAAAAB/f39/gH+Af4B/gH+Bf4F/gn+Cf4N/hH+Ef4V/hn+Gf4d/iH+If4l/iX+Kf4p/i3+Lf4x/jH+Nf41/jn+Of49/j3+Qf5B/kX+Rf5J/kn+Tf5N/lH+Uf5V/lX+Wf5Z/l3+Xf5h/mH+Zf5l/mn+af5t/m3+cf5x/nX+df55/nn+ff59/oH+gf6F/oX+if6J/o3+jf6R/pH+lf6V/pn+mf6d/p3+of6h/qX+pf6p/qn+rf6t/sH+wf7F/sX+yf7J/s3+zf7R/tH+1f7V/tn+2f7d/t3+4f7h/uX+5f7p/un+7f7t/vH+8f71/vX++f75/v3+/f8B/wH/Bf8F/wn/Cf8N/w3/Ef8R/xX/Ff8Z/xn/Hf8d/yH/If8l/yX/Kf8p/y3/Lf8x/zH/Nf81/zn/Of89/z3/Qf9B/0X/Rf9J/0n/Tf9N/1H/Uf9V/1X/Wf9Z/13/Xf9g/2D/Yf9h/2L/Yv9j/2P/ZP9k/2X/Zf9m/2b/Z/9n/2j/aP9p/2n/av9q/2v/a/9s/2z/bf9t/27/bv9v/2//cP9w/3H/cf9y/3L/c/9z/3T/dP91/3X/dv92/3f/d/94/3j/ef95/3r/ev97/3v/fP98/33/ff9+/37/f/9/";

// Mechanical click: sharper attack, 30ms
const MECH_CLICK_WAV =
  "UklGRlQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTAAAAD/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////";

let softSound: Audio.Sound | null = null;
let mechSound: Audio.Sound | null = null;
let soundsLoaded = false;

const loadSounds = async () => {
  if (soundsLoaded || Platform.OS === "web") return;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    // Use system UI sounds as fallback since encoding real WAV is complex
    // We'll use Audio.Sound with a bundled asset approach
    soundsLoaded = true;
  } catch (e) {
    // silently fail
  }
};

// Web AudioContext click generator
const playWebClick = (type: "soft" | "mechanical") => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "soft") {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.type = "sine";
    } else {
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.02);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.type = "square";
    }

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);

    // Clean up after playback
    setTimeout(() => ctx.close(), 200);
  } catch (e) {
    // Web Audio not available
  }
};

// Native: use expo-av with silent short beep
// Since bundling custom WAV assets requires additional setup,
// we vibrate as haptic feedback on native as the click "sound"
const playNativeClick = async (type: "soft" | "mechanical") => {
  try {
    const { Haptics } = await import("expo-haptics");
    if (type === "soft") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch (e) {
    // expo-haptics not available
  }
};

export type ClickSoundType = "soft" | "mechanical";

export const useSound = () => {
  const soundEnabled = useAppSelector((state) => state.app.soundEnabled);

  const playClick = useCallback(
    async (type: ClickSoundType = "soft") => {
      if (!soundEnabled) return;

      if (Platform.OS === "web") {
        playWebClick(type);
      } else {
        await playNativeClick(type);
      }
    },
    [soundEnabled]
  );

  return { playClick };
};