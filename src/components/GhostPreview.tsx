import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Position, Block } from "../types";
import { COLORS, BLOCK_COLORS } from "../utils/colors";
import { getShapeCells } from "../utils/blocks";

interface GhostPreviewProps {
  block: Block;
  position: Position;
  cellSize: number;
  isValid: boolean;
}

function GhostPreviewComponent({
  block,
  position,
  cellSize,
  isValid,
}: GhostPreviewProps) {
  const shapeCells = getShapeCells(block.shape);

  return (
    <View
      style={[
        styles.container,
        {
          left: position.col * cellSize,
          top: position.row * cellSize,
          opacity: 0.6,
        },
      ]}
    >
      {shapeCells.map((cell, index) => (
        <View
          key={index}
          style={[
            styles.cell,
            {
              left: cell.col * cellSize,
              top: cell.row * cellSize,
              width: cellSize,
              height: cellSize,
              backgroundColor: isValid
                ? COLORS.ghostValid
                : COLORS.ghostInvalid,
              borderColor: isValid
                ? "rgba(149, 231, 122, 0.8)"
                : "rgba(255, 107, 107, 0.8)",
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
  },
  cell: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 4,
  },
});

export const GhostPreview = memo(GhostPreviewComponent);

