import { beforeEach, describe, expect, it } from "vitest";
import { createAttackComponent } from "../../components/attack-component";
import { createEnemyComponent } from "../../components/enemy-component";
import { createHealthComponent } from "../../components/health-component";
import { createPositionComponentFromPoint } from "../../components/position-component";
import { createUnitComponent } from "../../components/unit-component";
import type { Entity } from "../../entities/entity";
import { createEntity } from "../../entities/entity";
import {
  calculateAttackPriority,
  calculateDistancePriority,
  calculateHealthPriority,
  calculateTargetSwitchCooldownRemaining,
  calculateUnitTypePriority,
  shouldConsiderThreatBasedSwitch,
} from "../target-switching-utils-basic";
import {
  applyEnemyTypeTargetSwitchingConfig,
  calculateEngagementThresholdMultiplier,
  getEnemyTypeTargetSwitchingConfig,
  selectBestAttackerFromMultiple,
} from "../target-switching-utils";

describe("Target Switching Utils", () => {
  let enemyEntity: Entity;
  let attackerEntity1: Entity;
  let attackerEntity2: Entity;
  let structureEntity: Entity;

  beforeEach(() => {
    // Create test entities
    enemyEntity = createEntity("enemy1");
    enemyEntity.components.position = createPositionComponentFromPoint({ x: 100, y: 100 });
    enemyEntity.components.enemy = createEnemyComponent("basic");
    enemyEntity.components.attack = createAttackComponent(25, 50);
    enemyEntity.components.health = createHealthComponent(100);

    attackerEntity1 = createEntity("attacker1");
    attackerEntity1.components.position = createPositionComponentFromPoint({ x: 120, y: 100 });
    attackerEntity1.components.unit = createUnitComponent();
    attackerEntity1.components.attack = createAttackComponent(30, 40);
    attackerEntity1.components.health = createHealthComponent(80);

    attackerEntity2 = createEntity("attacker2");
    attackerEntity2.components.position = createPositionComponentFromPoint({ x: 105, y: 100 }); // Much closer
    attackerEntity2.components.unit = createUnitComponent();
    attackerEntity2.components.attack = createAttackComponent(20, 35);
    attackerEntity2.components.health = createHealthComponent(60);

    structureEntity = createEntity("structure1");
    structureEntity.components.position = createPositionComponentFromPoint({ x: 200, y: 100 });
    structureEntity.components.attack = createAttackComponent(40, 60);
    structureEntity.components.health = createHealthComponent(200);
  });

  describe("selectBestAttackerFromMultiple", () => {
    it("should return null for empty candidates array", () => {
      const result = selectBestAttackerFromMultiple(enemyEntity, []);
      
      expect(result).toBeNull();
    });

    it("should return single attacker when only one candidate", () => {
      const result = selectBestAttackerFromMultiple(enemyEntity, [attackerEntity1]);
      
      expect(result).toBe(attackerEntity1);
    });

    it("should select closer attacker when multiple candidates", () => {
      const result = selectBestAttackerFromMultiple(enemyEntity, [attackerEntity1, attackerEntity2]);
      
      // attackerEntity2 is much closer (distance 5 vs 20)
      expect(result).toBe(attackerEntity2);
    });

    it("should prioritize units over structures", () => {
      const result = selectBestAttackerFromMultiple(enemyEntity, [structureEntity, attackerEntity1]);
      
      // attackerEntity1 should win due to unit type bonus
      expect(result).toBe(attackerEntity1);
    });

    it("should filter out attackers outside pursuit range", () => {
      // Move attacker2 far away
      attackerEntity2.components.position = createPositionComponentFromPoint({ x: 300, y: 100 });
      
      const result = selectBestAttackerFromMultiple(enemyEntity, [attackerEntity1, attackerEntity2]);
      
      expect(result).toBe(attackerEntity1);
    });
  });

  describe("calculateEngagementThresholdMultiplier", () => {
    it("should return 1.0 when no current target", () => {
      const result = calculateEngagementThresholdMultiplier(enemyEntity);
      
      expect(result).toBe(1.0);
    });

    it("should return 1.5 when enemy is within attack range of current target", () => {
      // Place target within attack range (50)
      const targetEntity = createEntity("target1");
      targetEntity.components.position = createPositionComponentFromPoint({ x: 130, y: 100 });
      targetEntity.components.health = createHealthComponent(100);
      
      const result = calculateEngagementThresholdMultiplier(enemyEntity, targetEntity);
      
      expect(result).toBe(1.5);
    });

    it("should return 1.2 when enemy is pursuing but not in attack range", () => {
      // Place target within 120% of attack range but outside attack range
      const targetEntity = createEntity("target1");
      targetEntity.components.position = createPositionComponentFromPoint({ x: 155, y: 100 });
      targetEntity.components.health = createHealthComponent(100);
      
      const result = calculateEngagementThresholdMultiplier(enemyEntity, targetEntity);
      
      expect(result).toBe(1.2);
    });

    it("should return 1.0 when target is distant", () => {
      // Place target far away
      const targetEntity = createEntity("target1");
      targetEntity.components.position = createPositionComponentFromPoint({ x: 300, y: 100 });
      targetEntity.components.health = createHealthComponent(100);
      
      const result = calculateEngagementThresholdMultiplier(enemyEntity, targetEntity);
      
      expect(result).toBe(1.0);
    });
  });

  describe("getEnemyTypeTargetSwitchingConfig", () => {
    it("should return basic config for basic enemy type", () => {
      const config = getEnemyTypeTargetSwitchingConfig("basic");
      
      expect(config).toEqual({
        enabled: true,
        cooldownMs: 2000,
        pursuitRange: 1.5,
        threatThreshold: 0.5,
      });
    });

    it("should return fast config for fast enemy type", () => {
      const config = getEnemyTypeTargetSwitchingConfig("fast");
      
      expect(config).toEqual({
        enabled: true,
        cooldownMs: 1500,
        pursuitRange: 2.0,
        threatThreshold: 0.3,
      });
    });

    it("should return heavy config for heavy enemy type", () => {
      const config = getEnemyTypeTargetSwitchingConfig("heavy");
      
      expect(config).toEqual({
        enabled: true,
        cooldownMs: 3000,
        pursuitRange: 1.2,
        threatThreshold: 0.7,
      });
    });
  });

  describe("applyEnemyTypeTargetSwitchingConfig", () => {
    it("should apply fast enemy configuration", () => {
      const enemy = createEnemyComponent("fast");
      applyEnemyTypeTargetSwitchingConfig(enemy, "fast");
      
      expect(enemy.targetSwitching).toEqual({
        enabled: true,
        cooldownMs: 1500,
        pursuitRange: 2.0,
        threatThreshold: 0.3,
      });
    });

    it("should apply heavy enemy configuration", () => {
      const enemy = createEnemyComponent("heavy");
      applyEnemyTypeTargetSwitchingConfig(enemy, "heavy");
      
      expect(enemy.targetSwitching).toEqual({
        enabled: true,
        cooldownMs: 3000,
        pursuitRange: 1.2,
        threatThreshold: 0.7,
      });
    });
  });

  // Basic tests without complex entity setup

  describe("shouldConsiderThreatBasedSwitch", () => {
    it("should return true when new threat exceeds threshold", () => {
      const currentThreat = 30;
      const newThreat = 80; // 50 point difference
      const threatThreshold = 0.5; // 50 points
      
      const result = shouldConsiderThreatBasedSwitch(
        currentThreat,
        newThreat,
        threatThreshold,
      );
      
      expect(result).toBe(true);
    });

    it("should return false when new threat does not exceed threshold", () => {
      const currentThreat = 50;
      const newThreat = 70; // 20 point difference
      const threatThreshold = 0.5; // 50 points
      
      const result = shouldConsiderThreatBasedSwitch(
        currentThreat,
        newThreat,
        threatThreshold,
      );
      
      expect(result).toBe(false);
    });

    it("should handle different threat thresholds", () => {
      const currentThreat = 30;
      const newThreat = 55; // 25 point difference
      const threatThreshold = 0.2; // 20 points
      
      const result = shouldConsiderThreatBasedSwitch(
        currentThreat,
        newThreat,
        threatThreshold,
      );
      
      expect(result).toBe(true);
    });
  });

  describe("calculateDistancePriority", () => {
    it("should give higher priority to closer targets", () => {
      const closeDistance = 10;
      const farDistance = 100;
      
      const closePriority = calculateDistancePriority(closeDistance);
      const farPriority = calculateDistancePriority(farDistance);
      
      expect(closePriority).toBeGreaterThan(farPriority);
    });

    it("should cap priority at max considered distance", () => {
      const veryFarDistance = 1000;
      const maxDistance = 200;
      
      const priority1 = calculateDistancePriority(maxDistance);
      const priority2 = calculateDistancePriority(veryFarDistance);
      
      expect(priority1).toBe(priority2); // Both should be treated as max distance
    });

    it("should use custom max considered distance", () => {
      const distance = 150;
      const customMax = 100;
      
      const priority = calculateDistancePriority(distance, customMax);
      
      expect(priority).toBe(0); // Distance exceeds custom max, so minimum priority
    });
  });

  describe("calculateAttackPriority", () => {
    it("should return 0 for undefined damage", () => {
      const result = calculateAttackPriority(undefined);
      
      expect(result).toBe(0);
    });

    it("should calculate priority based on damage", () => {
      const result = calculateAttackPriority(50);
      
      expect(result).toBe(5); // 50 / 10 = 5
    });

    it("should cap priority at 30", () => {
      const result = calculateAttackPriority(500);
      
      expect(result).toBe(30); // Capped at 30
    });
  });

  describe("calculateHealthPriority", () => {
    it("should return 0 for undefined health", () => {
      const result = calculateHealthPriority(undefined, undefined);
      
      expect(result).toBe(0);
    });

    it("should give higher priority to lower health targets", () => {
      const lowHealthPriority = calculateHealthPriority(25, 100); // 25% health
      const highHealthPriority = calculateHealthPriority(75, 100); // 75% health
      
      expect(lowHealthPriority).toBeGreaterThan(highHealthPriority);
    });

    it("should return maximum priority for dead targets", () => {
      const result = calculateHealthPriority(0, 100);
      
      expect(result).toBe(20); // Maximum health priority
    });
  });

  describe("calculateUnitTypePriority", () => {
    it("should return 10 for unit entities", () => {
      const result = calculateUnitTypePriority(true);
      
      expect(result).toBe(10);
    });

    it("should return 0 for non-unit entities", () => {
      const result = calculateUnitTypePriority(false);
      
      expect(result).toBe(0);
    });
  });

  describe("calculateTargetSwitchCooldownRemaining", () => {
    it("should return 0 when no previous switch time", () => {
      const result = calculateTargetSwitchCooldownRemaining(undefined, 2000);
      
      expect(result).toBe(0);
    });

    it("should return remaining cooldown time", () => {
      const currentTime = Date.now();
      const lastSwitchTime = currentTime - 1000; // 1 second ago
      
      const result = calculateTargetSwitchCooldownRemaining(
        lastSwitchTime,
        2000,
        currentTime,
      );
      
      expect(result).toBe(1000); // 1 second remaining (2000ms cooldown - 1000ms elapsed)
    });

    it("should return 0 when cooldown has expired", () => {
      const currentTime = Date.now();
      const lastSwitchTime = currentTime - 3000; // 3 seconds ago
      
      const result = calculateTargetSwitchCooldownRemaining(
        lastSwitchTime,
        2000,
        currentTime,
      );
      
      expect(result).toBe(0);
    });
  });
});