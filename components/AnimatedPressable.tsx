import { useRef, ReactNode } from "react";
import {
  Pressable,
  Animated,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useSound, ClickSoundType } from "@/hooks/useSound";

interface AnimatedPressableProps extends PressableProps {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  soundType?: ClickSoundType;
  scaleAmount?: number; // default 0.95
  disableSound?: boolean;
}

export const AnimatedPressable = ({
  children,
  onPress,
  className,
  style,
  soundType = "soft",
  scaleAmount = 0.95,
  disableSound = false,
  disabled,
  ...rest
}: AnimatedPressableProps) => {
  const scale = useRef(new Animated.Value(1)).current;
  const { playClick } = useSound();

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: scaleAmount,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  const handlePress = (e: any) => {
    if (!disableSound) playClick(soundType);
    onPress?.(e);
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        className={className}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};