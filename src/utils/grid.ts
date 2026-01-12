import { Grid, Block, Position, LineClearResult, GridCell } from "../types";
import { getShapeCells } from "./blocks";

export const GRID_SIZE = 8;

// Create an empty 8x8 grid
export function createEmptyGrid(): Grid {
  return Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null));
}

// Check if a position is within grid bounds
export function isWithinBounds(row: number, col: number): boolean {
  return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
}

// Check if a block can be placed at a given position
export function canPlaceBlock(
  grid: Grid,
  block: Block,
  position: Position
): boolean {
  const shapeCells = getShapeCells(block.shape);

  for (const cell of shapeCells) {
    const gridRow = position.row + cell.row;
    const gridCol = position.col + cell.col;

    // Check bounds
    if (!isWithinBounds(gridRow, gridCol)) {
      return false;
    }

    // Check if cell is occupied
    if (grid[gridRow][gridCol] !== null) {
      return false;
    }
  }

  return true;
}

// Get the grid cells that a block would occupy at a position
export function getBlockCellsOnGrid(
  block: Block,
  position: Position
): Position[] {
  const shapeCells = getShapeCells(block.shape);
  return shapeCells.map((cell) => ({
    row: position.row + cell.row,
    col: position.col + cell.col,
  }));
}

// Place a block on the grid (returns new grid, does not mutate)
export function placeBlock(
  grid: Grid,
  block: Block,
  position: Position
): Grid {
  const newGrid = grid.map((row) => [...row]);
  const shapeCells = getShapeCells(block.shape);

  for (const cell of shapeCells) {
    const gridRow = position.row + cell.row;
    const gridCol = position.col + cell.col;
    newGrid[gridRow][gridCol] = block.color;
  }

  return newGrid;
}

// Check for complete lines (rows and columns)
export function checkLineClears(grid: Grid): LineClearResult {
  const completedRows: number[] = [];
  const completedCols: number[] = [];

  // Check rows
  for (let row = 0; row < GRID_SIZE; row++) {
    const isComplete = grid[row].every((cell) => cell !== null);
    if (isComplete) {
      completedRows.push(row);
    }
  }

  // Check columns
  for (let col = 0; col < GRID_SIZE; col++) {
    let isComplete = true;
    for (let row = 0; row < GRID_SIZE; row++) {
      if (grid[row][col] === null) {
        isComplete = false;
        break;
      }
    }
    if (isComplete) {
      completedCols.push(col);
    }
  }

  return {
    rows: completedRows,
    cols: completedCols,
    totalLines: completedRows.length + completedCols.length,
  };
}

// Get all cells that will be cleared
export function getCellsToClear(lineClear: LineClearResult): Position[] {
  const cells: Position[] = [];
  const cellSet = new Set<string>();

  // Add cells from completed rows
  for (const row of lineClear.rows) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const key = `${row},${col}`;
      if (!cellSet.has(key)) {
        cellSet.add(key);
        cells.push({ row, col });
      }
    }
  }

  // Add cells from completed columns
  for (const col of lineClear.cols) {
    for (let row = 0; row < GRID_SIZE; row++) {
      const key = `${row},${col}`;
      if (!cellSet.has(key)) {
        cellSet.add(key);
        cells.push({ row, col });
      }
    }
  }

  return cells;
}

// Predict which cells would be cleared if a block is placed at a position
// Returns cells that would be part of completed rows/columns after placement
export function predictLineClearsAfterPlacement(
  grid: Grid,
  block: Block,
  position: Position
): Position[] {
  // Simulate placing the block
  const simulatedGrid = placeBlock(grid, block, position);
  
  // Check for completed lines on the simulated grid
  const lineClear = checkLineClears(simulatedGrid);
  
  // If no lines would be cleared, return empty array
  if (lineClear.totalLines === 0) {
    return [];
  }
  
  // Return all cells that would be cleared
  return getCellsToClear(lineClear);
}

// Clear completed lines from the grid (returns new grid)
export function clearLines(grid: Grid, lineClear: LineClearResult): Grid {
  const newGrid = grid.map((row) => [...row]);

  // Clear rows
  for (const row of lineClear.rows) {
    for (let col = 0; col < GRID_SIZE; col++) {
      newGrid[row][col] = null;
    }
  }

  // Clear columns
  for (const col of lineClear.cols) {
    for (let row = 0; row < GRID_SIZE; row++) {
      newGrid[row][col] = null;
    }
  }

  return newGrid;
}

// Check if any block in inventory can be placed anywhere on the grid
export function canPlaceAnyBlock(
  grid: Grid,
  inventory: (Block | null)[]
): boolean {
  for (const block of inventory) {
    if (block === null) continue;

    // Try every position on the grid
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (canPlaceBlock(grid, block, { row, col })) {
          return true;
        }
      }
    }
  }

  return false;
}

// Check if the game is over (no valid moves)
export function checkGameOver(
  grid: Grid,
  inventory: (Block | null)[]
): boolean {
  // Filter out null blocks (empty inventory slots)
  const blocks = inventory.filter((b): b is Block => b !== null);

  // If no blocks in inventory, game is not over yet (new blocks will be generated)
  if (blocks.length === 0) {
    return false;
  }

  return !canPlaceAnyBlock(grid, blocks);
}

// Convert touch coordinates to grid position
export function touchToGridPosition(
  touchX: number,
  touchY: number,
  gridLayout: { x: number; y: number; cellSize: number }
): Position {
  const col = Math.floor((touchX - gridLayout.x) / gridLayout.cellSize);
  const row = Math.floor((touchY - gridLayout.y) / gridLayout.cellSize);
  return { row, col };
}

