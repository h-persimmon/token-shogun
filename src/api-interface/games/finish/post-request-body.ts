/**
 * /games/[gameId]/finishにPOSTする際のリクエストボディの型
 */
export interface GameFinishPostRequestBody {
  /**
   * クリアしたかどうか
   */
  isCompleted: boolean;

  /**
   * 消費したトークン数
   */
  consumedToken: number;
}
