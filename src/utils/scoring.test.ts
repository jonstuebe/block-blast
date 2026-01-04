import { describe, it, expect } from "vitest";
import {
  calculateScore,
  getComboMultiplier,
  getPlacementPoints,
  formatScore,
  formatCombo,
} from "./scoring";
import { LineClearResult } from "../types";

describe("getComboMultiplier", () => {
  it("returns 1x for first combo", () => {
    expect(getComboMultiplier(1)).toBe(1);
  });

  it("returns 1.5x for second combo", () => {
    expect(getComboMultiplier(2)).toBe(1.5);
  });

  it("returns 2x for third combo", () => {
    expect(getComboMultiplier(3)).toBe(2);
  });

  it("increases by 0.5 for each combo", () => {
    expect(getComboMultiplier(4)).toBe(2.5);
    expect(getComboMultiplier(5)).toBe(3);
    expect(getComboMultiplier(6)).toBe(3.5);
  });

  it("caps at 8x maximum", () => {
    expect(getComboMultiplier(15)).toBe(8);
    expect(getComboMultiplier(20)).toBe(8);
    expect(getComboMultiplier(100)).toBe(8);
  });

  it("reaches 8x at combo 15", () => {
    // 1 + (15-1) * 0.5 = 1 + 7 = 8
    expect(getComboMultiplier(15)).toBe(8);
  });
});

describe("calculateScore", () => {
  it("gives 100 points for 1 line", () => {
    const lineClear: LineClearResult = { rows: [0], cols: [], totalLines: 1 };
    const result = calculateScore(lineClear, 0);

    expect(result.basePoints).toBe(100);
    expect(result.points).toBe(100);
  });

  it("gives 300 points for 2 lines (bonus)", () => {
    const lineClear: LineClearResult = { rows: [0, 1], cols: [], totalLines: 2 };
    const result = calculateScore(lineClear, 0);

    expect(result.basePoints).toBe(300);
    expect(result.points).toBe(300);
  });

  it("gives 600 points for 3 lines", () => {
    const lineClear: LineClearResult = { rows: [0, 1, 2], cols: [], totalLines: 3 };
    const result = calculateScore(lineClear, 0);

    expect(result.basePoints).toBe(600);
    expect(result.points).toBe(600);
  });

  it("gives 1000+ points for 4+ lines", () => {
    const lineClear: LineClearResult = { rows: [0, 1, 2, 3], cols: [], totalLines: 4 };
    const result = calculateScore(lineClear, 0);

    expect(result.basePoints).toBe(1000);
    expect(result.points).toBe(1000);
  });

  it("applies combo multiplier correctly", () => {
    const lineClear: LineClearResult = { rows: [0], cols: [], totalLines: 1 };

    // Combo 2 = 1.5x multiplier
    const result = calculateScore(lineClear, 2);

    expect(result.basePoints).toBe(100);
    expect(result.multiplier).toBe(1.5);
    expect(result.points).toBe(150);
  });

  it("applies high combo multiplier", () => {
    const lineClear: LineClearResult = { rows: [0, 1], cols: [], totalLines: 2 };

    // Combo 5 = 3x multiplier
    const result = calculateScore(lineClear, 5);

    expect(result.basePoints).toBe(300);
    expect(result.multiplier).toBe(3);
    expect(result.points).toBe(900);
  });

  it("floors the final score", () => {
    const lineClear: LineClearResult = { rows: [0], cols: [], totalLines: 1 };

    // 100 * 1.5 = 150 (exact)
    const result = calculateScore(lineClear, 2);
    expect(result.points).toBe(150);
  });

  it("counts row and column clears together", () => {
    // 1 row + 1 column = 2 lines
    const lineClear: LineClearResult = { rows: [0], cols: [0], totalLines: 2 };
    const result = calculateScore(lineClear, 0);

    expect(result.basePoints).toBe(300);
  });
});

describe("getPlacementPoints", () => {
  it("gives 1 point per cell", () => {
    expect(getPlacementPoints(1)).toBe(1);
    expect(getPlacementPoints(4)).toBe(4);
    expect(getPlacementPoints(9)).toBe(9);
  });
});

describe("formatScore", () => {
  it("formats small numbers", () => {
    expect(formatScore(0)).toBe("0");
    expect(formatScore(100)).toBe("100");
    expect(formatScore(999)).toBe("999");
  });

  it("adds commas to large numbers", () => {
    expect(formatScore(1000)).toBe("1,000");
    expect(formatScore(12345)).toBe("12,345");
    expect(formatScore(1234567)).toBe("1,234,567");
  });
});

describe("formatCombo", () => {
  it("formats multiplier with one decimal", () => {
    expect(formatCombo(1)).toBe("×1.0");
    expect(formatCombo(1.5)).toBe("×1.5");
    expect(formatCombo(2)).toBe("×2.0");
    expect(formatCombo(8)).toBe("×8.0");
  });
});

