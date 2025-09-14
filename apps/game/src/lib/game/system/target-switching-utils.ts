import type { AttackComponent } from "../components/attack-component";
import { calculateDistance } from "../components/attack-component";
import type { EnemyComponent, EnemyType } from "../components/enemy-component";
import {
  getPursuitRange,
  getThreatThreshold,
  getTargetSwitchingConfig,
  type EnemyTargetSwitchingConfig,
} from "../components/enemy-component";
import type { HealthComponent } from "../components/health-component";
import type { PositionComponent } from "../components/position-component";
import type { Entity } from "../entities/entity";

/**
 * Helper functions for target switching decisions
 */

/**
 * Gets enemy type-specific target switching configuration
 * Implements requirement 4.3: support type-specific target switching behaviors
 * @param enemyType Enemy type identifier
 * @returns Type-specific target switching configuration
 */
export const getEnemyTypeTargetSwitchingConfig = (
  enemyType: EnemyType,
): EnemyTargetSwitchingConfig => {
  const typeConfigs: Record<EnemyType, EnemyTargetSwitchingConfig> = {
    basic: {
      enabled: true,
      cooldownMs: 2000,
      pursuitRange: 1.5,
      threatThreshold: 0.5,
    },
    fast: {
      enabled: true,
      cooldownMs: 1500, // Faster switching for fast enemies
      pursuitRange: 2.0, // Longer pursuit range
      threatThreshold: 0.3, // Lower threshold (more aggressive switching)
    },
    heavy: {
      enabled: true,
      cooldownMs: 3000, // Slower switching for heavy enemies
      pursuitRange: 1.2, // Shorter pursuit range
      threatThreshold: 0.7, // Higher threshold (more conservative switching)
    },
  };

  return typeConfigs[enemyType] || typeConfigs.basic;
};

/**
 * Applies enemy type-specific configuration to an enemy component
 * @param enemyComponent Enemy component to configure
 * @param enemyType Enemy type identifier
 */
export const applyEnemyTypeTargetSwitchingConfig = (
  enemyComponent: EnemyComponent,
  enemyType: EnemyType,
): void => {
  const config = getEnemyTypeTargetSwitchingConfig(enemyType);
  enemyComponent.targetSwitching = config;
};

/**
 * Calculates the effective pursuit range for an enemy based on its configuration
 * @param enemyComponent Enemy component with target switching configuration
 * @param baseAttackRange Base attack range of the enemy
 * @returns Calculated pursuit range in pixels
 */
export const calculatePursuitRange = (
  enemyComponent: EnemyComponent,
  baseAttackRange: number,
): number => {
  return getPursuitRange(enemyComponent, baseAttackRange);
};

/**
 * Calculates the effective pursuit range with additional safety margin
 * @param enemyComponent Enemy component with target switching configuration
 * @param baseAttackRange Base attack range of the enemy
 * @param safetyMargin Additional margin multiplier (default: 1.1 for 10% extra range)
 * @returns Calculated pursuit range with safety margin
 */
export const calculatePursuitRangeWithMargin = (
  enemyComponent: EnemyComponent,
  baseAttackRange: number,
  safetyMargin: number = 1.1,
): number => {
  const basePursuitRange = getPursuitRange(enemyComponent, baseAttackRange);
  return basePursuitRange * safetyMargin;
};

/**
 * Determines if a target is within pursuit range of an enemy
 * @param enemyEntity Enemy entity
 * @param targetEntity Target entity to check
 * @param enemyComponent Enemy component (for performance, can be passed if already available)
 * @returns True if target is within pursuit range
 */
export const isTargetInPursuitRange = (
  enemyEntity: Entity,
  targetEntity: Entity,
  enemyComponent?: EnemyComponent,
): boolean => {
  const enemyPos = enemyEntity.components.position as PositionComponent;
  const targetPos = targetEntity.components.position as PositionComponent;
  const attackComponent = enemyEntity.components.attack as AttackComponent;

  if (!enemyPos || !targetPos) {
    return false;
  }

  const enemy = enemyComponent || (enemyEntity.components.enemy as EnemyComponent);
  if (!enemy) {
    return false;
  }

  const distance = calculateDistance(enemyPos.point, targetPos.point);
  const baseAttackRange = attackComponent?.range || 50;
  const pursuitRange = calculatePursuitRange(enemy, baseAttackRange);

  return distance <= pursuitRange;
};

/**
 * Calculates threat level of a target entity
 * @param targetEntity Target entity to assess
 * @param enemyEntity Enemy entity doing the assessment (for relative threat calculation)
 * @returns Threat level score (0-100)
 */
