import { EventModule } from "../event/module";
import { Position } from "../position/position";
import { AllyUnit, EnemyUnit } from "./class";
import { UnitTypeModule } from "./unit-type/module";

/**
 * ユニットに関するモジュール
 */
export class UnitModule {
  /**
   * 味方ユニット一覧
   */
  public readonly allyUnitList: AllyUnit[];

  /**
   * 敵ユニット一覧
   */
  public readonly enemyUnitList: EnemyUnit[];

  /**
   * コンストラクタ
   */
  public constructor(
    /**
     * イベントに関するモジュール
     */
    private readonly eventModule: EventModule,

    /**
     * ユニットタイプに関するモジュール
     */
    private readonly unitTypeModule: UnitTypeModule,
  ) {
    this.allyUnitList = [];
    this.enemyUnitList = [];
  }

  /**
   * 味方ユニットを作成する関数
   * @param unitTypeId ユニットタイプID
   * @param position 座標
   * @returns 味方ユニット
   */
  public createAllyUnit(unitTypeId: string, position: Position): void {
    const unitType = this.unitTypeModule.findAllyByIdOrNull(unitTypeId);
    if (!unitType) {
      throw new Error(`味方ユニットタイプ ${unitTypeId} は存在しません`);
    }
    const unitId = `${unitType.id}-${++unitType.unitCount}`;
    this.allyUnitList.push(
      new AllyUnit(
        unitId,
        unitType,
        position,
        this.eventModule.getDefaultModule(),
      ),
    );
  }

  /**
   * 敵ユニットを作成する関数
   * @param unitTypeId ユニットタイプID
   * @param position 座標
   * @returns 敵ユニット
   */
  public createEnemyUnit(unitTypeId: string, position: Position): void {
    const unitType = this.unitTypeModule.findEnemyByIdOrNull(unitTypeId);
    if (!unitType) {
      throw new Error(`敵ユニットタイプ ${unitTypeId} は存在しません`);
    }
    const unitId = `${unitType.id}-${++unitType.unitCount}`;
    this.enemyUnitList.push(
      new EnemyUnit(
        unitId,
        unitType,
        position,
        this.eventModule.getDefaultModule(),
      ),
    );
  }
}
