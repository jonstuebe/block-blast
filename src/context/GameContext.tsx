import React, { createContext, useContext, ReactNode, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGameState, UseGameStateReturn } from "../hooks/useGameState";
import { GridLayout, GhostPreview, Settings } from "../types";

const SETTINGS_KEY = "@blockblast:settings";

// Simple mutable ref type to replace SharedValue
interface MutableRef<T> {
  value: T;
}

interface GameContextType extends UseGameStateReturn {
  // Grid layout for coordinate calculations
  gridLayout: GridLayout;
  setGridLayout: (layout: GridLayout) => void;

  // Ghost preview mutable ref (for real-time updates)
  ghostPreview: MutableRef<GhostPreview>;

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

  // Mutable ref for ghost preview (replaces Reanimated shared value)
  const ghostPreviewRef = useRef<GhostPreview>({
    position: null,
    isValid: false,
    cells: [],
  });

  // Create a stable object that mimics SharedValue interface
  const ghostPreview = React.useMemo(() => ({
    get value() {
      return ghostPreviewRef.current;
    },
    set value(newValue: GhostPreview) {
      ghostPreviewRef.current = newValue;
    },
  }), []);

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
