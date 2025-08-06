import { IEvent } from "../event/interface";
import { Position } from "../position/position";
import { UnitStrategy } from "./unit-strategy/interface";
import { IUnitType } from "./unit-type/interface";

/**
 * ユニットを表すインターフェース
 */
export interface IUnit {
  /**
   * ID
   */
  readonly id: string;

  /**
   * ユニットタイプ
   */
  readonly unitType: IUnitType;

  /**
   * 座標
   */
  position: Position

  /**
   * 現在の体力
   */
  currentHp: number;

  /**
   * 現在の移動速度
   */
  currentSpeed: number;

  /**
   * 現在実行中のイベント
   */
  currentEvent: IEvent;
  
  /**
   * 行動戦略
   */
  strategy: UnitStrategy;
}