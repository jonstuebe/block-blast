import { describe, it, expect } from "vitest";
import {
  createEmptyGrid,
  canPlaceBlock,
  placeBlock,
  checkLineClears,
  clearLines,
  checkGameOver,
  canPlaceAnyBlock,
  isWithinBounds,
  GRID_SIZE,
} from "./grid";
import { Block, Grid, BlockColor } from "../types";
import { BLOCK_SHAPES } from "./blocks";

// Helper to create a test block
function createTestBlock(
  shape: boolean[][],
  color: BlockColor = "red"
): Block {
  return {
    id: "test-block",
    shape,
    color,
  };
}

// Helper to fill a row
function fillRow(grid: Grid, row: number, color: BlockColor = "blue"): Grid {
  const newGrid = grid.map((r) => [...r]);
  for (let col = 0; col < GRID_SIZE; col++) {
    newGrid[row][col] = color;
  }
  return newGrid;
}

// Helper to fill a column
function fillColumn(grid: Grid, col: number, color: BlockColor = "green"): Grid {
  const newGrid = grid.map((r) => [...r]);
  for (let row = 0; row < GRID_SIZE; row++) {
    newGrid[row][col] = color;
  }
  return newGrid;
}

describe("createEmptyGrid", () => {
  it("creates an 8x8 grid", () => {
    const grid = createEmptyGrid();
    expect(grid.length).toBe(8);
    expect(grid[0].length).toBe(8);
  });

  it("fills all cells with null", () => {
    const grid = createEmptyGrid();
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        expect(grid[row][col]).toBeNull();
      }
    }
  });
});

describe("isWithinBounds", () => {
  it("returns true for valid positions", () => {
    expect(isWithinBounds(0, 0)).toBe(true);
    expect(isWithinBounds(7, 7)).toBe(true);
    expect(isWithinBounds(4, 4)).toBe(true);
  });

  it("returns false for positions outside grid", () => {
    expect(isWithinBounds(-1, 0)).toBe(false);
    expect(isWithinBounds(0, -1)).toBe(false);
    expect(isWithinBounds(8, 0)).toBe(false);
    expect(isWithinBounds(0, 8)).toBe(false);
    expect(isWithinBounds(10, 10)).toBe(false);
  });
});

describe("canPlaceBlock", () => {
  it("allows placement on empty grid within bounds", () => {
    const grid = createEmptyGrid();
    const block = createTestBlock(BLOCK_SHAPES.single);

    expect(canPlaceBlock(grid, block, { row: 0, col: 0 })).toBe(true);
    expect(canPlaceBlock(grid, block, { row: 7, col: 7 })).toBe(true);
    expect(canPlaceBlock(grid, block, { row: 4, col: 4 })).toBe(true);
  });

  it("rejects placement outside grid bounds", () => {
    const grid = createEmptyGrid();
    const block = createTestBlock(BLOCK_SHAPES.line2H);

    // Block would extend past right edge
    expect(canPlaceBlock(grid, block, { row: 0, col: 7 })).toBe(false);
    // Block would extend past bottom edge
    const verticalBlock = createTestBlock(BLOCK_SHAPES.line2V);
    expect(canPlaceBlock(grid, verticalBlock, { row: 7, col: 0 })).toBe(false);
  });

  it("rejects placement on occupied cells", () => {
    let grid = createEmptyGrid();
    grid[4][4] = "red";

    const block = createTestBlock(BLOCK_SHAPES.single);
    expect(canPlaceBlock(grid, block, { row: 4, col: 4 })).toBe(false);
  });

  it("allows placement adjacent to occupied cells", () => {
    let grid = createEmptyGrid();
    grid[4][4] = "red";

    const block = createTestBlock(BLOCK_SHAPES.single);
    expect(canPlaceBlock(grid, block, { row: 4, col: 5 })).toBe(true);
    expect(canPlaceBlock(grid, block, { row: 3, col: 4 })).toBe(true);
  });

  it("handles multi-cell blocks correctly", () => {
    let grid = createEmptyGrid();
    grid[4][5] = "red"; // Block in the way

    const block = createTestBlock(BLOCK_SHAPES.line3H);
    // This would overlap with the occupied cell
    expect(canPlaceBlock(grid, block, { row: 4, col: 4 })).toBe(false);
    // This is clear
    expect(canPlaceBlock(grid, block, { row: 3, col: 4 })).toBe(true);
  });
});

describe("placeBlock", () => {
  it("places a single block correctly", () => {
    const grid = createEmptyGrid();
    const block = createTestBlock(BLOCK_SHAPES.single, "red");

    const newGrid = placeBlock(grid, block, { row: 4, col: 4 });

    expect(newGrid[4][4]).toBe("red");
    // Original grid unchanged
    expect(grid[4][4]).toBeNull();
  });

  it("places a multi-cell block correctly", () => {
    const grid = createEmptyGrid();
    const block = createTestBlock(BLOCK_SHAPES.line3H, "blue");

    const newGrid = placeBlock(grid, block, { row: 2, col: 3 });

    expect(newGrid[2][3]).toBe("blue");
    expect(newGrid[2][4]).toBe("blue");
    expect(newGrid[2][5]).toBe("blue");
  });

  it("places an L-shaped block correctly", () => {
    const grid = createEmptyGrid();
    const block = createTestBlock(BLOCK_SHAPES.smallL1, "green");
    // smallL1 = [[true, false], [true, true]]

    const newGrid = placeBlock(grid, block, { row: 0, col: 0 });

    expect(newGrid[0][0]).toBe("green");
    expect(newGrid[0][1]).toBeNull();
    expect(newGrid[1][0]).toBe("green");
    expect(newGrid[1][1]).toBe("green");
  });
});

