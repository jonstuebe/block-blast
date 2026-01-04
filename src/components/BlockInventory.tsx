import React, { memo, useCallback } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Animated, { FadeIn, ZoomIn, Layout } from "react-native-reanimated";
import { Block } from "../types";
import { DraggableBlock } from "./DraggableBlock";
import { COLORS } from "../utils/colors";
import { getShapeDimensions } from "../utils/blocks";

interface BlockInventoryProps {
  inventory: (Block | null)[];
  onBlockPlaced?: (blockIndex: number) => void;
}

// Calculate cell size for inventory blocks (smaller than grid cells)
const INVENTORY_CELL_SIZE_RATIO = 0.8;
const MAX_BLOCK_DIMENSION = 5; // Max block dimension for sizing

function BlockInventoryComponent({
  inventory,
  onBlockPlaced,
}: BlockInventoryProps) {
  const { width: screenWidth } = useWindowDimensions();

  // Calculate inventory cell size based on screen width
  // We want 3 blocks to fit comfortably with some spacing
  const availableWidth = screenWidth * 0.9;
  const inventoryCellSize = Math.floor(
    (availableWidth / 3 / MAX_BLOCK_DIMENSION) * INVENTORY_CELL_SIZE_RATIO
  );

  const handleBlockPlaced = useCallback(
    (blockIndex: number) => {
      onBlockPlaced?.(blockIndex);
    },
    [onBlockPlaced]
  );

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
                  onPlaced={() => handleBlockPlaced(index)}
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
  blockSlot: {
    flex: 1,
    minHeight: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  blockWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export const BlockInventory = memo(BlockInventoryComponent);

