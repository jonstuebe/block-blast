import { Grid, Block, Position, LineClearResult } from "../types";

// XState machine context (extended state)
export interface GameMachineContext {
  grid: Grid;
  inventory: (Block | null)[];
  score: number;
  highScore: number;
  combo: number;
  currentDrag: {
    blockIndex: number;
    position: Position | null;
    isValid: boolean;
  } | null;
  linesToClear: LineClearResult | null;
}

// XState machine events
export type GameMachineEvent =
  | { type: "DRAG_START"; blockIndex: number }
  | { type: "DRAG_UPDATE"; position: Position | null; isValid: boolean }
  | { type: "DRAG_CANCEL" }
  | { type: "DROP_BLOCK"; position: Position }
  | { type: "CLEAR_COMPLETE" }
  | { type: "RESTART" }
  | { type: "LOAD_HIGH_SCORE"; highScore: number };

// State value types
export type GameMachineStateValue =
  | "idle"
  | "dragging"
  | "placing"
  | "clearing"
  | "checkingGameOver"
  | "gameOver";

// Input for creating the machine (initial values)
export interface GameMachineInput {
  highScore?: number;
}

