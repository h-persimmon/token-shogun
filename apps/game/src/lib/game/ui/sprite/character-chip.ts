import { Direction } from "../../components/movement-component";

export const spriteSheetNumber: Record<Direction, Record<number, number>> = {
  [Direction.DOWN]: {
    0: 0,
    1: 1,
    2: 2,
  },
  [Direction.DOWN_LEFT]: {
    0: 3,
    1: 4,
    2: 5,
  },
  [Direction.LEFT]: {
    0: 6,
    1: 7,
    2: 8,
  },
  [Direction.DOWN_RIGHT]: {
    0: 9,
    1: 10,
    2: 11,
  },
  [Direction.RIGHT]: {
    0: 12,
    1: 13,
    2: 14,
  },
  [Direction.UP_RIGHT]: {
    0: 15,
    1: 16,
    2: 17,
  },
  [Direction.UP]: {
    0: 18,
    1: 19,
    2: 20,
  },
  [Direction.UP_LEFT]: {
    0: 21,
    1: 22,
    2: 23,
  },
};
