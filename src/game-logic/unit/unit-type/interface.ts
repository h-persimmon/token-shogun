import { Event } from "../../event/event";
import { Faction } from "./faction";

/**
 * ユニットタイプ
 */
export interface IUnitType {
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

  /**
   * このタイプのユニットの数
   */
  readonly unitCount: number;
}

