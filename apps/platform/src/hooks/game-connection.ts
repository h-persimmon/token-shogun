import { Order } from "../../../../packages/vibe-strategy"
import type { GameStatusInfo } from "../../../game/src/lib/game/order-listner"

export const useGameConnection = () => {
  const sendOrder = async (orders: Order[]) => {
    console.log(orders)
  }

  const getGameState = async (): Promise<GameStatusInfo> => {
    return {
      aliveUnitIds: [],
      deadUnitIds: [],
      deployableStructureIds: [],
      aliveEnemyTypes: [],
    }
  }

  return {
    sendOrder,
    getGameState
  }
}