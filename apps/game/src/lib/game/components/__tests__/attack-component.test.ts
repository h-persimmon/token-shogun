import { describe, expect, it } from "vitest";
import {
  canAttack,
  clearAttackTarget,
  createAttackComponent,
  executeAttack,
  isArtilleryAttack,
  isAttackComponent,
  isDirectAttack,
  isHomingAttack,
  isProjectileAttack,
  isValidArtilleryConfig,
  isValidHomingConfig,
} from "../attack-component";

describe("AttackComponent", () => {
  describe("createAttackComponent", () => {
    it("should create attack component with default values", () => {
      const attack = createAttackComponent(50, 200, 1.5);

      expect(attack.damage).toBe(50);
      expect(attack.range).toBe(200);
      expect(attack.cooldown).toBe(1.5);
      expect(attack.attackType).toBe("direct");
      expect(attack.projectileSpeed).toBe(300);
      expect(attack.lastAttackTime).toBe(0);
      expect(attack.target).toBeUndefined();
    });

    it("should create attack component with specified attack type", () => {
      const attack = createAttackComponent(30, 250, 1.0, "homing", 400);

      expect(attack.attackType).toBe("homing");
      expect(attack.projectileSpeed).toBe(400);
    });

    it("should create artillery attack with explosion parameters", () => {
      const attack = createAttackComponent(
        60,
        300,
        2.0,
        "artillery",
        200,
        80,
        1.5,
        "cannonball",
      );

      expect(attack.attackType).toBe("artillery");
      expect(attack.explosionRadius).toBe(80);
      expect(attack.flightTime).toBe(1.5);
      expect(attack.projectileSprite).toBe("cannonball");
    });
  });

  describe("isAttackComponent", () => {
    it("should return true for valid attack component", () => {
      const attack = createAttackComponent(50, 200);
      expect(isAttackComponent(attack)).toBe(true);
    });

    it("should return false for invalid component", () => {
      const invalidComponent = { type: "invalid", data: {} };
      expect(isAttackComponent(invalidComponent as any)).toBe(false);
    });
  });

  describe("attack type utility functions", () => {
    it("should correctly identify direct attack", () => {
      const directAttack = createAttackComponent(50, 200, 1.0, "direct");
      expect(isDirectAttack(directAttack)).toBe(true);
      expect(isArtilleryAttack(directAttack)).toBe(false);
      expect(isHomingAttack(directAttack)).toBe(false);
    });

    it("should correctly identify artillery attack", () => {
      const artilleryAttack = createAttackComponent(60, 300, 2.0, "artillery");
      expect(isArtilleryAttack(artilleryAttack)).toBe(true);
      expect(isDirectAttack(artilleryAttack)).toBe(false);
      expect(isHomingAttack(artilleryAttack)).toBe(false);
    });

    it("should correctly identify homing attack", () => {
      const homingAttack = createAttackComponent(30, 250, 1.0, "homing");
      expect(isHomingAttack(homingAttack)).toBe(true);
      expect(isDirectAttack(homingAttack)).toBe(false);
      expect(isArtilleryAttack(homingAttack)).toBe(false);
    });

    it("should identify projectile attacks", () => {
      const directAttack = createAttackComponent(50, 200, 1.0, "direct");
      const artilleryAttack = createAttackComponent(60, 300, 2.0, "artillery");
      const homingAttack = createAttackComponent(30, 250, 1.0, "homing");

      expect(isProjectileAttack(directAttack)).toBe(false);
      expect(isProjectileAttack(artilleryAttack)).toBe(true);
      expect(isProjectileAttack(homingAttack)).toBe(true);
    });
  });

  describe("attack configuration validation", () => {
    it("should validate artillery attack configuration", () => {
      const validArtillery = createAttackComponent(
        60,
        300,
        2.0,
        "artillery",
        200,
        80,
        1.5,
      );
      const invalidArtillery1 = createAttackComponent(
        60,
        300,
        2.0,
        "artillery",
        200,
        0,
        1.5,
      );
      const invalidArtillery2 = createAttackComponent(
        60,
        300,
        2.0,
        "artillery",
        200,
        80,
        0,
      );

      expect(isValidArtilleryConfig(validArtillery)).toBe(true);
      expect(isValidArtilleryConfig(invalidArtillery1)).toBe(false);
      expect(isValidArtilleryConfig(invalidArtillery2)).toBe(false);
    });

    it("should validate homing attack configuration", () => {
      const validHoming = createAttackComponent(30, 250, 1.0, "homing", 400);
      const invalidHoming = createAttackComponent(30, 250, 1.0, "homing", 0);

      expect(isValidHomingConfig(validHoming)).toBe(true);
      expect(isValidHomingConfig(invalidHoming)).toBe(false);
    });

    it("should not validate non-matching attack types", () => {
      const directAttack = createAttackComponent(50, 200, 1.0, "direct");

      expect(isValidArtilleryConfig(directAttack)).toBe(false);
      expect(isValidHomingConfig(directAttack)).toBe(false);
    });
  });

  describe("existing functionality", () => {
    it("should maintain canAttack functionality", () => {
      const attack = createAttackComponent(50, 200, 1.0);
      const currentTime = 1000;

      expect(canAttack(attack, currentTime)).toBe(true);

      attack.lastAttackTime = currentTime;
      expect(canAttack(attack, currentTime + 500)).toBe(false);
      expect(canAttack(attack, currentTime + 1000)).toBe(true);
    });

    it("should maintain executeAttack functionality", () => {
      const attack = createAttackComponent(50, 200, 1.0);
      const currentTime = 1000;
      const targetId = "enemy-1";

      executeAttack(attack, currentTime, targetId);

      expect(attack.lastAttackTime).toBe(currentTime);
      expect(attack.target).toBe(targetId);
    });

    it("should maintain clearAttackTarget functionality", () => {
      const attack = createAttackComponent(50, 200, 1.0);
      attack.target = "enemy-1";

      clearAttackTarget(attack);

      expect(attack.target).toBeUndefined();
    });
  });
});
