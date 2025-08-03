import { UNIT } from "@/constants";

/**
 * 派閥（味方または敵）
 */
export type Faction = "ally" | "enemy";

/**
 * ユニットタイプ
 */
export interface UnitType {
  /**
   * ID
   */
  readonly id: string;

  /**
   * 名前
   */
  readonly name: string;

  /**
   * 最大体力
   */
  readonly maxHp: number;

  /**
   * デフォルトの移動速度
   */
  readonly defaultSpeed: number;

  /**
   * 使用可能なイベント
   */
  readonly availableEventList: Event[];

  /**
   * 派閥
   */
  readonly faction: Faction;
}

/**
 * 味方ユニットの種類
 */
export interface AllyUnitType extends UnitType {
  readonly faction: "ally";
}

/**
 * 敵ユニットの種類
 */
export interface EnemyUnitType extends UnitType {
  readonly faction: "enemy";
}

/**
 * 味方ユニットの種類一覧
 */
export const allyUnitTypeList: AllyUnitType[] = [
  {
    id: UNIT.TYPE.ALLY.SAMURAI.ID,
    name: UNIT.TYPE.ALLY.SAMURAI.NAME,
    maxHp: 500,
    defaultSpeed: 100,
    availableEventList: [],
    faction: "ally",
  },
  {
    id: UNIT.TYPE.ALLY.NINJA.ID,
    name: UNIT.TYPE.ALLY.NINJA.NAME,
    maxHp: 300,
    defaultSpeed: 300,
    availableEventList: [],
    faction: "ally",
  },
  {
    id: UNIT.TYPE.ALLY.GUNMAN.ID,
    name: UNIT.TYPE.ALLY.GUNMAN.NAME,
    maxHp: 400,
    defaultSpeed: 50,
    availableEventList: [],
    faction: "ally",
  },
]

/**
 * 敵ユニットの種類一覧
 */
export const enemyUnitTypeList: EnemyUnitType[] = [
  {
    id: UNIT.TYPE.ENEMY.KAPPA.ID,
    name: UNIT.TYPE.ENEMY.KAPPA.NAME,
    maxHp: 300,
    defaultSpeed: 100,
    availableEventList: [],
    faction: "enemy",
  },
  {
    id: UNIT.TYPE.ENEMY.GHOST.ID,
    name: UNIT.TYPE.ENEMY.GHOST.NAME,
    maxHp: 100,
    defaultSpeed: 300,
    availableEventList: [],
    faction: "enemy",
  },
  {
    id: UNIT.TYPE.ENEMY.DRAGON.ID,
    name: UNIT.TYPE.ENEMY.DRAGON.NAME,
    maxHp: 2000,
    defaultSpeed: 75,
    availableEventList: [],
    faction: "enemy",
  },
]
