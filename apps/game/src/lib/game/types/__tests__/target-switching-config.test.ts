import { describe, expect, it } from "vitest";
import {
  DEFAULT_TARGET_SWITCHING_CONFIG,
  getEnemyTypeConfig,
  isTargetSwitchingEnabledForType,
  isTargetSwitchingGloballyEnabled,
  loadTargetSwitchingConfig,
  type TargetSwitchEvaluation,
  type TargetSwitchingConfig,
  updateEnemyTypeConfig,
  validateEnemyTargetSwitchingConfig,
  validateTargetSwitchingConfig,
} from "../target-switching-config";

describe("Target Switching Configuration", () => {
  describe("DEFAULT_TARGET_SWITCHING_CONFIG", () => {
    it("should have valid default values", () => {
      expect(DEFAULT_TARGET_SWITCHING_CONFIG.globalEnabled).toBe(true);
      expect(DEFAULT_TARGET_SWITCHING_CONFIG.defaultCooldownMs).toBe(2000);
      expect(DEFAULT_TARGET_SWITCHING_CONFIG.defaultPursuitRange).toBe(1.5);
      expect(DEFAULT_TARGET_SWITCHING_CONFIG.defaultThreatThreshold).toBe(0.5);
    });

    it("should have configurations for basic enemy types", () => {
      const configs = DEFAULT_TARGET_SWITCHING_CONFIG.enemyTypeConfigs;
      expect(configs.basic).toBeDefined();
      expect(configs.fast).toBeDefined();
      expect(configs.heavy).toBeDefined();
    });

    it("should have different configurations for different enemy types", () => {
      const configs = DEFAULT_TARGET_SWITCHING_CONFIG.enemyTypeConfigs;

      // Fast enemies should have shorter cooldown and longer pursuit range
      expect(configs.fast.cooldownMs).toBeLessThan(configs.basic.cooldownMs);
      expect(configs.fast.pursuitRange).toBeGreaterThan(
        configs.basic.pursuitRange,
      );

      // Heavy enemies should have longer cooldown and shorter pursuit range
      expect(configs.heavy.cooldownMs).toBeGreaterThan(
        configs.basic.cooldownMs,
      );
      expect(configs.heavy.pursuitRange).toBeLessThan(
        configs.basic.pursuitRange,
      );
    });
  });

  describe("validateTargetSwitchingConfig", () => {
    it("should return default config when given empty object", () => {
      const result = validateTargetSwitchingConfig({});
      expect(result.globalEnabled).toBe(
        DEFAULT_TARGET_SWITCHING_CONFIG.globalEnabled,
      );
      expect(result.defaultCooldownMs).toBe(
        DEFAULT_TARGET_SWITCHING_CONFIG.defaultCooldownMs,
      );
    });

    it("should validate and clamp cooldown values", () => {
      const result = validateTargetSwitchingConfig({
        defaultCooldownMs: -100,
      });
      expect(result.defaultCooldownMs).toBe(0);
    });

    it("should validate and clamp pursuit range values", () => {
      const result = validateTargetSwitchingConfig({
        defaultPursuitRange: -0.5,
      });
      expect(result.defaultPursuitRange).toBe(0.1);
    });

    it("should validate and clamp threat threshold values", () => {
      const lowResult = validateTargetSwitchingConfig({
        defaultThreatThreshold: -0.5,
      });
      expect(lowResult.defaultThreatThreshold).toBe(0);

      const highResult = validateTargetSwitchingConfig({
        defaultThreatThreshold: 1.5,
      });
      expect(highResult.defaultThreatThreshold).toBe(1);
    });

    it("should preserve valid custom values", () => {
      const customConfig = {
        globalEnabled: false,
        defaultCooldownMs: 3000,
        defaultPursuitRange: 2.0,
        defaultThreatThreshold: 0.8,
      };

      const result = validateTargetSwitchingConfig(customConfig);
      expect(result.globalEnabled).toBe(false);
      expect(result.defaultCooldownMs).toBe(3000);
      expect(result.defaultPursuitRange).toBe(2.0);
      expect(result.defaultThreatThreshold).toBe(0.8);
    });

    it("should validate enemy type configurations", () => {
      const customConfig = {
        enemyTypeConfigs: {
          custom: {
            enabled: false,
            cooldownMs: -100,
            pursuitRange: -0.5,
            threatThreshold: 1.5,
          },
        },
      };

      const result = validateTargetSwitchingConfig(customConfig);
      const customTypeConfig = result.enemyTypeConfigs.custom;

      expect(customTypeConfig.enabled).toBe(false);
      expect(customTypeConfig.cooldownMs).toBe(0);
      expect(customTypeConfig.pursuitRange).toBe(0.1);
      expect(customTypeConfig.threatThreshold).toBe(1);
    });

    it("should ensure default enemy types exist", () => {
      const result = validateTargetSwitchingConfig({});
      expect(result.enemyTypeConfigs.basic).toBeDefined();
      expect(result.enemyTypeConfigs.fast).toBeDefined();
      expect(result.enemyTypeConfigs.heavy).toBeDefined();
    });
  });

  describe("validateEnemyTargetSwitchingConfig", () => {
    const mockGlobalConfig: TargetSwitchingConfig = {
      globalEnabled: true,
      defaultCooldownMs: 2000,
      defaultPursuitRange: 1.5,
      defaultThreatThreshold: 0.5,
      enemyTypeConfigs: {},
    };

    it("should use global defaults when no values provided", () => {
      const result = validateEnemyTargetSwitchingConfig({}, mockGlobalConfig);
      expect(result.enabled).toBe(mockGlobalConfig.globalEnabled);
      expect(result.cooldownMs).toBe(mockGlobalConfig.defaultCooldownMs);
      expect(result.pursuitRange).toBe(mockGlobalConfig.defaultPursuitRange);
      expect(result.threatThreshold).toBe(
        mockGlobalConfig.defaultThreatThreshold,
      );
    });

    it("should validate and clamp values", () => {
      const result = validateEnemyTargetSwitchingConfig(
        {
          cooldownMs: -100,
          pursuitRange: -0.5,
          threatThreshold: 1.5,
        },
        mockGlobalConfig,
      );

      expect(result.cooldownMs).toBe(0);
      expect(result.pursuitRange).toBe(0.1);
      expect(result.threatThreshold).toBe(1);
    });
  });

  describe("loadTargetSwitchingConfig", () => {
    it("should return default config when no data provided", () => {
      const result = loadTargetSwitchingConfig();
      expect(result).toEqual(DEFAULT_TARGET_SWITCHING_CONFIG);
    });

    it("should return default config when undefined provided", () => {
      const result = loadTargetSwitchingConfig(undefined);
      expect(result).toEqual(DEFAULT_TARGET_SWITCHING_CONFIG);
    });

    it("should validate and return custom config", () => {
      const customConfig = {
        globalEnabled: false,
        defaultCooldownMs: 3000,
      };

      const result = loadTargetSwitchingConfig(customConfig);
      expect(result.globalEnabled).toBe(false);
      expect(result.defaultCooldownMs).toBe(3000);
      expect(result.defaultPursuitRange).toBe(
        DEFAULT_TARGET_SWITCHING_CONFIG.defaultPursuitRange,
      );
    });
  });

  describe("getEnemyTypeConfig", () => {
    const mockConfig: TargetSwitchingConfig = {
      globalEnabled: true,
      defaultCooldownMs: 2000,
      defaultPursuitRange: 1.5,
      defaultThreatThreshold: 0.5,
      enemyTypeConfigs: {
        custom: {
          enabled: false,
          cooldownMs: 3000,
          pursuitRange: 2.0,
          threatThreshold: 0.8,
        },
      },
    };

    it("should return specific config when enemy type exists", () => {
      const result = getEnemyTypeConfig(mockConfig, "custom");
      expect(result.enabled).toBe(false);
      expect(result.cooldownMs).toBe(3000);
      expect(result.pursuitRange).toBe(2.0);
      expect(result.threatThreshold).toBe(0.8);
    });

    it("should return default config when enemy type does not exist", () => {
      const result = getEnemyTypeConfig(mockConfig, "nonexistent");
      expect(result.enabled).toBe(mockConfig.globalEnabled);
      expect(result.cooldownMs).toBe(mockConfig.defaultCooldownMs);
      expect(result.pursuitRange).toBe(mockConfig.defaultPursuitRange);
      expect(result.threatThreshold).toBe(mockConfig.defaultThreatThreshold);
    });
  });

  describe("updateEnemyTypeConfig", () => {
    const mockConfig: TargetSwitchingConfig = {
      globalEnabled: true,
      defaultCooldownMs: 2000,
      defaultPursuitRange: 1.5,
      defaultThreatThreshold: 0.5,
      enemyTypeConfigs: {
        existing: {
          enabled: true,
          cooldownMs: 2000,
          pursuitRange: 1.5,
          threatThreshold: 0.5,
        },
      },
    };

    it("should update existing enemy type config", () => {
      const result = updateEnemyTypeConfig(mockConfig, "existing", {
        cooldownMs: 3000,
        pursuitRange: 2.0,
      });

      const updatedConfig = result.enemyTypeConfigs.existing;
      expect(updatedConfig.cooldownMs).toBe(3000);
      expect(updatedConfig.pursuitRange).toBe(2.0);
      expect(updatedConfig.enabled).toBe(true); // Should preserve existing values
      expect(updatedConfig.threatThreshold).toBe(0.5);
    });

    it("should create new enemy type config", () => {
      const result = updateEnemyTypeConfig(mockConfig, "new", {
        enabled: false,
        cooldownMs: 4000,
      });

      const newConfig = result.enemyTypeConfigs.new;
      expect(newConfig.enabled).toBe(false);
      expect(newConfig.cooldownMs).toBe(4000);
      expect(newConfig.pursuitRange).toBe(mockConfig.defaultPursuitRange);
      expect(newConfig.threatThreshold).toBe(mockConfig.defaultThreatThreshold);
    });

    it("should not modify original config", () => {
      const originalConfig = { ...mockConfig };
      updateEnemyTypeConfig(mockConfig, "existing", { cooldownMs: 9999 });

      expect(mockConfig.enemyTypeConfigs.existing.cooldownMs).toBe(
        originalConfig.enemyTypeConfigs.existing.cooldownMs,
      );
    });
  });

  describe("isTargetSwitchingGloballyEnabled", () => {
    it("should return true when globally enabled", () => {
      const config: TargetSwitchingConfig = {
        globalEnabled: true,
        defaultCooldownMs: 2000,
        defaultPursuitRange: 1.5,
        defaultThreatThreshold: 0.5,
        enemyTypeConfigs: {},
      };

      expect(isTargetSwitchingGloballyEnabled(config)).toBe(true);
    });

    it("should return false when globally disabled", () => {
      const config: TargetSwitchingConfig = {
        globalEnabled: false,
        defaultCooldownMs: 2000,
        defaultPursuitRange: 1.5,
        defaultThreatThreshold: 0.5,
        enemyTypeConfigs: {},
      };

      expect(isTargetSwitchingGloballyEnabled(config)).toBe(false);
    });
  });

  describe("isTargetSwitchingEnabledForType", () => {
    const enabledConfig: TargetSwitchingConfig = {
      globalEnabled: true,
      defaultCooldownMs: 2000,
      defaultPursuitRange: 1.5,
      defaultThreatThreshold: 0.5,
      enemyTypeConfigs: {
        enabled: {
          enabled: true,
          cooldownMs: 2000,
          pursuitRange: 1.5,
          threatThreshold: 0.5,
        },
        disabled: {
          enabled: false,
          cooldownMs: 2000,
          pursuitRange: 1.5,
          threatThreshold: 0.5,
        },
      },
    };

    const disabledConfig: TargetSwitchingConfig = {
      ...enabledConfig,
      globalEnabled: false,
    };

    it("should return false when globally disabled", () => {
      expect(isTargetSwitchingEnabledForType(disabledConfig, "enabled")).toBe(
        false,
      );
      expect(isTargetSwitchingEnabledForType(disabledConfig, "disabled")).toBe(
        false,
      );
    });

    it("should return true when globally enabled and type enabled", () => {
      expect(isTargetSwitchingEnabledForType(enabledConfig, "enabled")).toBe(
        true,
      );
    });

    it("should return false when globally enabled but type disabled", () => {
      expect(isTargetSwitchingEnabledForType(enabledConfig, "disabled")).toBe(
        false,
      );
    });

    it("should return true for nonexistent type when globally enabled", () => {
      expect(
        isTargetSwitchingEnabledForType(enabledConfig, "nonexistent"),
      ).toBe(true);
    });
  });

  describe("TargetSwitchEvaluation type", () => {
    it("should allow valid evaluation results", () => {
      const evaluation: TargetSwitchEvaluation = {
        shouldSwitch: true,
        newTargetId: "entity-123",
        reason: "switch_approved",
        priority: 0.8,
      };

      expect(evaluation.shouldSwitch).toBe(true);
      expect(evaluation.newTargetId).toBe("entity-123");
      expect(evaluation.reason).toBe("switch_approved");
      expect(evaluation.priority).toBe(0.8);
    });

    it("should allow evaluation without new target", () => {
      const evaluation: TargetSwitchEvaluation = {
        shouldSwitch: false,
        reason: "cooldown",
        priority: 0,
      };

      expect(evaluation.shouldSwitch).toBe(false);
      expect(evaluation.newTargetId).toBeUndefined();
      expect(evaluation.reason).toBe("cooldown");
      expect(evaluation.priority).toBe(0);
    });
  });
});
