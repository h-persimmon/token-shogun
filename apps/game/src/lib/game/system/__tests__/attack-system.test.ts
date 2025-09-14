import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAttackComponent } from "../../components/attack-component";
import { createHealthComponent } from "../../components/health-component";
import { createPositionComponent } from "../../components/position-component";
import {
  createTargetComponent,
  setEntityTarget,
} from "../../components/target-component";
import { createEntity } from "../../entities/entity";
import { AttackSystem } from "../attack-system";

// EntityManagerのモック
const createMockEntityManager = () => {
  const entities = new Map();

  return {
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
        entity.components.set(component.type, component);
      }
    }),
    queryEntities: vi.fn((query: any) => {
      const result = [];
      for (const entity of entities.values()) {
        const hasRequired =
          query.required?.every((type: string) =>
            entity.components.has(type),
          ) ?? true;

        if (hasRequired) {
          result.push(entity);
        }
      }
      return result;
    }),
  };
};

// GameStateSystemのモック
const createMockGameStateSystem = () => ({
  notifyEnemyDefeated: vi.fn(),
  notifyStructureDamaged: vi.fn(),
});

describe("AttackSystem", () => {
  let attackSystem: AttackSystem;
  let mockEntityManager: ReturnType<typeof createMockEntityManager>;
  let mockGameStateSystem: ReturnType<typeof createMockGameStateSystem>;

  beforeEach(() => {
    mockEntityManager = createMockEntityManager();
    mockGameStateSystem = createMockGameStateSystem();
    attackSystem = new AttackSystem(mockEntityManager as any, 10);
    attackSystem.setGameStateSystem(mockGameStateSystem);
  });

  describe("constructor", () => {
    it("should create AttackSystem with default projectile pool size", () => {
      const system = new AttackSystem(mockEntityManager as any);
      expect(system).toBeInstanceOf(AttackSystem);
    });

    it("should create AttackSystem with custom projectile pool size", () => {
      const system = new AttackSystem(mockEntityManager as any, 50);
      expect(system).toBeInstanceOf(AttackSystem);
    });
  });

  describe("setGameStateSystem", () => {
    it("should set GameStateSystem reference", () => {
      const newGameStateSystem = createMockGameStateSystem();
      attackSystem.setGameStateSystem(newGameStateSystem);

      // GameStateSystemが設定されていることを間接的に確認
      expect(() =>
        attackSystem.setGameStateSystem(newGameStateSystem),
      ).not.toThrow();
    });
  });

  describe("canAttackTarget", () => {
    it("should return true for alive target", () => {
      const targetEntity = createEntity("target", null);
      const healthComponent = createHealthComponent(100);
      targetEntity.components.set("health", healthComponent);

      const result = attackSystem.canAttackTarget(targetEntity);
      expect(result).toBe(true);
    });

    it("should return false for dead target", () => {
      const targetEntity = createEntity("target", null);
      const healthComponent = createHealthComponent(100);
      healthComponent.currentHealth = 0;
      healthComponent.isDead = true;
      targetEntity.components.set("health", healthComponent);

      const result = attackSystem.canAttackTarget(targetEntity);
      expect(result).toBe(false);
    });

    it("should return false for target without health component", () => {
      const targetEntity = createEntity("target", null);

      const result = attackSystem.canAttackTarget(targetEntity);
      expect(result).toBe(false);
    });
  });

  describe("calculateAndApplyDamage", () => {
    it("should calculate and apply damage correctly", () => {
      const attackerEntity = createEntity("attacker", null);
      const attackComponent = createAttackComponent(50, 200);
      attackerEntity.components.set("attack", attackComponent);

      const targetEntity = createEntity("target", null);
      const healthComponent = createHealthComponent(100);
      targetEntity.components.set("health", healthComponent);

      const damageDealt = attackSystem.calculateAndApplyDamage(
        attackerEntity,
        targetEntity,
      );

      expect(damageDealt).toBe(50);
      expect(healthComponent.currentHealth).toBe(50);
      expect(healthComponent.isDead).toBe(false);
    });

    it("should not deal more damage than current health", () => {
      const attackerEntity = createEntity("attacker", null);
      const attackComponent = createAttackComponent(150, 200);
      attackerEntity.components.set("attack", attackComponent);

      const targetEntity = createEntity("target", null);
      const healthComponent = createHealthComponent(100);
      targetEntity.components.set("health", healthComponent);

      const damageDealt = attackSystem.calculateAndApplyDamage(
        attackerEntity,
        targetEntity,
      );

      expect(damageDealt).toBe(100);
      expect(healthComponent.currentHealth).toBe(0);
      expect(healthComponent.isDead).toBe(true);
    });

    it("should return 0 damage if attacker has no attack component", () => {
      const attackerEntity = createEntity("attacker", null);
      const targetEntity = createEntity("target", null);
      const healthComponent = createHealthComponent(100);
      targetEntity.components.set("health", healthComponent);

      const damageDealt = attackSystem.calculateAndApplyDamage(
        attackerEntity,
        targetEntity,
      );

      expect(damageDealt).toBe(0);
      expect(healthComponent.currentHealth).toBe(100);
    });
  });

  describe("applyDamage", () => {
    it("should apply damage to target entity", () => {
      const targetEntity = createEntity("target", null);
      const healthComponent = createHealthComponent(100);
      targetEntity.components.set("health", healthComponent);

      attackSystem.applyDamage(targetEntity, 30);

      expect(healthComponent.currentHealth).toBe(70);
      expect(healthComponent.isDead).toBe(false);
    });

    it("should mark entity as dead when health reaches zero", () => {
      const targetEntity = createEntity("target", null);
      const healthComponent = createHealthComponent(50);
      targetEntity.components.set("health", healthComponent);

      attackSystem.applyDamage(targetEntity, 50);

      expect(healthComponent.currentHealth).toBe(0);
      expect(healthComponent.isDead).toBe(true);
    });

    it("should notify GameStateSystem when enemy is defeated", () => {
      const targetEntity = createEntity("target", null);
      const healthComponent = createHealthComponent(50);
      const enemyComponent = {
        type: "enemy" as const,
        enemyType: "basic" as const,
        spawnTime: 0,
        rewardValue: 10,
        structureTargetPriority: "any" as const,
      };
      targetEntity.components.set("health", healthComponent);
      targetEntity.components.set("enemy", enemyComponent);

      attackSystem.applyDamage(targetEntity, 50);

      expect(mockGameStateSystem.notifyEnemyDefeated).toHaveBeenCalledWith(
        targetEntity.id,
        10,
      );
    });

    it("should notify GameStateSystem when gate structure is damaged", () => {
      const targetEntity = createEntity("target", null);
      const healthComponent = createHealthComponent(100);
      const structureComponent = {
        type: "structure",
        structureType: "gate",
        isCriticalForLose: true,
        attackableType: "none",
        maxUnits: 0,
      } as const;
      targetEntity.components.set("health", healthComponent);
      targetEntity.components.set("structure", structureComponent);

      attackSystem.applyDamage(targetEntity, 30);

      expect(mockGameStateSystem.notifyStructureDamaged).toHaveBeenCalledWith(
        targetEntity.id,
        30,
      );
    });
  });

  describe("executeAttack", () => {
    it("should execute direct attack successfully", () => {
      const attackerEntity = createEntity("attacker", null);
      const attackComponent = createAttackComponent(50, 200, 1.0, "direct");
      attackerEntity.components.set("attack", attackComponent);

      const targetEntity = createEntity("target", null);
      const healthComponent = createHealthComponent(100);
      targetEntity.components.set("health", healthComponent);

      const currentTime = 1000;
      const result = attackSystem.executeAttack(
        attackerEntity,
        targetEntity,
        currentTime,
      );

      expect(result.success).toBe(true);
      expect(result.damageDealt).toBe(50);
      expect(result.targetDestroyed).toBe(false);
      expect(result.targetId).toBe(targetEntity.id);
      expect(attackComponent.lastAttackTime).toBe(currentTime);
      expect(attackComponent.target).toBe(targetEntity.id);
    });

    it("should execute projectile attack successfully", () => {
      const attackerEntity = createEntity("attacker", null);
      const attackComponent = createAttackComponent(
        50,
        200,
        1.0,
        "homing",
        300,
      );
      const positionComponent = createPositionComponent(5, 5);
      attackerEntity.components.set("attack", attackComponent);
      attackerEntity.components.set("position", positionComponent);

      const targetEntity = createEntity("target", null);
      const healthComponent = createHealthComponent(100);
      const targetPosition = createPositionComponent(10, 10);
      targetEntity.components.set("health", healthComponent);
      targetEntity.components.set("position", targetPosition);

      const currentTime = 1000;
      const result = attackSystem.executeAttack(
        attackerEntity,
        targetEntity,
        currentTime,
      );

      expect(result.success).toBe(true);
      expect(result.damageDealt).toBe(0); // 弾丸攻撃では着弾時にダメージ
      expect(result.targetDestroyed).toBe(false);
      expect(attackComponent.lastAttackTime).toBe(currentTime);
    });

    it("should return failure when attacker has no attack component", () => {
      const attackerEntity = createEntity("attacker", null);
      const targetEntity = createEntity("target", null);
      const healthComponent = createHealthComponent(100);
      targetEntity.components.set("health", healthComponent);

      const result = attackSystem.executeAttack(
        attackerEntity,
        targetEntity,
        1000,
      );

      expect(result.success).toBe(false);
      expect(result.damageDealt).toBe(0);
    });

    it("should return failure when target has no health component", () => {
      const attackerEntity = createEntity("attacker", null);
      const attackComponent = createAttackComponent(50, 200);
      attackerEntity.components.set("attack", attackComponent);

      const targetEntity = createEntity("target", null);

      const result = attackSystem.executeAttack(
        attackerEntity,
        targetEntity,
        1000,
      );

      expect(result.success).toBe(false);
      expect(result.damageDealt).toBe(0);
    });
  });

  describe("isEntityAttacking", () => {
    it("should return true when entity is attacking", () => {
      const attackerEntity = createEntity("attacker", null);
      const attackComponent = createAttackComponent(50, 200);
      const targetComponent = createTargetComponent("entity", 5);
      setEntityTarget(targetComponent, "target-id");
      attackComponent.target = "target-id";

      attackerEntity.components.set("attack", attackComponent);
      attackerEntity.components.set("target", targetComponent);
      mockEntityManager.entities.set(attackerEntity.id, attackerEntity);

      const result = attackSystem.isEntityAttacking(attackerEntity.id);
      expect(result).toBe(true);
    });

    it("should return false when entity is not attacking", () => {
      const attackerEntity = createEntity("attacker", null);
      const attackComponent = createAttackComponent(50, 200);
      const targetComponent = createTargetComponent("none", 5);

      attackerEntity.components.set("attack", attackComponent);
      attackerEntity.components.set("target", targetComponent);
      mockEntityManager.entities.set(attackerEntity.id, attackerEntity);

      const result = attackSystem.isEntityAttacking(attackerEntity.id);
      expect(result).toBe(false);
    });

    it("should return false when entity does not exist", () => {
      const result = attackSystem.isEntityAttacking("non-existent");
      expect(result).toBe(false);
    });
  });

  describe("stopAttack", () => {
    it("should stop attack successfully", () => {
      const attackerEntity = createEntity("attacker", null);
      const attackComponent = createAttackComponent(50, 200);
      attackComponent.target = "target-id";
      attackerEntity.components.set("attack", attackComponent);
      mockEntityManager.entities.set(attackerEntity.id, attackerEntity);

      const result = attackSystem.stopAttack(attackerEntity.id);

      expect(result).toBe(true);
      expect(attackComponent.target).toBeUndefined();
    });

    it("should return false when entity does not exist", () => {
      const result = attackSystem.stopAttack("non-existent");
      expect(result).toBe(false);
    });

    it("should return false when entity has no attack component", () => {
      const attackerEntity = createEntity("attacker", null);
      mockEntityManager.entities.set(attackerEntity.id, attackerEntity);

      const result = attackSystem.stopAttack(attackerEntity.id);
      expect(result).toBe(false);
    });
  });

  describe("update", () => {
    it("should process attacking entities", () => {
      const attackerEntity = createEntity("attacker", null);
      const attackComponent = createAttackComponent(50, 200, 0.5, "direct");
      const positionComponent = createPositionComponent(5, 5);
      const targetComponent = createTargetComponent("entity", 5);
      setEntityTarget(targetComponent, "target-id");

      attackerEntity.components.set("attack", attackComponent);
      attackerEntity.components.set("position", positionComponent);
      attackerEntity.components.set("target", targetComponent);

      const targetEntity = createEntity("target-id", null);
      const targetHealth = createHealthComponent(100);
      const targetPosition = createPositionComponent(6, 6); // 範囲内
      targetEntity.components.set("health", targetHealth);
      targetEntity.components.set("position", targetPosition);

      mockEntityManager.entities.set(attackerEntity.id, attackerEntity);
      mockEntityManager.entities.set("target-id", targetEntity);

      // queryEntitiesが攻撃者を返すように設定
      mockEntityManager.queryEntities.mockReturnValue([attackerEntity]);

      const currentTime = 1000;
      attackSystem.update(currentTime);

      // 攻撃が実行されたことを確認
      expect(attackComponent.lastAttackTime).toBe(currentTime);
      expect(targetHealth.currentHealth).toBe(50);
    });

    it("should not attack when on cooldown", () => {
      const attackerEntity = createEntity("attacker", null);
      const attackComponent = createAttackComponent(50, 200, 1.0, "direct");
      attackComponent.lastAttackTime = 500; // 最近攻撃した
      const positionComponent = createPositionComponent(5, 5);
      const targetComponent = createTargetComponent("entity", 5);
      setEntityTarget(targetComponent, "target-id");

      attackerEntity.components.set("attack", attackComponent);
      attackerEntity.components.set("position", positionComponent);
      attackerEntity.components.set("target", targetComponent);

      const targetEntity = createEntity("target-id", null);
      const targetHealth = createHealthComponent(100);
      const targetPosition = createPositionComponent(6, 6);
      targetEntity.components.set("health", targetHealth);
      targetEntity.components.set("position", targetPosition);

      mockEntityManager.entities.set(attackerEntity.id, attackerEntity);
      mockEntityManager.entities.set("target-id", targetEntity);
      mockEntityManager.queryEntities.mockReturnValue([attackerEntity]);

      const currentTime = 1000; // クールダウン中
      attackSystem.update(currentTime);

      // 攻撃が実行されていないことを確認
      expect(attackComponent.lastAttackTime).toBe(500);
      expect(targetHealth.currentHealth).toBe(100);
    });
  });

  describe("attack history recording", () => {
    it("should record damage source and timestamp for direct attacks", () => {
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

      setEntityTarget(targetComponent, targetEntity.id);

      const currentTime = 1000;

      const damageDealt = attackSystem.calculateAndApplyDamage(
        attackerEntity,
        targetEntity,
        currentTime,
      );

      expect(damageDealt).toBe(50);
      expect(healthComponent.lastDamageTime).toBe(currentTime);
      expect(healthComponent.lastDamageFrom).toBe(attackerEntity.id);
      expect(healthComponent.currentHealth).toBe(50);
    });

    it("should record damage source and timestamp for projectile attacks", () => {
      // このテストは弾丸攻撃の着弾時の攻撃履歴記録をテストします
      // 実際の弾丸システムは複雑なので、applyHomingProjectileHitメソッドを直接テストします
      const targetEntity = createEntity("target", null);
      const healthComponent = createHealthComponent(100);
      targetEntity.components.health = healthComponent;

      // ProjectileComponentのモック
      const projectileComponent = {
        type: "projectile",
        attackerId: "attacker_123",
        damage: 30,
        speed: 200,
        attackType: "homing" as const,
      };

      // プライベートメソッドをテストするため、anyキャストを使用
      (attackSystem as any).applyHomingProjectileHit(
        targetEntity,
        projectileComponent,
      );

      expect(healthComponent.currentHealth).toBe(70);
      expect(healthComponent.lastDamageFrom).toBe("attacker_123");
      expect(healthComponent.lastDamageTime).toBeDefined();
      expect(typeof healthComponent.lastDamageTime).toBe("number");
    });

    it("should record damage source and timestamp for explosion attacks", () => {
      // 爆発攻撃のテスト用にエンティティを準備
      const enemyEntity = createEntity("enemy", null);
      const healthComponent = createHealthComponent(100);
      const positionComponent = createPositionComponent(10, 10);
      const enemyComponent = { type: "enemy", enemyType: "basic" };

      enemyEntity.components.health = healthComponent;
      enemyEntity.components.position = positionComponent;
      enemyEntity.components.enemy = enemyComponent;

      // 爆発中心と同じ位置に敵を配置（距離0で最大ダメージ）
      const explosionCenter = { x: 10, y: 10 };
      positionComponent.point = { x: 10, y: 10 }; // 同じ位置に設定

      // findEnemiesInRadiusメソッドをモックして、作成したエンティティを返すようにする
      const findEnemiesInRadiusSpy = vi.spyOn(
        attackSystem as any,
        "findEnemiesInRadius",
      );
      findEnemiesInRadiusSpy.mockReturnValue([enemyEntity]);

      const explosionRadius = 50;
      const baseDamage = 40;
      const attackerId = "artillery_attacker";

      // プライベートメソッドをテストするため、anyキャストを使用
      (attackSystem as any).applyExplosionDamage(
        explosionCenter,
        explosionRadius,
        baseDamage,
        attackerId,
      );

      expect(healthComponent.currentHealth).toBe(60); // 100 - 40 = 60
      expect(healthComponent.lastDamageFrom).toBe(attackerId);
      expect(healthComponent.lastDamageTime).toBeDefined();
      expect(typeof healthComponent.lastDamageTime).toBe("number");

      // スパイをリストア
      findEnemiesInRadiusSpy.mockRestore();
    });

    it("should ensure timestamp is current time", () => {
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

      setEntityTarget(targetComponent, targetEntity.id);

      const beforeTime = Date.now();

      attackSystem.calculateAndApplyDamage(
        attackerEntity,
        targetEntity,
        beforeTime,
      );

      const afterTime = Date.now();

      expect(healthComponent.lastDamageTime).toBe(beforeTime);
      expect(healthComponent.lastDamageTime).toBeGreaterThanOrEqual(beforeTime);
      expect(healthComponent.lastDamageTime).toBeLessThanOrEqual(afterTime);
    });
  });
});
