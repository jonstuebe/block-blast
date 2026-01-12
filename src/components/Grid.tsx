import React, { useCallback, memo, useEffect } from "react";
import { View, StyleSheet, useWindowDimensions, LayoutChangeEvent } from "react-native";
import { Grid as GridType, Position, GhostPreview, BlockColor } from "../types";
import { GRID_SIZE } from "../utils/grid";
import { COLORS } from "../utils/colors";
import { Cell } from "./Cell";
import { ClearingEffect, ClearingCell } from "./ClearingEffect";
import { useGame } from "../context/GameContext";

interface GridProps {
  grid: GridType;
  clearingCells?: ClearingCell[];
  onClearingComplete?: () => void;
}

function GridComponent({ grid, clearingCells = [], onClearingComplete }: GridProps) {
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
    highlightedCells: [],
    highlightColor: null,
  });

  // Sync ghost preview from shared value to React state using polling
  // This avoids worklet issues with useAnimatedReaction
  useEffect(() => {
    let lastValue = JSON.stringify(ghostPreview.value);
    const interval = setInterval(() => {
      const currentValue = JSON.stringify(ghostPreview.value);
      if (currentValue !== lastValue) {
        lastValue = currentValue;
        setGhostState(ghostPreview.value);
      }
    }, 16); // ~60fps polling
    return () => clearInterval(interval);
  }, [ghostPreview]);

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
      return clearingCells.some((cell) => cell.position.row === row && cell.position.col === col);
    },
    [clearingCells]
  );

  // Handle clearing animation complete
  const handleClearingComplete = useCallback(() => {
    onClearingComplete?.();
  }, [onClearingComplete]);

  // Check if a cell has ghost preview or is highlighted for line clear
  const getGhostState = useCallback(
    (row: number, col: number): { isGhost: boolean; isValid: boolean; highlightColor: BlockColor | null } => {
      const isGhost = ghostState.cells.some(
        (cell) => cell.row === row && cell.col === col
      );
      
      // Check if this cell is in a row/column that would be cleared
      const isHighlighted = ghostState.highlightedCells.some(
        (cell) => cell.row === row && cell.col === col
      );
      
      return { 
        isGhost, 
        isValid: ghostState.isValid,
        highlightColor: isHighlighted ? ghostState.highlightColor : null,
      };
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
                highlightColor={ghost.highlightColor}
              />
            );
          })}
        </View>
      ))}
      
      {/* Particle effect overlay for clearing animation */}
      {clearingCells.length > 0 && (
        <ClearingEffect
          cells={clearingCells}
          cellSize={cellSize}
          onComplete={handleClearingComplete}
        />
      )}
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

