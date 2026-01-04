import { useCallback, useEffect, useReducer } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Grid,
  Block,
  Position,
  GameState,
  LineClearResult,
} from "../types";
import {
  createEmptyGrid,
  canPlaceBlock,
  placeBlock,
  checkLineClears,
  clearLines,
  checkGameOver,
} from "../utils/grid";
import { generateRandomBlock, generateInitialInventory, getShapeCells } from "../utils/blocks";
import { calculateScore, getPlacementPoints } from "../utils/scoring";

const HIGH_SCORE_KEY = "@blockblast:highscore";

// Action types
type GameAction =
  | { type: "PLACE_BLOCK"; blockIndex: number; position: Position }
  | { type: "CLEAR_LINES"; lineClear: LineClearResult }
  | { type: "REFILL_INVENTORY" }
  | { type: "SET_GAME_OVER" }
  | { type: "RESET_GAME" }
  | { type: "LOAD_HIGH_SCORE"; highScore: number };

// Initial state factory
function createInitialState(): GameState {
  const grid = createEmptyGrid();
  const inventory = generateInitialInventory();
  return {
    grid,
    inventory,
    score: 0,
    highScore: 0,
    combo: 0,
    isGameOver: false,
  };
}

// Game reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "PLACE_BLOCK": {
      const block = state.inventory[action.blockIndex];
      if (!block || !canPlaceBlock(state.grid, block, action.position)) {
        return state;
      }

      // Place the block
      const newGrid = placeBlock(state.grid, block, action.position);

      // Remove block from inventory
      const newInventory = [...state.inventory];
      newInventory[action.blockIndex] = null;

      // Calculate placement points
      const cellCount = getShapeCells(block.shape).length;
      const placementPoints = getPlacementPoints(cellCount);

      // Check for line clears
      const lineClear = checkLineClears(newGrid);

      if (lineClear.totalLines > 0) {
        // Clear lines and calculate score with combo
        const clearedGrid = clearLines(newGrid, lineClear);
        const newCombo = state.combo + 1;
        const { points } = calculateScore(lineClear, newCombo);

        return {
          ...state,
          grid: clearedGrid,
          inventory: newInventory,
          score: state.score + placementPoints + points,
          combo: newCombo,
        };
      }

      // No lines cleared - reset combo
      return {
        ...state,
        grid: newGrid,
        inventory: newInventory,
        score: state.score + placementPoints,
        combo: 0,
      };
    }

    case "REFILL_INVENTORY": {
      // Check if all inventory slots are empty
      const isEmpty = state.inventory.every((block) => block === null);
      if (!isEmpty) {
        return state;
      }

      // Generate new blocks based on current score
      const newInventory = [
        generateRandomBlock(state.score),
        generateRandomBlock(state.score),
        generateRandomBlock(state.score),
      ];

      return {
        ...state,
        inventory: newInventory,
      };
    }

    case "SET_GAME_OVER": {
      const newHighScore = Math.max(state.score, state.highScore);
      return {
        ...state,
        isGameOver: true,
        highScore: newHighScore,
      };
    }

    case "RESET_GAME": {
      return {
        ...createInitialState(),
        highScore: state.highScore,
      };
    }

    case "LOAD_HIGH_SCORE": {
      return {
        ...state,
        highScore: action.highScore,
      };
    }

    default:
      return state;
  }
}

export interface UseGameStateReturn {
  // State
  grid: Grid;
  inventory: (Block | null)[];
  score: number;
  highScore: number;
  combo: number;
  isGameOver: boolean;

  // Actions
  placeBlock: (blockIndex: number, position: Position) => boolean;
  resetGame: () => void;
  canPlaceBlockAt: (block: Block, position: Position) => boolean;
}

export function useGameState(): UseGameStateReturn {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);

  // Load high score from storage on mount
  useEffect(() => {
    async function loadHighScore() {
      try {
        const stored = await AsyncStorage.getItem(HIGH_SCORE_KEY);
        if (stored) {
          dispatch({ type: "LOAD_HIGH_SCORE", highScore: parseInt(stored, 10) });
        }
      } catch (error) {
        console.error("Failed to load high score:", error);
      }
    }
    loadHighScore();
  }, []);

  // Save high score when it changes
  useEffect(() => {
    async function saveHighScore() {
      try {
        await AsyncStorage.setItem(HIGH_SCORE_KEY, state.highScore.toString());
      } catch (error) {
        console.error("Failed to save high score:", error);
      }
    }
    if (state.highScore > 0) {
      saveHighScore();
    }
  }, [state.highScore]);

  // Check for game over after inventory changes
  useEffect(() => {
    // First, check if inventory needs refill
    const isEmpty = state.inventory.every((block) => block === null);
    if (isEmpty && !state.isGameOver) {
      dispatch({ type: "REFILL_INVENTORY" });
      return;
    }

    // Then check for game over
    if (!state.isGameOver && checkGameOver(state.grid, state.inventory)) {
      dispatch({ type: "SET_GAME_OVER" });
    }
  }, [state.grid, state.inventory, state.isGameOver]);

  const placeBlockAction = useCallback(
    (blockIndex: number, position: Position): boolean => {
      const block = state.inventory[blockIndex];
      if (!block) return false;

      if (!canPlaceBlock(state.grid, block, position)) {
        return false;
      }

      dispatch({ type: "PLACE_BLOCK", blockIndex, position });
      return true;
    },
    [state.grid, state.inventory]
  );

  const resetGame = useCallback(() => {
    dispatch({ type: "RESET_GAME" });
  }, []);

  const canPlaceBlockAt = useCallback(
    (block: Block, position: Position): boolean => {
      return canPlaceBlock(state.grid, block, position);
    },
    [state.grid]
  );

  return {
    grid: state.grid,
    inventory: state.inventory,
    score: state.score,
    highScore: state.highScore,
    combo: state.combo,
    isGameOver: state.isGameOver,
    placeBlock: placeBlockAction,
    resetGame,
    canPlaceBlockAt,
  };
}

