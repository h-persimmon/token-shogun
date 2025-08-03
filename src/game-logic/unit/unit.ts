import { Event, eventList } from "../event/event";
import { Position } from "../position/position";
import { UnitStrategy } from "./unit-strategy";
import { UnitType } from "./unit-type";

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
  readonly unitType: UnitType;

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
  currentEvent: Event;
  
  /**
   * 行動戦略
   */
  strategy: UnitStrategy;
}

/**
 * ユニットを表すクラス
 */
export class Unit implements IUnit {
  readonly id: string;
  readonly unitType: UnitType;
  position: Position;
  currentHp: number;
  currentSpeed: number;
  currentEvent: Event;
  strategy: UnitStrategy;

  public constructor (
    id: string,
    unitType: UnitType,
    position: Position,
  ) {
    this.id = id;
    this.unitType = unitType;
    this.position = position;
    this.currentHp = this.unitType.maxHp;
    this.currentSpeed = this.unitType.defaultSpeed;
    this.currentEvent = eventList.find((event) => event.id === "doNothing")!; // TODO
    this.strategy = {} // TODO
  }
}

/**
 * 敵ユニット
 */
export class EnemyUnit implements IUnit {
  private readonly unit: Unit;

  public constructor(
    id: string,
    unitType: UnitType,
    position: Position,
  ) {
    if (unitType.faction !== "enemy") {
      throw new Error("敵ユニットではありません")
    }
    this.unit = new Unit(
      id,
      unitType,
      position,
    );
  }
  get id(): string {
    return this.unit.id;
  };

  get unitType(): UnitType {
    return this.unit.unitType;
  };

  get position(): Position {
    return this.unit.position;
  };

  get currentHp(): number {
    return this.unit.currentHp;
  };

  get currentSpeed(): number {
    return this.unit.currentSpeed;
  };

  get currentEvent(): Event {
    return this.unit.currentEvent;
  };

  get strategy(): UnitStrategy {
    return this.unit.strategy;
  };
}

/**
 * 味方ユニット
 */
export class AllyUnit implements IUnit {
  private readonly unit: Unit;

  public constructor(
    id: string,
    unitType: UnitType,
    position: Position,
  ) {
    if (unitType.faction !== "ally") {
      throw new Error("味方ユニットではありません")
    }
    this.unit = new Unit(
      id,
      unitType,
      position,
    );
  }

  get id(): string {
    return this.unit.id;
  };

  get unitType(): UnitType {
    return this.unit.unitType;
  };

  get position(): Position {
    return this.unit.position;
  };

  get currentHp(): number {
    return this.unit.currentHp;
  };

  get currentSpeed(): number {
    return this.unit.currentSpeed;
  };

  get currentEvent(): Event {
    return this.unit.currentEvent;
  };

  get strategy(): UnitStrategy {
    return this.unit.strategy;
  };
}
