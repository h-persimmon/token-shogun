import type { AttackComponent } from "../components/attack-component";
import { calculateDistance } from "../components/attack-component";
import type { EnemyComponent } from "../components/enemy-component";
import {
  canSwitchTarget,
  getPursuitRange,
  getTargetSwitchingConfig,
  getThreatThreshold,
} from "../components/enemy-component";
import type { HealthComponent } from "../components/health-component";
import type { PositionComponent } from "../components/position-component";
import type { TargetComponent } from "../components/target-component";
import type { Entity } from "../entities/entity";
import type {
  TargetSwitchEvaluation,
  TargetSwitchingConfig,
} from "../types/target-switching-config";

/**
 * Evaluates whether an enemy should switch targets based on recent damage and configuration
 */
export const evaluateTargetSwitch = (
  enemyEntity: Entity,
  attackerEntityId: string | undefined,
  entityManager: { getEntity: (id: string) => Entity | undefined },
  currentTime: number = Date.now(),
): TargetSwitchEvaluation => {
  const enemyComponent = enemyEntity.components.enemy as EnemyComponent;
  const healthComponent = enemyEntity.components.health as HealthComponent;
  const targetComponent = enemyEntity.components.target as TargetComponent;
  const attackComponent = enemyEntity.components.attack as AttackComponent;
  const positionComponent = enemyEntity.components
    .position as PositionComponent;

  // Check if target switching is enabled for this enemy
  if (!enemyComponent || !getTargetSwitchingConfig(enemyComponent).enabled) {
    return {
      shouldSwitch: false,
      reason: "disabled",
      priority: 0,
    };
  }

  // Check cooldown
  if (!canSwitchTarget(enemyComponent, currentTime)) {
    return {
      shouldSwitch: false,
      reason: "cooldown",
      priority: 0,
    };
  }

  // Check if there's a valid attacker
  if (!attackerEntityId) {
    return {
      shouldSwitch: false,
      reason: "no_attacker",
      priority: 0,
    };
  }

  const attackerEntity = entityManager.getEntity(attackerEntityId);
  if (!attackerEntity) {
    return {
      shouldSwitch: false,
      reason: "no_attacker",
      priority: 0,
    };
  }

  const attackerPosition = attackerEntity.components
    .position as PositionComponent;
  if (!attackerPosition || !positionComponent) {
    return {
      shouldSwitch: false,
      reason: "no_attacker",
      priority: 0,
    };
  }

  // Calculate distance to attacker
  const distanceToAttacker = calculateDistance(
    positionComponent.point,
    attackerPosition.point,
  );

  // Check if attacker is within pursuit range
  const baseAttackRange = attackComponent?.range || 50;
  const pursuitRange = getPursuitRange(enemyComponent, baseAttackRange);

  if (distanceToAttacker > pursuitRange) {
    return {
      shouldSwitch: false,
      reason: "out_of_range",
      priority: 0,
    };
  }

  // Calculate priority for the potential new target
  const priority = calculateTargetSwitchPriority(
    enemyEntity,
    attackerEntity,
    distanceToAttacker,
    enemyComponent,
  );

  // Check if current target exists and calculate its priority
  let currentTargetPriority = 0;
  if (targetComponent.targetEntityId) {
    const currentTarget = entityManager.getEntity(
      targetComponent.targetEntityId,
    );
    if (currentTarget) {
      const currentTargetPosition = currentTarget.components
        .position as PositionComponent;
      if (currentTargetPosition) {
        const distanceToCurrentTarget = calculateDistance(
          positionComponent.point,
          currentTargetPosition.point,
        );
        currentTargetPriority = calculateTargetSwitchPriority(
          enemyEntity,
          currentTarget,
          distanceToCurrentTarget,
          enemyComponent,
        );
      }
    }
  }

  // Apply threat threshold - new target must be significantly better
  // But only if there's a current target to compare against
  if (targetComponent.targetEntityId) {
    const threatThreshold = getThreatThreshold(enemyComponent);
    const priorityDifference = priority - currentTargetPriority;

    // Convert threat threshold from 0-1 range to priority points (0-100 range)
    const thresholdPoints = threatThreshold * 100;

    if (priorityDifference < thresholdPoints) {
      return {
        shouldSwitch: false,
        reason: "lower_priority",
        priority: priority,
      };
    }
  }

  return {
    shouldSwitch: true,
    newTargetId: attackerEntityId,
    reason: "switch_approved",
    priority: priority,
  };
};

/**
 * Calculates priority score for a potential target based on distance, threat level, and configuration
 */
