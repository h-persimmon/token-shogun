import { IEvent } from "./interface";

/**
 * イベント
 */
export class Event implements IEvent {
  readonly id: string;
  readonly name: string;
  readonly tags: readonly string[];

  public constructor(
    id: string,
    name: string,
    tags: readonly string[],
  ) {
    this.id = id;
    this.name = name;
    this.tags = tags;
  }
}

/**
 * 攻撃イベント
 */
export class AttackEvent implements IEvent {
  private readonly event: Event;
  readonly damage: number;

  public constructor(
    id: string,
    name: string,
    tags: readonly string[],
    damage: number,
  ) {
    this.event = new Event(id, name, tags)
    this.damage = damage;
  }

  get id(): string {
    return this.event.id
  }

  get name(): string {
    return this.event.name
  }

  get tags(): readonly string[] {
    return this.event.tags
  }
}
