import type { Component } from "./types";

export const enemyComponentTag = "enemy";

export type EnemyType = "basic" | "fast" | "heavy";

export type StructureTargetPriority = "gate" | "defense" | "any";

export type EnemyTargetSwitchingConfig = {
  enabled: boolean;
  cooldownMs: number;
  pursuitRange: number;
  threatThreshold: number;
};

export type EnemyComponent = Component<
  typeof enemyComponentTag,
  {
    enemyType: string;
    spawnTime: number;
    rewardValue: number; // 撃破時の報酬
    structureTargetPriority: StructureTargetPriority; // 構造物の攻撃優先度
    targetSwitching?: EnemyTargetSwitchingConfig;
    lastTargetSwitchTime?: number;
  }
>;

export const createEnemyComponent = (
  enemyType: EnemyType,
  spawnTime: number = Date.now(),
  structureTargetPriority: StructureTargetPriority,
  rewardValue: number,
  targetSwitching?: EnemyTargetSwitchingConfig,
): EnemyComponent => ({
  type: enemyComponentTag,
  enemyType,
  spawnTime,
  rewardValue: rewardValue || 0,
  structureTargetPriority,
  targetSwitching,
  lastTargetSwitchTime: undefined,
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

// Target switching configuration utility functions
export const getDefaultTargetSwitchingConfig =
  (): EnemyTargetSwitchingConfig => ({
    enabled: true,
    cooldownMs: 2000,
    pursuitRange: 1.5,
    threatThreshold: 0.5,
  });

export const getTargetSwitchingConfig = (
  enemy: EnemyComponent,
): EnemyTargetSwitchingConfig => {
  return enemy.targetSwitching || getDefaultTargetSwitchingConfig();
};

export const setTargetSwitchingConfig = (
  enemy: EnemyComponent,
  config: EnemyTargetSwitchingConfig,
): void => {
  enemy.targetSwitching = config;
};

export const isTargetSwitchingEnabled = (enemy: EnemyComponent): boolean => {
  const config = getTargetSwitchingConfig(enemy);
  return config.enabled;
};

export const canSwitchTarget = (
  enemy: EnemyComponent,
  currentTime: number = Date.now(),
): boolean => {
  if (!isTargetSwitchingEnabled(enemy)) {
    return false;
  }

  if (!enemy.lastTargetSwitchTime) {
    return true;
  }

  const config = getTargetSwitchingConfig(enemy);
  const timeSinceLastSwitch = currentTime - enemy.lastTargetSwitchTime;
  return timeSinceLastSwitch >= config.cooldownMs;
};

export const recordTargetSwitch = (
  enemy: EnemyComponent,
  switchTime: number = Date.now(),
): void => {
  enemy.lastTargetSwitchTime = switchTime;
};

export const getTargetSwitchCooldownRemaining = (
  enemy: EnemyComponent,
  currentTime: number = Date.now(),
): number => {
  if (!enemy.lastTargetSwitchTime) {
    return 0;
  }

  const config = getTargetSwitchingConfig(enemy);
  const timeSinceLastSwitch = currentTime - enemy.lastTargetSwitchTime;
  return Math.max(0, config.cooldownMs - timeSinceLastSwitch);
};

export const getPursuitRange = (
  enemy: EnemyComponent,
  baseAttackRange: number,
): number => {
  const config = getTargetSwitchingConfig(enemy);
  return baseAttackRange * config.pursuitRange;
};

export const getThreatThreshold = (enemy: EnemyComponent): number => {
  const config = getTargetSwitchingConfig(enemy);
  return config.threatThreshold;
};
