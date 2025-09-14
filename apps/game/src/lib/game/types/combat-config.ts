/**
 * スタン効果の設定インターフェース
 */
export interface StunConfig {
  /** デフォルトのスタン時間（ミリ秒） */
  defaultDuration: number;
  /** ユニットタイプ別のスタン時間修正値 */
  unitTypeModifiers: Record<string, number>;
  /** 視覚効果の表示時間（ミリ秒） */
  visualEffectDuration: number;
}

/**
 * 戦闘範囲判定の設定インターフェース
 */
export interface CombatRangeConfig {
  /** 停止する距離の閾値（攻撃範囲の何%で停止するか 0.0-1.0） */
  stopThreshold: number;
  /** 移動を再開する距離の閾値（攻撃範囲の何%で再開するか 0.0-1.0） */
  resumeThreshold: number;
  /** 範囲チェックの間隔（ミリ秒） */
  checkInterval: number;
}
