import { IUnit } from "./unit";

export interface UnitStrategy {
  recognizeAsFirstPriority?: IUnit;
  stopPolicy?: Event;
}
