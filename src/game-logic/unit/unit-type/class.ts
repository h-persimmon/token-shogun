import { FACTION } from "@/constants";
import { IUnitType } from "./interface";
import { IEvent } from "../../event/interface";
import { Faction } from "./faction";

/**
 * ユニットタイプクラス（Kiroが生成）
 */
export class UnitType implements IUnitType {
  public unitCount: number = 0;

  readonly id: string;
  readonly name: string;
  readonly maxHp: number;
  readonly defaultSpeed: number;
  readonly availableEventList: IEvent[];
  readonly faction: Faction;

  constructor(
    id: string,
    name: string,
    maxHp: number,
    defaultSpeed: number,
    availableEventList: IEvent[],
    faction: Faction,
  ) {
    this.id = id;
    this.name = name;
    this.maxHp = maxHp;
    this.defaultSpeed = defaultSpeed;
    this.availableEventList = availableEventList;
    this.faction = faction;
  }
}

/**
 * 味方ユニットの種類（Kiroが生成）
 */
export class AllyUnitType implements IUnitType {
  private readonly unitType: UnitType;

  constructor(
    id: string,
    name: string,
    maxHp: number,
    defaultSpeed: number,
    availableEventList: IEvent[],
  ) {
    this.unitType = new UnitType(
      id,
      name,
      maxHp,
      defaultSpeed,
      availableEventList,
      FACTION.ALLY,
    );
  }

  get id(): string {
    return this.unitType.id;
  }

  get name(): string {
    return this.unitType.name;
  }

  get maxHp(): number {
    return this.unitType.maxHp;
  }

  get defaultSpeed(): number {
    return this.unitType.defaultSpeed;
  }

  get availableEventList(): IEvent[] {
    return this.unitType.availableEventList;
  }

  get faction(): Faction {
    return this.unitType.faction;
  }

  get unitCount(): number {
    return this.unitType.unitCount;
  }

  set unitCount(unitCount: number) {
    this.unitType.unitCount = unitCount;
  }
}

/**
 * 敵ユニットの種類（Kiroが生成）
 */
export class EnemyUnitType implements IUnitType {
  private readonly unitType: UnitType;

  constructor(
    id: string,
    name: string,
    maxHp: number,
    defaultSpeed: number,
    availableEventList: IEvent[],
  ) {
    this.unitType = new UnitType(
      id,
      name,
      maxHp,
      defaultSpeed,
      availableEventList,
      FACTION.ENEMY,
    );
  }

  get id(): string {
    return this.unitType.id;
  }

  get name(): string {
    return this.unitType.name;
  }

  get maxHp(): number {
    return this.unitType.maxHp;
  }

  get defaultSpeed(): number {
    return this.unitType.defaultSpeed;
  }

  get availableEventList(): IEvent[] {
    return this.unitType.availableEventList;
  }

  get faction(): Faction {
    return this.unitType.faction;
  }

  get unitCount(): number {
    return this.unitType.unitCount;
  }

  set unitCount(unitCount: number) {
    this.unitType.unitCount = unitCount;
  }
}
