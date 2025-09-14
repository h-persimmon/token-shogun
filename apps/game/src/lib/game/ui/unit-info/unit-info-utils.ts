// ユニット情報抽出とユーティリティ関数

import {
  type AttackComponent,
  isAttackComponent,
} from "../../components/attack-component";
import {
  type EnemyComponent,
  isEnemyComponent,
} from "../../components/enemy-component";
import {
  type HealthComponent,
  isHealthComponent,
} from "../../components/health-component";
import {
  isStructureComponent,
  type StructureComponent,
} from "../../components/structure-component";
import {
  isUnitComponent,
  type UnitComponent,
} from "../../components/unit-component";
import type { Entity } from "../../entities/entity";
import type { UnitInfoData } from "./types";

/**
 * エンティティからユニット情報を抽出する
 */
export function extractUnitInfo(entity: Entity): UnitInfoData {
  const unitType = determineUnitType(entity);
  const healthInfo = extractHealthInfo(entity);
  const attackInfo = extractAttackInfo(entity);

  const baseInfo: UnitInfoData = {
    entityId: entity.id,
    unitType,
    health: healthInfo,
    attack: attackInfo,
  };

  // ユニットタイプ別の追加情報を設定
  switch (unitType) {
    case "enemy":
      baseInfo.enemyType = extractEnemyType(entity);
      break;
    case "structure":
      baseInfo.structureType = extractStructureType(entity);
      break;
    case "ally":
      baseInfo.unitClass = extractUnitClass(entity);
      break;
  }

  return baseInfo;
}

/**
 * エンティティのユニットタイプを判定する
 */
export function determineUnitType(
  entity: Entity,
): "ally" | "enemy" | "structure" {
  // 構造物コンポーネントがある場合は構造物
  if (hasComponent(entity, isStructureComponent)) {
    return "structure";
  }

  // 敵コンポーネントがある場合は敵
  if (hasComponent(entity, isEnemyComponent)) {
    return "enemy";
  }

  // ユニットコンポーネントがある場合は味方
  if (hasComponent(entity, isUnitComponent)) {
    return "ally";
  }

  // デフォルトは味方として扱う
  return "ally";
}

/**
 * エンティティから体力情報を抽出する
 */
function extractHealthInfo(entity: Entity): { current: number; max: number } {
  const healthComponent = getComponent(entity, isHealthComponent);

  if (healthComponent) {
    return {
      current: healthComponent.currentHealth,
      max: healthComponent.maxHealth,
    };
  }

  // 体力コンポーネントがない場合はデフォルト値
  return {
    current: 0,
    max: 0,
  };
}

/**
 * エンティティから攻撃情報を抽出する
 */
function extractAttackInfo(entity: Entity): UnitInfoData["attack"] {
  const attackComponent = getComponent(entity, isAttackComponent);

  if (attackComponent) {
    return {
      damage: attackComponent.damage,
      range: attackComponent.range,
      attackType: attackComponent.attackType,
    };
  }

  return undefined;
}

/**
 * 敵の種別を抽出する
 */
function extractEnemyType(entity: Entity): string | undefined {
  const enemyComponent = getComponent(entity, isEnemyComponent);
  return enemyComponent?.enemyType;
}

/**
 * 構造物の種別を抽出する
 */
function extractStructureType(entity: Entity): string | undefined {
  const structureComponent = getComponent(entity, isStructureComponent);
  return structureComponent?.structureType;
}

/**
 * 味方ユニットのクラスを抽出する
 */
function extractUnitClass(entity: Entity): string | undefined {
  const unitComponent = getComponent(entity, isUnitComponent);
  return unitComponent?.unitType;
}

/**
 * エンティティが指定されたコンポーネントを持っているかチェックする
 */
function hasComponent<T>(
  entity: Entity,
  typeGuard: (component: any) => component is T,
): boolean {
  return Object.values(entity.components).some(typeGuard);
}

/**
 * エンティティから指定されたコンポーネントを取得する
 */
function getComponent<T>(
  entity: Entity,
  typeGuard: (component: any) => component is T,
): T | undefined {
  return Object.values(entity.components).find(typeGuard) as T | undefined;
}

/**
 * ユニットが攻撃可能かどうかを判定する
 */
export function canUnitAttack(entity: Entity): boolean {
  return hasComponent(entity, isAttackComponent);
}

/**
 * ユニットの表示名を生成する
 */
export function generateUnitDisplayName(unitInfo: UnitInfoData): string {
  switch (unitInfo.unitType) {
    case "enemy":
      return unitInfo.enemyType ? `敵: ${unitInfo.enemyType}` : "敵ユニット";
    case "structure":
      return unitInfo.structureType
        ? `構造物: ${unitInfo.structureType}`
        : "構造物";
    case "ally":
      return unitInfo.unitClass
        ? `味方: ${unitInfo.unitClass}`
        : "味方ユニット";
    default:
      return "ユニット";
  }
}

/**
 * 体力の割合を計算する（0-1の範囲）
 */
export function calculateHealthPercentage(
  health: UnitInfoData["health"],
): number {
  if (health.max === 0) return 0;
  return Math.max(0, Math.min(1, health.current / health.max));
}

/**
 * 体力状態を文字列で取得する
 */
export function getHealthStatus(health: UnitInfoData["health"]): string {
  const percentage = calculateHealthPercentage(health);

  if (percentage === 0) return "死亡";
  if (percentage < 0.25) return "重傷";
  if (percentage < 0.5) return "中傷";
  if (percentage < 0.75) return "軽傷";
  return "健康";
}
