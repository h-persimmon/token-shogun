import type { Component } from "./types";

export const enemyComponentTag = "enemy";

export type EnemyType = "basic" | "fast" | "heavy";

export type StructureTargetPriority = "gate" | "defense" | "any";

export type EnemyComponent = Component<
  typeof enemyComponentTag,
  {
    enemyType: string;
    spawnTime: number;
    rewardValue: number; // 撃破時の報酬
    structureTargetPriority: StructureTargetPriority; // 構造物の攻撃優先度
  }
>;

export const createEnemyComponent = (
  enemyType: EnemyType,
  spawnTime: number = Date.now(),
  structureTargetPriority: StructureTargetPriority,
  rewardValue: number,
): EnemyComponent => ({
  type: enemyComponentTag,
  enemyType,
  spawnTime,
  rewardValue: rewardValue || 0,
  structureTargetPriority: structureTargetPriority
});

export const isEnemyComponent = (
  component: Component<any, any>,
): component is EnemyComponent => {
  return component.type === enemyComponentTag;
};

export const getEnemyAge = (
  enemy: EnemyComponent,
  currentTime: number = Date.now(),
): number => {
  return Math.max(0, currentTime - enemy.spawnTime);
};

export const isEnemyType = (
  enemy: EnemyComponent,
  type: EnemyType,
): boolean => {
  return enemy.enemyType === type;
};

export const getEnemyReward = (enemy: EnemyComponent): number => {
  return enemy.rewardValue;
};

// 構造物の優先度に関するユーティリティ関数
export const getStructureTargetPriority = (
  enemy: EnemyComponent,
): StructureTargetPriority => {
  return enemy.structureTargetPriority;
};

export const setStructureTargetPriority = (
  enemy: EnemyComponent,
  priority: StructureTargetPriority,
): void => {
  enemy.structureTargetPriority = priority;
};

export const isGatePriority = (enemy: EnemyComponent): boolean => {
  return enemy.structureTargetPriority === "gate";
};

export const isDefensePriority = (enemy: EnemyComponent): boolean => {
  return enemy.structureTargetPriority === "defense";
};

export const isAnyStructurePriority = (enemy: EnemyComponent): boolean => {
  return enemy.structureTargetPriority === "any";
};
