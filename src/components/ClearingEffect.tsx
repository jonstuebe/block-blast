import React, { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Position, BlockColor } from "../types";
import { BLOCK_COLORS } from "../utils/colors";

// Cell being cleared with its color
export interface ClearingCell {
  position: Position;
  color: BlockColor;
}

interface ClearingEffectProps {
  cells: ClearingCell[];
  cellSize: number;
  onComplete: () => void;
}

interface ParticleConfig {
  id: number;
  color: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  targetRotation: number;
  size: number;
}

const PARTICLES_PER_CELL = 5;
const ANIMATION_DURATION = 350;

// Generate random particles for a cell
function generateParticles(
  cell: ClearingCell,
  cellSize: number,
  cellIndex: number
): ParticleConfig[] {
  const particles: ParticleConfig[] = [];
  const color = BLOCK_COLORS[cell.color];
  const cellCenterX = cell.position.col * cellSize + cellSize / 2;
  const cellCenterY = cell.position.row * cellSize + cellSize / 2;

  for (let i = 0; i < PARTICLES_PER_CELL; i++) {
    // Random angle for scatter direction
    const angle = (Math.PI * 2 * i) / PARTICLES_PER_CELL + Math.random() * 0.5;
    const distance = 40 + Math.random() * 40; // 40-80px scatter

    particles.push({
      id: cellIndex * PARTICLES_PER_CELL + i,
      color,
      startX: cellCenterX,
      startY: cellCenterY,
      targetX: Math.cos(angle) * distance,
      targetY: Math.sin(angle) * distance,
      targetRotation: (Math.random() - 0.5) * 360,
      size: cellSize * (0.15 + Math.random() * 0.15), // 15-30% of cell size
    });
  }

  return particles;
}

// Individual particle component
function Particle({ config }: { config: ParticleConfig }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.quad),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = config.targetX * progress.value;
    const translateY = config.targetY * progress.value;
    const scale = 1 - progress.value * 0.8; // Scale from 1 to 0.2
    const opacity = 1 - progress.value;
    const rotation = config.targetRotation * progress.value;

    return {
      transform: [
        { translateX },
        { translateY },
        { scale },
        { rotate: `${rotation}deg` },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: config.startX - config.size / 2,
          top: config.startY - config.size / 2,
          width: config.size,
          height: config.size,
          backgroundColor: config.color,
          borderRadius: config.size * 0.2,
        },
        animatedStyle,
      ]}
    />
  );
}

export function ClearingEffect({
  cells,
  cellSize,
  onComplete,
}: ClearingEffectProps) {
  // Generate all particles once when cells change
  const particles = useMemo(() => {
    return cells.flatMap((cell, index) =>
      generateParticles(cell, cellSize, index)
    );
  }, [cells, cellSize]);

  // Trigger completion callback after animation
  useEffect(() => {
    if (cells.length === 0) return;

    const timer = setTimeout(() => {
      onComplete();
    }, ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, [cells, onComplete]);

  if (cells.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((config) => (
        <Particle key={config.id} config={config} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "visible",
  },
  particle: {
    position: "absolute",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
});

