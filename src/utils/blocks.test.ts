import { describe, it, expect } from "vitest";
import {
  BLOCK_SHAPES,
  getShapeDimensions,
  getShapeCells,
  generateRandomBlock,
  generateInitialInventory,
} from "./blocks";

describe("BLOCK_SHAPES", () => {
  it("has a single block shape", () => {
    expect(BLOCK_SHAPES.single).toEqual([[true]]);
  });

  it("has correct horizontal line shapes", () => {
    expect(BLOCK_SHAPES.line2H).toEqual([[true, true]]);
    expect(BLOCK_SHAPES.line3H).toEqual([[true, true, true]]);
    expect(BLOCK_SHAPES.line4H).toEqual([[true, true, true, true]]);
  });

  it("has correct vertical line shapes", () => {
    expect(BLOCK_SHAPES.line2V).toEqual([[true], [true]]);
    expect(BLOCK_SHAPES.line3V).toEqual([[true], [true], [true]]);
  });

  it("has correct square shapes", () => {
    expect(BLOCK_SHAPES.square2).toEqual([
      [true, true],
      [true, true],
    ]);
    expect(BLOCK_SHAPES.square3).toEqual([
      [true, true, true],
      [true, true, true],
      [true, true, true],
    ]);
  });

  it("has L-shaped blocks", () => {
    // Check one L shape as representative
    expect(BLOCK_SHAPES.smallL1).toEqual([
      [true, false],
      [true, true],
    ]);
  });
});

describe("getShapeDimensions", () => {
  it("returns correct dimensions for single block", () => {
    const dims = getShapeDimensions(BLOCK_SHAPES.single);
    expect(dims).toEqual({ rows: 1, cols: 1 });
  });

  it("returns correct dimensions for horizontal line", () => {
    const dims = getShapeDimensions(BLOCK_SHAPES.line3H);
    expect(dims).toEqual({ rows: 1, cols: 3 });
  });

  it("returns correct dimensions for vertical line", () => {
    const dims = getShapeDimensions(BLOCK_SHAPES.line3V);
    expect(dims).toEqual({ rows: 3, cols: 1 });
  });

  it("returns correct dimensions for square", () => {
    const dims = getShapeDimensions(BLOCK_SHAPES.square2);
    expect(dims).toEqual({ rows: 2, cols: 2 });
  });

  it("returns correct dimensions for L shape", () => {
    const dims = getShapeDimensions(BLOCK_SHAPES.lShape1);
    // lShape1 = [[true, false], [true, false], [true, true]]
    expect(dims).toEqual({ rows: 3, cols: 2 });
  });
});

describe("getShapeCells", () => {
  it("returns single cell for single block", () => {
    const cells = getShapeCells(BLOCK_SHAPES.single);
    expect(cells).toEqual([{ row: 0, col: 0 }]);
  });

  it("returns correct cells for horizontal line", () => {
    const cells = getShapeCells(BLOCK_SHAPES.line3H);
    expect(cells).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]);
  });

  it("returns correct cells for L shape", () => {
    const cells = getShapeCells(BLOCK_SHAPES.smallL1);
    // smallL1 = [[true, false], [true, true]]
    expect(cells).toEqual([
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ]);
  });

  it("skips false cells in shape", () => {
    const cells = getShapeCells(BLOCK_SHAPES.tShape1);
    // tShape1 = [[true, true, true], [false, true, false]]
    expect(cells).toHaveLength(4);
    expect(cells).not.toContainEqual({ row: 1, col: 0 });
    expect(cells).not.toContainEqual({ row: 1, col: 2 });
  });
});

describe("generateRandomBlock", () => {
  it("returns a block with required properties", () => {
    const block = generateRandomBlock();

    expect(block).toHaveProperty("id");
    expect(block).toHaveProperty("shape");
    expect(block).toHaveProperty("color");
    expect(typeof block.id).toBe("string");
    expect(Array.isArray(block.shape)).toBe(true);
    expect(["red", "blue", "green", "yellow", "purple", "orange"]).toContain(
      block.color
    );
  });

  it("returns different blocks on multiple calls", () => {
    const blocks = Array(10)
      .fill(null)
      .map(() => generateRandomBlock());
    const ids = blocks.map((b) => b.id);
    const uniqueIds = new Set(ids);

    // All blocks should have unique IDs
    expect(uniqueIds.size).toBe(10);
  });

  it("generates simpler shapes at low scores", () => {
    // Generate many blocks at score 0 and check they're mostly simple
    const blocks = Array(50)
      .fill(null)
      .map(() => generateRandomBlock(0));

    // At score 0, we should mostly see simple shapes (smaller blocks)
    const cellCounts = blocks.map((b) => getShapeCells(b.shape).length);
    const averageCells = cellCounts.reduce((a, b) => a + b, 0) / cellCounts.length;

    // Simple shapes average around 2-3 cells
    expect(averageCells).toBeLessThan(5);
  });

  it("generates more complex shapes at high scores", () => {
    // Generate many blocks at high score
    const blocks = Array(50)
      .fill(null)
      .map(() => generateRandomBlock(5000));

    const cellCounts = blocks.map((b) => getShapeCells(b.shape).length);
    const averageCells = cellCounts.reduce((a, b) => a + b, 0) / cellCounts.length;

    // Complex shapes average around 3-5 cells
    expect(averageCells).toBeGreaterThan(2);
  });
});

describe("generateInitialInventory", () => {
  it("returns exactly 3 blocks", () => {
    const inventory = generateInitialInventory();
    expect(inventory).toHaveLength(3);
  });

  it("returns all valid blocks", () => {
    const inventory = generateInitialInventory();

    for (const block of inventory) {
      expect(block).toHaveProperty("id");
      expect(block).toHaveProperty("shape");
      expect(block).toHaveProperty("color");
    }
  });

  it("returns blocks with unique IDs", () => {
    const inventory = generateInitialInventory();
    const ids = inventory.map((b) => b.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(3);
  });
});

