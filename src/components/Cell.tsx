import React, { memo, useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { GridCell, BlockColor } from "../types";
import { BLOCK_COLORS, COLORS } from "../utils/colors";

interface CellProps {
  color: GridCell;
  size: number;
  isGhost?: boolean;
  isGhostValid?: boolean;
  isClearing?: boolean;
  highlightColor?: BlockColor | null;
}

function CellComponent({
  color,
  size,
  isGhost = false,
  isGhostValid = true,
  isClearing = false,
  highlightColor = null,
}: CellProps) {
  // Determine the background color based on state
  // Priority: ghost preview > highlight color (for line clear preview) > actual color
  const backgroundColor = isGhost
    ? isGhostValid
      ? COLORS.ghostValid
      : COLORS.ghostInvalid
    : highlightColor && color
    ? BLOCK_COLORS[highlightColor]
    : color
    ? BLOCK_COLORS[color]
    : COLORS.cellEmpty;

  const isFilled = color && !isGhost;
  const isHighlighted = highlightColor && color && !isGhost;

  // When clearing, instantly hide the cell - particles handle the visual effect
  const cellOpacity = isClearing ? 0 : 1;

  // Animation for glow/pulse effect on highlighted cells
  const glowOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isHighlighted) {
      // Start pulsing glow effect
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite repeat
        true // Reverse
      );
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      // Stop animation and reset
      cancelAnimation(glowOpacity);
      cancelAnimation(pulseScale);
      glowOpacity.value = withTiming(0, { duration: 150 });
      pulseScale.value = withTiming(1, { duration: 150 });
    }
  }, [isHighlighted, glowOpacity, pulseScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    shadowOpacity: isHighlighted ? 0.6 + glowOpacity.value * 0.4 : 0.3,
    shadowRadius: isHighlighted ? 4 + glowOpacity.value * 6 : 2,
  }));

  return (
    <Animated.View
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor,
          opacity: cellOpacity,
        },
        isFilled && styles.filledCell,
        isHighlighted && {
          shadowColor: backgroundColor,
          elevation: 8,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  cell: {
    borderWidth: 1,
    borderColor: COLORS.gridLine,
    borderRadius: 4,
  },
  filledCell: {
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});

export const Cell = memo(CellComponent);

