import React, { createContext, useContext, ReactNode, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMachine } from "@xstate/react";
import { gameMachine } from "../machines/gameMachine";
import { GridLayout, GhostPreview, Settings, Grid, Block, Position, LineClearResult } from "../types";
import { useSharedValue } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { canPlaceBlock } from "../utils/grid";

const HIGH_SCORE_KEY = "@blockblast:highscore";
const SETTINGS_KEY = "@blockblast:settings";

interface GameContextType {
  // State from machine
  grid: Grid;
  inventory: (Block | null)[];
  score: number;
  highScore: number;
  combo: number;
  linesToClear: LineClearResult | null;
  isGameOver: boolean;
  isDragging: boolean;
  isClearing: boolean;

  // Actions
  startDrag: (blockIndex: number) => void;
  updateDrag: (position: Position | null, isValid: boolean) => void;
  cancelDrag: () => void;
  dropBlock: (position: Position) => void;
  clearComplete: () => void;
  resetGame: () => void;
  canPlaceBlockAt: (block: Block, position: Position) => boolean;

  // Grid layout for coordinate calculations
  gridLayout: GridLayout;
  setGridLayout: (layout: GridLayout) => void;

  // Ghost preview shared values (for real-time updates on UI thread)
  ghostPreview: SharedValue<GhostPreview>;

  // Settings
  settings: Settings;
  setSettings: (settings: Settings) => void;
}

const GameContext = createContext<GameContextType | null>(null);

interface GameProviderProps {
  children: ReactNode;
}

const defaultSettings: Settings = {
  soundEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
};

export function GameProvider({ children }: GameProviderProps) {
  const [state, send] = useMachine(gameMachine, { input: {} });
  
  const [gridLayout, setGridLayout] = React.useState<GridLayout>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    cellSize: 0,
  });

  const [settings, setSettingsState] = React.useState<Settings>(defaultSettings);

  // Shared value for ghost preview (updates on UI thread)
  const ghostPreview = useSharedValue<GhostPreview>({
    position: null,
    isValid: false,
    cells: [],
    highlightedCells: [],
    highlightColor: null,
  });

  // Load high score from storage on mount
  useEffect(() => {
    async function loadHighScore() {
      try {
        const stored = await AsyncStorage.getItem(HIGH_SCORE_KEY);
        if (stored) {
          send({ type: "LOAD_HIGH_SCORE", highScore: parseInt(stored, 10) });
        }
      } catch (error) {
        console.error("Failed to load high score:", error);
      }
    }
    loadHighScore();
  }, [send]);

  // Save high score when it changes
  useEffect(() => {
    async function saveHighScore() {
      try {
        await AsyncStorage.setItem(HIGH_SCORE_KEY, state.context.highScore.toString());
      } catch (error) {
        console.error("Failed to save high score:", error);
      }
    }
    if (state.context.highScore > 0) {
      saveHighScore();
    }
  }, [state.context.highScore]);

  // Load settings from storage on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) {
          setSettingsState(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
    loadSettings();
  }, []);

  // Save settings when they change
  const setSettings = useCallback(async (newSettings: Settings) => {
    setSettingsState(newSettings);
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, []);

  // Actions
  const startDrag = useCallback((blockIndex: number) => {
    send({ type: "DRAG_START", blockIndex });
  }, [send]);

  const updateDrag = useCallback((position: Position | null, isValid: boolean) => {
    send({ type: "DRAG_UPDATE", position, isValid });
  }, [send]);

  const cancelDrag = useCallback(() => {
    send({ type: "DRAG_CANCEL" });
  }, [send]);

  const dropBlock = useCallback((position: Position) => {
    send({ type: "DROP_BLOCK", position });
  }, [send]);

  const clearComplete = useCallback(() => {
    send({ type: "CLEAR_COMPLETE" });
  }, [send]);

  const resetGame = useCallback(() => {
    send({ type: "RESTART" });
  }, [send]);

  const canPlaceBlockAt = useCallback((block: Block, position: Position): boolean => {
    return canPlaceBlock(state.context.grid, block, position);
  }, [state.context.grid]);

  const value: GameContextType = {
    // State from machine context
    grid: state.context.grid,
    inventory: state.context.inventory,
    score: state.context.score,
    highScore: state.context.highScore,
    combo: state.context.combo,
    linesToClear: state.context.linesToClear,
    isGameOver: state.matches("gameOver"),
    isDragging: state.matches("dragging"),
    isClearing: state.matches("clearing"),

    // Actions
    startDrag,
    updateDrag,
    cancelDrag,
    dropBlock,
    clearComplete,
    resetGame,
    canPlaceBlockAt,

    // Layout
    gridLayout,
    setGridLayout,

    // Ghost preview
    ghostPreview,

    // Settings
    settings,
    setSettings,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
