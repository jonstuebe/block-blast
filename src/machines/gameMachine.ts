import { setup, assign, fromPromise } from "xstate";
import {
  GameMachineContext,
  GameMachineEvent,
  GameMachineInput,
} from "./types";
import { Grid, Block, Position, LineClearResult } from "../types";
import {
  createEmptyGrid,
  canPlaceBlock,
  placeBlock,
  checkLineClears,
  clearLines,
  canPlaceAnyBlock,
} from "../utils/grid";
import { generateRandomBlock, generateInitialInventory, getShapeCells } from "../utils/blocks";
import { calculateScore, getPlacementPoints } from "../utils/scoring";

// Initial context factory
function createInitialContext(input?: GameMachineInput): GameMachineContext {
  return {
    grid: createEmptyGrid(),
    inventory: generateInitialInventory(),
    score: 0,
    highScore: input?.highScore ?? 0,
    combo: 0,
    currentDrag: null,
    linesToClear: null,
  };
}

// The game state machine
export const gameMachine = setup({
  types: {
    context: {} as GameMachineContext,
    events: {} as GameMachineEvent,
    input: {} as GameMachineInput,
  },

  guards: {
    // Check if block can be placed at position
    isValidPlacement: ({ context, event }) => {
      if (event.type !== "DROP_BLOCK") return false;
      if (context.currentDrag === null) return false;

      const block = context.inventory[context.currentDrag.blockIndex];
      if (!block) return false;

      return canPlaceBlock(context.grid, block, event.position);
    },

    // Check if there are lines to clear
    hasLinesToClear: ({ context }) => {
      return context.linesToClear !== null && context.linesToClear.totalLines > 0;
    },

    // Check if game can continue (any valid moves exist)
    canContinue: ({ context }) => {
      return canPlaceAnyBlock(context.grid, context.inventory);
    },

    // Check if inventory is empty and needs refill
    isInventoryEmpty: ({ context }) => {
      return context.inventory.every((block) => block === null);
    },
  },

  actions: {
    // Start dragging a block
    startDrag: assign({
      currentDrag: ({ event }) => {
        if (event.type !== "DRAG_START") return null;
        return {
          blockIndex: event.blockIndex,
          position: null,
          isValid: false,
        };
      },
    }),

    // Update drag position
    updateDrag: assign({
      currentDrag: ({ context, event }) => {
        if (event.type !== "DRAG_UPDATE") return context.currentDrag;
        if (!context.currentDrag) return null;
        return {
          ...context.currentDrag,
          position: event.position,
          isValid: event.isValid,
        };
      },
    }),

    // Cancel drag
    cancelDrag: assign({
      currentDrag: () => null,
    }),

    // Place block on grid and update inventory
    placeBlockOnGrid: assign(({ context, event }) => {
      if (event.type !== "DROP_BLOCK") return {};
      if (!context.currentDrag) return {};

      const block = context.inventory[context.currentDrag.blockIndex];
      if (!block) return {};

      // Place block on grid
      const newGrid = placeBlock(context.grid, block, event.position);

      // Remove block from inventory
      const newInventory = [...context.inventory];
      newInventory[context.currentDrag.blockIndex] = null;

      // Calculate placement points
      const cellCount = getShapeCells(block.shape).length;
      const placementPoints = getPlacementPoints(cellCount);

      // Check for line clears
      const lineClear = checkLineClears(newGrid);

      return {
        grid: newGrid,
        inventory: newInventory,
        score: context.score + placementPoints,
        linesToClear: lineClear.totalLines > 0 ? lineClear : null,
        currentDrag: null,
      };
    }),

    // Clear lines from grid and update score
    clearLinesFromGrid: assign(({ context }) => {
      if (!context.linesToClear) return {};

      const clearedGrid = clearLines(context.grid, context.linesToClear);
      const newCombo = context.combo + 1;
      const { points } = calculateScore(context.linesToClear, newCombo);

      return {
        grid: clearedGrid,
        score: context.score + points,
        combo: newCombo,
        linesToClear: null,
      };
    }),

    // Reset combo when no lines cleared
    resetCombo: assign({
      combo: () => 0,
      linesToClear: () => null,
    }),

    // Refill inventory with new blocks
    refillInventory: assign(({ context }) => {
      return {
        inventory: [
          generateRandomBlock(context.score),
          generateRandomBlock(context.score),
          generateRandomBlock(context.score),
        ],
      };
    }),

    // Update high score if current score is higher
    updateHighScore: assign(({ context }) => {
      if (context.score > context.highScore) {
        return { highScore: context.score };
      }
      return {};
    }),

    // Load high score from storage
    loadHighScore: assign(({ event }) => {
      if (event.type !== "LOAD_HIGH_SCORE") return {};
      return { highScore: event.highScore };
    }),

    // Reset game to initial state
    resetGame: assign(({ context }) => {
      const initial = createInitialContext({ highScore: context.highScore });
      return initial;
    }),
  },
}).createMachine({
  id: "game",
  initial: "idle",
  context: ({ input }) => createInitialContext(input),

  states: {
    idle: {
      // Check if inventory needs refill on entry
      always: [
        {
          guard: "isInventoryEmpty",
          actions: "refillInventory",
        },
      ],
      on: {
        DRAG_START: {
          target: "dragging",
          actions: "startDrag",
        },
        LOAD_HIGH_SCORE: {
          actions: "loadHighScore",
        },
        RESTART: {
          target: "idle",
          actions: "resetGame",
          reenter: true,
        },
      },
    },

    dragging: {
      on: {
        DRAG_UPDATE: {
          actions: "updateDrag",
        },
        DRAG_CANCEL: {
          target: "idle",
          actions: "cancelDrag",
        },
        DROP_BLOCK: [
          {
            guard: "isValidPlacement",
            target: "placing",
            actions: "placeBlockOnGrid",
          },
          {
            target: "idle",
            actions: "cancelDrag",
          },
        ],
      },
    },

    placing: {
      always: [
        {
          guard: "hasLinesToClear",
          target: "clearing",
        },
        {
          target: "checkingGameOver",
          actions: "resetCombo",
        },
      ],
    },

    clearing: {
      entry: "clearLinesFromGrid",
      on: {
        CLEAR_COMPLETE: {
          target: "checkingGameOver",
        },
      },
    },

    checkingGameOver: {
      always: [
        {
          guard: "isInventoryEmpty",
          actions: "refillInventory",
        },
        {
          guard: "canContinue",
          target: "idle",
        },
        {
          target: "gameOver",
          actions: "updateHighScore",
        },
      ],
    },

    gameOver: {
      on: {
        RESTART: {
          target: "idle",
          actions: "resetGame",
        },
      },
    },
  },
});

export type GameMachine = typeof gameMachine;

