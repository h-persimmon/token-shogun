import { Position } from "../position/position";
import { Difficulty } from "./difficulty";

/**
 * ステージを表すインターフェース
 */
export interface Stage {
  /**
   * ID
   */
  readonly id: number;

  /**
   * 名前
   */
  readonly name: string;

  /**
   * 難易度
   */
  readonly difficulty: Difficulty;

  /**
   * フィールドサイズ
   */
  readonly fieldSize: {
    /**
     * 横
     */
    readonly width: number;

    /**
     * 縦
     */
    readonly height: number
  };

  /**
   * 初期配置される敵ユニット一覧
   */
  readonly enemyUnitList: readonly {
    /**
     * ユニットタイプID
     */
    readonly unitTypeId: string;

    /**
     * 座標
     */
    readonly position: Position;
  }[];

  /**
   * 配置可能な味方ユニット一覧
   */
  readonly allyUnitIdList: readonly string[];

  /**
   * 使用可能なトークン数
   */
  readonly maxTokens: number;
}
