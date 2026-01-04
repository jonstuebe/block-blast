import React, { memo, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { COLORS } from "../utils/colors";
import { formatScore } from "../utils/scoring";

interface ScoreDisplayProps {
  score: number;
}

function ScoreDisplayComponent({ score }: ScoreDisplayProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [displayScore, setDisplayScore] = React.useState(score);

  // Animate score changes
  useEffect(() => {
    // Pop animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate score counting
    const startScore = displayScore;
    const endScore = score;
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(startScore + (endScore - startScore) * progress);
      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }, [score]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>SCORE</Text>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Text style={styles.score}>{formatScore(displayScore)}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  score: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

export const ScoreDisplay = memo(ScoreDisplayComponent);

