import { Position } from "../position/position";
import { AllyUnit, EnemyUnit } from "./unit";
import { allyUnitTypeList, enemyUnitTypeList } from "./unit-type";

/**
 * ユニットに関するサービス
 */
export class UnitService {
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
  public constructor() {
    this.allyUnitList = [];
    this.enemyUnitList = [];
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
  ): void {
    const unitType = allyUnitTypeList.find((allyUnitType) => allyUnitType.id === unitTypeId)!;
    if (!unitType) {
      throw new Error(`ユニットタイプ ${unitTypeId} は存在しません`)
    }
    const unitId = `ally-${1}-${unitType.id}` // TODO
    this.allyUnitList.push(new AllyUnit(unitId, unitType, position))
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
  ): void {
    const unitType = enemyUnitTypeList.find((enemyUnitType) => enemyUnitType.id === unitTypeId);
    if (!unitType) {
      throw new Error(`ユニットタイプ ${unitTypeId} は存在しません`)
    }
    const unitId = `enemy-${1}-${unitType.id}` // TODO
    this.enemyUnitList.push(new EnemyUnit(unitId, unitType, position));
  }
}
