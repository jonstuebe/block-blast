import { Block, BlockShape, BlockColor } from "../types";
import { getRandomColor } from "./colors";

// All available block shapes as 2D boolean matrices
export const BLOCK_SHAPES: Record<string, BlockShape> = {
  // Single block (1x1)
  single: [[true]],

  // Line blocks
  line2H: [[true, true]], // 1x2 horizontal
  line3H: [[true, true, true]], // 1x3 horizontal
  line4H: [[true, true, true, true]], // 1x4 horizontal
  line5H: [[true, true, true, true, true]], // 1x5 horizontal
  line2V: [[true], [true]], // 2x1 vertical
  line3V: [[true], [true], [true]], // 3x1 vertical
  line4V: [[true], [true], [true], [true]], // 4x1 vertical
  line5V: [[true], [true], [true], [true], [true]], // 5x1 vertical

  // Square blocks
  square2: [
    [true, true],
    [true, true],
  ], // 2x2
  square3: [
    [true, true, true],
    [true, true, true],
    [true, true, true],
  ], // 3x3

  // L-shapes (4 orientations)
  lShape1: [
    [true, false],
    [true, false],
    [true, true],
  ],
  lShape2: [
    [true, true, true],
    [true, false, false],
  ],
  lShape3: [
    [true, true],
    [false, true],
    [false, true],
  ],
  lShape4: [
    [false, false, true],
    [true, true, true],
  ],

  // Reverse L-shapes (4 orientations)
  lShapeR1: [
    [false, true],
    [false, true],
    [true, true],
  ],
  lShapeR2: [
    [true, false, false],
    [true, true, true],
  ],
  lShapeR3: [
    [true, true],
    [true, false],
    [true, false],
  ],
  lShapeR4: [
    [true, true, true],
    [false, false, true],
  ],

  // T-shapes (4 orientations)
  tShape1: [
    [true, true, true],
    [false, true, false],
  ],
  tShape2: [
    [false, true],
    [true, true],
    [false, true],
  ],
  tShape3: [
    [false, true, false],
    [true, true, true],
  ],
  tShape4: [
    [true, false],
    [true, true],
    [true, false],
  ],

  // Z-shapes (2 orientations)
  zShape1: [
    [true, true, false],
    [false, true, true],
  ],
  zShape2: [
    [false, true],
    [true, true],
    [true, false],
  ],

  // S-shapes (2 orientations)
  sShape1: [
    [false, true, true],
    [true, true, false],
  ],
  sShape2: [
    [true, false],
    [true, true],
    [false, true],
  ],

  // Small L shapes (3 cells)
  smallL1: [
    [true, false],
    [true, true],
  ],
  smallL2: [
    [true, true],
    [true, false],
  ],
  smallL3: [
    [true, true],
    [false, true],
  ],
  smallL4: [
    [false, true],
    [true, true],
  ],
};

// Shape categories for difficulty scaling
const SIMPLE_SHAPES = [
  "single",
  "line2H",
  "line2V",
  "square2",
  "smallL1",
  "smallL2",
  "smallL3",
  "smallL4",
];

const MEDIUM_SHAPES = [
  "line3H",
  "line3V",
  "lShape1",
  "lShape2",
  "lShape3",
  "lShape4",
  "lShapeR1",
  "lShapeR2",
  "lShapeR3",
  "lShapeR4",
  "tShape1",
  "tShape2",
  "tShape3",
  "tShape4",
];

const COMPLEX_SHAPES = [
  "line4H",
  "line4V",
  "line5H",
  "line5V",
  "square3",
  "zShape1",
  "zShape2",
  "sShape1",
  "sShape2",
];

// Shape weights (lower = rarer)
const SHAPE_WEIGHTS: Record<string, number> = {
  single: 0.3, // Much less common
  square3: 0.1, // Rare
  // All other shapes default to 1.0
};

// Weighted random selection from available shapes
function weightedRandomShape(shapes: string[]): string {
  const weights = shapes.map((s) => SHAPE_WEIGHTS[s] ?? 1.0);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < shapes.length; i++) {
    random -= weights[i];
    if (random <= 0) return shapes[i];
  }
  return shapes[shapes.length - 1];
}

// Generate a unique ID for a block
let blockIdCounter = 0;
function generateBlockId(): string {
  return `block_${Date.now()}_${blockIdCounter++}`;
}

// Get shape dimensions
export function getShapeDimensions(shape: BlockShape): {
  rows: number;
  cols: number;
} {
  return {
    rows: shape.length,
    cols: shape[0]?.length || 0,
  };
}

// Get all filled cell positions in a shape
export function getShapeCells(shape: BlockShape): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        cells.push({ row, col });
      }
    }
  }
  return cells;
}

// Get cells on the outer perimeter of a shape (interior cells are excluded)
export function getPerimeterCells(shape: BlockShape): { row: number; col: number }[] {
  const perimeterCells: { row: number; col: number }[] = [];

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      // Skip empty cells
      if (!shape[row][col]) continue;

      // Check if cell is on perimeter (has any empty neighbor)
      const hasEmptyNeighbor =
        !shape[row - 1]?.[col] ||  // Top
        !shape[row + 1]?.[col] ||  // Bottom
        !shape[row][col - 1] ||      // Left
        !shape[row][col + 1];       // Right

      if (hasEmptyNeighbor) {
        perimeterCells.push({ row, col });
      }
    }
  }

  return perimeterCells;
}

// Generate a random block based on difficulty
export function generateRandomBlock(score: number = 0): Block {
  let availableShapes: string[];

  // Difficulty scaling based on score
  if (score < 500) {
    // Easy: mostly simple shapes
    availableShapes = [...SIMPLE_SHAPES, ...SIMPLE_SHAPES, ...MEDIUM_SHAPES.slice(0, 4)];
  } else if (score < 1500) {
    // Medium: mix of simple and medium
    availableShapes = [...SIMPLE_SHAPES, ...MEDIUM_SHAPES];
  } else if (score < 3000) {
    // Hard: medium and complex
    availableShapes = [...MEDIUM_SHAPES, ...COMPLEX_SHAPES];
  } else {
    // Very hard: all shapes with higher probability of complex
    availableShapes = [
      ...SIMPLE_SHAPES,
      ...MEDIUM_SHAPES,
      ...COMPLEX_SHAPES,
      ...COMPLEX_SHAPES,
    ];
  }

  const shapeName = weightedRandomShape(availableShapes);
  const shape = BLOCK_SHAPES[shapeName];

  return {
    id: generateBlockId(),
    shape,
    color: getRandomColor(),
  };
}

// Generate initial inventory of 3 blocks
export function generateInitialInventory(): Block[] {
  return [
    generateRandomBlock(0),
    generateRandomBlock(0),
    generateRandomBlock(0),
  ];
}

