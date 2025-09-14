import { beforeEach, describe, expect, it } from "vitest";
import { createAttackComponent } from "../../components/attack-component";
import { createEnemyComponent } from "../../components/enemy-component";
import { createHealthComponent } from "../../components/health-component";
import { createPositionComponentFromPoint } from "../../components/position-component";
import { createTargetComponent } from "../../components/target-component";
import { createUnitComponent } from "../../components/unit-component";
import type { Entity } from "../../entities/entity";
import { createEntity } from "../../entities/entity";
import {
  calculateTargetSwitchPriority,
  clearDamageSource,
  evaluateTargetSwitch,
  getRecentDamageSource,
  isAttackerInPursuitRange,
  isTargetSwitchCooldownExpired,
  shouldRevertToOriginalTarget,
} from "../target-switch-evaluation";

describe("Target Switch Evaluation", () => {
  let enemyEntity: Entity;
  let attackerEntity: Entity;
  let originalTargetEntity: Entity;
  let entityManager: { getEntity: (id: string) => Entity | undefined };

  beforeEach(() => {
    // Create enemy entity
    enemyEntity = createEntity("enemy1");
    enemyEntity.components.enemy = createEnemyComponent(
      "basic",
      Date.now(),
      "any",
      10,
      {
        enabled: true,
        cooldownMs: 2000,
        pursuitRange: 1.5,
        threatThreshold: 0.5,
      },
    );
    enemyEntity.components.health = createHealthComponent(100);
    enemyEntity.components.target = createTargetComponent();
    enemyEntity.components.attack = createAttackComponent(50, 50, 1000);
    enemyEntity.components.position = createPositionComponentFromPoint({
      x: 100,
      y: 100,
    });

    // Create attacker entity
    attackerEntity = createEntity("attacker1");
    attackerEntity.components.unit = createUnitComponent("ally", "warrior");
    attackerEntity.components.health = createHealthComponent(80);
    attackerEntity.components.attack = createAttackComponent(30, 40, 800);
    attackerEntity.components.position = createPositionComponentFromPoint({
      x: 120,
      y: 120,
    });

    // Create original target entity
    originalTargetEntity = createEntity("original1");
    originalTargetEntity.components.health = createHealthComponent(60);
    originalTargetEntity.components.position = createPositionComponentFromPoint(
      {
        x: 200,
        y: 200,
      },
    );

    // Mock entity manager
    entityManager = {
      getEntity: (id: string) => {
        switch (id) {
          case "enemy1":
            return enemyEntity;
          case "attacker1":
            return attackerEntity;
          case "original1":
            return originalTargetEntity;
          default:
            return undefined;
        }
      },
    };
  });

  describe("evaluateTargetSwitch", () => {
    it("should return disabled when target switching is disabled", () => {
      enemyEntity.components.enemy!.targetSwitching!.enabled = false;

      const result = evaluateTargetSwitch(
        enemyEntity,
        "attacker1",
        entityManager,
        Date.now(),
      );

      expect(result.shouldSwitch).toBe(false);
      expect(result.reason).toBe("disabled");
      expect(result.priority).toBe(0);
    });

    it("should return cooldown when target switch is on cooldown", () => {
      const currentTime = Date.now();
      enemyEntity.components.enemy!.lastTargetSwitchTime = currentTime - 1000; // 1 second ago

      const result = evaluateTargetSwitch(
        enemyEntity,
        "attacker1",
        entityManager,
        currentTime,
      );

      expect(result.shouldSwitch).toBe(false);
      expect(result.reason).toBe("cooldown");
      expect(result.priority).toBe(0);
    });

    it("should return no_attacker when attacker ID is undefined", () => {
      const result = evaluateTargetSwitch(
        enemyEntity,
        undefined,
        entityManager,
        Date.now(),
      );

      expect(result.shouldSwitch).toBe(false);
      expect(result.reason).toBe("no_attacker");
      expect(result.priority).toBe(0);
    });

    it("should return no_attacker when attacker entity does not exist", () => {
      const result = evaluateTargetSwitch(
        enemyEntity,
        "nonexistent",
        entityManager,
        Date.now(),
      );

      expect(result.shouldSwitch).toBe(false);
      expect(result.reason).toBe("no_attacker");
      expect(result.priority).toBe(0);
    });

    it("should return out_of_range when attacker is too far", () => {
      // Move attacker far away
      attackerEntity.components.position!.point = { x: 1000, y: 1000 };

      const result = evaluateTargetSwitch(
        enemyEntity,
        "attacker1",
        entityManager,
        Date.now(),
      );

      expect(result.shouldSwitch).toBe(false);
      expect(result.reason).toBe("out_of_range");
      expect(result.priority).toBe(0);
    });

    it("should return lower_priority when new target priority is not high enough", () => {
      // Set current target
      enemyEntity.components.target!.targetEntityId = "original1";

      // Make attacker weaker (lower priority) and farther away
      attackerEntity.components.attack!.damage = 5;
      attackerEntity.components.health!.currentHealth = 10;
      attackerEntity.components.position!.point = { x: 150, y: 150 }; // Farther away

      const result = evaluateTargetSwitch(
        enemyEntity,
        "attacker1",
        entityManager,
        Date.now(),
      );

      expect(result.shouldSwitch).toBe(false);
      expect(result.reason).toBe("lower_priority");
      expect(result.priority).toBeGreaterThan(0);
    });

    it("should approve target switch when conditions are met", () => {
      // Ensure no current target so switch should be approved
      enemyEntity.components.target!.targetEntityId = undefined;

      const result = evaluateTargetSwitch(
        enemyEntity,
        "attacker1",
        entityManager,
        Date.now(),
      );

      expect(result.shouldSwitch).toBe(true);
      expect(result.reason).toBe("switch_approved");
      expect(result.newTargetId).toBe("attacker1");
      expect(result.priority).toBeGreaterThan(0);
    });

    it("should approve switch when new target has significantly higher priority", () => {
      // Set current target to a weak target
      enemyEntity.components.target!.targetEntityId = "original1";
      originalTargetEntity.components.attack = createAttackComponent(
        5,
        40,
        800,
      ); // Very weak
      originalTargetEntity.components.position!.point = { x: 300, y: 300 }; // Far away

      // Make attacker very strong (high priority)
      attackerEntity.components.attack!.damage = 100;
      attackerEntity.components.position!.point = { x: 105, y: 105 }; // Very close

      const result = evaluateTargetSwitch(
        enemyEntity,
        "attacker1",
        entityManager,
        Date.now(),
      );

      expect(result.shouldSwitch).toBe(true);
      expect(result.reason).toBe("switch_approved");
      expect(result.newTargetId).toBe("attacker1");
    });
  });

  describe("calculateTargetSwitchPriority", () => {
    it("should calculate higher priority for closer targets", () => {
      const closeEntity = createEntity("close");
      closeEntity.components.position = createPositionComponentFromPoint({
        x: 105,
        y: 105,
      });
      closeEntity.components.attack = createAttackComponent(30, 40, 800);
      closeEntity.components.health = createHealthComponent(80);

      const farEntity = createEntity("far");
      farEntity.components.position = createPositionComponentFromPoint({
        x: 200,
        y: 200,
      });
      farEntity.components.attack = createAttackComponent(30, 40, 800);
      farEntity.components.health = createHealthComponent(80);

      const closePriority = calculateTargetSwitchPriority(
        enemyEntity,
        closeEntity,
        10, // close distance
        enemyEntity.components.enemy!,
      );

      const farPriority = calculateTargetSwitchPriority(
        enemyEntity,
        farEntity,
        100, // far distance
        enemyEntity.components.enemy!,
      );

      expect(closePriority).toBeGreaterThan(farPriority);
    });

    it("should calculate higher priority for higher damage targets", () => {
      const highDamageEntity = createEntity("highDamage");
      highDamageEntity.components.position = createPositionComponentFromPoint({
        x: 120,
        y: 120,
      });
      highDamageEntity.components.attack = createAttackComponent(100, 40, 800);
      highDamageEntity.components.health = createHealthComponent(80);

      const lowDamageEntity = createEntity("lowDamage");
      lowDamageEntity.components.position = createPositionComponentFromPoint({
        x: 120,
        y: 120,
      });
      lowDamageEntity.components.attack = createAttackComponent(10, 40, 800);
      lowDamageEntity.components.health = createHealthComponent(80);

      const highDamagePriority = calculateTargetSwitchPriority(
        enemyEntity,
        highDamageEntity,
        20,
        enemyEntity.components.enemy!,
      );

      const lowDamagePriority = calculateTargetSwitchPriority(
        enemyEntity,
        lowDamageEntity,
        20,
        enemyEntity.components.enemy!,
      );

      expect(highDamagePriority).toBeGreaterThan(lowDamagePriority);
    });

    it("should calculate higher priority for lower health targets", () => {
      const lowHealthEntity = createEntity("lowHealth");
      lowHealthEntity.components.position = createPositionComponentFromPoint({
        x: 120,
        y: 120,
      });
      lowHealthEntity.components.attack = createAttackComponent(30, 40, 800);
      lowHealthEntity.components.health = createHealthComponent(100);
      lowHealthEntity.components.health!.currentHealth = 20; // Low health

      const highHealthEntity = createEntity("highHealth");
      highHealthEntity.components.position = createPositionComponentFromPoint({
        x: 120,
        y: 120,
      });
      highHealthEntity.components.attack = createAttackComponent(30, 40, 800);
      highHealthEntity.components.health = createHealthComponent(100);
      highHealthEntity.components.health!.currentHealth = 100; // Full health

      const lowHealthPriority = calculateTargetSwitchPriority(
        enemyEntity,
        lowHealthEntity,
        20,
        enemyEntity.components.enemy!,
      );

      const highHealthPriority = calculateTargetSwitchPriority(
        enemyEntity,
        highHealthEntity,
        20,
        enemyEntity.components.enemy!,
      );

      expect(lowHealthPriority).toBeGreaterThan(highHealthPriority);
    });

    it("should give bonus priority to unit targets", () => {
      const unitEntity = createEntity("unit");
      unitEntity.components.position = createPositionComponentFromPoint({
        x: 120,
        y: 120,
      });
      unitEntity.components.attack = createAttackComponent(30, 40, 800);
      unitEntity.components.health = createHealthComponent(80);
      unitEntity.components.unit = createUnitComponent("ally", "warrior");

      const structureEntity = createEntity("structure");
      structureEntity.components.position = createPositionComponentFromPoint({
        x: 120,
        y: 120,
      });
      structureEntity.components.attack = createAttackComponent(30, 40, 800);
      structureEntity.components.health = createHealthComponent(80);

      const unitPriority = calculateTargetSwitchPriority(
        enemyEntity,
        unitEntity,
        20,
        enemyEntity.components.enemy!,
      );

      const structurePriority = calculateTargetSwitchPriority(
        enemyEntity,
        structureEntity,
        20,
        enemyEntity.components.enemy!,
      );

      expect(unitPriority).toBeGreaterThan(structurePriority);
    });
  });

  describe("isTargetSwitchCooldownExpired", () => {
    it("should return true when no previous switch time", () => {
      const result = isTargetSwitchCooldownExpired(
        enemyEntity.components.enemy!,
        Date.now(),
      );

      expect(result).toBe(true);
    });

    it("should return false when cooldown has not expired", () => {
      const currentTime = Date.now();
      enemyEntity.components.enemy!.lastTargetSwitchTime = currentTime - 1000; // 1 second ago

      const result = isTargetSwitchCooldownExpired(
        enemyEntity.components.enemy!,
        currentTime,
      );

      expect(result).toBe(false);
    });

    it("should return true when cooldown has expired", () => {
      const currentTime = Date.now();
      enemyEntity.components.enemy!.lastTargetSwitchTime = currentTime - 3000; // 3 seconds ago

      const result = isTargetSwitchCooldownExpired(
        enemyEntity.components.enemy!,
        currentTime,
      );

      expect(result).toBe(true);
    });
  });

  describe("isAttackerInPursuitRange", () => {
    it("should return true when attacker is within pursuit range", () => {
      const result = isAttackerInPursuitRange(
        enemyEntity,
        attackerEntity,
        enemyEntity.components.enemy!,
      );

      expect(result).toBe(true);
    });

    it("should return false when attacker is outside pursuit range", () => {
      attackerEntity.components.position!.point = { x: 1000, y: 1000 };

      const result = isAttackerInPursuitRange(
        enemyEntity,
        attackerEntity,
        enemyEntity.components.enemy!,
      );

      expect(result).toBe(false);
    });

    it("should return false when position components are missing", () => {
      delete attackerEntity.components.position;

      const result = isAttackerInPursuitRange(
        enemyEntity,
        attackerEntity,
        enemyEntity.components.enemy!,
      );

      expect(result).toBe(false);
    });
  });

  describe("shouldRevertToOriginalTarget", () => {
    beforeEach(() => {
      enemyEntity.components.target!.originalTargetId = "original1";
      enemyEntity.components.target!.targetEntityId = "attacker1";
    });

    it("should return false when no original target is stored", () => {
      enemyEntity.components.target!.originalTargetId = undefined;

      const result = shouldRevertToOriginalTarget(
        enemyEntity,
        enemyEntity.components.target!,
        entityManager,
      );

      expect(result).toBe(false);
    });

    it("should return false when current target is still in range", () => {
      const result = shouldRevertToOriginalTarget(
        enemyEntity,
        enemyEntity.components.target!,
        entityManager,
      );

      expect(result).toBe(false);
    });

    it("should return true when current target is out of range", () => {
      attackerEntity.components.position!.point = { x: 1000, y: 1000 };

      const result = shouldRevertToOriginalTarget(
        enemyEntity,
        enemyEntity.components.target!,
        entityManager,
      );

      expect(result).toBe(true);
    });

    it("should return false when original target no longer exists", () => {
      attackerEntity.components.position!.point = { x: 1000, y: 1000 };
      entityManager.getEntity = (id: string) => {
        if (id === "original1") return undefined;
        return id === "enemy1" ? enemyEntity : attackerEntity;
      };

      const result = shouldRevertToOriginalTarget(
        enemyEntity,
        enemyEntity.components.target!,
        entityManager,
      );

      expect(result).toBe(false);
    });

    it("should return false when original target is dead", () => {
      attackerEntity.components.position!.point = { x: 1000, y: 1000 };
      originalTargetEntity.components.health!.isDead = true;

      const result = shouldRevertToOriginalTarget(
        enemyEntity,
        enemyEntity.components.target!,
        entityManager,
      );

      expect(result).toBe(false);
    });
  });

  describe("getRecentDamageSource", () => {
    it("should return undefined when no damage source", () => {
      const result = getRecentDamageSource(
        enemyEntity.components.health!,
        1000,
        Date.now(),
      );

      expect(result).toBeUndefined();
    });

    it("should return undefined when damage is too old", () => {
      const currentTime = Date.now();
      enemyEntity.components.health!.lastDamageTime = currentTime - 2000; // 2 seconds ago
      enemyEntity.components.health!.lastDamageFrom = "attacker1";

      const result = getRecentDamageSource(
        enemyEntity.components.health!,
        1000, // 1 second max age
        currentTime,
      );

      expect(result).toBeUndefined();
    });

    it("should return damage source when recent", () => {
      const currentTime = Date.now();
      enemyEntity.components.health!.lastDamageTime = currentTime - 500; // 0.5 seconds ago
      enemyEntity.components.health!.lastDamageFrom = "attacker1";

      const result = getRecentDamageSource(
        enemyEntity.components.health!,
        1000, // 1 second max age
        currentTime,
      );

      expect(result).toBe("attacker1");
    });
  });

  describe("clearDamageSource", () => {
    it("should clear damage source information", () => {
      enemyEntity.components.health!.lastDamageTime = Date.now();
      enemyEntity.components.health!.lastDamageFrom = "attacker1";

      clearDamageSource(enemyEntity.components.health!);

      expect(enemyEntity.components.health!.lastDamageTime).toBeUndefined();
      expect(enemyEntity.components.health!.lastDamageFrom).toBeUndefined();
    });
  });
});
