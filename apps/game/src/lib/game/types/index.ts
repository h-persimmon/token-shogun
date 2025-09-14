export type { CombatRangeConfig, StunConfig } from "./combat-config";
export type {
  TargetSwitchEvaluation,
  TargetSwitchingConfig,
} from "./target-switching-config";
export {
  DEFAULT_TARGET_SWITCHING_CONFIG,
  getEnemyTypeConfig,
  isTargetSwitchingEnabledForType,
  isTargetSwitchingGloballyEnabled,
  loadTargetSwitchingConfig,
  updateEnemyTypeConfig,
  validateEnemyTargetSwitchingConfig,
  validateTargetSwitchingConfig,
} from "./target-switching-config";
