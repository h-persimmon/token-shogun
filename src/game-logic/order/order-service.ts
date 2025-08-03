import { AiResponseBody } from "@/api-interface/ai/responce-body";

/**
 * 命令に関するサービス
 */
export class OrderService {
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