export const calculateTargetSwitchPriority = (
  enemyEntity: Entity,
  targetEntity: Entity,
  distance: number,
  enemyComponent: EnemyComponent,
): number => {
  let priority = 0;

  // Distance factor (closer targets have higher priority)
  // Normalize distance to 0-1 range, then invert (closer = higher score)
  const maxConsideredDistance = 200; // Maximum distance for priority calculation
  const normalizedDistance =
    Math.min(distance, maxConsideredDistance) / maxConsideredDistance;
  const distanceScore = (1 - normalizedDistance) * 40; // Max 40 points for distance
  priority += distanceScore;

  // Threat level factor (based on target's attack power)
  const targetAttack = targetEntity.components.attack as AttackComponent;
  if (targetAttack) {
    const threatScore = Math.min(targetAttack.damage / 10, 30); // Max 30 points for threat
    priority += threatScore;
  }

  // Health factor (prefer targets with lower health for quicker elimination)
  const targetHealth = targetEntity.components.health as HealthComponent;
  if (targetHealth) {
    const healthRatio = targetHealth.currentHealth / targetHealth.maxHealth;
    const healthScore = (1 - healthRatio) * 20; // Max 20 points for low health
    priority += healthScore;
  }

  // Unit type bonus (prefer certain unit types)
  const targetUnit = targetEntity.components.unit;
  if (targetUnit) {
    priority += 10; // Bonus for attacking units vs structures
  }

  return Math.max(0, priority);
};

/**
 * Checks if target switching cooldown has passed
 */
export const isTargetSwitchCooldownExpired = (
  enemyComponent: EnemyComponent,
  currentTime: number = Date.now(),
): boolean => {
  return canSwitchTarget(enemyComponent, currentTime);
};

/**
 * Validates if an attacker is within pursuit range
 */
export const isAttackerInPursuitRange = (
  enemyEntity: Entity,
  attackerEntity: Entity,
  enemyComponent: EnemyComponent,
): boolean => {
  const enemyPosition = enemyEntity.components.position as PositionComponent;
  const attackerPosition = attackerEntity.components
    .position as PositionComponent;
  const attackComponent = enemyEntity.components.attack as AttackComponent;

  if (!enemyPosition || !attackerPosition) {
    return false;
  }

  const distance = calculateDistance(
    enemyPosition.point,
    attackerPosition.point,
  );
  const baseAttackRange = attackComponent?.range || 50;
  const pursuitRange = getPursuitRange(enemyComponent, baseAttackRange);

  return distance <= pursuitRange;
};

/**
 * Checks if the enemy should revert to its original target
 */
export const shouldRevertToOriginalTarget = (
  enemyEntity: Entity,
  targetComponent: TargetComponent,
  entityManager: { getEntity: (id: string) => Entity | undefined },
): boolean => {
  // Only consider reversion if we have an original target stored
  if (!targetComponent.originalTargetId) {
    return false;
  }

  // Check if current target (switched target) is still valid and in range
  if (targetComponent.targetEntityId) {
    const currentTarget = entityManager.getEntity(
      targetComponent.targetEntityId,
    );
    if (currentTarget) {
      const enemyComponent = enemyEntity.components.enemy as EnemyComponent;
      if (
        enemyComponent &&
        isAttackerInPursuitRange(enemyEntity, currentTarget, enemyComponent)
      ) {
        return false; // Current target is still valid, don't revert
      }
    }
  }

  // Check if original target is still valid
  const originalTarget = entityManager.getEntity(
    targetComponent.originalTargetId,
  );
  if (!originalTarget) {
    return false; // Original target no longer exists
  }

  const originalTargetHealth = originalTarget.components
    .health as HealthComponent;
  if (!originalTargetHealth || originalTargetHealth.isDead) {
    return false; // Original target is dead
  }

  return true; // Should revert to original target
};

/**
 * Gets the most recent damage source from health component
 */
export const getRecentDamageSource = (
  healthComponent: HealthComponent,
  maxAgeMs: number = 1000,
  currentTime: number = Date.now(),
): string | undefined => {
  if (!healthComponent.lastDamageTime || !healthComponent.lastDamageFrom) {
    return undefined;
  }

  const damageAge = currentTime - healthComponent.lastDamageTime;
  if (damageAge > maxAgeMs) {
    return undefined; // Damage is too old
  }

  return healthComponent.lastDamageFrom;
};

/**
 * Clears damage source information after processing
 */
export const clearDamageSource = (healthComponent: HealthComponent): void => {
  healthComponent.lastDamageTime = undefined;
  healthComponent.lastDamageFrom = undefined;
};
