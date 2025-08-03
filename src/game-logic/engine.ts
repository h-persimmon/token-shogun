import { StageConfig, stageConfigList } from "./stage/stage";
import { AllyUnit, EnemyUnit } from "./unit/unit";
import { UnitService } from "./unit/unit-service";

/**
 * ゲームを管理するクラス
 */
export class GameEngine {
  private readonly unitFactory: UnitService;
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
    this.unitFactory = new UnitService();
    this.id = "game-" + Date.now().toString();
    this.stageConfig = stageConfigList.find((stageConfig) => stageConfig.id === stageId)!
    this.enemyUnitList = [];
    this.allyUnitList = [];
  }

  /**
   * 初期化
   */
  public init() {
    for (const enemyUnitConfig of this.stageConfig.enemyUnitList) {
      const enemyUnit = this.unitFactory.createEnemyUnit(
        enemyUnitConfig.unitTypeId,
        enemyUnitConfig.position
      );
      this.enemyUnitList.push(enemyUnit);
    }
  }
}
