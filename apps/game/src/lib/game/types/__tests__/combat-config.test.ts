import { describe, expect, it } from "vitest";
import {
  DEFAULT_COMBAT_RANGE_CONFIG,
  DEFAULT_STUN_CONFIG,
} from "../../constants";
import type { CombatRangeConfig, StunConfig } from "../combat-config";

describe("Combat Config Types", () => {
  describe("StunConfig", () => {
    it("should have valid default stun configuration", () => {
      expect(DEFAULT_STUN_CONFIG).toBeDefined();
      expect(DEFAULT_STUN_CONFIG.defaultDuration).toBe(1000);
      expect(DEFAULT_STUN_CONFIG.visualEffectDuration).toBe(300);
      expect(DEFAULT_STUN_CONFIG.unitTypeModifiers).toBeDefined();
    });

    it("should have unit type modifiers for different unit types", () => {
      const modifiers = DEFAULT_STUN_CONFIG.unitTypeModifiers;
      expect(modifiers.light).toBe(0.8);
      expect(modifiers.heavy).toBe(1.2);
      expect(modifiers.fast).toBe(0.6);
      expect(modifiers.tank).toBe(1.5);
    });

    it("should satisfy StunConfig interface", () => {
      const config: StunConfig = DEFAULT_STUN_CONFIG;
      expect(typeof config.defaultDuration).toBe("number");
      expect(typeof config.unitTypeModifiers).toBe("object");
      expect(typeof config.visualEffectDuration).toBe("number");
    });
  });

  describe("CombatRangeConfig", () => {
    it("should have valid default combat range configuration", () => {
      expect(DEFAULT_COMBAT_RANGE_CONFIG).toBeDefined();
      expect(DEFAULT_COMBAT_RANGE_CONFIG.stopThreshold).toBe(0.95);
      expect(DEFAULT_COMBAT_RANGE_CONFIG.resumeThreshold).toBe(1.1);
      expect(DEFAULT_COMBAT_RANGE_CONFIG.checkInterval).toBe(100);
    });

    it("should have valid threshold values", () => {
      const config = DEFAULT_COMBAT_RANGE_CONFIG;
      expect(config.stopThreshold).toBeGreaterThan(0);
      expect(config.stopThreshold).toBeLessThanOrEqual(1);
      expect(config.resumeThreshold).toBeGreaterThan(config.stopThreshold);
    });

    it("should satisfy CombatRangeConfig interface", () => {
      const config: CombatRangeConfig = DEFAULT_COMBAT_RANGE_CONFIG;
      expect(typeof config.stopThreshold).toBe("number");
      expect(typeof config.resumeThreshold).toBe("number");
      expect(typeof config.checkInterval).toBe("number");
    });
  });
});
