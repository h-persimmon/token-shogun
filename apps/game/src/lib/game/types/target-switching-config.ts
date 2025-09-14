import type { EnemyTargetSwitchingConfig } from "../components/enemy-component";

/**
 * Global target switching configuration interface
 */
export interface TargetSwitchingConfig {
  /** Global enable/disable flag for target switching */
  globalEnabled: boolean;
  /** Default cooldown period in milliseconds */
  defaultCooldownMs: number;
  /** Default pursuit range multiplier (multiplied by attack range) */
  defaultPursuitRange: number;
  /** Default threat threshold for target switching */
  defaultThreatThreshold: number;
  /** Enemy type-specific configurations */
  enemyTypeConfigs: Record<string, EnemyTargetSwitchingConfig>;
}

/**
 * Target switch evaluation result
 */
export interface TargetSwitchEvaluation {
  /** Whether the enemy should switch targets */
  shouldSwitch: boolean;
  /** ID of the new target entity (if switching) */
  newTargetId?: string;
  /** Reason for the decision */
  reason:
    | "cooldown"
    | "no_attacker"
    | "out_of_range"
    | "lower_priority"
    | "switch_approved"
    | "disabled";
  /** Priority score for the potential target */
  priority: number;
}

/**
 * Default target switching configuration
 */
export const DEFAULT_TARGET_SWITCHING_CONFIG: TargetSwitchingConfig = {
  globalEnabled: true,
  defaultCooldownMs: 2000,
  defaultPursuitRange: 1.5,
  defaultThreatThreshold: 0.5,
  enemyTypeConfigs: {
    basic: {
      enabled: true,
      cooldownMs: 2000,
      pursuitRange: 1.5,
      threatThreshold: 0.5,
    },
    fast: {
      enabled: true,
      cooldownMs: 1500,
      pursuitRange: 2.0,
      threatThreshold: 0.3,
    },
    heavy: {
      enabled: true,
      cooldownMs: 3000,
      pursuitRange: 1.2,
      threatThreshold: 0.7,
    },
  },
};

/**
 * Validates target switching configuration values
 */
export const validateTargetSwitchingConfig = (
  config: Partial<TargetSwitchingConfig>,
): TargetSwitchingConfig => {
  const validated: TargetSwitchingConfig = {
    globalEnabled:
      config.globalEnabled ?? DEFAULT_TARGET_SWITCHING_CONFIG.globalEnabled,
    defaultCooldownMs: Math.max(
      0,
      config.defaultCooldownMs ??
        DEFAULT_TARGET_SWITCHING_CONFIG.defaultCooldownMs,
    ),
    defaultPursuitRange: Math.max(
      0.1,
      config.defaultPursuitRange ??
        DEFAULT_TARGET_SWITCHING_CONFIG.defaultPursuitRange,
    ),
    defaultThreatThreshold: Math.max(
      0,
      Math.min(
        1,
        config.defaultThreatThreshold ??
          DEFAULT_TARGET_SWITCHING_CONFIG.defaultThreatThreshold,
      ),
    ),
    enemyTypeConfigs: {},
  };

  // Validate enemy type configurations
  if (config.enemyTypeConfigs) {
    for (const [enemyType, typeConfig] of Object.entries(
      config.enemyTypeConfigs,
    )) {
      validated.enemyTypeConfigs[enemyType] =
        validateEnemyTargetSwitchingConfig(typeConfig, validated);
    }
  }

  // Ensure default enemy types exist
  for (const [enemyType, defaultConfig] of Object.entries(
    DEFAULT_TARGET_SWITCHING_CONFIG.enemyTypeConfigs,
  )) {
    if (!validated.enemyTypeConfigs[enemyType]) {
      validated.enemyTypeConfigs[enemyType] = defaultConfig;
    }
  }

  return validated;
};

/**
 * Validates enemy-specific target switching configuration
 */
export const validateEnemyTargetSwitchingConfig = (
  config: Partial<EnemyTargetSwitchingConfig>,
  globalConfig: TargetSwitchingConfig,
): EnemyTargetSwitchingConfig => {
  return {
    enabled: config.enabled ?? globalConfig.globalEnabled,
    cooldownMs: Math.max(
      0,
      config.cooldownMs ?? globalConfig.defaultCooldownMs,
    ),
    pursuitRange: Math.max(
      0.1,
      config.pursuitRange ?? globalConfig.defaultPursuitRange,
    ),
    threatThreshold: Math.max(
      0,
      Math.min(
        1,
        config.threatThreshold ?? globalConfig.defaultThreatThreshold,
      ),
    ),
  };
};

/**
 * Loads target switching configuration with fallback to defaults
 */
export const loadTargetSwitchingConfig = (
  configData?: Partial<TargetSwitchingConfig>,
): TargetSwitchingConfig => {
  if (!configData) {
    return DEFAULT_TARGET_SWITCHING_CONFIG;
  }

  return validateTargetSwitchingConfig(configData);
};

/**
 * Gets configuration for a specific enemy type
 */
export const getEnemyTypeConfig = (
  config: TargetSwitchingConfig,
  enemyType: string,
): EnemyTargetSwitchingConfig => {
  const typeConfig = config.enemyTypeConfigs[enemyType];

  if (typeConfig) {
    return typeConfig;
  }

  // Fallback to default configuration
  return {
    enabled: config.globalEnabled,
    cooldownMs: config.defaultCooldownMs,
    pursuitRange: config.defaultPursuitRange,
    threatThreshold: config.defaultThreatThreshold,
  };
};

/**
 * Updates configuration for a specific enemy type
 */
export const updateEnemyTypeConfig = (
  config: TargetSwitchingConfig,
  enemyType: string,
  newConfig: Partial<EnemyTargetSwitchingConfig>,
): TargetSwitchingConfig => {
  const updatedConfig = { ...config };
  const currentTypeConfig = getEnemyTypeConfig(config, enemyType);

  updatedConfig.enemyTypeConfigs[enemyType] =
    validateEnemyTargetSwitchingConfig(
      { ...currentTypeConfig, ...newConfig },
      config,
    );

  return updatedConfig;
};

/**
 * Checks if target switching is globally enabled
 */
export const isTargetSwitchingGloballyEnabled = (
  config: TargetSwitchingConfig,
): boolean => {
  return config.globalEnabled;
};

/**
 * Checks if target switching is enabled for a specific enemy type
 */
export const isTargetSwitchingEnabledForType = (
  config: TargetSwitchingConfig,
  enemyType: string,
): boolean => {
  if (!config.globalEnabled) {
    return false;
  }

  const typeConfig = getEnemyTypeConfig(config, enemyType);
  return typeConfig.enabled;
};
