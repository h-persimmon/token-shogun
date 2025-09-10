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
