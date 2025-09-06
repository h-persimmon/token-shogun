import { TokensCountPostRequestBody } from "@/api-interface/tokens/count/post-request-body";
import { TokensCountPostResponseBody } from "@/api-interface/tokens/count/post-response-body";
import { Stage } from "../stage/interface";

/**
 * トークンに関するモジュール
 */
export class TokenModule {
  /**
   * 現在消費したトークン数
   */
  private _consumedToken: number;

  /**
   * コンストラクタ
   */
  public constructor(
    /**
     * ステージ情報
     */
    private readonly stage: Stage,
  ) {
    this._consumedToken = 0;
  }

  /**
   * 現在消費したトークン数（Getter）
   */
  public get consumedToken() {
    return this._consumedToken;
  }

  /**
   * 残りのトークン数
   */
  public get remainingTokens(): number {
    return this.stage.maxTokens - this.consumedToken;
  }

  /**
   * トークンを消費する関数
   * @param consumedToken
   */
  public async consumeToken(prompt: string) {
    const consumedToken = await this.countTokens(prompt);
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
