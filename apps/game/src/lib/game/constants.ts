import type { CombatRangeConfig, StunConfig } from "./types/combat-config";

// 攻撃を受けた直後の硬直時間
// この時間の間は、移動がストップする
export const STUN_DURATION = 500; // ミリ秒

/**
 * スタン効果のデフォルト設定
 */
export const DEFAULT_STUN_CONFIG: StunConfig = {
  defaultDuration: 1000, // 1秒
  unitTypeModifiers: {
    light: 0.8, // 軽装ユニットは20%短縮
    heavy: 1.2, // 重装ユニットは20%延長
    fast: 0.6, // 高速ユニットは40%短縮
    tank: 1.5, // タンクユニットは50%延長
  },
  visualEffectDuration: 300, // 0.3秒
};

/**
 * 戦闘範囲判定のデフォルト設定
 */
export const DEFAULT_COMBAT_RANGE_CONFIG: CombatRangeConfig = {
  stopThreshold: 0.95, // 攻撃範囲の95%で停止
  resumeThreshold: 1.1, // 攻撃範囲の110%で移動再開
  checkInterval: 100, // 100ms間隔でチェック
};
