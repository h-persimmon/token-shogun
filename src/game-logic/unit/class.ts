import { FACTION } from "@/constants";
import { Position } from "../position/position";
import { UnitStrategy } from "./unit-strategy/interface";
import { IUnitType } from "./unit-type/interface";
import { IUnit } from "./interface";
import { IEvent } from "../event/interface";

/**
 * ユニット
 */
export class Unit implements IUnit {
  readonly id: string;
  readonly unitType: IUnitType;
  position: Position;
  currentHp: number;
  currentSpeed: number;
  currentEvent: IEvent;
  strategy: UnitStrategy;

  public constructor (
    id: string,
    unitType: IUnitType,
    position: Position,
    defaultEvent: IEvent,
  ) {
    this.id = id;
    this.unitType = unitType;
    this.position = position;
    this.currentHp = this.unitType.maxHp;
    this.currentSpeed = this.unitType.defaultSpeed;
    this.currentEvent = defaultEvent;
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
    unitType: IUnitType,
    position: Position,
    defaultEvent: IEvent,
  ) {
    if (unitType.faction !== FACTION.ENEMY) {
      throw new Error("敵ユニットではありません")
    }
    this.unit = new Unit(
      id,
      unitType,
      position,
      defaultEvent,
    );
  }
  get id(): string {
    return this.unit.id;
  };

  get unitType(): IUnitType {
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

  get currentEvent(): IEvent {
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
    unitType: IUnitType,
    position: Position,
    defaultEvent: IEvent,
  ) {
    if (unitType.faction !== FACTION.ALLY) {
      throw new Error("味方ユニットではありません")
    }
    this.unit = new Unit(
      id,
      unitType,
      position,
      defaultEvent
    );
  }

  get id(): string {
    return this.unit.id;
  };

  get unitType(): IUnitType {
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

  get currentEvent(): IEvent {
    return this.unit.currentEvent;
  };

  get strategy(): UnitStrategy {
    return this.unit.strategy;
  };
}
