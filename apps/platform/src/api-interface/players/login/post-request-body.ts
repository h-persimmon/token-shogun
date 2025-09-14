/**
 * /players/loginにPOSTする際のリクエストボディの型
 */
export interface PlayersLoginPostRequestBody {
  /**
   * プレイヤーID
   */
  playerId: string;
}
