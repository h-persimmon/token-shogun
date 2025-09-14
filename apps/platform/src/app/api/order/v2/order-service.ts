import { ENV } from "@/constants";
import { join } from "path";
import { GameStatusInfo } from "../../../../../../game/src/lib/game/order-listner";
import { llmOutputSchema } from "@kiro-rts/vibe-strategy/llm-output-schema"
import { OrderV2PostResponseBody } from "@/api-interface/order/v2/post-response-body";
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { AttackTargetOrder, DefenseCrystalOrder, DeploymentTargetOrder, Order } from "@kiro-rts/vibe-strategy";

export interface AIResponse {
  metrics: { latencyMs: number };
  output: {
    message: {
      content: { text: string }[];
      role: string;
    };
  };
  stopReason: string;
  usage: {
    cacheReadInputTokenCount: number;
    cacheReadInputTokens: number;
    cacheWriteInputTokenCount: number;
    cacheWriteInputTokens: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}


/**
 * /orderへのリクエストを処理するためのクラス
 */
export class OrderService {
  private readonly BEDROCK_API_URL: string;
  private readonly BEDROCK_API_KEY: string;
  private xmlParser: XMLParser;

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

    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      isArray: (name) => name === 'unit' || name === 'structure',
      parseAttributeValue: true
    });
  }

  public async order(userPrompt: string, gameStatusInfo: GameStatusInfo): Promise<OrderV2PostResponseBody> {
    const prompt = this.createPrompt(userPrompt, gameStatusInfo);
    console.log(prompt)
    const aiResponse = await this.sendPromptToAi(prompt);
    console.log(aiResponse)
    const text = aiResponse.output.message.content[0].text
    console.log(text)
    const response = await this.parseResponse(text);
    console.log(response)
    return response;
  }

  /**
   * AIにプロンプトを送信する関数
   * @param prompt プロンプト
   * @returns レスポンスボディ
   */
  private async sendPromptToAi(prompt: string): Promise<AIResponse> {
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

  private createPrompt(userPrompt: string, gameStatusInfo: GameStatusInfo) {
    return `
あなたはリアルタイムストラテジーゲームにおいて、ユーザープロンプトとして自然言語で入力された命令をXMLに変換するエージェントです。
現在のゲーム状況、ユーザプロンプト、出力用XSDスキーマを以下に示します。これらに基づいて適切な操作を表すXMLを出力してください。
XML以外は絶対に出力しないでください。
必ず提供されたXSDスキーマに準拠した有効なXMLを返してください。

# 現在のゲーム状況
${this.formatGameStatusInfo(gameStatusInfo)}

# ユーザプロンプト
${userPrompt}

# 出力用XSDスキーマ
${llmOutputSchema}
`
  }

  private formatGameStatusInfo(gameStatusInfo: GameStatusInfo): string {
    const sections = [];

    // 生存ユニット情報
    if (gameStatusInfo.aliveUnitIds.length > 0) {
      sections.push(`## 生存ユニット
- ユニット数: ${gameStatusInfo.aliveUnitIds.length}体
- ユニットID: ${gameStatusInfo.aliveUnitIds.join(', ')}`);
    } else {
      sections.push(`## 生存ユニット
- 生存ユニットなし`);
    }

    // 死亡ユニット情報
    if (gameStatusInfo.deadUnitIds.length > 0) {
      sections.push(`## 死亡ユニット
- 死亡ユニット数: ${gameStatusInfo.deadUnitIds.length}体
- 死亡ユニットID: ${gameStatusInfo.deadUnitIds.join(', ')}`);
    } else {
      sections.push(`## 死亡ユニット
- 死亡ユニットなし`);
    }

    // 配置可能構造物情報
    if (gameStatusInfo.deployableStructureIds.length > 0) {
      sections.push(`## 配置可能構造物
- 配置可能構造物数: ${gameStatusInfo.deployableStructureIds.length}個
- 構造物ID: ${gameStatusInfo.deployableStructureIds.join(', ')}`);
    } else {
      sections.push(`## 配置可能構造物
- 配置可能構造物なし`);
    }

    // 生存敵タイプ情報
    if (gameStatusInfo.aliveEnemyTypes.length > 0) {
      sections.push(`## 生存敵タイプ
- 敵タイプ数: ${gameStatusInfo.aliveEnemyTypes.length}種類
- 敵タイプ: ${gameStatusInfo.aliveEnemyTypes.join(', ')}`);
    } else {
      sections.push(`## 生存敵タイプ
- 生存敵なし`);
    }

    return sections.join('\n\n');
  }

  public async parseResponse(responseText: string): Promise<OrderV2PostResponseBody> {
    // Try to extract XML content from the response
    const xmlMatch = responseText.match(/```xml\s*([\s\S]*?)\s*```/) ||
      responseText.match(/```\s*([\s\S]*?)\s*```/) ||
      [null, responseText.trim()];

    let xmlContent = xmlMatch[1] || responseText;

    // Remove any commentary before or after the actual XML
    xmlContent = xmlContent.replace(/^[^<]+/, '').replace(/[^>]+$/, '');

    try {
      // Validate the XML
      const isValid = XMLValidator.validate(xmlContent);
      if (isValid !== true) {
        console.error("XML validation failed:", isValid.err);
        // Return a minimal valid object as fallback
        return { orders: [] };
      }

      // Parse XML to object
      const parsedObject = this.xmlParser.parse(xmlContent);

      // Handle both new LLMOutput format and old order format
      if (parsedObject.llmOutput && parsedObject.llmOutput.orders) {
        // New format: orders.order contains the array of orders
        const ordersData = parsedObject.llmOutput.orders;
        
        // Handle case where orders.order is an array or single object
        let orderArray = [];
        if (ordersData.order) {
          orderArray = Array.isArray(ordersData.order) ? ordersData.order : [ordersData.order];
        }
        
        return {
          orders: this.transformNewOrderFormat(orderArray)
        };
      }
      else if (parsedObject.order) {
        // Old format - transform to new format
        return {
          orders: this.transformOldOrderFormat(parsedObject.order)
        };
      }
      else {
        console.error("XML structure doesn't match expected format");
        return { orders: [] };
      }
    } catch (error) {
      console.error("Failed to parse LLM response as XML:", error);
      // Return a minimal valid object as fallback
      return { orders: [] };
    }
  }

  private transformNewOrderFormat(orderArray: any[]): Order[] {
    const orders: Order[] = [];

    orderArray.forEach(orderObj => {
      if (orderObj.attackTarget) {
        orders.push({
          type: "attackTarget",
          entityId: orderObj.attackTarget.entityId,
          targetEnemyTypeId: orderObj.attackTarget.targetEnemyTypeId
        } as AttackTargetOrder);
      }
      else if (orderObj.deploymentTarget) {
        orders.push({
          type: "deploymentTarget",
          entityId: orderObj.deploymentTarget.entityId,
          targetStructureId: orderObj.deploymentTarget.targetStructureId
        } as DeploymentTargetOrder);
      }
      else if (orderObj.defenseCrystal) {
        orders.push({
          type: "defenseCrystal",
          entityId: orderObj.defenseCrystal.entityId
        } as DefenseCrystalOrder);
      }
      else if (orderObj.reviveAllyUnit) {
        orders.push({
          type: "reviveAllyUnit",
          entityId: orderObj.reviveAllyUnit.entityId
        } as any); // Assuming ReviveAllyUnitOrder exists
      }
    });

    return orders;
  }

  private transformOldOrderFormat(orderObj: any): Order[] {
    const orders: Order[] = [];

    // Process target orders
    if (orderObj.target) {
      if (orderObj.target.enemy && orderObj.target.enemy.id) {
        orders.push({
          type: "attackTarget",
          entityId: orderObj.target.enemy.id,
          targetEnemyTypeId: orderObj.target.enemy.id
        } as AttackTargetOrder);
      }

      if (orderObj.target.structure && orderObj.target.structure.id) {
        orders.push({
          type: "deploymentTarget",
          entityId: "ally-unit", // Placeholder, should be replaced
          targetStructureId: orderObj.target.structure.id
        } as DeploymentTargetOrder);
      }
    }

    // Process create orders (simplified)
    if (orderObj.create && orderObj.create.unit) {
      const units = Array.isArray(orderObj.create.unit) ?
        orderObj.create.unit : [orderObj.create.unit];

      units.forEach(unit => {
        if (unit.unitTypeId) {
          // This is a simplification, in a real system you'd map
          // create operations to the appropriate order types
          orders.push({
            type: "defenseCrystal",
            entityId: unit.unitTypeId
          } as DefenseCrystalOrder);
        }
      });
    }

    return orders;
  }
}
