import { ENV } from "@/constants";
import { join } from "path";
import { OrderPostResponseBody } from "@/api-interface/order/post-response-body";

/**
 * /orderへのリクエストを処理するためのクラス
 */
export class OrderHandler {
  private readonly BEDROCK_API_URL: string;
  private readonly BEDROCK_API_KEY: string;

  /**
   * コンストラクタ
   */
  public constructor() {
    // URL
    this.BEDROCK_API_URL =
      process.env.BEDROCK_API_URL || ENV.BEDROCK_API_URL.DEFAULT;
    // KEY
    const keyOrNull = process.env.BEDROCK_API_KEY || null;
    if (keyOrNull === null) {
      throw new Error(
        "Environment BEDROCK_API_KEY is not provided. Please edit .env file.",
      );
    }
    this.BEDROCK_API_KEY = keyOrNull;
  }

  /**
   * AIにプロンプトを送信する関数
   * @param prompt プロンプト
   * @returns レスポンスボディ
   */
  public async sendPromptToAi(prompt: string): Promise<OrderPostResponseBody> {
    const url = join(this.BEDROCK_API_URL, "/converse");
    const payload = {
      messages: [
        {
          role: "user",
          content: [{ text: prompt }],
        },
      ],
    };
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.BEDROCK_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    return response.json();
  }
}
