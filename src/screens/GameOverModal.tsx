import React, { memo, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  FadeIn,
  SlideInDown,
} from "react-native-reanimated";
import { COLORS } from "../utils/colors";
import { formatScore } from "../utils/scoring";

interface GameOverModalProps {
  score: number;
  highScore: number;
  onRestart: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GameOverModalComponent({
  score,
  highScore,
  onRestart,
}: GameOverModalProps) {
  const isNewHighScore = score >= highScore && score > 0;

  // Button animation
  const buttonScale = useSharedValue(1);

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15 });
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <Animated.View
      style={styles.overlay}
      entering={FadeIn.duration(300)}
    >
      <Animated.View
        style={styles.modal}
        entering={SlideInDown.springify().damping(15)}
      >
        <Text style={styles.gameOverText}>GAME OVER</Text>

        {isNewHighScore && (
          <Animated.View
            entering={FadeIn.delay(300).springify()}
            style={styles.newHighScoreContainer}
          >
            <Text style={styles.newHighScoreText}>NEW HIGH SCORE!</Text>
          </Animated.View>
        )}

        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.finalScore}>{formatScore(score)}</Text>
        </View>

        <View style={styles.highScoreSection}>
          <Text style={styles.highScoreLabel}>BEST</Text>
          <Text style={styles.highScoreValue}>{formatScore(highScore)}</Text>
        </View>

        <AnimatedPressable
          style={[styles.restartButton, buttonAnimatedStyle]}
          onPress={onRestart}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.restartText}>PLAY AGAIN</Text>
        </AnimatedPressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: COLORS.modalBackground,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    minWidth: 280,
  },
  gameOverText: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    letterSpacing: 4,
    marginBottom: 16,
  },
  newHighScoreContainer: {
    backgroundColor: "rgba(255, 217, 61, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 24,
  },
  newHighScoreText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textAccent,
    letterSpacing: 2,
  },
  scoreSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  finalScore: {
    fontSize: 56,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  highScoreSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  highScoreLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  highScoreValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textAccent,
  },
  restartButton: {
    backgroundColor: COLORS.buttonPrimary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: COLORS.buttonPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  restartText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.backgroundStart,
    letterSpacing: 2,
  },
});

export const GameOverModal = memo(GameOverModalComponent);

