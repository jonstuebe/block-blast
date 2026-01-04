import React, { memo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  FadeOut,
  ZoomOut,
} from "react-native-reanimated";
import { GridCell, BlockColor } from "../types";
import { BLOCK_COLORS, COLORS } from "../utils/colors";

interface CellProps {
  color: GridCell;
  size: number;
  isGhost?: boolean;
  isGhostValid?: boolean;
  isClearing?: boolean;
}

function CellComponent({
  color,
  size,
  isGhost = false,
  isGhostValid = true,
  isClearing = false,
}: CellProps) {
  const animatedStyle = useAnimatedStyle(() => {
    if (isClearing) {
      return {
        transform: [{ scale: withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }) }],
        opacity: withTiming(0, { duration: 300 }),
      };
    }

    if (color && !isGhost) {
      // Animate new blocks appearing
      return {
        transform: [{ scale: withSpring(1, { damping: 12, stiffness: 200 }) }],
        opacity: 1,
      };
    }

    return {
      transform: [{ scale: 1 }],
      opacity: 1,
    };
  }, [color, isClearing, isGhost]);

  const backgroundColor = isGhost
    ? isGhostValid
      ? COLORS.ghostValid
      : COLORS.ghostInvalid
    : color
    ? BLOCK_COLORS[color]
    : COLORS.cellEmpty;

  return (
    <Animated.View
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor,
        },
        color && !isGhost && styles.filledCell,
        animatedStyle,
      ]}
      exiting={isClearing ? FadeOut.duration(300).withInitialValues({ opacity: 1 }) : undefined}
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

