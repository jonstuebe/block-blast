import React, { createContext, useContext, ReactNode, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGameState, UseGameStateReturn } from "../hooks/useGameState";
import { GridLayout, GhostPreview, Settings } from "../types";
import { useSharedValue } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

const SETTINGS_KEY = "@blockblast:settings";

interface GameContextType extends UseGameStateReturn {
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
  const gameState = useGameState();
  const [gridLayout, setGridLayout] = React.useState<GridLayout>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    cellSize: 0,
  });

  const [settings, setSettingsState] = React.useState<Settings>(defaultSettings);

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

  // Shared value for ghost preview (updates on UI thread)
  const ghostPreview = useSharedValue<GhostPreview>({
    position: null,
    isValid: false,
    cells: [],
  });

  const value: GameContextType = {
    ...gameState,
    gridLayout,
    setGridLayout,
    ghostPreview,
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
