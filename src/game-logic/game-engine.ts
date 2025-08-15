import { EventModule } from "./event/module";
import { OrderModule } from "./order/module";
import { Stage } from "./stage/interface";
import { StageModule } from "./stage/module";
import { UnitModule } from "./unit/module";
import { UnitTypeModule } from "./unit/unit-type/module";

/**
 * ゲームを管理するクラス
 */
export class GameEngine {
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
   * ステージに関するモジュール
   * ステージの管理などを委譲
   */
  private readonly stageModule: StageModule;

  /**
   * 命令に関するモジュール
   * AIへの命令やそれに伴うユニットの状態変化などを委譲
   */
  private readonly orderModule: OrderModule;

  /**
   * ステージ情報
   */
  private readonly stage: Stage;

  /**
   * ゲームのID
   */
  public readonly id: string;

  /**
   * コンストラクタ
   * @param stageId ステージID
   */
  public constructor(stageId: string) {
    // 各モジュールを生成
    this.eventModule = new EventModule();
    this.unitTypeModule = new UnitTypeModule();
    this.unitModule = new UnitModule(this.eventModule, this.unitTypeModule);
    this.stageModule = new StageModule();
    this.orderModule = new OrderModule(this.unitModule);

    // ゲームの初期設定
    const stageOrNull = this.stageModule.findByIdOrNull(stageId);
    if (!stageOrNull) {
      throw new Error(`ステージ ${stageId} は存在しません。`);
    }
    this.stage = stageOrNull;
    this.id = "game-" + Date.now().toString();
    this.createEnemies();
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
  public getGameStatus() {
    return {
      gameId: this.id,
      stage: {
        id: this.stage.id,
        name: this.stage.name,
        difficulty: this.stage.difficulty,
        fieldSize: this.stage.fieldSize,
        maxTokens: this.stage.maxTokens,
      },
      enemyUnits: this.unitModule.enemyUnitList.map((unit) => ({
        id: unit.id,
        unitType: {
          id: unit.unitType.id,
          name: unit.unitType.name,
          faction: unit.unitType.faction,
          maxHp: unit.unitType.maxHp,
          defaultSpeed: unit.unitType.defaultSpeed,
        },
        position: unit.position,
        currentHp: unit.currentHp,
        currentSpeed: unit.currentSpeed,
        currentEvent: unit.currentEvent,
      })),
      allyUnits: this.unitModule.allyUnitList.map((unit) => ({
        id: unit.id,
        unitType: {
          id: unit.unitType.id,
          name: unit.unitType.name,
          faction: unit.unitType.faction,
          maxHp: unit.unitType.maxHp,
          defaultSpeed: unit.unitType.defaultSpeed,
        },
        position: unit.position,
        currentHp: unit.currentHp,
        currentSpeed: unit.currentSpeed,
        currentEvent: unit.currentEvent,
      })),
    };
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
