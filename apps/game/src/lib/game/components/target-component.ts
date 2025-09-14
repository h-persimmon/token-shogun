import type { Point } from "./position-component";
import type { Component } from "./types";

export const targetComponentTag = "target";

export type TargetComponent = Component<
  typeof targetComponentTag,
  {
    targetEntityId?: string;
    // 優先攻撃的タイプ
    enemyTypeByOrder?: string;
    targetPosition?: Point;
    targetType: "entity" | "position" | "none";
    priority: number; // 0-10, 高いほど優先
    // 特殊なターゲット状態を示すフラグ
    specialMission?: "defense" | "deployment"; // 拠点守備または砲台配置のミッション中
    // Target switching state management fields
    originalTargetId?: string; // Store original target for potential reversion
    switchReason?: "attack" | "proximity" | "threat"; // Reason for target switch
    canSwitchTarget?: boolean; // Flag to prevent rapid switching
  }
>;

export const createTargetComponent = (
  targetType: "entity" | "position" | "none" = "none",
  priority: number = 5,
): TargetComponent => ({
  type: targetComponentTag,
  targetType,
  priority,
});

export const isTargetComponent = (
  component: Component<any, any>,
): component is TargetComponent => {
  return component.type === targetComponentTag;
};

// Component utility functions

export const setEntityTarget = (
  target: TargetComponent,
  entityId: string,
  priority?: number,
): void => {
  target.targetEntityId = entityId;
  target.targetPosition = undefined;
  target.targetType = "entity";
  if (priority !== undefined) {
    target.priority = Math.max(0, Math.min(10, priority));
  }
};

export const setPositionTarget = (
  target: TargetComponent,
  position: Point,
  priority?: number,
): void => {
  target.targetEntityId = undefined;
  target.targetPosition = { ...position };
  target.targetType = "position";
  if (priority !== undefined) {
    target.priority = Math.max(0, Math.min(10, priority));
  }
};

export const clearTarget = (target: TargetComponent): void => {
  target.targetEntityId = undefined;
  target.targetPosition = undefined;
  target.targetType = "none";
};

export const hasValidTarget = (target: TargetComponent): boolean => {
  return (
    target.targetType !== "none" &&
    ((target.targetType === "entity" && target.targetEntityId !== undefined) ||
      (target.targetType === "position" && target.targetPosition !== undefined))
  );
};

// 優先攻撃ターゲットを設定する関数
export const setPriorityAttackTarget = (
  target: TargetComponent,
  enemyType: string | undefined,
): void => {
  target.enemyTypeByOrder = enemyType;
};

// 特殊ミッション（拠点防衛や砲台配置）の設定
export const setSpecialMission = (
  target: TargetComponent,
  missionType: "defense" | "deployment" | undefined,
): void => {
  target.specialMission = missionType;
};

// 特殊ミッションをクリア
export const clearSpecialMission = (target: TargetComponent): void => {
  target.specialMission = undefined;
};

export const evaluateTargetPriority = (
  target: TargetComponent,
  distance: number,
): number => {
  if (!hasValidTarget(target)) {
    return 0;
  }

  // 距離が近いほど、優先度が高いほど評価値が高くなる
  // 距離の逆数と優先度を組み合わせて評価
  const distanceScore = distance > 0 ? 1 / distance : 1;
  const priorityScore = target.priority / 10;

  return distanceScore * priorityScore;
};

// Target switching state management functions

/**
 * Store the original target before switching to a new target
 */
export const storeOriginalTarget = (
  target: TargetComponent,
  reason: "attack" | "proximity" | "threat",
): void => {
  // Only store if we don't already have an original target stored
  if (!target.originalTargetId && target.targetEntityId) {
    target.originalTargetId = target.targetEntityId;
  }
  target.switchReason = reason;
};

/**
 * Restore the original target if it exists
 */
export const restoreOriginalTarget = (target: TargetComponent): boolean => {
  if (target.originalTargetId) {
    target.targetEntityId = target.originalTargetId;
    target.targetType = "entity";
    target.originalTargetId = undefined;
    target.switchReason = undefined;
    return true;
  }
  return false;
};

/**
 * Clear target switching state
 */
export const clearTargetSwitchingState = (target: TargetComponent): void => {
  target.originalTargetId = undefined;
  target.switchReason = undefined;
  target.canSwitchTarget = undefined;
};

/**
 * Check if the target has switched from its original target
 */
export const hasTargetSwitched = (target: TargetComponent): boolean => {
  return target.originalTargetId !== undefined;
};

/**
 * Set target switching capability flag
 */
export const setCanSwitchTarget = (
  target: TargetComponent,
  canSwitch: boolean,
): void => {
  target.canSwitchTarget = canSwitch;
};

/**
 * Check if target switching is allowed
 */
export const canSwitchTargets = (target: TargetComponent): boolean => {
  return target.canSwitchTarget !== false; // Default to true if not set
};

/**
 * Switch to a new target while preserving original target information
 */
export const switchToNewTarget = (
  target: TargetComponent,
  newTargetId: string,
  reason: "attack" | "proximity" | "threat",
  priority?: number,
): void => {
  // Store original target if this is the first switch
  storeOriginalTarget(target, reason);

  // Set new target
  setEntityTarget(target, newTargetId, priority);

  // Update switch reason
  target.switchReason = reason;
};

/**
 * Get the current switch reason
 */
export const getSwitchReason = (
  target: TargetComponent,
): "attack" | "proximity" | "threat" | undefined => {
  return target.switchReason;
};

/**
 * Get the original target ID
 */
export const getOriginalTargetId = (
  target: TargetComponent,
): string | undefined => {
  return target.originalTargetId;
};
