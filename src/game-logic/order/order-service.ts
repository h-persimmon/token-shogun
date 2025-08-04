import { OrderResponseBody } from "@/api-interface/order/response-body";
import { UnitService } from "../unit/unit-service";
import { GameEngine } from "../engine";
import { OrderRequestBody } from "@/api-interface/order/request-body";
import { headerPrompt, xmlSchema } from "./prompt";

/**
 * 命令に関するサービス
 */
export class OrderService {
  /**
   * コンストラクタ
   */
  public constructor(
    /**
     * ゲームエンジン
     */
    private readonly gameEngine: GameEngine,
  ) {};

  /**
   * AIに命令してゲーム状況を更新する関数
   * @param userPrompt ユーザプロンプト
   */
  public async order(userPrompt: string): Promise<void> {
    const gameStatusText = this.createGameStatusText();
    const prompt = `#システムプロンプト\n${headerPrompt}\n\n#現在のゲーム状況\n${gameStatusText}\n\n#ユーザプロンプト\n${userPrompt}\n\n#XMLスキーマ\n${xmlSchema}`;
    console.log(prompt); // TODO
    const orderResponseBody = await this.sendPromptToServer(prompt);
    console.log(orderResponseBody.output.message.content[0].text); // TODO
    this.updateGameStatus(orderResponseBody.output.message.content[0].text);
  }

  /**
   * ゲーム状況を表すテキストを作成する関数（Kiroが生成）
   * @returns ゲーム状況を表すテキスト
   */
  public createGameStatusText(): string {
    let text = "";

    // 味方ユニット
    text += "## 味方ユニット\n";
    text += "### ユニット一覧\n";
    text += "```csv\n";
    text += "unitId(string), unitTypeId(string), positionX(number), positionY(number), currentHp(number), currentSpeed(number), currentEventId(string)\n";

    for (const unit of this.gameEngine.allyUnitList) {
      text += `"${unit.id}", "${unit.unitType.id}", ${unit.position.x}, ${unit.position.y}, ${unit.currentHp}, ${unit.currentSpeed}, "${unit.currentEvent.id}"\n`;
    }
    text += "```\n";

    text += "### ユニットタイプ詳細\n";
    text += "```csv\n";
    text += "unitTypeId(string), unitTypeName(string), maxHp(number), defaultSpeed(number)\n";

    // 味方ユニットタイプの重複を除去
    const allyUnitTypes = new Set<string>();
    for (const unit of this.gameEngine.allyUnitList) {
      if (!allyUnitTypes.has(unit.unitType.id)) {
        allyUnitTypes.add(unit.unitType.id);
        text += `"${unit.unitType.id}", "${unit.unitType.name}", ${unit.unitType.maxHp}, ${unit.unitType.defaultSpeed}\n`;
      }
    }
    text += "```\n";

    // 敵ユニット
    text += "## 敵ユニット\n";
    text += "### ユニット一覧\n";
    text += "```csv\n";
    text += "unitId(string), unitTypeId(string), positionX(number), positionY(number), currentHp(number), currentSpeed(number), currentEventId(string)\n";

    for (const unit of this.gameEngine.enemyUnitList) {
      text += `"${unit.id}", "${unit.unitType.id}", ${unit.position.x}, ${unit.position.y}, ${unit.currentHp}, ${unit.currentSpeed}, "${unit.currentEvent.id}"\n`;
    }
    text += "```\n";

    text += "### ユニットタイプ詳細\n";
    text += "```csv\n";
    text += "unitTypeId(string), unitTypeName(string), maxHp(number), defaultSpeed(number)\n";

    // 敵ユニットタイプの重複を除去
    const enemyUnitTypes = new Set<string>();
    for (const unit of this.gameEngine.enemyUnitList) {
      if (!enemyUnitTypes.has(unit.unitType.id)) {
        enemyUnitTypes.add(unit.unitType.id);
        text += `"${unit.unitType.id}", "${unit.unitType.name}", ${unit.unitType.maxHp}, ${unit.unitType.defaultSpeed}\n`;
      }
    }
    text += "```\n";

    // イベント
    text += "## イベント\n";
    text += "```json\n";

    const eventsByUnitType: { [key: string]: Array<{ id: string; name: string }> } = {};

    // 全ユニットタイプのイベントを収集
    const allUnits = [...this.gameEngine.allyUnitList, ...this.gameEngine.enemyUnitList];
    for (const unit of allUnits) {
      if (!eventsByUnitType[unit.unitType.id]) {
        eventsByUnitType[unit.unitType.id] = [];
      }
      // availableEventListからイベントを追加（重複除去）
      for (const event of unit.unitType.availableEventList) {
        if (!eventsByUnitType[unit.unitType.id].some(e => e.id === event.id)) {
          eventsByUnitType[unit.unitType.id].push({ id: event.id, name: event.name });
        }
      }
    }

    text += JSON.stringify(eventsByUnitType, null, 2);
    text += "\n```";

    return text;
  }

  /**
   * サーバにユーザプロンプトとゲーム内状況を送信する関数
   * @param prompt ユーザプロンプト
   * @param gameEngine ゲームエンジン
   * @returns レスポンスボディ
   */
  private async sendPromptToServer(prompt: string): Promise<OrderResponseBody> {
    const url = "/api/order";
    const orderRequestBody: OrderRequestBody = { prompt };
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(orderRequestBody),
    })
    return response.json();
  }

  /**
   * AIから返されたXMLをもとにゲーム内状況を更新する関数
   * @param responseXml AIから返されたXML
   */
  private updateGameStatus(responseXml: string): void {

  }
}
