import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { GridCell, BlockColor } from "../types";
import { BLOCK_COLORS, COLORS } from "../utils/colors";

interface CellProps {
  color: GridCell;
  size: number;
  isGhost?: boolean;
  isGhostValid?: boolean;
  isClearing?: boolean;
}

function CellComponent({
  color,
  size,
  isGhost = false,
  isGhostValid = true,
  isClearing = false,
}: CellProps) {
  const backgroundColor = isGhost
    ? isGhostValid
      ? COLORS.ghostValid
      : COLORS.ghostInvalid
    : color
    ? BLOCK_COLORS[color]
    : COLORS.cellEmpty;

  const isFilled = color && !isGhost;

  return (
    <View
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor,
          opacity: isClearing ? 0.5 : 1,
        },
        isFilled && styles.filledCell,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  cell: {
    borderWidth: 1,
    borderColor: COLORS.gridLine,
    borderRadius: 4,
  },
  filledCell: {
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});

export const Cell = memo(CellComponent);