export const calculateThreatLevel = (
  targetEntity: Entity,
  enemyEntity: Entity,
): number => {
  let threatLevel = 0;

  const targetAttack = targetEntity.components.attack as AttackComponent;
  const targetHealth = targetEntity.components.health as HealthComponent;
  const enemyHealth = enemyEntity.components.health as HealthComponent;

  // Attack power threat (0-40 points)
  if (targetAttack) {
    const attackThreat = Math.min(targetAttack.damage / 10, 40);
    threatLevel += attackThreat;
  }

  // Health-based threat (lower health = higher threat for quick elimination) (0-20 points)
  if (targetHealth) {
    const healthRatio = targetHealth.currentHealth / targetHealth.maxHealth;
    const healthThreat = (1 - healthRatio) * 20;
    threatLevel += healthThreat;
  }

  // Relative damage potential (0-30 points)
  if (targetAttack && enemyHealth) {
    const relativeDamage = targetAttack.damage / Math.max(enemyHealth.currentHealth, 1);
    const relativeThreat = Math.min(relativeDamage * 100, 30);
    threatLevel += relativeThreat;
  }

  // Unit type bonus (0-10 points)
  if (targetEntity.components.unit) {
    threatLevel += 10; // Units are generally more threatening than structures
  }

  return Math.min(100, Math.max(0, threatLevel));
};

/**
 * Determines if a target switch should be considered based on threat assessment
 * @param currentThreat Threat level of current target
 * @param newThreat Threat level of potential new target
 * @param enemyComponent Enemy component with threat threshold configuration
 * @returns True if switch should be considered based on threat levels
 */
export const shouldConsiderThreatBasedSwitch = (
  currentThreat: number,
  newThreat: number,
  enemyComponent: EnemyComponent,
): boolean => {
  const threatThreshold = getThreatThreshold(enemyComponent);
  
  // Convert threat threshold from 0-1 range to threat level points (0-100 range)
  const thresholdPoints = threatThreshold * 100;
  
  // New target must be significantly more threatening
  const threatDifference = newThreat - currentThreat;
  return threatDifference >= thresholdPoints;
};

/**
 * Calculates distance-based priority score for target switching
 * @param distance Distance to target in pixels
 * @param maxConsideredDistance Maximum distance for priority calculation
 * @returns Distance priority score (0-40 points, closer = higher)
 */
export const calculateDistancePriority = (
  distance: number,
  maxConsideredDistance: number = 200,
): number => {
  const normalizedDistance = Math.min(distance, maxConsideredDistance) / maxConsideredDistance;
  return (1 - normalizedDistance) * 40;
};

/**
 * Calculates attack power priority score for target switching
 * @param attackComponent Attack component of the target
 * @returns Attack priority score (0-30 points)
 */
export const calculateAttackPriority = (attackComponent?: AttackComponent): number => {
  if (!attackComponent) {
    return 0;
  }
  return Math.min(attackComponent.damage / 10, 30);
};

/**
 * Calculates health-based priority score for target switching
 * @param healthComponent Health component of the target
 * @returns Health priority score (0-20 points, lower health = higher priority)
 */
export const calculateHealthPriority = (healthComponent?: HealthComponent): number => {
  if (!healthComponent) {
    return 0;
  }
  const healthRatio = healthComponent.currentHealth / healthComponent.maxHealth;
  return (1 - healthRatio) * 20;
};

/**
 * Calculates unit type priority bonus for target switching
 * @param targetEntity Target entity to check
 * @returns Unit type priority bonus (0-10 points)
 */
export const calculateUnitTypePriority = (targetEntity: Entity): number => {
  return targetEntity.components.unit ? 10 : 0;
};

/**
 * Determines optimal target from a list of candidates based on comprehensive scoring
 * @param enemyEntity Enemy entity making the decision
 * @param candidates Array of potential target entities
 * @param enemyComponent Enemy component (for performance, can be passed if already available)
 * @returns Best target entity or null if no suitable target found
 */
