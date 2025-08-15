import { EVENT } from "@/constants";
import { AttackEvent, Event } from "./class";

/**
 * イベント一覧
 */
export const eventList: Event[] = [
  new Event(EVENT.DO_NOTHING.ID, EVENT.DO_NOTHING.NAME, EVENT.DO_NOTHING.TAGS),
  new AttackEvent(
    EVENT.NORMAL_ATTACK.ID,
    EVENT.NORMAL_ATTACK.NAME,
    EVENT.NORMAL_ATTACK.TAGS,
    50,
  ),
  new AttackEvent(
    EVENT.FIRE_BREATH.ID,
    EVENT.FIRE_BREATH.NAME,
    EVENT.FIRE_BREATH.TAGS,
    200,
  ),
];
