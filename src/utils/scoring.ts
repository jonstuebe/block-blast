import { LineClearResult } from "../types";

// Base points for line clears
const BASE_POINTS: Record<number, number> = {
  1: 100,
  2: 300,
  3: 600,
  4: 1000,
};

// Get base points for number of lines cleared
function getBasePoints(lineCount: number): number {
  if (lineCount <= 0) return 0;
  if (lineCount >= 4) return BASE_POINTS[4] + (lineCount - 4) * 300;
  return BASE_POINTS[lineCount];
}

// Calculate combo multiplier (max 8x)
export function getComboMultiplier(comboCount: number): number {
  // Combo 1: 1.0x, Combo 2: 1.5x, Combo 3: 2.0x, etc.
  const multiplier = 1 + (comboCount - 1) * 0.5;
  return Math.min(multiplier, 8); // Cap at 8x
}

// Calculate score for a line clear
export function calculateScore(
  lineClear: LineClearResult,
  comboCount: number
): {
  points: number;
  basePoints: number;
  multiplier: number;
} {
  const basePoints = getBasePoints(lineClear.totalLines);
  const multiplier = comboCount > 0 ? getComboMultiplier(comboCount) : 1;
  const points = Math.floor(basePoints * multiplier);

  return {
    points,
    basePoints,
    multiplier,
  };
}

// Points for placing a block (without clearing lines)
export function getPlacementPoints(blockCellCount: number): number {
  // Small bonus for placing blocks
  return blockCellCount;
}

// Format score for display (e.g., 1,234,567)
export function formatScore(score: number): string {
  return score.toLocaleString();
}

// Format combo multiplier for display
export function formatCombo(multiplier: number): string {
  return `×${multiplier.toFixed(1)}`;
}