export const selectOptimalTarget = (
  enemyEntity: Entity,
  candidates: Entity[],
  enemyComponent?: EnemyComponent,
): Entity | null => {
  if (candidates.length === 0) {
    return null;
  }

  const enemyPos = enemyEntity.components.position as PositionComponent;
  const enemy = enemyComponent || (enemyEntity.components.enemy as EnemyComponent);

  if (!enemyPos || !enemy) {
    return null;
  }

  let bestTarget: Entity | null = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    const candidatePos = candidate.components.position as PositionComponent;
    if (!candidatePos) continue;

    // Check if candidate is within pursuit range
    if (!isTargetInPursuitRange(enemyEntity, candidate, enemy)) {
      continue;
    }

    const distance = calculateDistance(enemyPos.point, candidatePos.point);
    
    // Calculate comprehensive score
    let score = 0;
    score += calculateDistancePriority(distance);
    score += calculateAttackPriority(candidate.components.attack as AttackComponent);
    score += calculateHealthPriority(candidate.components.health as HealthComponent);
    score += calculateUnitTypePriority(candidate);

    if (score > bestScore) {
      bestScore = score;
      bestTarget = candidate;
    }
  }

  return bestTarget;
};

/**
 * Validates if a target switching decision meets all criteria
 * @param enemyEntity Enemy entity
 * @param currentTargetId Current target entity ID (can be undefined)
 * @param newTargetId New target entity ID
 * @param entityManager Entity manager for entity lookup
 * @param currentTime Current timestamp
 * @returns Validation result with reason if invalid
 */
export const validateTargetSwitchDecision = (
  enemyEntity: Entity,
  currentTargetId: string | undefined,
  newTargetId: string,
  entityManager: { getEntity: (id: string) => Entity | undefined },
  currentTime: number = Date.now(),
): { isValid: boolean; reason?: string } => {
  const enemyComponent = enemyEntity.components.enemy as EnemyComponent;
  
  if (!enemyComponent) {
    return { isValid: false, reason: "no_enemy_component" };
  }

  // Check if target switching is enabled
  const config = getTargetSwitchingConfig(enemyComponent);
  if (!config.enabled) {
    return { isValid: false, reason: "switching_disabled" };
  }

  // Check cooldown
  if (enemyComponent.lastTargetSwitchTime) {
    const timeSinceLastSwitch = currentTime - enemyComponent.lastTargetSwitchTime;
    if (timeSinceLastSwitch < config.cooldownMs) {
      return { isValid: false, reason: "cooldown_active" };
    }
  }

  // Validate new target exists and is valid
  const newTarget = entityManager.getEntity(newTargetId);
  if (!newTarget) {
    return { isValid: false, reason: "new_target_not_found" };
  }

  const newTargetHealth = newTarget.components.health as HealthComponent;
  if (!newTargetHealth || newTargetHealth.isDead || newTargetHealth.currentHealth <= 0) {
    return { isValid: false, reason: "new_target_invalid" };
  }

  // Check if new target is within pursuit range
  if (!isTargetInPursuitRange(enemyEntity, newTarget, enemyComponent)) {
    return { isValid: false, reason: "new_target_out_of_range" };
  }

  // If there's a current target, validate the switch is beneficial
  if (currentTargetId) {
    const currentTarget = entityManager.getEntity(currentTargetId);
    if (currentTarget) {
      const currentThreat = calculateThreatLevel(currentTarget, enemyEntity);
      const newThreat = calculateThreatLevel(newTarget, enemyEntity);
      
      if (!shouldConsiderThreatBasedSwitch(currentThreat, newThreat, enemyComponent)) {
        return { isValid: false, reason: "insufficient_threat_improvement" };
      }
    }
  }

  return { isValid: true };
};

/**
 * Calculates the time remaining until target switching cooldown expires
 * @param enemyComponent Enemy component with cooldown information
 * @param currentTime Current timestamp
 * @returns Milliseconds remaining until cooldown expires (0 if no cooldown)
 */
export const calculateTargetSwitchCooldownRemaining = (
  enemyComponent: EnemyComponent,
  currentTime: number = Date.now(),
): number => {
  if (!enemyComponent.lastTargetSwitchTime) {
    return 0;
  }

  const config = getTargetSwitchingConfig(enemyComponent);
  const timeSinceLastSwitch = currentTime - enemyComponent.lastTargetSwitchTime;
  return Math.max(0, config.cooldownMs - timeSinceLastSwitch);
};

/**
 * Selects the best attacker from multiple candidates when multiple allied units attack simultaneously
 * Implements requirement 2.2: prioritize based on proximity, threat level, or attack timing
 * @param enemyEntity Enemy entity being attacked
 * @param attackerCandidates Array of potential attacker entities
 * @param enemyComponent Enemy component (for performance, can be passed if already available)
 * @returns Best attacker entity or null if no suitable attacker found
 */
