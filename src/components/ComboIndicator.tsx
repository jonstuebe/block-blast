import React, { memo, useEffect, useRef } from "react";
import { StyleSheet, Animated, Text } from "react-native";
import { COLORS } from "../utils/colors";
import { getComboMultiplier, formatCombo } from "../utils/scoring";

interface ComboIndicatorProps {
  combo: number;
}

function ComboIndicatorComponent({ combo }: ComboIndicatorProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (combo > 0) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Pulse animation
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.2,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Fade out
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [combo, scaleAnim, opacityAnim]);

  if (combo <= 0) return null;

  const multiplier = getComboMultiplier(combo);
  const isHighCombo = combo >= 3;

  return (
    <Animated.View
      style={[
        styles.container,
        isHighCombo && styles.highCombo,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Text style={[styles.comboText, isHighCombo && styles.highComboText]}>
        COMBO
      </Text>
      <Text style={[styles.multiplier, isHighCombo && styles.highMultiplier]}>
        {formatCombo(multiplier)}
      </Text>
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

