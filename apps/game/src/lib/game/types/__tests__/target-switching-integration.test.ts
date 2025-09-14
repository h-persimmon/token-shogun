import { describe, expect, it } from "vitest";
import {
  canSwitchTarget,
  createEnemyComponent,
  getPursuitRange,
  getTargetSwitchingConfig,
  getThreatThreshold,
  isTargetSwitchingEnabled,
  recordTargetSwitch,
} from "../../components/enemy-component";
import {
  DEFAULT_TARGET_SWITCHING_CONFIG,
  getEnemyTypeConfig,
  isTargetSwitchingEnabledForType,
  loadTargetSwitchingConfig,
} from "../target-switching-config";

describe("Target Switching Configuration Integration", () => {
  describe("Integration with EnemyComponent", () => {
    it("should use default configuration when enemy has no specific config", () => {
      const enemy = createEnemyComponent("basic", Date.now(), "any", 10);
      const config = getTargetSwitchingConfig(enemy);

      expect(config.enabled).toBe(true);
      expect(config.cooldownMs).toBe(2000);
      expect(config.pursuitRange).toBe(1.5);
      expect(config.threatThreshold).toBe(0.5);
    });

    it("should use global configuration for enemy type-specific settings", () => {
      const globalConfig = loadTargetSwitchingConfig();
      const basicTypeConfig = getEnemyTypeConfig(globalConfig, "basic");

      expect(basicTypeConfig.enabled).toBe(true);
      expect(basicTypeConfig.cooldownMs).toBe(2000);
      expect(basicTypeConfig.pursuitRange).toBe(1.5);
      expect(basicTypeConfig.threatThreshold).toBe(0.5);
    });

    it("should have different configurations for different enemy types", () => {
      const globalConfig = loadTargetSwitchingConfig();

      const basicConfig = getEnemyTypeConfig(globalConfig, "basic");
      const fastConfig = getEnemyTypeConfig(globalConfig, "fast");
      const heavyConfig = getEnemyTypeConfig(globalConfig, "heavy");

      // Fast enemies should have shorter cooldown and longer pursuit range
      expect(fastConfig.cooldownMs).toBeLessThan(basicConfig.cooldownMs);
      expect(fastConfig.pursuitRange).toBeGreaterThan(basicConfig.pursuitRange);

      // Heavy enemies should have longer cooldown and shorter pursuit range
      expect(heavyConfig.cooldownMs).toBeGreaterThan(basicConfig.cooldownMs);
      expect(heavyConfig.pursuitRange).toBeLessThan(basicConfig.pursuitRange);
    });

    it("should respect global enable/disable setting", () => {
      const disabledConfig = loadTargetSwitchingConfig({
        globalEnabled: false,
      });

      expect(isTargetSwitchingEnabledForType(disabledConfig, "basic")).toBe(
        false,
      );
      expect(isTargetSwitchingEnabledForType(disabledConfig, "fast")).toBe(
        false,
      );
      expect(isTargetSwitchingEnabledForType(disabledConfig, "heavy")).toBe(
        false,
      );
    });

    it("should work with enemy component utility functions", () => {
      const enemy = createEnemyComponent("fast", Date.now(), "any", 15);

      expect(isTargetSwitchingEnabled(enemy)).toBe(true);
      expect(canSwitchTarget(enemy)).toBe(true);

      // Record a target switch
      const switchTime = Date.now();
      recordTargetSwitch(enemy, switchTime);

      // Should not be able to switch immediately due to cooldown
      expect(canSwitchTarget(enemy, switchTime + 100)).toBe(false);

      // Should be able to switch after cooldown period
      expect(canSwitchTarget(enemy, switchTime + 2000)).toBe(true);
    });

    it("should calculate pursuit range correctly", () => {
      const enemy = createEnemyComponent("fast", Date.now(), "any", 15);
      const baseAttackRange = 100;

      // Enemy component uses default config (1.5) unless explicitly set
      const pursuitRange = getPursuitRange(enemy, baseAttackRange);
      expect(pursuitRange).toBe(150); // 100 * 1.5 (default)
    });

    it("should return correct threat threshold", () => {
      const basicEnemy = createEnemyComponent("basic", Date.now(), "any", 10);
      const fastEnemy = createEnemyComponent("fast", Date.now(), "any", 15);
      const heavyEnemy = createEnemyComponent("heavy", Date.now(), "any", 25);

      // All enemies use default config (0.5) unless explicitly set
      expect(getThreatThreshold(basicEnemy)).toBe(0.5);
      expect(getThreatThreshold(fastEnemy)).toBe(0.5);
      expect(getThreatThreshold(heavyEnemy)).toBe(0.5);
    });

    it("should demonstrate how to apply global config to enemy components", () => {
      const globalConfig = loadTargetSwitchingConfig();

      // Create enemies and apply type-specific configurations
      const basicEnemy = createEnemyComponent("basic", Date.now(), "any", 10);
      const fastEnemy = createEnemyComponent("fast", Date.now(), "any", 15);
      const heavyEnemy = createEnemyComponent("heavy", Date.now(), "any", 25);

      // Apply global configuration to enemies
      const basicTypeConfig = getEnemyTypeConfig(globalConfig, "basic");
      const fastTypeConfig = getEnemyTypeConfig(globalConfig, "fast");
      const heavyTypeConfig = getEnemyTypeConfig(globalConfig, "heavy");

      // Verify that global config has different settings for different types
      expect(basicTypeConfig.cooldownMs).toBe(2000);
      expect(fastTypeConfig.cooldownMs).toBe(1500);
      expect(heavyTypeConfig.cooldownMs).toBe(3000);

      expect(basicTypeConfig.pursuitRange).toBe(1.5);
      expect(fastTypeConfig.pursuitRange).toBe(2.0);
      expect(heavyTypeConfig.pursuitRange).toBe(1.2);
    });

    it("should handle custom enemy type configurations", () => {
      const customConfig = loadTargetSwitchingConfig({
        enemyTypeConfigs: {
          custom: {
            enabled: true,
            cooldownMs: 5000,
            pursuitRange: 3.0,
            threatThreshold: 0.9,
          },
        },
      });

      const customTypeConfig = getEnemyTypeConfig(customConfig, "custom");
      expect(customTypeConfig.cooldownMs).toBe(5000);
      expect(customTypeConfig.pursuitRange).toBe(3.0);
      expect(customTypeConfig.threatThreshold).toBe(0.9);
    });

    it("should fall back to defaults for unknown enemy types", () => {
      const globalConfig = loadTargetSwitchingConfig();
      const unknownTypeConfig = getEnemyTypeConfig(globalConfig, "unknown");

      expect(unknownTypeConfig.enabled).toBe(globalConfig.globalEnabled);
      expect(unknownTypeConfig.cooldownMs).toBe(globalConfig.defaultCooldownMs);
      expect(unknownTypeConfig.pursuitRange).toBe(
        globalConfig.defaultPursuitRange,
      );
      expect(unknownTypeConfig.threatThreshold).toBe(
        globalConfig.defaultThreatThreshold,
      );
    });
  });

  describe("Configuration Validation Integration", () => {
    it("should validate configuration when loading", () => {
      const invalidConfig = loadTargetSwitchingConfig({
        defaultCooldownMs: -1000,
        defaultPursuitRange: -0.5,
        defaultThreatThreshold: 2.0,
        enemyTypeConfigs: {
          invalid: {
            enabled: true,
            cooldownMs: -500,
            pursuitRange: -1.0,
            threatThreshold: 1.5,
          },
        },
      });

      // Global defaults should be validated
      expect(invalidConfig.defaultCooldownMs).toBe(0);
      expect(invalidConfig.defaultPursuitRange).toBe(0.1);
      expect(invalidConfig.defaultThreatThreshold).toBe(1);

      // Enemy type config should be validated
      const invalidTypeConfig = invalidConfig.enemyTypeConfigs.invalid;
      expect(invalidTypeConfig.cooldownMs).toBe(0);
      expect(invalidTypeConfig.pursuitRange).toBe(0.1);
      expect(invalidTypeConfig.threatThreshold).toBe(1);
    });

    it("should preserve valid configurations", () => {
      const validConfig = loadTargetSwitchingConfig({
        globalEnabled: false,
        defaultCooldownMs: 3000,
        defaultPursuitRange: 2.5,
        defaultThreatThreshold: 0.8,
        enemyTypeConfigs: {
          valid: {
            enabled: true,
            cooldownMs: 1500,
            pursuitRange: 1.8,
            threatThreshold: 0.6,
          },
        },
      });

      expect(validConfig.globalEnabled).toBe(false);
      expect(validConfig.defaultCooldownMs).toBe(3000);
      expect(validConfig.defaultPursuitRange).toBe(2.5);
      expect(validConfig.defaultThreatThreshold).toBe(0.8);

      const validTypeConfig = validConfig.enemyTypeConfigs.valid;
      expect(validTypeConfig.enabled).toBe(true);
      expect(validTypeConfig.cooldownMs).toBe(1500);
      expect(validTypeConfig.pursuitRange).toBe(1.8);
      expect(validTypeConfig.threatThreshold).toBe(0.6);
    });
  });
});