export const selectBestAttackerFromMultiple = (
  enemyEntity: Entity,
  attackerCandidates: Entity[],
  enemyComponent?: EnemyComponent,
): Entity | null => {
  if (attackerCandidates.length === 0) {
    return null;
  }

  if (attackerCandidates.length === 1) {
    return attackerCandidates[0];
  }

  const enemyPos = enemyEntity.components.position as PositionComponent;
  const enemy = enemyComponent || (enemyEntity.components.enemy as EnemyComponent);

  if (!enemyPos || !enemy) {
    return attackerCandidates[0]; // Fallback to first attacker
  }

  let bestAttacker: Entity | null = null;
  let bestScore = -1;

  for (const attacker of attackerCandidates) {
    const attackerPos = attacker.components.position as PositionComponent;
    if (!attackerPos) continue;

    // Check if attacker is within pursuit range
    if (!isTargetInPursuitRange(enemyEntity, attacker, enemy)) {
      continue;
    }

    const distance = calculateDistance(enemyPos.point, attackerPos.point);
    
    // Calculate comprehensive score based on multiple criteria
    let score = 0;
    
    // Distance priority (closer is better) - 40 points max
    score += calculateDistancePriority(distance);
    
    // Attack power priority - 30 points max
    score += calculateAttackPriority(attacker.components.attack as AttackComponent);
    
    // Health priority (lower health targets are easier to eliminate) - 20 points max
    score += calculateHealthPriority(attacker.components.health as HealthComponent);
    
    // Unit type priority - 10 points max
    score += calculateUnitTypePriority(attacker);

    // Attack timing bonus - recent attackers get priority
    const attackerHealth = attacker.components.health as HealthComponent;
    if (attackerHealth?.lastDamageTime) {
      const timeSinceAttack = Date.now() - attackerHealth.lastDamageTime;
      if (timeSinceAttack < 1000) { // Within last second
        score += 15; // Timing bonus
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestAttacker = attacker;
    }
  }

  return bestAttacker;
};

/**
 * Calculates engagement threshold multiplier for enemies already in combat
 * Implements requirement 2.3: higher threshold for switching when already engaged
 * @param enemyEntity Enemy entity
 * @param currentTargetEntity Current target entity (if any)
 * @param enemyComponent Enemy component (for performance, can be passed if already available)
 * @returns Threshold multiplier (1.0 = normal, >1.0 = higher threshold required)
 */
export const calculateEngagementThresholdMultiplier = (
  enemyEntity: Entity,
  currentTargetEntity?: Entity,
  enemyComponent?: EnemyComponent,
): number => {
  const enemy = enemyComponent || (enemyEntity.components.enemy as EnemyComponent);
  if (!enemy || !currentTargetEntity) {
    return 1.0; // Normal threshold if not engaged
  }

  const enemyPos = enemyEntity.components.position as PositionComponent;
  const targetPos = currentTargetEntity.components.position as PositionComponent;
  const attackComponent = enemyEntity.components.attack as AttackComponent;

  if (!enemyPos || !targetPos || !attackComponent) {
    return 1.0;
  }

  const distance = calculateDistance(enemyPos.point, targetPos.point);
  const attackRange = attackComponent.range || 50;

  // If enemy is within attack range of current target, they are "engaged in combat"
  if (distance <= attackRange) {
    return 1.5; // Require 50% higher priority difference to switch
  }

  // If enemy is actively pursuing (within 120% of attack range), slightly higher threshold
  if (distance <= attackRange * 1.2) {
    return 1.2; // Require 20% higher priority difference
  }

  return 1.0; // Normal threshold for distant targets
};

/**
 * Determines if an enemy should abandon its current target due to range constraints
 * @param enemyEntity Enemy entity
 * @param targetEntity Current target entity
 * @param enemyComponent Enemy component (for performance, can be passed if already available)
 * @returns True if enemy should abandon the target
 */
export const shouldAbandonTarget = (
  enemyEntity: Entity,
  targetEntity: Entity,
  enemyComponent?: EnemyComponent,
): boolean => {
  const enemy = enemyComponent || (enemyEntity.components.enemy as EnemyComponent);
  if (!enemy) {
    return false;
  }

  // Check if target is beyond pursuit range with additional margin
  const enemyPos = enemyEntity.components.position as PositionComponent;
  const targetPos = targetEntity.components.position as PositionComponent;
  const attackComponent = enemyEntity.components.attack as AttackComponent;

  if (!enemyPos || !targetPos) {
    return true; // Abandon if position data is missing
  }

  const distance = calculateDistance(enemyPos.point, targetPos.point);
  const baseAttackRange = attackComponent?.range || 50;
  const pursuitRangeWithMargin = calculatePursuitRangeWithMargin(enemy, baseAttackRange, 1.2);

  return distance > pursuitRangeWithMargin;
};