import { DIFFICULTY, STAGE, UNIT } from "@/constants";
import { Stage } from "./interface";

/**
 * ステージ一覧
 */
export const stageList: Stage[] = [
  {
    id: STAGE.S01.ID,
    name: STAGE.S01.NAME,
    difficulty: DIFFICULTY.EASY,
    fieldSize: {
      width: 400,
      height: 400,
    },
    mapPosition: {
      x: 20,
      y: 60,
    },
    enemyUnitList: [
      {
        unitTypeId: UNIT.TYPE.ENEMY.KAPPA.ID, // 河童
        position: {
          x: 100,
          y: 200,
        },
      },
      {
        unitTypeId: UNIT.TYPE.ENEMY.GHOST.ID, // 幽霊
        position: {
          x: 200,
          y: 300,
        },
      },
    ],
    allyUnitIdList: [
      UNIT.TYPE.ALLY.SAMURAI.ID, // 侍
      UNIT.TYPE.ALLY.NINJA.ID, // 忍者
      UNIT.TYPE.ALLY.GUNMAN.ID, // 銃使い
    ],
    maxTokens: 1000,
  },
  {
    id: STAGE.S02.ID,
    name: STAGE.S02.NAME,
    difficulty: DIFFICULTY.EASY,
    fieldSize: {
      width: 400,
      height: 400,
    },
    mapPosition: {
      x: 50,
      y: 30,
    },
    enemyUnitList: [
      {
        unitTypeId: UNIT.TYPE.ENEMY.KAPPA.ID, // 河童
        position: {
          x: 100,
          y: 200,
        },
      },
    ],
    allyUnitIdList: [
      UNIT.TYPE.ALLY.SAMURAI.ID, // 侍
      UNIT.TYPE.ALLY.NINJA.ID, // 忍者
      UNIT.TYPE.ALLY.GUNMAN.ID, // 銃使い
    ],
    maxTokens: 1000,
  },
  {
    id: STAGE.S03.ID,
    name: STAGE.S03.NAME,
    difficulty: DIFFICULTY.EASY,
    fieldSize: {
      width: 400,
      height: 400,
    },
    mapPosition: {
      x: 75,
      y: 70,
    },
    enemyUnitList: [
      {
        unitTypeId: UNIT.TYPE.ENEMY.DRAGON.ID, // 竜
        position: {
          x: 100,
          y: 200,
        },
      },
    ],
    allyUnitIdList: [
      UNIT.TYPE.ALLY.SAMURAI.ID, // 侍
    ],
    maxTokens: 600,
  },
];
