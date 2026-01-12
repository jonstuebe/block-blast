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
import {
  getShapeCells,
  getShapeDimensions,
  getPerimeterCells,
} from "../utils/blocks";
import {
  canPlaceBlock,
  getBlockCellsOnGrid,
  GRID_SIZE,
  predictLineClearsAfterPlacement,
} from "../utils/grid";
import { useGame } from "../context/GameContext";

interface DraggableBlockProps {
  block: Block;
  blockIndex: number;
  inventoryCellSize: number;
  onPlaced?: () => void;
}

const DRAG_SCALE = 1.0;
const INVENTORY_SCALE = 0.6;
const VERTICAL_OFFSET = 80; // Pixels above finger when dragging

function DraggableBlockComponent({
  block,
  blockIndex,
  inventoryCellSize,
  onPlaced,
}: DraggableBlockProps) {
  const {
    grid,
    gridLayout,
    ghostPreview,
    startDrag,
    dropBlock,
    cancelDrag,
    settings,
  } = useGame();

  // State for ghost position (screen coordinates)
  const [ghostX, setGhostX] = React.useState(0);
  const [ghostY, setGhostY] = React.useState(0);

  // Animation shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(INVENTORY_SCALE);
  const opacity = useSharedValue(1);

  // Starting position for reset
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Track where user initially touched within the block (relative to block center)
  const touchOffsetX = useSharedValue(0);
  const touchOffsetY = useSharedValue(0);

  // Block dimensions
  const { rows, cols } = getShapeDimensions(block.shape);
  const blockWidth = cols * inventoryCellSize;
  const blockHeight = rows * inventoryCellSize;

  // Calculate overlap between a block cell and grid cell
  const calculateOverlap = useCallback(
    (
      blockCellRow: number,
      blockCellCol: number,
      gridRow: number,
      gridCol: number
    ): number => {
      if (gridLayout.cellSize === 0 || inventoryCellSize === 0) return 0;

      const blockCellScreenX = ghostX + blockCellCol * inventoryCellSize;
      const blockCellScreenY = ghostY + blockCellRow * inventoryCellSize;

      const gridCellScreenX = gridLayout.x + gridCol * gridLayout.cellSize;
      const gridCellScreenY = gridLayout.y + gridRow * gridLayout.cellSize;

      const blockCellRight = blockCellScreenX + inventoryCellSize;
      const blockCellBottom = blockCellScreenY + inventoryCellSize;
      const gridCellRight = gridCellScreenX + gridLayout.cellSize;
      const gridCellBottom = gridCellScreenY + gridLayout.cellSize;

      const left = Math.max(blockCellScreenX, gridCellScreenX);
      const right = Math.min(blockCellRight, gridCellRight);
      const top = Math.max(blockCellScreenY, gridCellScreenY);
      const bottom = Math.min(blockCellBottom, gridCellBottom);

      const overlapWidth = Math.max(0, right - left);
      const overlapHeight = Math.max(0, bottom - top);
      const overlapArea = overlapWidth * overlapHeight;

      const gridCellArea = gridLayout.cellSize * gridLayout.cellSize;
      return (overlapArea / gridCellArea) * 100;
    },
    [gridLayout, inventoryCellSize, ghostX, ghostY]
  );

  // Calculate grid position using perimeter overlap detection
  const calculateGridPosition = useCallback(
    (screenX: number, screenY: number): Position | null => {
      if (gridLayout.cellSize === 0) return null;

      const perimeterCells = getPerimeterCells(block.shape);

      let bestPosition: Position | null = null;
      let bestScore = -1;

      for (let startRow = 0; startRow <= GRID_SIZE - rows; startRow++) {
        for (let startCol = 0; startCol <= GRID_SIZE - cols; startCol++) {
          let totalOverlap = 0;
          let validCellCount = 0;
          let hasCollision = false;

          for (const cell of perimeterCells) {
            const gridRow = startRow + cell.row;
            const gridCol = startCol + cell.col;

            if (grid[gridRow][gridCol]) {
              hasCollision = true;
              break;
            }

            const overlap = calculateOverlap(
              cell.row,
              cell.col,
              gridRow,
              gridCol
            );

            totalOverlap += overlap;
            validCellCount++;
          }

          if (hasCollision || validCellCount === 0) continue;

          const averageOverlap = totalOverlap / validCellCount;

          if (averageOverlap > 50 && averageOverlap > bestScore) {
            bestScore = averageOverlap;
            bestPosition = { row: startRow, col: startCol };
          }
        }
      }

      // If overlap detection fails, try center-point detection as fallback
      if (!bestPosition) {
        // Get all filled cells and calculate shape center
        const shapeCells = getShapeCells(block.shape);
        const centerRow =
          shapeCells.reduce((sum, c) => sum + c.row, 0) / shapeCells.length;
        const centerCol =
          shapeCells.reduce((sum, c) => sum + c.col, 0) / shapeCells.length;

        // Center point in screen coordinates
        const centerScreenX = screenX + (centerCol + 0.5) * inventoryCellSize;
        const centerScreenY = screenY + (centerRow + 0.5) * inventoryCellSize;

        // Which grid cell contains this center?
        const centerGridCol = Math.floor(
          (centerScreenX - gridLayout.x) / gridLayout.cellSize
        );
        const centerGridRow = Math.floor(
          (centerScreenY - gridLayout.y) / gridLayout.cellSize
        );

        // Calculate implied start position
        const impliedStartCol = centerGridCol - Math.floor(centerCol);
        const impliedStartRow = centerGridRow - Math.floor(centerRow);

        // Check bounds and use as fallback position
        if (
          impliedStartRow >= 0 &&
          impliedStartRow <= GRID_SIZE - rows &&
          impliedStartCol >= 0 &&
          impliedStartCol <= GRID_SIZE - cols
        ) {
          bestPosition = { row: impliedStartRow, col: impliedStartCol };
        }
      }

      return bestPosition;
    },
    [grid, block, gridLayout, rows, cols, inventoryCellSize, calculateOverlap]
  );

  // Update ghost preview
  const updateGhostPreview = useCallback(
    (screenX: number, screenY: number) => {
      setGhostX(screenX);
      setGhostY(screenY);

      const position = calculateGridPosition(screenX, screenY);

      if (!position) {
        ghostPreview.value = {
          position: null,
          isValid: false,
          cells: [],
          highlightedCells: [],
          highlightColor: null,
        };
        return;
      }

      const isValid = canPlaceBlock(grid, block, position);
      const cells = isValid ? getBlockCellsOnGrid(block, position) : [];

      // Calculate which cells would be cleared if block is placed here
      const highlightedCells = isValid
        ? predictLineClearsAfterPlacement(grid, block, position)
        : [];
      const highlightColor = highlightedCells.length > 0 ? block.color : null;

      ghostPreview.value = {
        position,
        isValid,
        cells,
        highlightedCells,
        highlightColor,
      };
    },
    [calculateGridPosition, grid, block, ghostPreview]
  );

  // Clear ghost preview
  const clearGhostPreview = useCallback(() => {
    ghostPreview.value = {
      position: null,
      isValid: false,
      cells: [],
      highlightedCells: [],
      highlightColor: null,
    };
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

  // Minimum touch target size (Apple recommends 44pt)
  const MIN_TOUCH_TARGET = 44;
  const scaledBlockWidth = blockWidth * INVENTORY_SCALE;
  const scaledBlockHeight = blockHeight * INVENTORY_SCALE;
  const horizontalPadding = Math.max(
    0,
    (MIN_TOUCH_TARGET - scaledBlockWidth) / 2
  );
  const verticalPadding = Math.max(
    0,
    (MIN_TOUCH_TARGET - scaledBlockHeight) / 2
  );

  // Pan gesture handler with generous hit slop for easier grabbing
  const panGesture = Gesture.Pan()
    .hitSlop({
      horizontal: Math.max(30, horizontalPadding + 15),
      vertical: Math.max(30, verticalPadding + 15),
    })
    .onStart((event) => {
      "worklet";
      // Store starting position
      startX.value = translateX.value;
      startY.value = translateY.value - VERTICAL_OFFSET;

      // Calculate offset from touch point to block center
      // event.x/y are relative to gesture handler
      // Account for INVENTORY_SCALE since block is displayed at 0.6 scale initially
      touchOffsetX.value = (event.x - blockWidth / 2) * INVENTORY_SCALE;
      touchOffsetY.value = (event.y - blockHeight / 2) * INVENTORY_SCALE;

      scale.value = DRAG_SCALE;

      // Notify state machine
      runOnJS(handleDragStart)();
    })
    .onUpdate((event) => {
      "worklet";
      // Update visual position (relative to start)
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;

      // Calculate ghost position: center horizontally, VERTICAL_OFFSET above finger
      const ghostScreenX =
        event.absoluteX - touchOffsetX.value - blockWidth / 2;
      const ghostScreenY =
        event.absoluteY -
        touchOffsetY.value -
        VERTICAL_OFFSET -
        blockHeight / 2;

      // Update ghost preview
      runOnJS(updateGhostPreview)(ghostScreenX, ghostScreenY);
    })
    .onEnd((event) => {
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
        // Invalid placement - smooth return to origin
        translateX.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
        translateY.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });

        // Shake if was over grid
        if (preview.position) {
          runOnJS(shakeAnimation)();
          runOnJS(triggerHaptic)("error");
        }

        // Cancel drag in state machine
        runOnJS(handleDragCancel)();
      }

      // Reset scale
      scale.value = INVENTORY_SCALE;

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
