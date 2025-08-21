import { TokensCountPostRequestBody } from "@/api-interface/tokens/count/post-request-body";
import { TokensCountPostResponseBody } from "@/api-interface/tokens/count/post-response-body";

/**
 * トークンに関するモジュール
 */
export class TokenModule {
  /**
   * 現在消費したトークン
   */
  private _consumedToken: number;

  /**
   * コンストラクタ
   */
  public constructor() {
    this._consumedToken = 0;
  }

  /**
   * 現在消費したトークンのゲッター
   */
  public get consumedToken() {
    return this._consumedToken;
  }

  /**
   * 消費したトークンを加算する関数
   * @param consumedToken
   */
  public addConsumedToken(consumedToken: number) {
    if (consumedToken < 0) {
      throw new Error("負数は加算できません");
    }
    this._consumedToken += consumedToken;
  }

  /**
   * プロンプトのトークン数を計算するAPIを呼び出す関数
   * @param prompt プロンプト
   * @returns トークン数
   */
  public async countTokens(prompt: string): Promise<number> {
    const url = "/api/tokens/count";
    const requestBody: TokensCountPostRequestBody = { prompt };
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
    const responseBody: TokensCountPostResponseBody = await response.json();
    return responseBody.tokens;
  }
}
