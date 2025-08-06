import { DIFFICULTY, UNIT } from "@/constants";
import { Stage } from "./interface";

/**
 * ステージ一覧
 */
export const stageList: Stage[] = [
  {
    id: 1,
    name: "初心者の間",
    difficulty: DIFFICULTY.EASY,
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
