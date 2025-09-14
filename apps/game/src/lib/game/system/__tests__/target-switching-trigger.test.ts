import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAttackComponent } from "../../components/attack-component";
import { createHealthComponent } from "../../components/health-component";
import { createPositionComponent } from "../../components/position-component";
import { createTargetComponent } from "../../components/target-component";
import { createEntity } from "../../entities/entity";
import { AttackSystem } from "../attack-system";

describe("Target Switching Trigger Mechanism", () => {
  let attackSystem: AttackSystem;
  let mockEntityManager: any;
  let consoleSpy: any;

  beforeEach(() => {
    const entities = new Map();

    mockEntityManager = {
      entities,
      createEntity: vi.fn(
        (textureKey: string, x: number, y: number, scale: number) => {
          const entity = createEntity(`entity_${Date.now()}`, null);
          entities.set(entity.id, entity);
          return entity;
        },
      ),
      getEntity: vi.fn((id: string) => entities.get(id)),
      destroyEntity: vi.fn((id: string) => entities.delete(id)),
      addComponent: vi.fn((entityId: string, component: any) => {
        const entity = entities.get(entityId);
        if (entity) {
          entity.components[component.type] = component;
        }
      }),
      queryEntities: vi.fn(() => []),
    };

    attackSystem = new AttackSystem(mockEntityManager, 10);

    // Spy on console.log to verify logging
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("Damage Source Recording", () => {
    it("should record damage source and log for direct attacks", () => {
      const attackerEntity = createEntity("attacker", null);
      const targetEntity = createEntity("target", null);

      const attackComponent = createAttackComponent(50, 100, 1000);
      const healthComponent = createHealthComponent(100);
      const positionComponent = createPositionComponent(0, 0);
      const targetComponent = createTargetComponent();

      attackerEntity.components.attack = attackComponent;
      attackerEntity.components.position = positionComponent;
      attackerEntity.components.target = targetComponent;
      targetEntity.components.health = healthComponent;

      const currentTime = 1000;

      const damageDealt = attackSystem.calculateAndApplyDamage(
        attackerEntity,
        targetEntity,
        currentTime,
      );

      // Verify damage was applied
      expect(damageDealt).toBe(50);
      expect(healthComponent.currentHealth).toBe(50);

      // Verify damage source was recorded
      expect(healthComponent.lastDamageTime).toBe(currentTime);
      expect(healthComponent.lastDamageFrom).toBe(attackerEntity.id);

      // Verify target switching logging was called
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("🎯 Target Switching: Recorded damage source"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Attacker: ${attackerEntity.id}`),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Target: ${targetEntity.id}`),
      );
    });

    it("should record damage source and log for projectile attacks", () => {
      const targetEntity = createEntity("target", null);
      const healthComponent = createHealthComponent(100);
      targetEntity.components.health = healthComponent;

      // Mock projectile component
      const projectileComponent = {
        type: "projectile",
        attackerId: "attacker_123",
        damage: 30,
        speed: 200,
        attackType: "homing" as const,
      };

      // Call the private method using any cast for testing
      (attackSystem as any).applyHomingProjectileHit(
        targetEntity,
        projectileComponent,
      );

      // Verify damage was applied
      expect(healthComponent.currentHealth).toBe(70);

      // Verify damage source was recorded
      expect(healthComponent.lastDamageFrom).toBe("attacker_123");
      expect(healthComponent.lastDamageTime).toBeDefined();

      // Verify target switching logging was called
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "🎯 Target Switching: Recorded projectile damage source",
        ),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Attacker: attacker_123"),
      );
    });

    it("should record damage source and log for explosion attacks", () => {
      const enemyEntity = createEntity("enemy", null);
      const healthComponent = createHealthComponent(100);
      const positionComponent = createPositionComponent(10, 10);
      const enemyComponent = { type: "enemy", enemyType: "basic" };

      enemyEntity.components.health = healthComponent;
      enemyEntity.components.position = positionComponent;
      enemyEntity.components.enemy = enemyComponent;

      // Mock findEnemiesInRadius to return our test entity
      const findEnemiesInRadiusSpy = vi.spyOn(
        attackSystem as any,
        "findEnemiesInRadius",
      );
      findEnemiesInRadiusSpy.mockReturnValue([enemyEntity]);

      const explosionCenter = { x: 10, y: 10 };
      const explosionRadius = 50;
      const baseDamage = 40;
      const attackerId = "artillery_attacker";

      // Call the private method using any cast for testing
      (attackSystem as any).applyExplosionDamage(
        explosionCenter,
        explosionRadius,
        baseDamage,
        attackerId,
      );

      // The main focus is verifying damage source recording for target switching
      // Verify damage source was recorded
      expect(healthComponent.lastDamageFrom).toBe(attackerId);
      expect(healthComponent.lastDamageTime).toBeDefined();

      // Verify target switching logging was called
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "🎯 Target Switching: Recorded explosion damage source",
        ),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Attacker: ${attackerId}`),
      );

      // Clean up spy
      findEnemiesInRadiusSpy.mockRestore();
    });

    it("should ensure damage source recording works with current timestamp", () => {
      const attackerEntity = createEntity("attacker", null);
      const targetEntity = createEntity("target", null);

      const attackComponent = createAttackComponent(25, 100, 1000);
      const healthComponent = createHealthComponent(100);
      const positionComponent = createPositionComponent(0, 0);
      const targetComponent = createTargetComponent();

      attackerEntity.components.attack = attackComponent;
      attackerEntity.components.position = positionComponent;
      attackerEntity.components.target = targetComponent;
      targetEntity.components.health = healthComponent;

      const beforeTime = Date.now();

      attackSystem.calculateAndApplyDamage(
        attackerEntity,
        targetEntity,
        beforeTime,
      );

      const afterTime = Date.now();

      // Verify timestamp is accurate
      expect(healthComponent.lastDamageTime).toBe(beforeTime);
      expect(healthComponent.lastDamageTime).toBeGreaterThanOrEqual(beforeTime);
      expect(healthComponent.lastDamageTime).toBeLessThanOrEqual(afterTime);

      // Verify attacker ID is recorded correctly
      expect(healthComponent.lastDamageFrom).toBe(attackerEntity.id);
    });
  });

  describe("Integration with Target Switching", () => {
    it("should provide damage source information that can be used by TargetingSystem", () => {
      const attackerEntity = createEntity("attacker", null);
      const targetEntity = createEntity("target", null);

      const attackComponent = createAttackComponent(30, 100, 1000);
      const healthComponent = createHealthComponent(100);

      attackerEntity.components.attack = attackComponent;
      targetEntity.components.health = healthComponent;

      const attackTime = Date.now();

      // Simulate attack
      attackSystem.calculateAndApplyDamage(
        attackerEntity,
        targetEntity,
        attackTime,
      );

      // Verify that the health component has the information needed for target switching
      expect(healthComponent.lastDamageFrom).toBe(attackerEntity.id);
      expect(healthComponent.lastDamageTime).toBe(attackTime);

      // Simulate checking for recent damage (as TargetingSystem would do)
      const currentTime = attackTime + 500; // 500ms later
      const damageAge = currentTime - healthComponent.lastDamageTime!;

      // Should be considered recent damage (within 1000ms threshold)
      expect(damageAge).toBeLessThan(1000);
      expect(healthComponent.lastDamageFrom).toBeTruthy();
    });
  });
});
