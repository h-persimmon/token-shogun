/**
 * Basic target switching utility functions without complex imports
 */

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
 * @param damage Attack damage value
 * @returns Attack priority score (0-30 points)
 */
export const calculateAttackPriority = (damage?: number): number => {
  if (!damage) {
    return 0;
  }
  return Math.min(damage / 10, 30);
};

/**
 * Calculates health-based priority score for target switching
 * @param currentHealth Current health value
 * @param maxHealth Maximum health value
 * @returns Health priority score (0-20 points, lower health = higher priority)
 */
export const calculateHealthPriority = (currentHealth?: number, maxHealth?: number): number => {
  if (currentHealth === undefined || maxHealth === undefined || maxHealth <= 0) {
    return 0;
  }
  const healthRatio = currentHealth / maxHealth;
  return (1 - healthRatio) * 20;
};

/**
 * Calculates unit type priority bonus for target switching
 * @param isUnit Whether the target is a unit
 * @returns Unit type priority bonus (0-10 points)
 */
export const calculateUnitTypePriority = (isUnit: boolean): number => {
  return isUnit ? 10 : 0;
};

/**
 * Determines if a target switch should be considered based on threat assessment
 * @param currentThreat Threat level of current target
 * @param newThreat Threat level of potential new target
 * @param threatThreshold Threat threshold (0-1 range)
 * @returns True if switch should be considered based on threat levels
 */
export const shouldConsiderThreatBasedSwitch = (
  currentThreat: number,
  newThreat: number,
  threatThreshold: number,
): boolean => {
  // Convert threat threshold from 0-1 range to threat level points (0-100 range)
  const thresholdPoints = threatThreshold * 100;
  
  // New target must be significantly more threatening
  const threatDifference = newThreat - currentThreat;
  return threatDifference >= thresholdPoints;
};

/**
 * Calculates the time remaining until target switching cooldown expires
 * @param lastSwitchTime Last switch timestamp
 * @param cooldownMs Cooldown duration in milliseconds
 * @param currentTime Current timestamp
 * @returns Milliseconds remaining until cooldown expires (0 if no cooldown)
 */
export const calculateTargetSwitchCooldownRemaining = (
  lastSwitchTime?: number,
  cooldownMs: number = 2000,
  currentTime: number = Date.now(),
): number => {
  if (!lastSwitchTime) {
    return 0;
  }

  const timeSinceLastSwitch = currentTime - lastSwitchTime;
  return Math.max(0, cooldownMs - timeSinceLastSwitch);
};