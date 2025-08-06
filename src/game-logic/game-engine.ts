import { OrderService } from "./order/order-service";
import { StageConfig, stageConfigList } from "./stage/stage";
import { UnitService } from "./unit/unit-service";

/**
 * ゲームを管理するクラス
 */
export class GameEngine {
  private readonly unitService: UnitService;
  private readonly orderService: OrderService;
  readonly id: string;
  readonly stageConfig: StageConfig;

  /**
   * コンストラクタ
   * @param stageId ステージID
   */
  public constructor(
    stageId: number,
  ) {
    this.unitService = new UnitService();
    this.orderService = new OrderService(this.unitService);
    this.id = "game-" + Date.now().toString();
    this.stageConfig = stageConfigList.find((stageConfig) => stageConfig.id === stageId)!
    this.createEnemies();
  }

  /**
   * 初期の敵ユニットを作成する関数
   */
  private createEnemies(): void {
    for (const enemyUnitConfig of this.stageConfig.enemyUnitList) {
      this.unitService.createEnemyUnit(
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
      enemyUnits: this.unitService.enemyUnitList.map(unit => ({
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
      allyUnits: this.unitService.allyUnitList.map(unit => ({
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
    await this.orderService.order(userPrompt);
  }
}
