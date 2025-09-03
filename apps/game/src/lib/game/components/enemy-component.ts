import type { Component } from "./types";

export const enemyComponentTag = "enemy";

export type EnemyType = "basic" | "fast" | "heavy";

export type StructureTargetPriority = "gate" | "defense" | "any";

export type EnemyComponent = Component<
  typeof enemyComponentTag,
  {
    enemyType: EnemyType;
    spawnTime: number;
    rewardValue: number; // 撃破時の報酬
    structureTargetPriority: StructureTargetPriority; // 構造物の攻撃優先度
  }
>;

// 敵の種類別設定
export const ENEMY_CONFIGS = {
  basic: {
    rewardValue: 10,
    health: 100,
    speed: 50,
    damage: 1,
    defaultStructureTargetPriority: "gate" as StructureTargetPriority,
  },
  fast: {
    rewardValue: 15,
    health: 60,
    speed: 50,
    damage: 15,
    defaultStructureTargetPriority: "gate" as StructureTargetPriority,
  },
  heavy: {
    rewardValue: 25,
    health: 200,
    speed: 50,
    damage: 40,
    defaultStructureTargetPriority: "defense" as StructureTargetPriority,
  },
} as const;

export const createEnemyComponent = (
  enemyType: EnemyType,
  spawnTime: number = Date.now(),
  structureTargetPriority?: StructureTargetPriority,
): EnemyComponent => ({
  type: enemyComponentTag,
  enemyType,
  spawnTime,
  rewardValue: ENEMY_CONFIGS[enemyType].rewardValue,
  structureTargetPriority:
    structureTargetPriority ||
    ENEMY_CONFIGS[enemyType].defaultStructureTargetPriority,
});

export const isEnemyComponent = (
  component: Component<any, any>,
): component is EnemyComponent => {
  return component.type === enemyComponentTag;
};

// Component utility functions

export const getEnemyConfig = (enemyType: EnemyType) => {
  return ENEMY_CONFIGS[enemyType];
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

export const createEnemyWithConfig = (
  enemyType: EnemyType,
  spawnTime?: number,
  structureTargetPriority?: StructureTargetPriority,
) => {
  const config = getEnemyConfig(enemyType);
  return {
    enemy: createEnemyComponent(enemyType, spawnTime, structureTargetPriority),
    config,
  };
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
