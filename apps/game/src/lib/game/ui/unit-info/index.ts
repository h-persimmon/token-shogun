// ユニット情報ポップアップシステムのエクスポート

export { PopupRenderer } from "./popup-renderer";
export { RangeVisualizer } from "./range-visualizer";
export type {
  RangeVisualizerOptions,
  UnitInfoData,
  UnitInfoPopup,
} from "./types";
export { UnitInfoPopupSystem } from "./unit-info-popup-system";
export {
  calculateHealthPercentage,
  canUnitAttack,
  determineUnitType,
  extractUnitInfo,
  generateUnitDisplayName,
  getHealthStatus,
} from "./unit-info-utils";
