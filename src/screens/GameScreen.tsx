import React, { useCallback, useState } from "react";
import { View, StyleSheet, SafeAreaView, StatusBar } from "react-native";
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
import { getCellsToClear, checkLineClears } from "../utils/grid";
import { Position } from "../types";

export function GameScreen() {
  const {
    grid,
    inventory,
    score,
    highScore,
    combo,
    isGameOver,
    resetGame,
    settings,
    setSettings,
  } = useGame();

  const [clearingCells, setClearingCells] = useState<Position[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const handleBlockPlaced = useCallback(
    (blockIndex: number) => {
      // Check for line clears to trigger animations
      const lineClear = checkLineClears(grid);
      if (lineClear.totalLines > 0) {
        const cells = getCellsToClear(lineClear);
        setClearingCells(cells);
        // Clear the animation state after animation completes
        setTimeout(() => {
          setClearingCells([]);
        }, 350);
      }
    },
    [grid]
  );

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
            {/* Score Display */}
            <View style={styles.header}>
              <ScoreDisplay score={score} highScore={highScore} />
              <SettingsButton onPress={handleOpenSettings} />
            </View>

            {/* Combo Indicator */}
            <ComboIndicator combo={combo} />

            {/* Game Grid */}
            <View style={styles.gridContainer}>
              <Grid grid={grid} clearingCells={clearingCells} />
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
    paddingTop: 10,
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
