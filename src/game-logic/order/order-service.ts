import { AiResponseBody } from "@/api-interface/ai/responce-body";
import { UnitService } from "../unit/unit-service";

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
  ) { }

  /**
   * AIにメッセージを送る関数
   * @param prompt プロンプト
   * @returns レスポンスボディ
   */
  public async sendMessageToAi(prompt: string): Promise<AiResponseBody> {
    const url = "/api/ai"
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ prompt })
    })
    return response.json()
  }
}
