import { IUnit } from "../interface";

export interface UnitStrategy {
  recognizeAsFirstPriority?: IUnit;
  stopPolicy?: Event;
}
