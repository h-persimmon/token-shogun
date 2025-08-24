import { OrderPostResponseBody } from "@/api-interface/order/post-response-body";
import { OrderPostRequestBody } from "@/api-interface/order/post-request-body";
import { headerPrompt, xmlSchema } from "./prompt";
import { UnitModule } from "../unit/module";
import { TokenModule } from "../token/module";

/**
 * 命令に関するモジュール
 */
export class OrderModule {
  /**
   * コンストラクタ
   */
  public constructor(
    /**
     * ユニットに関するモジュール
     */
    private readonly unitModule: UnitModule,

    /**
     * トークンに関するモジュール
     */
    private readonly tokenModule: TokenModule,
  ) {}

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
    await this.tokenModule.consumeToken(userPrompt);
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
    text +=
      "unitId(string), unitTypeId(string), positionX(number), positionY(number), currentHp(number), currentSpeed(number), currentEventId(string)\n";

    for (const unit of this.unitModule.allyUnitList) {
      text += `"${unit.id}", "${unit.unitType.id}", ${unit.position.x}, ${unit.position.y}, ${unit.currentHp}, ${unit.currentSpeed}, "${unit.currentEvent.id}"\n`;
    }
    text += "```\n";

    text += "### ユニットタイプ詳細\n";
    text += "```csv\n";
    text +=
      "unitTypeId(string), unitTypeName(string), maxHp(number), defaultSpeed(number)\n";

    // 味方ユニットタイプの重複を除去
    const allyUnitTypes = new Set<string>();
    for (const unit of this.unitModule.allyUnitList) {
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
    text +=
      "unitId(string), unitTypeId(string), positionX(number), positionY(number), currentHp(number), currentSpeed(number), currentEventId(string)\n";

    for (const unit of this.unitModule.enemyUnitList) {
      text += `"${unit.id}", "${unit.unitType.id}", ${unit.position.x}, ${unit.position.y}, ${unit.currentHp}, ${unit.currentSpeed}, "${unit.currentEvent.id}"\n`;
    }
    text += "```\n";

    text += "### ユニットタイプ詳細\n";
    text += "```csv\n";
    text +=
      "unitTypeId(string), unitTypeName(string), maxHp(number), defaultSpeed(number)\n";

    // 敵ユニットタイプの重複を除去
    const enemyUnitTypes = new Set<string>();
    for (const unit of this.unitModule.enemyUnitList) {
      if (!enemyUnitTypes.has(unit.unitType.id)) {
        enemyUnitTypes.add(unit.unitType.id);
        text += `"${unit.unitType.id}", "${unit.unitType.name}", ${unit.unitType.maxHp}, ${unit.unitType.defaultSpeed}\n`;
      }
    }
    text += "```\n";

    // イベント
    text += "## イベント\n";
    text += "```json\n";

    const eventsByUnitType: {
      [key: string]: Array<{ id: string; name: string }>;
    } = {};

    // 全ユニットタイプのイベントを収集
    const allUnits = [
      ...this.unitModule.allyUnitList,
      ...this.unitModule.enemyUnitList,
    ];
    for (const unit of allUnits) {
      if (!eventsByUnitType[unit.unitType.id]) {
        eventsByUnitType[unit.unitType.id] = [];
      }
      // availableEventListからイベントを追加（重複除去）
      for (const event of unit.unitType.availableEventList) {
        if (
          !eventsByUnitType[unit.unitType.id].some((e) => e.id === event.id)
        ) {
          eventsByUnitType[unit.unitType.id].push({
            id: event.id,
            name: event.name,
          });
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
  private async sendPromptToServer(
    prompt: string,
  ): Promise<OrderPostResponseBody> {
    const url = "/api/order";
    const orderRequestBody: OrderPostRequestBody = { prompt };
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(orderRequestBody),
    });
    return response.json();
  }

  /**
   * AIから返されたXMLをもとにゲーム内状況を更新する関数（Kiroが生成）
   * @param responseXml AIから返されたXML
   */
  private updateGameStatus(responseXml: string): void {
    try {
      // XMLをパースしてDOMオブジェクトに変換
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(responseXml, "text/xml");

      // パースエラーをチェック
      const parseError = xmlDoc.querySelector("parsererror");
      if (parseError) {
        console.error("XML parse error:", parseError.textContent);
        return;
      }

      // orderルート要素を取得
      const orderElement = xmlDoc.querySelector("order");
      if (!orderElement) {
        console.error("order要素が見つかりません");
        return;
      }

      // create要素を処理
      const createElement = orderElement.querySelector("create");
      if (createElement) {
        this.processCreateElement(createElement);
      }

      // update要素を処理（現在のスキーマには含まれていないが、将来の拡張のため）
      const updateElement = orderElement.querySelector("update");
      if (updateElement) {
        // 将来の実装用
        console.log("update要素が見つかりましたが、現在は未実装です");
      }
    } catch (error) {
      console.error("XML処理中にエラーが発生しました:", error);
    }
  }

  /**
   * create要素を処理してユニットを作成する関数（Kiroが生成）
   * @param createElement create要素
   */
  private processCreateElement(createElement: Element): void {
    const unitElements = createElement.querySelectorAll("unit");

    for (const unitElement of unitElements) {
      const unitTypeIdElement = unitElement.querySelector("unitTypeId");
      if (!unitTypeIdElement) {
        console.error("unitTypeId要素が見つかりません");
        continue;
      }

      const unitTypeId = unitTypeIdElement.textContent?.trim();
      if (!unitTypeId) {
        console.error("unitTypeIdが空です");
        continue;
      }

      // 仮実装：適当な座標でユニットを作成
      const position = {
        x: Math.floor(Math.random() * 10),
        y: Math.floor(Math.random() * 10),
      };

      try {
        this.unitModule.createAllyUnit(unitTypeId, position);
        console.log(
          `味方ユニット ${unitTypeId} を座標 (${position.x}, ${position.y}) に作成しました`,
        );
      } catch (error) {
        console.error(`ユニット作成エラー (${unitTypeId}):`, error);
      }
    }
  }
}
