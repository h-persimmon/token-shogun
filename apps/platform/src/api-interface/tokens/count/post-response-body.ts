/**
 * /tokens/countにPOSTした際のレスポンスボディの型
 */
export interface TokensCountPostResponseBody {
  /**
   * prompt
   */
  prompt: string;

  /**
   * トークン数
   */
  tokens: number;
}
