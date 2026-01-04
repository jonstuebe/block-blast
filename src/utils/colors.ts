import { BlockColor } from "../types";

// Block colors - vibrant saturated hues
export const BLOCK_COLORS: Record<BlockColor, string> = {
  red: "#ff6b6b",
  blue: "#4ecdc4",
  green: "#95e77a",
  yellow: "#ffd93d",
  purple: "#a55eea",
  orange: "#ff9f43",
};

// UI colors
export const COLORS = {
  // Background gradient
  backgroundStart: "#1a1a2e",
  backgroundEnd: "#16213e",

  // Grid
  gridBackground: "#0f0f1a",
  gridLine: "#2d3a4a",
  cellEmpty: "#1a1a2e",

  // Ghost preview
  ghostValid: "rgba(149, 231, 122, 0.4)", // green tint
  ghostInvalid: "rgba(255, 107, 107, 0.4)", // red tint

  // UI elements
  textPrimary: "#ffffff",
  textSecondary: "#8892a0",
  textAccent: "#ffd93d",

  // Overlay
  overlay: "rgba(0, 0, 0, 0.7)",
  modalBackground: "#1e2a3a",

  // Buttons
  buttonPrimary: "#4ecdc4",
  buttonSecondary: "#2d3a4a",
};

// Get a random block color
export function getRandomColor(): BlockColor {
  const colors: BlockColor[] = [
    "red",
    "blue",
    "green",
    "yellow",
    "purple",
    "orange",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

