import React, { memo, useCallback, useState, useRef } from "react";
import { StyleSheet, View, Animated, PanResponder } from "react-native";
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
  const { grid, gridLayout, ghostPreview, placeBlock, settings } = useGame();

  // Animation values using React Native's Animated API (not Reanimated)
  const pan = useRef(new Animated.ValueXY()).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Track absolute position for grid calculations
  const absolutePosRef = useRef({ x: 0, y: 0 });

  // Block dimensions
  const { rows, cols } = getShapeDimensions(block.shape);
  const blockWidth = cols * inventoryCellSize;
  const blockHeight = rows * inventoryCellSize;

  // Calculate grid position from touch coordinates
  const calculateGridPosition = useCallback(
    (touchX: number, touchY: number): Position | null => {
      if (gridLayout.cellSize === 0) return null;

      const col = Math.round((touchX - gridLayout.x) / gridLayout.cellSize);
      const row = Math.round((touchY - gridLayout.y) / gridLayout.cellSize);

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
  const updateGhostPreviewFn = useCallback(
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

  // PanResponder for drag handling (no Reanimated worklets)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt, gestureState) => {
        // Scale up on drag start
        Animated.spring(scaleAnim, {
          toValue: DRAG_SCALE,
          useNativeDriver: true,
        }).start();

        triggerHaptic("light");

        // Calculate initial absolute position
        absolutePosRef.current = {
          x: evt.nativeEvent.pageX - blockWidth / 2,
          y: evt.nativeEvent.pageY - blockHeight / 2 - FINGER_OFFSET,
        };
      },

      onPanResponderMove: (evt, gestureState) => {
        // Update position
        pan.setValue({
          x: gestureState.dx,
          y: gestureState.dy - FINGER_OFFSET,
        });

        // Update absolute position for grid calculation
        absolutePosRef.current = {
          x: evt.nativeEvent.pageX - blockWidth / 2,
          y: evt.nativeEvent.pageY - blockHeight / 2 - FINGER_OFFSET,
        };

        // Update ghost preview
        updateGhostPreviewFn(absolutePosRef.current.x, absolutePosRef.current.y);
      },

      onPanResponderRelease: (evt, gestureState) => {
        const preview = ghostPreview.value;

        if (preview.position && preview.isValid) {
          // Valid placement
          const success = placeBlock(blockIndex, preview.position);
          if (success) {
            triggerHaptic("success");
            // Fade out
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }).start();
            onPlaced?.();
          }
        } else {
          // Invalid placement - spring back
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();

          if (preview.position) {
            triggerHaptic("error");
            // Shake animation
            Animated.sequence([
              Animated.timing(pan, { toValue: { x: -10, y: pan.y._value }, duration: 50, useNativeDriver: true }),
              Animated.timing(pan, { toValue: { x: 10, y: pan.y._value }, duration: 100, useNativeDriver: true }),
              Animated.timing(pan, { toValue: { x: -10, y: pan.y._value }, duration: 100, useNativeDriver: true }),
              Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }),
            ]).start();
          }
        }

        // Reset scale
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        // Clear ghost preview
        clearGhostPreview();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
      {...panResponder.panHandlers}
    >
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
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
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

