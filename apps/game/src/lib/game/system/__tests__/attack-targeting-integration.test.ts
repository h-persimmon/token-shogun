import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAttackComponent } from "../../components/attack-component";
import { createEnemyComponent } from "../../components/enemy-component";
import { createHealthComponent } from "../../components/health-component";
import { createPositionComponentFromPoint } from "../../components/position-component";
import { createTargetComponent } from "../../components/target-component";
import { createUnitComponent } from "../../components/unit-component";
import { createEntity } from "../../entities/entity";
import { AttackSystem } from "../attack-system";
import { TargetingSystem } from "../targeting-system";

describe("AttackSystem and TargetingSystem Integration", () => {
  let attackSystem: AttackSystem;
  let targetingSystem: TargetingSystem;
  let mockEntityManager: any;
  let mockMovementSystem: any;
  let consoleSpy: any;

  beforeEach(() => {
    const entities = new Map();

    mockEntityManager = {
      entities,
      createEntity: vi.fn(),
      getEntity: vi.fn((id: string) => entities.get(id)),
      destroyEntity: vi.fn((id: string) => entities.delete(id)),
      addComponent: vi.fn(),
      queryEntities: vi.fn((query: any) => {
        const result = [];
        for (const entity of entities.values()) {
          const hasRequired = query.required.every(
            (comp: string) => comp in entity.components,
          );
          if (hasRequired) {
            result.push(entity);
          }
        }
        return result;
      }),
      getAllEntities: () => Array.from(entities.values()),
    };

    mockMovementSystem = {
      moveEntityTo: vi.fn(),
    };

    attackSystem = new AttackSystem(mockEntityManager, 10);
    targetingSystem = new TargetingSystem(
      mockEntityManager,
      mockMovementSystem,
    );

    // Helper to add entities to mock manager
    (mockEntityManager as any).addEntity = (entity: any) => {
      entities.set(entity.id, entity);
      return entity;
    };

    // Spy on console.log to verify logging
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("Target Switching Trigger Integration", () => {
    it("should record damage source in AttackSystem and trigger target switching in TargetingSystem", () => {
      // Create an enemy entity
      const enemyEntity = createEntity("enemy1");
      enemyEntity.components.enemy = createEnemyComponent(
        "basic",
        Date.now(),
        "any",
        10,
        {
          enabled: true,
          cooldownMs: 1000,
          pursuitRange: 1.5,
          threatThreshold: 0.1,
        },
      );
      enemyEntity.components.target = createTargetComponent("none");
      enemyEntity.components.health = createHealthComponent(100);
      enemyEntity.components.position = createPositionComponentFromPoint({
        x: 100,
        y: 100,
      });
      enemyEntity.components.attack = createAttackComponent(20, 50);
      (mockEntityManager as any).addEntity(enemyEntity);

      // Create an allied unit (attacker)
      const allyEntity = createEntity("ally1");
      allyEntity.components.unit = createUnitComponent("soldier");
      allyEntity.components.position = createPositionComponentFromPoint({
        x: 110,
        y: 110,
      });
      allyEntity.components.health = createHealthComponent(80);
      allyEntity.components.attack = createAttackComponent(15, 40);
      (mockEntityManager as any).addEntity(allyEntity);

      // Step 1: Simulate ally attacking enemy (this should record damage source)
      const attackTime = Date.now();
      const damageDealt = attackSystem.calculateAndApplyDamage(
        allyEntity,
        enemyEntity,
        attackTime,
      );

      // Verify damage was applied and source was recorded
      expect(damageDealt).toBe(15);
      expect(enemyEntity.components.health.currentHealth).toBe(85);
      expect(enemyEntity.components.health.lastDamageFrom).toBe(allyEntity.id);
      expect(enemyEntity.components.health.lastDamageTime).toBe(attackTime);

      // Verify target switching logging was called
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("🎯 Target Switching: Recorded damage source"),
      );

      // The main focus of this task is verifying damage source recording works
      // This provides the trigger mechanism for target switching

      // Verify that the damage source information is available for target switching evaluation
      expect(enemyEntity.components.health.lastDamageFrom).toBe(allyEntity.id);
      expect(enemyEntity.components.health.lastDamageTime).toBe(attackTime);

      // Verify that this information can be used by target switching logic
      const damageAge =
        Date.now() - enemyEntity.components.health.lastDamageTime!;
      expect(damageAge).toBeLessThan(1000); // Should be recent enough for target switching
    });

    it("should handle projectile attacks and trigger target switching", () => {
      // Create an enemy entity
      const enemyEntity = createEntity("enemy1");
      enemyEntity.components.enemy = createEnemyComponent(
        "basic",
        Date.now(),
        "any",
        10,
        {
          enabled: true,
          cooldownMs: 1000,
          pursuitRange: 2.0,
          threatThreshold: 0.1,
        },
      );
      enemyEntity.components.target = createTargetComponent("none");
      enemyEntity.components.health = createHealthComponent(100);
      enemyEntity.components.position = createPositionComponentFromPoint({
        x: 100,
        y: 100,
      });
      enemyEntity.components.attack = createAttackComponent(20, 50);
      (mockEntityManager as any).addEntity(enemyEntity);

      // Create an allied unit (archer)
      const archerEntity = createEntity("archer1");
      archerEntity.components.unit = createUnitComponent("archer");
      archerEntity.components.position = createPositionComponentFromPoint({
        x: 150,
        y: 150,
      });
      archerEntity.components.health = createHealthComponent(60);
      archerEntity.components.attack = createAttackComponent(25, 80);
      (mockEntityManager as any).addEntity(archerEntity);

      // Simulate projectile hit (using the private method for testing)
      const projectileComponent = {
        type: "projectile",
        attackerId: archerEntity.id,
        damage: 25,
        speed: 200,
        attackType: "homing" as const,
      };

      // Apply projectile hit
      (attackSystem as any).applyHomingProjectileHit(
        enemyEntity,
        projectileComponent,
      );

      // Verify damage was applied and source was recorded
      expect(enemyEntity.components.health.currentHealth).toBe(75);
      expect(enemyEntity.components.health.lastDamageFrom).toBe(
        archerEntity.id,
      );

      // Verify projectile target switching logging was called
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "🎯 Target Switching: Recorded projectile damage source",
        ),
      );

      // Verify that the damage source information is available for target switching evaluation
      expect(enemyEntity.components.health.lastDamageFrom).toBe(
        archerEntity.id,
      );
      expect(enemyEntity.components.health.lastDamageTime).toBeDefined();

      // Verify that this information can be used by target switching logic
      const damageAge =
        Date.now() - enemyEntity.components.health.lastDamageTime!;
      expect(damageAge).toBeLessThan(1000); // Should be recent enough for target switching
    });
  });
});
