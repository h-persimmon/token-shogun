/**
 * /players/loginにPOSTした際のレスポンスボディの型
 */
export interface PlayersLoginPostResponseBody {
  /**
   * 成功したか
   */
  isSuccess: boolean;

  /**
   * メッセージ
   */
  message: string;

  /**
   * プレイヤーID
   */
  playerId: string | null;
}
