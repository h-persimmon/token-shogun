import { UNIT } from "@/constants";
import { AllyUnitType, EnemyUnitType } from "./class";

/**
 * 味方ユニットの種類一覧
 */
export const allyUnitTypeList: AllyUnitType[] = [
  new AllyUnitType(
    UNIT.TYPE.ALLY.SAMURAI.ID,
    UNIT.TYPE.ALLY.SAMURAI.NAME,
    500,
    100,
    [],
  ),
  new AllyUnitType(
    UNIT.TYPE.ALLY.NINJA.ID,
    UNIT.TYPE.ALLY.NINJA.NAME,
    300,
    300,
    [],
  ),
  new AllyUnitType(
    UNIT.TYPE.ALLY.GUNMAN.ID,
    UNIT.TYPE.ALLY.GUNMAN.NAME,
    400,
    50,
    [],
  ),
];

/**
 * 敵ユニットの種類一覧
 */
export const enemyUnitTypeList: EnemyUnitType[] = [
  new EnemyUnitType(
    UNIT.TYPE.ENEMY.KAPPA.ID,
    UNIT.TYPE.ENEMY.KAPPA.NAME,
    300,
    100,
    [],
  ),
  new EnemyUnitType(
    UNIT.TYPE.ENEMY.GHOST.ID,
    UNIT.TYPE.ENEMY.GHOST.NAME,
    100,
    300,
    [],
  ),
  new EnemyUnitType(
    UNIT.TYPE.ENEMY.DRAGON.ID,
    UNIT.TYPE.ENEMY.DRAGON.NAME,
    2000,
    75,
    [],
  ),
];
