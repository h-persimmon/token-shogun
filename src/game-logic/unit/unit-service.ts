import { Position } from "../position/position";
import { AllyUnit, EnemyUnit } from "./unit";
import { allyUnitTypeList, enemyUnitTypeList } from "./unit-type";

/**
 * ユニットに関するサービス
 */
export class UnitService {
  /**
   * 味方ユニットの数
   */
  public allyUnitCount: number;

  /**
   * 敵ユニットの数
   */
  public enemyUnitCount: number;

  /**
   * コンストラクタ
   */
  public constructor() {
    this.allyUnitCount = 0;
    this.enemyUnitCount = 0;
  }

  /**
   * 味方ユニットを作成する関数
   * @param unitTypeId ユニットタイプID
   * @param position 座標
   * @returns 味方ユニット
   */
  public createAllyUnit(
    unitTypeId: string,
    position: Position,
  ) {
    const unitType = allyUnitTypeList.find((allyUnitType) => allyUnitType.id === unitTypeId)!;
    if (!unitType) {
      throw new Error(`ユニットタイプ ${unitTypeId} は存在しません`)
    }
    const unitId = `ally-${++this.allyUnitCount}-${unitType.id}`
    return new AllyUnit(unitId, unitType, position);
  }

  /**
   * 敵ユニットを作成する関数
   * @param unitTypeId ユニットタイプID
   * @param position 座標
   * @returns 敵ユニット
   */
  public createEnemyUnit(
    unitTypeId: string,
    position: Position,
  ) {
    const unitType = enemyUnitTypeList.find((enemyUnitType) => enemyUnitType.id === unitTypeId);
    if (!unitType) {
      throw new Error(`ユニットタイプ ${unitTypeId} は存在しません`)
    }
    const unitId = `enemy-${++this.enemyUnitCount}-${unitType.id}`
    return new EnemyUnit(unitId, unitType, position);
  }
}
