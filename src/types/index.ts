// Block colors available in the game
export type BlockColor =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "orange";

// A grid cell can be empty (null) or contain a block color
export type GridCell = BlockColor | null;

// The 8x8 game grid
export type Grid = GridCell[][];

// Block shape represented as a 2D boolean matrix
// true = filled cell, false = empty cell
export type BlockShape = boolean[][];

// A block piece that can be placed on the grid
export interface Block {
  id: string;
  shape: BlockShape;
  color: BlockColor;
}

// Position on the grid (row, col)
export interface Position {
  row: number;
  col: number;
}

// Result of checking for line clears
export interface LineClearResult {
  rows: number[];
  cols: number[];
  totalLines: number;
}

// Game state interface
export interface GameState {
  grid: Grid;
  inventory: (Block | null)[];
  score: number;
  highScore: number;
  combo: number;
  isGameOver: boolean;
}

// Ghost preview state for showing where block will be placed
export interface GhostPreview {
  position: Position | null;
  isValid: boolean;
  cells: Position[];
  highlightedCells: Position[];
  highlightColor: BlockColor | null;
}

// Settings state
export interface Settings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
}

// Grid layout measurements for coordinate calculations
export interface GridLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  cellSize: number;
}

// Inventory slot layout measurements
export interface SlotLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}
