import React, { memo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn, ZoomIn, Layout } from "react-native-reanimated";
import { Block } from "../types";
import { DraggableBlock } from "./DraggableBlock";
import { COLORS } from "../utils/colors";
import { useGame } from "../context/GameContext";

interface BlockInventoryProps {
  inventory: (Block | null)[];
  onBlockPlaced?: () => void;
}

function BlockInventoryComponent({
  inventory,
  onBlockPlaced,
}: BlockInventoryProps) {
  const { gridLayout } = useGame();

  // Use the same cell size as the grid so blocks match exactly where they'll drop
  const inventoryCellSize = gridLayout.cellSize;

  const handleBlockPlaced = useCallback(() => {
    onBlockPlaced?.();
  }, [onBlockPlaced]);

  // Don't render blocks until grid has measured and we have a valid cell size
  if (inventoryCellSize === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.inventory, styles.inventoryLoading]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inventory}>
        {inventory.map((block, index) => (
          <Animated.View
            key={block?.id ?? `empty-${index}`}
            style={styles.blockSlot}
            entering={FadeIn.delay(index * 100).springify()}
            layout={Layout.springify()}
          >
            {block && (
              <Animated.View
                entering={ZoomIn.delay(index * 100).springify()}
                style={styles.blockWrapper}
              >
                <DraggableBlock
                  block={block}
                  blockIndex={index}
                  inventoryCellSize={inventoryCellSize}
                  onPlaced={handleBlockPlaced}
                />
              </Animated.View>
            )}
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  inventory: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: COLORS.gridBackground,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inventoryLoading: {
    minHeight: 120,
  },
  blockSlot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  blockWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export const BlockInventory = memo(BlockInventoryComponent);
