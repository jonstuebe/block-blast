import React, { memo, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Block, Position } from "../types";
import { BLOCK_COLORS, COLORS } from "../utils/colors";
import { getShapeCells, getShapeDimensions } from "../utils/blocks";
import { canPlaceBlock, getBlockCellsOnGrid, GRID_SIZE } from "../utils/grid";
import { useGame } from "../context/GameContext";

interface DraggableBlockProps {
  block: Block;
  blockIndex: number;
  inventoryCellSize: number;
  onPlaced?: () => void;
}

const DRAG_SCALE = 1.1;
const FINGER_OFFSET = 80; // Pixels above finger when dragging

function DraggableBlockComponent({
  block,
  blockIndex,
  inventoryCellSize,
  onPlaced,
}: DraggableBlockProps) {
  const { grid, gridLayout, ghostPreview, startDrag, dropBlock, cancelDrag, settings } = useGame();

  // Animation shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Starting position for reset
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Current drag position (absolute on screen)
  const absoluteX = useSharedValue(0);
  const absoluteY = useSharedValue(0);

  // Block dimensions
  const { rows, cols } = getShapeDimensions(block.shape);
  const blockWidth = cols * inventoryCellSize;
  const blockHeight = rows * inventoryCellSize;

  // Calculate grid position from touch coordinates
  const calculateGridPosition = useCallback(
    (touchX: number, touchY: number): Position | null => {
      if (gridLayout.cellSize === 0) return null;

      // Calculate which cell the top-left of the block would be in
      const col = Math.round((touchX - gridLayout.x) / gridLayout.cellSize);
      const row = Math.round((touchY - gridLayout.y) / gridLayout.cellSize);

      // Check bounds
      if (
        row < 0 ||
        col < 0 ||
        row + rows > GRID_SIZE ||
        col + cols > GRID_SIZE
      ) {
        return null;
      }

      return { row, col };
    },
    [gridLayout, rows, cols]
  );

  // Update ghost preview
  const updateGhostPreview = useCallback(
    (touchX: number, touchY: number) => {
      const position = calculateGridPosition(touchX, touchY);

      if (!position) {
        ghostPreview.value = { position: null, isValid: false, cells: [] };
        return;
      }

      const isValid = canPlaceBlock(grid, block, position);
      const cells = isValid ? getBlockCellsOnGrid(block, position) : [];

      ghostPreview.value = { position, isValid, cells };
    },
    [calculateGridPosition, grid, block, ghostPreview]
  );

  // Clear ghost preview
  const clearGhostPreview = useCallback(() => {
    ghostPreview.value = { position: null, isValid: false, cells: [] };
  }, [ghostPreview]);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(
    (type: "light" | "medium" | "success" | "error") => {
      if (!settings.hapticsEnabled) return;

      switch (type) {
        case "light":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "medium":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case "success":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case "error":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    },
    [settings.hapticsEnabled]
  );

  // Handle successful placement
  const handlePlacement = useCallback(
    (position: Position) => {
      dropBlock(position);
      triggerHaptic("success");
      onPlaced?.();
    },
    [dropBlock, triggerHaptic, onPlaced]
  );

  // Handle drag start
  const handleDragStart = useCallback(() => {
    startDrag(blockIndex);
    triggerHaptic("light");
  }, [startDrag, blockIndex, triggerHaptic]);

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    cancelDrag();
  }, [cancelDrag]);

  // Shake animation for invalid placement
  const shakeAnimation = useCallback(() => {
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withRepeat(withTiming(10, { duration: 100 }), 3, true),
      withSpring(0, { damping: 12 })
    );
  }, [translateX]);

  // Pan gesture handler
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      "worklet";
      // Store starting position
      startX.value = translateX.value;
      startY.value = translateY.value;

      // Calculate absolute position
      absoluteX.value = event.absoluteX - blockWidth / 2;
      absoluteY.value = event.absoluteY - blockHeight / 2 - FINGER_OFFSET;

      // Scale up
      scale.value = withSpring(DRAG_SCALE, { damping: 12, stiffness: 200 });

      // Notify state machine
      runOnJS(handleDragStart)();
    })
    .onUpdate((event) => {
      "worklet";
      // Update position (relative to start)
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY - FINGER_OFFSET;

      // Update absolute position for grid calculation
      absoluteX.value = event.absoluteX - blockWidth / 2;
      absoluteY.value = event.absoluteY - blockHeight / 2 - FINGER_OFFSET;

      // Update ghost preview (on JS thread)
      runOnJS(updateGhostPreview)(absoluteX.value, absoluteY.value);
    })
    .onEnd(() => {
      "worklet";
      // Get current ghost preview state
      const preview = ghostPreview.value;

      if (preview.position && preview.isValid) {
        // Valid placement - animate to grid position and fade out
        scale.value = withTiming(0.9, { duration: 100 });
        opacity.value = withTiming(0, { duration: 150 });

        // Handle placement on JS thread
        runOnJS(handlePlacement)(preview.position);
      } else {
        // Invalid placement - rubber band back
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });

        // Shake if was over grid
        if (preview.position) {
          runOnJS(shakeAnimation)();
          runOnJS(triggerHaptic)("error");
        }

        // Cancel drag in state machine
        runOnJS(handleDragCancel)();
      }

      // Reset scale
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });

      // Clear ghost preview
      runOnJS(clearGhostPreview)();
    });

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {block.shape.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => (
              <View
                key={`${rowIndex}-${colIndex}`}
                style={[
                  styles.cell,
                  {
                    width: inventoryCellSize,
                    height: inventoryCellSize,
                    backgroundColor: cell
                      ? BLOCK_COLORS[block.color]
                      : "transparent",
                    borderWidth: cell ? 2 : 0,
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.3,
    elevation: 8,
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
  },
});

export const DraggableBlock = memo(DraggableBlockComponent);
