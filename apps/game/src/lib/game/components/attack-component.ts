import type { PositionComponent } from "./position-component";
import type { Component } from "./types";

export const attackComponentTag = "attack";

export type AttackType = "direct" | "artillery" | "homing";

export type AttackComponent = Component<
  typeof attackComponentTag,
  {
    damage: number;
    range: number; // pixels
    cooldown: number; // seconds
    lastAttackTime: number; // timestamp of last attack
    target?: string; // entity id of current target
    // 新規追加: 攻撃タイプ機能
    attackType: AttackType;
    projectileSpeed: number; // 弾丸速度 (pixels/second)
    // 砲台攻撃用
    explosionRadius?: number; // 爆発範囲
    flightTime?: number; // 飛行時間 (seconds)
    // 弾丸の見た目
    projectileSprite?: string;
  }
>;

/**
 * Creates a new AttackComponent with the specified parameters
 */
export const createAttackComponent = (
  damage: number,
  range: number,
  cooldown = 1.0,
  attackType: AttackType = "direct",
  projectileSpeed = 300,
  explosionRadius?: number,
  flightTime?: number,
  projectileSprite?: string,
): AttackComponent => ({
  type: attackComponentTag,
  damage,
  range,
  cooldown,
  lastAttackTime: 0,
  target: undefined,
  attackType,
  projectileSpeed,
  explosionRadius,
  flightTime,
  projectileSprite,
});

/**
 * Type guard to check if a component is an AttackComponent
 */
export const isAttackComponent = (
  component: Component<any, any>,
): component is AttackComponent => component.type === attackComponentTag;

// Component utility functions

/**
 * Checks if the attack component can perform an attack based on cooldown
 */
export const canAttack = (
  attack: AttackComponent,
  currentTime: number,
): boolean => currentTime - attack.lastAttackTime >= attack.cooldown * 1000;

/**
 * Executes an attack by updating the last attack time and target
 */
export const executeAttack = (
  attack: AttackComponent,
  currentTime: number,
  targetId: string,
): void => {
  attack.lastAttackTime = currentTime;
  attack.target = targetId;
};

/**
 * Clears the current attack target
 */
export const clearAttackTarget = (attack: AttackComponent): void => {
  attack.target = undefined;
};

/**
 * Calculates the Euclidean distance between two points
 */
export const calculateDistance = (
  pos1: { x: number; y: number },
  pos2: { x: number; y: number },
): number => {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Checks if the target is within attack range
 */
export const isInAttackRange = (
  attackerPos: PositionComponent,
  targetPos: PositionComponent,
  attackRange: number,
): boolean => {
  return calculateDistance(attackerPos.point, targetPos.point) <= attackRange;
};

// 攻撃タイプ判定のユーティリティ関数

/**
 * 直接攻撃タイプかどうかを判定
 */
export const isDirectAttack = (attack: AttackComponent): boolean =>
  attack.attackType === "direct";

/**
 * 砲台攻撃タイプかどうかを判定
 */
export const isArtilleryAttack = (attack: AttackComponent): boolean =>
  attack.attackType === "artillery";

/**
 * 弓矢攻撃タイプかどうかを判定
 */
export const isHomingAttack = (attack: AttackComponent): boolean =>
  attack.attackType === "homing";

/**
 * 弾丸を使用する攻撃タイプかどうかを判定
 */
export const isProjectileAttack = (attack: AttackComponent): boolean =>
  attack.attackType === "artillery" || attack.attackType === "homing";

/**
 * 砲台攻撃の設定が有効かどうかを検証
 */
export const isValidArtilleryConfig = (attack: AttackComponent): boolean =>
  attack.attackType === "artillery" &&
  attack.explosionRadius !== undefined &&
  attack.explosionRadius > 0 &&
  attack.flightTime !== undefined &&
  attack.flightTime > 0;

/**
 * 弓矢攻撃の設定が有効かどうかを検証
 */
export const isValidHomingConfig = (attack: AttackComponent): boolean =>
  attack.attackType === "homing" && attack.projectileSpeed > 0;
