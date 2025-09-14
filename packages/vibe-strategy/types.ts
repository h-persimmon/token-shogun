import { z } from 'zod';

/**
 * Game unit schema
 */
export const UnitSchema = z.object({
  id: z.string(),
  unitTypeId: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  currentHp: z.number(),
  currentSpeed: z.number(),
  currentEventId: z.string(),
});

export type Unit = z.infer<typeof UnitSchema>;

/**
 * Unit type schema
 */
export const UnitTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  maxHp: z.number(),
  defaultSpeed: z.number(),
  availableEventList: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
});

export type UnitType = z.infer<typeof UnitTypeSchema>;

/**
 * Event schema
 */
export const EventSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Event = z.infer<typeof EventSchema>;

/**
 * Game status schema
 */
export const GameStatusSchema = z.object({
  allyUnits: z.array(UnitSchema),
  allyUnitTypes: z.array(UnitTypeSchema),
  enemyUnits: z.array(UnitSchema),
  enemyUnitTypes: z.array(UnitTypeSchema),
  events: z.record(z.string(), z.array(EventSchema)),
});

export type GameStatus = z.infer<typeof GameStatusSchema>;

/**
 * Order request schema
 */
export const OrderRequestSchema = z.object({
  gameStatus: GameStatusSchema,
  userPrompt: z.string(),
});

export type OrderRequest = z.infer<typeof OrderRequestSchema>;

/**
 * Structure schema
 */
export const StructureSchema = z.object({
  id: z.string(),
  structureTypeId: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  currentHp: z.number(),
});

export type Structure = z.infer<typeof StructureSchema>;

/**
 * XML output schema for LLM (after parsing to object)
 */
export const OrderResponseSchema = z.object({
  order: z.object({
    create: z.optional(z.object({
      unit: z.union([
        z.array(z.object({
          unitTypeId: z.string(),
        })),
        z.object({
          unitTypeId: z.string(),
        })
      ]),
    })),
    update: z.optional(z.object({
      // For future implementation
    })),
    target: z.optional(z.object({
      enemy: z.optional(z.object({
        id: z.string(),
      })),
      structure: z.optional(z.object({
        id: z.string(),
      })),
    })),
  }),
});

export type OrderResponse = z.infer<typeof OrderResponseSchema>;

/**
 * API response schema
 */
export const ApiResponseSchema = z.object({
  output: z.object({
    message: z.object({
      content: z.array(z.object({
        text: z.string(),
      })),
    }),
  }),
});

export type ApiResponse = z.infer<typeof ApiResponseSchema>;
