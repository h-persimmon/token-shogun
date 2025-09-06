import { EventModule } from "./event/module";
import { GameStatus } from "./game-status";
import { OrderModule } from "./order/module";
import { Stage } from "../../apps/platform/src/game-logic/stage/interface";
import { TokenModule } from "./token/module";
import { UnitModule } from "./unit/module";
import { UnitTypeModule } from "./unit/unit-type/module";

/**
 * ゲームを管理するクラス
 */
export class GameEngine {
  /**
   * ゲームのID
   */
  public readonly id: string;

  /**
   * ステージ情報
   */
  private readonly stage: Stage;

  /**
   * イベントに関するモジュール
   * イベントの管理などを委譲
   */
  private readonly eventModule: EventModule;

  /**
   * ユニットタイプに関するモジュール
   * ユニットタイプの管理などを委譲
   */
  private readonly unitTypeModule: UnitTypeModule;

  /**
   * ユニットに関するモジュール
   * ユニットの作成・管理などを委譲
   */
  private readonly unitModule: UnitModule;

  /**
   * トークンに関するモジュール
   * トークンの管理や計算などを委譲
   */
  private readonly tokenModule: TokenModule;

  /**
   * 命令に関するモジュール
   * AIへの命令やそれに伴うユニットの状態変化などを委譲
   */
  private readonly orderModule: OrderModule;

  /**
   * コンストラクタ
   * @param Stage ステージ情報
   */
  private constructor(stage: Stage) {
    // ステージ情報を保存
    this.stage = stage;

    // 各モジュールを生成
    this.eventModule = new EventModule();
    this.unitTypeModule = new UnitTypeModule();
    this.unitModule = new UnitModule(this.eventModule, this.unitTypeModule);
    this.tokenModule = new TokenModule();
    this.orderModule = new OrderModule(this.unitModule, this.stage);

    // IDを設定
    this.id = "game-" + Date.now().toString();

    // 敵を配置
    this.createEnemies();
  }

  /**
   * インスタンスを生成する関数
   * @param stageId ステージ情報ID
   */
  public static async createInstance(stageId: string) {
    const stage = await this.getStage(stageId);
    return new GameEngine(stage);
  }

  /**
   * ステージ情報IDからステージ情報を取得する関数
   * @param stageId ステージ情報ID
   */
  private static async getStage(stageId: string): Promise<Stage> {
    const url = `/api/stages/${stageId}`;
    const response = await fetch(url, { method: "GET" });
    return response.json();
  }

  /**
   * 初期の敵ユニットを作成する関数
   */
  private createEnemies(): void {
    for (const enemyUnitConfig of this.stage.enemyUnitList) {
      this.unitModule.createEnemyUnit(
        enemyUnitConfig.unitTypeId,
        enemyUnitConfig.position,
      );
    }
  }

  /**
   * ゲーム状況を取得する（Kiroが生成）
   * @returns ゲーム状況オブジェクト
   */
  public getGameStatus(): GameStatus {
    return {
      stage: this.stage,
      enemyUnitList: this.unitModule.enemyUnitList,
      allyUnitList: this.unitModule.allyUnitList,
    };
  }

  /**
   * プロンプトのトークン数を計算する関数
   * @param prompt
   */
  public async countTokens(prompt: string): Promise<number> {
    return this.tokenModule.countTokens(prompt);
  }

  /**
   * プロンプトを処理する
   * @param userPrompt ユーザープロンプト
   * @returns 処理結果
   */
  public async order(userPrompt: string): Promise<void> {
    await this.orderModule.order(userPrompt);
  }
}
