import React, { useCallback, memo } from "react";
import { View, StyleSheet, useWindowDimensions, LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedStyle, useAnimatedReaction, runOnJS } from "react-native-reanimated";
import { Grid as GridType, Position, GhostPreview } from "../types";
import { GRID_SIZE } from "../utils/grid";
import { COLORS } from "../utils/colors";
import { Cell } from "./Cell";
import { useGame } from "../context/GameContext";

interface GridProps {
  grid: GridType;
  clearingCells?: Position[];
}

function GridComponent({ grid, clearingCells = [] }: GridProps) {
  const { width: screenWidth } = useWindowDimensions();
  const { setGridLayout, ghostPreview } = useGame();

  // Calculate grid size (90% of screen width)
  const gridWidth = screenWidth * 0.9;
  const cellSize = Math.floor(gridWidth / GRID_SIZE);
  const actualGridSize = cellSize * GRID_SIZE;

  // Track ghost preview state for rendering
  const [ghostState, setGhostState] = React.useState<GhostPreview>({
    position: null,
    isValid: false,
    cells: [],
  });

  // React to ghost preview changes on UI thread
  useAnimatedReaction(
    () => ghostPreview.value,
    (current, previous) => {
      if (JSON.stringify(current) !== JSON.stringify(previous)) {
        runOnJS(setGhostState)(current);
      }
    },
    [ghostPreview]
  );

  // Update grid layout when measured
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      // Get absolute position on screen
      event.target.measureInWindow((absoluteX, absoluteY) => {
        setGridLayout({
          x: absoluteX,
          y: absoluteY,
          width,
          height,
          cellSize,
        });
      });
    },
    [setGridLayout, cellSize]
  );

  // Check if a cell is being cleared
  const isCellClearing = useCallback(
    (row: number, col: number): boolean => {
      return clearingCells.some((cell) => cell.row === row && cell.col === col);
    },
    [clearingCells]
  );

  // Check if a cell has ghost preview
  const getGhostState = useCallback(
    (row: number, col: number): { isGhost: boolean; isValid: boolean } => {
      const isGhost = ghostState.cells.some(
        (cell) => cell.row === row && cell.col === col
      );
      return { isGhost, isValid: ghostState.isValid };
    },
    [ghostState]
  );

  return (
    <View
      style={[styles.container, { width: actualGridSize, height: actualGridSize }]}
      onLayout={handleLayout}
    >
      {grid.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell, colIndex) => {
            const ghost = getGhostState(rowIndex, colIndex);
            const isClearing = isCellClearing(rowIndex, colIndex);

            return (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                color={ghost.isGhost && !cell ? null : cell}
                size={cellSize}
                isGhost={ghost.isGhost && !cell}
                isGhostValid={ghost.isValid}
                isClearing={isClearing}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.gridBackground,
    borderRadius: 8,
    padding: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  row: {
    flexDirection: "row",
  },
});

export const Grid = memo(GridComponent);

