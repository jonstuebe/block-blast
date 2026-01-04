import React, { useCallback, useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { Grid } from "../components/Grid";
import { BlockInventory } from "../components/BlockInventory";
import { ScoreDisplay } from "../components/ScoreDisplay";
import { ComboIndicator } from "../components/ComboIndicator";
import { SettingsButton } from "../components/SettingsButton";
import { GameOverModal } from "./GameOverModal";
import { SettingsModal } from "./SettingsModal";
import { useGame } from "../context/GameContext";
import { COLORS } from "../utils/colors";
import { getCellsToClear } from "../utils/grid";
import { formatScore } from "../utils/scoring";
import { BlockColor } from "../types";
import type { ClearingCell } from "../components/ClearingEffect";

export function GameScreen() {
  const {
    grid,
    inventory,
    score,
    highScore,
    combo,
    linesToClear,
    isGameOver,
    isClearing,
    resetGame,
    clearComplete,
    settings,
    setSettings,
  } = useGame();

  const [clearingCells, setClearingCells] = useState<ClearingCell[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  // Handle clearing state - capture colors and start animation
  useEffect(() => {
    if (isClearing && linesToClear) {
      // Use linesToClear from context (set by state machine before clearing)
      const positions = getCellsToClear(linesToClear);
      
      // Convert positions to ClearingCells with colors from grid
      const cellsWithColors: ClearingCell[] = positions
        .map((pos) => {
          const color = grid[pos.row][pos.col];
          if (color) {
            return {
              position: pos,
              color: color as BlockColor,
            };
          }
          return null;
        })
        .filter((cell): cell is ClearingCell => cell !== null);
      
      setClearingCells(cellsWithColors);
      // Animation completion is now handled by ClearingEffect callback
    } else if (isClearing && !linesToClear) {
      // No lines to clear, just complete
      clearComplete();
    }
  }, [isClearing, linesToClear, grid, clearComplete]);

  // Handle clearing animation complete
  const handleClearingComplete = useCallback(() => {
    setClearingCells([]);
    clearComplete();
  }, [clearComplete]);

  const handleBlockPlaced = useCallback(() => {
    // Block placement is now handled by the state machine
    // This callback is just for any additional UI feedback
  }, []);

  const handleRestart = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <LinearGradient
        colors={[COLORS.backgroundStart, COLORS.backgroundEnd]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" />
          <View style={styles.container}>
            {/* Header with Score, Combo, and Settings */}
            <View style={styles.header}>
              <ScoreDisplay score={score} />
              <ComboIndicator combo={combo} />
              <View style={styles.headerRight}>
                <SettingsButton onPress={handleOpenSettings} />
                <Text style={styles.highScoreLabel}>BEST</Text>
                <Text style={styles.highScore}>{formatScore(highScore)}</Text>
              </View>
            </View>

            {/* Game Grid */}
            <View style={styles.gridContainer}>
              <Grid 
                grid={grid} 
                clearingCells={clearingCells} 
                onClearingComplete={handleClearingComplete}
              />
            </View>

            {/* Block Inventory */}
            <View style={styles.inventoryContainer}>
              <BlockInventory
                inventory={inventory}
                onBlockPlaced={handleBlockPlaced}
              />
            </View>
          </View>

          {/* Settings Modal */}
          {showSettings && (
            <SettingsModal
              settings={settings}
              onSettingsChange={setSettings}
              onClose={handleCloseSettings}
            />
          )}

          {/* Game Over Modal */}
          {isGameOver && (
            <GameOverModal
              score={score}
              highScore={highScore}
              onRestart={handleRestart}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 10,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerRight: {
    alignItems: "center",
    gap: 4,
  },
  highScoreLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  highScore: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textAccent,
  },
  gridContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inventoryContainer: {
    paddingBottom: 20,
  },
});
