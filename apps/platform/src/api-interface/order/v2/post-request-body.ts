import { GameStatusInfo } from "../../../../../game/src/lib/game/order-listner";

export interface OrderV2PostRequestBody {
  prompt: string;
  gameStatusInfo: GameStatusInfo;
}
