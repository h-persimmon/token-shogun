import { UNIT } from "@/constants";
import { Position } from "../position/position";

export interface StageConfig {
  readonly id: number;
  readonly name: string;
  readonly difficulty: 'easy' | 'normal' | 'hard';
  readonly fieldSize: {
    readonly width: number;
    readonly height: number
  };
  readonly enemyUnitList: readonly {
    readonly unitTypeId: string;
    readonly position: Position;
  }[];
  readonly allyUnitIdList: readonly string[];
  readonly maxTokens: number;
}

export const stageConfigList: StageConfig[] = [
  {
    id: 1,
    name: "初心者の間",
    difficulty: "easy",
    fieldSize: {
      width: 400,
      height: 400,
    },
    enemyUnitList: [
      {
        unitTypeId: UNIT.TYPE.ENEMY.KAPPA.ID,
        position: {
          x: 100,
          y: 200,
        }
      },
      {
        unitTypeId: UNIT.TYPE.ENEMY.GHOST.ID,
        position: {
          x: 200,
          y: 300,
        }
      },
    ],
    allyUnitIdList: [
      UNIT.TYPE.ALLY.SAMURAI.ID,
      UNIT.TYPE.ALLY.NINJA.ID,
      UNIT.TYPE.ALLY.GUNMAN.ID,
    ],
    maxTokens: 1000,
  }
]
