import React, { memo, useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { COLORS } from "../utils/colors";
import { getComboMultiplier, formatCombo } from "../utils/scoring";

interface ComboIndicatorProps {
  combo: number;
}

function ComboIndicatorComponent({ combo }: ComboIndicatorProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (combo > 0) {
      // Animate in with spring
      scale.value = withSpring(1, { damping: 8, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });

      // Pulse animation
      scale.value = withSequence(
        withSpring(1.2, { damping: 5, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
    } else {
      // Fade out
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.8, { duration: 300 });
    }
  }, [combo, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (combo <= 0) return null;

  const multiplier = getComboMultiplier(combo);
  const isHighCombo = combo >= 3;

  return (
    <Animated.View
      style={[styles.container, isHighCombo && styles.highCombo, animatedStyle]}
      entering={FadeIn.springify()}
      exiting={FadeOut.duration(200)}
    >
      <Animated.Text style={[styles.comboText, isHighCombo && styles.highComboText]}>
        COMBO
      </Animated.Text>
      <Animated.Text style={[styles.multiplier, isHighCombo && styles.highMultiplier]}>
        {formatCombo(multiplier)}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 120,
    right: 20,
    backgroundColor: "rgba(78, 205, 196, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.buttonPrimary,
    alignItems: "center",
  },
  highCombo: {
    backgroundColor: "rgba(255, 217, 61, 0.2)",
    borderColor: COLORS.textAccent,
  },
  comboText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.buttonPrimary,
    letterSpacing: 2,
  },
  highComboText: {
    color: COLORS.textAccent,
  },
  multiplier: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.buttonPrimary,
  },
  highMultiplier: {
    color: COLORS.textAccent,
  },
});

export const ComboIndicator = memo(ComboIndicatorComponent);

