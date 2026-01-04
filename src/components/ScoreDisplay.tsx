import React, { memo, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useDerivedValue,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { COLORS } from "../utils/colors";
import { formatScore } from "../utils/scoring";

interface ScoreDisplayProps {
  score: number;
  highScore: number;
}

function ScoreDisplayComponent({ score, highScore }: ScoreDisplayProps) {
  // Animated score value for smooth counting
  const animatedScore = useSharedValue(0);
  const displayScore = useSharedValue("0");

  // Scale animation when score changes
  const scaleValue = useSharedValue(1);

  // Update animated score when score changes
  useEffect(() => {
    // Animate the score number
    animatedScore.value = withTiming(score, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });

    // Pop animation
    scaleValue.value = withSpring(1.1, { damping: 5 }, () => {
      scaleValue.value = withSpring(1, { damping: 12 });
    });
  }, [score, animatedScore, scaleValue]);

  // Derive display score from animated value
  useDerivedValue(() => {
    const rounded = Math.floor(animatedScore.value);
    runOnJS(setDisplayScore)(rounded);
  }, [animatedScore]);

  const [scoreText, setDisplayScore] = React.useState(0);

  const animatedScoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.scoreContainer}>
        <Text style={styles.label}>SCORE</Text>
        <Animated.View style={animatedScoreStyle}>
          <Text style={styles.score}>{formatScore(scoreText)}</Text>
        </Animated.View>
      </View>
      <View style={styles.highScoreContainer}>
        <Text style={styles.highScoreLabel}>BEST</Text>
        <Text style={styles.highScore}>{formatScore(highScore)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  scoreContainer: {
    alignItems: "center",
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
  highScoreContainer: {
    alignItems: "center",
  },
  highScoreLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  highScore: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textAccent,
  },
});

export const ScoreDisplay = memo(ScoreDisplayComponent);

