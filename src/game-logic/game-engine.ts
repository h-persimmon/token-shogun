import { OrderService } from "./order/order-service";
import { Position } from "./position/position";
import { StageConfig, stageConfigList } from "./stage/stage";
import { AllyUnit, EnemyUnit } from "./unit/unit";
import { UnitService } from "./unit/unit-service";

/**
 * ゲームを管理するクラス
 */
export class GameEngine {
  private readonly unitService: UnitService;
  private readonly orderService: OrderService;
  readonly id: string;
  readonly stageConfig: StageConfig;
  readonly enemyUnitList: EnemyUnit[];
  readonly allyUnitList: AllyUnit[];

  /**
   * コンストラクタ
   * @param stageId ステージID
   */
  public constructor(
    stageId: number,
  ) {
    this.unitService = new UnitService();
    this.orderService = new OrderService(this);
    this.id = "game-" + Date.now().toString();
    this.stageConfig = stageConfigList.find((stageConfig) => stageConfig.id === stageId)!
    this.enemyUnitList = [];
    this.allyUnitList = [];
  }

  /**
   * ゲームを初期化する関数
   */
  public init(): void {
    for (const enemyUnitConfig of this.stageConfig.enemyUnitList) {
      const enemyUnit = this.unitService.createEnemyUnit(
        enemyUnitConfig.unitTypeId,
        enemyUnitConfig.position
      );
      this.enemyUnitList.push(enemyUnit);
    }
  }

  /**
   * 味方ユニットを作成し配置する関数
   * @param unitTypeId ユニットタイプID
   * @param position 座標
   */
  public createAllyUnit(
    unitTypeId: string,
    position: Position,
  ): void {
    const allyUnit = this.unitService.createAllyUnit(unitTypeId, position);
    this.allyUnitList.push(allyUnit);
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
      enemyUnits: this.enemyUnitList.map(unit => ({
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
      allyUnits: this.allyUnitList.map(unit => ({
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
