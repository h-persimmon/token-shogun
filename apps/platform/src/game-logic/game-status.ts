import { Stage } from "./stage/interface";
import { AllyUnit, EnemyUnit } from "./unit/class";

/**
 * ゲームの状態を表すインターフェース
 */
export interface GameStatus {
  /**
   * ステージ情報
   */
  readonly stage: Stage;

  /**
   * 敵ユニット一覧
   */
  readonly enemyUnitList: ReadonlyArray<EnemyUnit>;

  /**
   * 味方ユニット一覧
   */
  readonly allyUnitList: ReadonlyArray<AllyUnit>;
}
