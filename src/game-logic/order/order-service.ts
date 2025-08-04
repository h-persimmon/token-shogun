import { OrderResponseBody } from "@/api-interface/order/response-body";
import { UnitService } from "../unit/unit-service";
import { GameEngine } from "../engine";
import { OrderRequestBody } from "@/api-interface/order/request-body";

/**
 * 命令に関するサービス
 */
export class OrderService {
  /**
   * コンストラクタ
   */
  public constructor(
    /**
     * ユニットに関するサービス
     */
    private readonly unitService: UnitService,
  ) {};

  /**
   * AIに命令してゲーム状況を更新する関数
   * @param userPrompt ユーザプロンプト
   * @param gameEngine ゲームエンジン
   */
  public async order(userPrompt: string, gameEngine: GameEngine): Promise<void> {
    const orderResponseBody = this.sendPromptToServer(userPrompt);
    console.log((await orderResponseBody).output.message.content);
    // TODO
  }

  /**
   * ゲーム状況を表すテキストを作成する関数
   * @param gameEngine ゲームエンジン
   * @returns ゲーム状況を表すテキスト
   */
  public createGameStatisText(gameEngine: GameEngine): string {
    return "";
  }

  /**
   * サーバにユーザプロンプトとゲーム状況を送信する関数
   * @param prompt ユーザプロンプト
   * @param gameEngine ゲームエンジン
   * @returns レスポンスボディ
   */
  private async sendPromptToServer(prompt: string): Promise<OrderResponseBody> {
    const url = "/api/order";
    const orderRequestBody: OrderRequestBody = { prompt };
    const responce = await fetch(url, {
      method: "POST",
      body: JSON.stringify(orderRequestBody),
    })
    return responce.json();
  }
}