describe("checkLineClears", () => {
  it("returns empty result for grid with no complete lines", () => {
    const grid = createEmptyGrid();
    grid[0][0] = "red";
    grid[0][1] = "blue";

    const result = checkLineClears(grid);

    expect(result.rows).toEqual([]);
    expect(result.cols).toEqual([]);
    expect(result.totalLines).toBe(0);
  });

  it("detects a complete row", () => {
    let grid = createEmptyGrid();
    grid = fillRow(grid, 3);

    const result = checkLineClears(grid);

    expect(result.rows).toContain(3);
    expect(result.totalLines).toBe(1);
  });

  it("detects a complete column", () => {
    let grid = createEmptyGrid();
    grid = fillColumn(grid, 5);

    const result = checkLineClears(grid);

    expect(result.cols).toContain(5);
    expect(result.totalLines).toBe(1);
  });

  it("detects multiple complete rows", () => {
    let grid = createEmptyGrid();
    grid = fillRow(grid, 0);
    grid = fillRow(grid, 7);

    const result = checkLineClears(grid);

    expect(result.rows).toContain(0);
    expect(result.rows).toContain(7);
    expect(result.totalLines).toBe(2);
  });

  it("detects simultaneous row and column clears", () => {
    let grid = createEmptyGrid();
    grid = fillRow(grid, 4);
    grid = fillColumn(grid, 4);

    const result = checkLineClears(grid);

    expect(result.rows).toContain(4);
    expect(result.cols).toContain(4);
    expect(result.totalLines).toBe(2);
  });
});

describe("clearLines", () => {
  it("clears a complete row", () => {
    let grid = createEmptyGrid();
    grid = fillRow(grid, 3);

    const lineClear = { rows: [3], cols: [], totalLines: 1 };
    const clearedGrid = clearLines(grid, lineClear);

    for (let col = 0; col < GRID_SIZE; col++) {
      expect(clearedGrid[3][col]).toBeNull();
    }
  });

  it("clears a complete column", () => {
    let grid = createEmptyGrid();
    grid = fillColumn(grid, 5);

    const lineClear = { rows: [], cols: [5], totalLines: 1 };
    const clearedGrid = clearLines(grid, lineClear);

    for (let row = 0; row < GRID_SIZE; row++) {
      expect(clearedGrid[row][5]).toBeNull();
    }
  });

  it("preserves non-cleared cells", () => {
    let grid = createEmptyGrid();
    grid = fillRow(grid, 3);
    grid[0][0] = "purple"; // Not in cleared line

    const lineClear = { rows: [3], cols: [], totalLines: 1 };
    const clearedGrid = clearLines(grid, lineClear);

    expect(clearedGrid[0][0]).toBe("purple");
  });

  it("does not mutate original grid", () => {
    let grid = createEmptyGrid();
    grid = fillRow(grid, 3);

    const lineClear = { rows: [3], cols: [], totalLines: 1 };
    const clearedGrid = clearLines(grid, lineClear);

    // Original should still have the row filled
    expect(grid[3][0]).not.toBeNull();
    expect(clearedGrid[3][0]).toBeNull();
  });
});

describe("canPlaceAnyBlock", () => {
  it("returns true when blocks can be placed", () => {
    const grid = createEmptyGrid();
    const inventory = [createTestBlock(BLOCK_SHAPES.single)];

    expect(canPlaceAnyBlock(grid, inventory)).toBe(true);
  });

  it("returns false when grid is full", () => {
    // Fill entire grid
    const grid: Grid = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill("red"));

    const inventory = [createTestBlock(BLOCK_SHAPES.single)];

    expect(canPlaceAnyBlock(grid, inventory)).toBe(false);
  });

  it("returns false when no blocks fit", () => {
    // Create a nearly full grid where only corners are empty
    const grid: Grid = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill("red"));
    grid[0][0] = null;

    // Use a 2x2 block that won't fit in single corner
    const inventory = [createTestBlock(BLOCK_SHAPES.square2)];

    expect(canPlaceAnyBlock(grid, inventory)).toBe(false);
  });

  it("handles null inventory slots", () => {
    const grid = createEmptyGrid();
    const inventory = [null, null, createTestBlock(BLOCK_SHAPES.single)];

    expect(canPlaceAnyBlock(grid, inventory)).toBe(true);
  });
});

describe("checkGameOver", () => {
  it("returns false when moves are available", () => {
    const grid = createEmptyGrid();
    const inventory = [createTestBlock(BLOCK_SHAPES.single)];

    expect(checkGameOver(grid, inventory)).toBe(false);
  });

  it("returns true when no moves available", () => {
    // Fill entire grid
    const grid: Grid = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill("red"));

    const inventory = [createTestBlock(BLOCK_SHAPES.single)];

    expect(checkGameOver(grid, inventory)).toBe(true);
  });

  it("returns false when inventory is empty", () => {
    const grid: Grid = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill("red"));

    const inventory: (Block | null)[] = [null, null, null];

    // Empty inventory means new blocks will be generated, so not game over
    expect(checkGameOver(grid, inventory)).toBe(false);
  });
});

