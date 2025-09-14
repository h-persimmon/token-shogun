import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAttackComponent } from "../../components/attack-component";
import { createEnemyComponent } from "../../components/enemy-component";
import {
  createHealthComponent,
  recordDamageSource,
} from "../../components/health-component";
import { createMovementComponent } from "../../components/movement-component";
import { createPositionComponentFromPoint } from "../../components/position-component";
import { createTargetComponent } from "../../components/target-component";
import { createUnitComponent } from "../../components/unit-component";
import { createEntity } from "../../entities/entity";
import type { MovementSystem } from "../movement-system";
import { TargetingSystem } from "../targeting-system";

describe("TargetingSystem Integration", () => {
  let mockEntityManager: {
    getEntity: (id: string) => any;
    queryEntities: (query: any) => any[];
    getAllEntities: () => any[];
  };
  let movementSystem: MovementSystem;
  let targetingSystem: TargetingSystem;

  beforeEach(() => {
    const entities = new Map();

    mockEntityManager = {
      getEntity: (id: string) => entities.get(id),
      queryEntities: (query: any) => {
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
      },
      getAllEntities: () => Array.from(entities.values()),
    };

    // Create a mock movement system
    movementSystem = {
      moveEntityTo: vi.fn(),
    } as any;

    targetingSystem = new TargetingSystem(
      mockEntityManager as any,
      movementSystem,
    );

    // Helper to add entities to mock manager
    (mockEntityManager as any).addEntity = (entity: any) => {
      entities.set(entity.id, entity);
      return entity;
    };
  });

  describe("Target Switching Integration", () => {
    it("should switch enemy target when attacked by allied unit", () => {
      // Create an enemy entity with low threat threshold for easier switching
      const enemyEntity = createEntity("enemy1");
      enemyEntity.components.enemy = createEnemyComponent(
        "basic",
        Date.now(),
        "any",
        10,
        {
          enabled: true,
          cooldownMs: 2000,
          pursuitRange: 1.5,
          threatThreshold: 0.1, // Very low threshold for easy switching
        },
      );
      enemyEntity.components.target = createTargetComponent("none");
      enemyEntity.components.health = createHealthComponent(100);
      enemyEntity.components.position = createPositionComponentFromPoint({
        x: 100,
        y: 100,
      });
      enemyEntity.components.attack = createAttackComponent(20, 50);
      enemyEntity.components.movement = createMovementComponent();
      (mockEntityManager as any).addEntity(enemyEntity);

      // Create an allied unit (attacker)
      const allyEntity = createEntity("ally1");
      allyEntity.components.unit = createUnitComponent();
      allyEntity.components.position = createPositionComponentFromPoint({
        x: 110,
        y: 110,
      });
      allyEntity.components.health = createHealthComponent(80);
      allyEntity.components.attack = createAttackComponent(15, 40);
      (mockEntityManager as any).addEntity(allyEntity);

      // Create a structure (original target)
      const structureEntity = createEntity("structure1");
      structureEntity.components.structure = createStructureComponent(
        "castle",
        false,
        false,
        true,
      );
      structureEntity.components.position = createPositionComponentFromPoint({
        x: 200,
        y: 200,
      });
      structureEntity.components.health = createHealthComponent(500);
      (mockEntityManager as any).addEntity(structureEntity);

      // Set initial target for enemy (structure)
      enemyEntity.components.target.targetEntityId = structureEntity.id;
      enemyEntity.components.target.targetType = "entity";

      // Simulate damage from ally to enemy
      recordDamageSource(
        enemyEntity.components.health,
        allyEntity.id,
        Date.now(),
      );

      // Debug: Check if entity has required components
      console.log(
        "Enemy has target component:",
        "target" in enemyEntity.components,
      );
      console.log(
        "Enemy has attack component:",
        "attack" in enemyEntity.components,
      );

      // Debug: Check what entities are found by query
      const attackers = mockEntityManager.queryEntities({
        required: ["target", "attack"],
      });
      console.log("Attackers found:", attackers.length);
      console.log(
        "Attacker IDs:",
        attackers.map((e: any) => e.id),
      );

      // Update targeting system
      targetingSystem.update([]);

      // Debug: Check what happened
      console.log(
        "Enemy target after update:",
        enemyEntity.components.target.targetEntityId,
      );
      console.log(
        "Enemy original target:",
        enemyEntity.components.target.originalTargetId,
      );
      console.log(
        "Enemy switch reason:",
        enemyEntity.components.target.switchReason,
      );
      console.log(
        "Enemy health damage source:",
        enemyEntity.components.health.lastDamageFrom,
      );
      console.log(
        "Enemy health damage time:",
        enemyEntity.components.health.lastDamageTime,
      );

      // Enemy should have switched target to the attacking ally
      expect(enemyEntity.components.target.targetEntityId).toBe(allyEntity.id);
      expect(enemyEntity.components.target.originalTargetId).toBe(
        structureEntity.id,
      );
      expect(enemyEntity.components.target.switchReason).toBe("attack");
    });

    it("should not switch targets when target switching is disabled", () => {
      // Create an enemy entity with target switching disabled
      const enemyEntity = createEntity("enemy1");
      enemyEntity.components.enemy = createEnemyComponent(
        "basic",
        Date.now(),
        "any",
        10,
        {
          enabled: false,
          cooldownMs: 2000,
          pursuitRange: 1.5,
          threatThreshold: 0.5,
        },
      );
      enemyEntity.components.target = createTargetComponent("none");
      enemyEntity.components.health = createHealthComponent(100);
      enemyEntity.components.position = createPositionComponentFromPoint({
        x: 100,
        y: 100,
      });
      enemyEntity.components.attack = createAttackComponent(20, 50);
      enemyEntity.components.movement = createMovementComponent();
      (mockEntityManager as any).addEntity(enemyEntity);

      // Create an allied unit (attacker)
      const allyEntity = createEntity("ally1");
      allyEntity.components.unit = createUnitComponent();
      allyEntity.components.position = createPositionComponentFromPoint({
        x: 110,
        y: 110,
      });
      allyEntity.components.health = createHealthComponent(80);
      allyEntity.components.attack = createAttackComponent(15, 40);
      (mockEntityManager as any).addEntity(allyEntity);

      // Create a structure (original target)
      const structureEntity = createEntity("structure1");
      structureEntity.components.structure = createStructureComponent(
        "castle",
        false,
        false,
        true,
      );
      structureEntity.components.position = createPositionComponentFromPoint({
        x: 200,
        y: 200,
      });
      structureEntity.components.health = createHealthComponent(500);
      (mockEntityManager as any).addEntity(structureEntity);

      // Set initial target for enemy (structure)
      enemyEntity.components.target.targetEntityId = structureEntity.id;
      enemyEntity.components.target.targetType = "entity";

      // Simulate damage from ally to enemy
      recordDamageSource(
        enemyEntity.components.health,
        allyEntity.id,
        Date.now(),
      );

      // Update targeting system
      targetingSystem.update([]);

      // Enemy should NOT have switched target (target switching disabled)
      expect(enemyEntity.components.target.targetEntityId).toBe(
        structureEntity.id,
      );
      expect(enemyEntity.components.target.originalTargetId).toBeUndefined();
    });
  });
});

// Helper function to create structure component (simplified for testing)
function createStructureComponent(
  structureType: string,
  canDeploy: boolean = false,
  isGate: boolean = false,
  isCritical: boolean = false,
) {
  return {
    type: "structure" as const,
    structureType,
    canDeployUnit: canDeploy,
    deployedUnitId: undefined,
    isGate,
    isCriticalForLose: isCritical,
  };
}
