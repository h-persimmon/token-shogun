export interface Event {
  readonly id: string;
  readonly name: string;
  readonly tags: string[];
}

export interface AttackEvent extends Event {
  readonly damage: number;
}

export const eventList: Event[] = [
  {
    id: "doNothing",
    name: "なにもしない",
    tags: [],
  }
]
