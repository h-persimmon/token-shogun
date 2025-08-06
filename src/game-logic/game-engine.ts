import { OrderModule } from "./order/order-module";
import { StageConfig, stageConfigList } from "./stage/stage";
import { UnitModule } from "./unit/unit-module";

/**
 * ゲームを管理するクラス
 */
export class GameEngine {
  /**
   * ユニットに関するモジュール  
   * ユニットの作成・管理などを委譲
   */
  private readonly unitModule: UnitModule;

  /**
   * 命令に関するモジュール  
   * AIへの命令やそれに伴うユニットの状態変化などを委譲
   */
  private readonly orderModule: OrderModule;

  /**
   * ステージ情報
   */
  private readonly stageConfig: StageConfig;

  /**
   * ゲームのID
   */
  public readonly id: string;

  /**
   * コンストラクタ
   * @param stageId ステージID
   */
  public constructor(
    stageId: number,
  ) {
    // 各モジュールを生成
    this.unitModule = new UnitModule();
    this.orderModule = new OrderModule(this.unitModule);

    // ゲームの初期設定
    this.stageConfig = stageConfigList.find((stageConfig) => stageConfig.id === stageId)!
    this.id = "game-" + Date.now().toString();
    this.createEnemies();
  }

  /**
   * 初期の敵ユニットを作成する関数
   */
  private createEnemies(): void {
    for (const enemyUnitConfig of this.stageConfig.enemyUnitList) {
      this.unitModule.createEnemyUnit(
        enemyUnitConfig.unitTypeId,
        enemyUnitConfig.position
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
        id: this.stageConfig.id,
        name: this.stageConfig.name,
        difficulty: this.stageConfig.difficulty,
        fieldSize: this.stageConfig.fieldSize,
        maxTokens: this.stageConfig.maxTokens
      },
      enemyUnits: this.unitModule.enemyUnitList.map(unit => ({
        id: unit.id,
        unitType: {
          id: unit.unitType.id,
          name: unit.unitType.name,
          faction: unit.unitType.faction,
          maxHp: unit.unitType.maxHp,
          defaultSpeed: unit.unitType.defaultSpeed
        },
        position: unit.position,
        currentHp: unit.currentHp,
        currentSpeed: unit.currentSpeed,
        currentEvent: unit.currentEvent
      })),
      allyUnits: this.unitModule.allyUnitList.map(unit => ({
        id: unit.id,
        unitType: {
          id: unit.unitType.id,
          name: unit.unitType.name,
          faction: unit.unitType.faction,
          maxHp: unit.unitType.maxHp,
          defaultSpeed: unit.unitType.defaultSpeed
        },
        position: unit.position,
        currentHp: unit.currentHp,
        currentSpeed: unit.currentSpeed,
        currentEvent: unit.currentEvent
      }))
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
