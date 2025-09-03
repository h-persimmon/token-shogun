import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createEnemyComponent,
  createEnemyWithConfig,
  ENEMY_CONFIGS,
  enemyComponentTag,
  getEnemyAge,
  getEnemyConfig,
  getEnemyReward,
  isEnemyComponent,
  isEnemyType,
} from "../enemy-component";
import { createPositionComponent } from "../position-component";

describe("EnemyComponent", () => {
  const mockTime = 1000000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockTime);
  });

  describe("createEnemyComponent", () => {
    it("should create a basic enemy component with default spawn time", () => {
      const enemy = createEnemyComponent("basic");

      expect(enemy.type).toBe(enemyComponentTag);
      expect(enemy.enemyType).toBe("basic");
      expect(enemy.spawnTime).toBe(mockTime);
      expect(enemy.rewardValue).toBe(ENEMY_CONFIGS.basic.rewardValue);
    });

    it("should create an enemy component with specified spawn time", () => {
      const customSpawnTime = 500000;
      const enemy = createEnemyComponent("fast", customSpawnTime);

      expect(enemy.enemyType).toBe("fast");
      expect(enemy.spawnTime).toBe(customSpawnTime);
      expect(enemy.rewardValue).toBe(ENEMY_CONFIGS.fast.rewardValue);
    });

    it("should create heavy enemy with correct reward value", () => {
      const enemy = createEnemyComponent("heavy");

      expect(enemy.enemyType).toBe("heavy");
      expect(enemy.rewardValue).toBe(ENEMY_CONFIGS.heavy.rewardValue);
    });
  });

  describe("isEnemyComponent", () => {
    it("should return true for enemy component", () => {
      const enemy = createEnemyComponent("basic");
      expect(isEnemyComponent(enemy)).toBe(true);
    });

    it("should return false for non-enemy component", () => {
      const position = createPositionComponent(0, 0);
      expect(isEnemyComponent(position)).toBe(false);
    });
  });

  describe("getEnemyConfig", () => {
    it("should return correct config for each enemy type", () => {
      expect(getEnemyConfig("basic")).toEqual(ENEMY_CONFIGS.basic);
      expect(getEnemyConfig("fast")).toEqual(ENEMY_CONFIGS.fast);
      expect(getEnemyConfig("heavy")).toEqual(ENEMY_CONFIGS.heavy);
    });
  });

  describe("getEnemyAge", () => {
    it("should calculate enemy age correctly with default current time", () => {
      const spawnTime = mockTime - 5000;
      const enemy = createEnemyComponent("basic", spawnTime);

      const age = getEnemyAge(enemy);
      expect(age).toBe(5000);
    });

    it("should calculate enemy age correctly with specified current time", () => {
      const spawnTime = 1000;
      const currentTime = 6000;
      const enemy = createEnemyComponent("basic", spawnTime);

      const age = getEnemyAge(enemy, currentTime);
      expect(age).toBe(5000);
    });

    it("should return 0 for negative age", () => {
      const futureSpawnTime = mockTime + 5000;
      const enemy = createEnemyComponent("basic", futureSpawnTime);

      const age = getEnemyAge(enemy);
      expect(age).toBe(0);
    });
  });

  describe("isEnemyType", () => {
    it("should return true for matching enemy type", () => {
      const enemy = createEnemyComponent("fast");
      expect(isEnemyType(enemy, "fast")).toBe(true);
    });

    it("should return false for non-matching enemy type", () => {
      const enemy = createEnemyComponent("basic");
      expect(isEnemyType(enemy, "heavy")).toBe(false);
    });
  });

  describe("getEnemyReward", () => {
    it("should return correct reward value", () => {
      const basicEnemy = createEnemyComponent("basic");
      const fastEnemy = createEnemyComponent("fast");
      const heavyEnemy = createEnemyComponent("heavy");

      expect(getEnemyReward(basicEnemy)).toBe(10);
      expect(getEnemyReward(fastEnemy)).toBe(15);
      expect(getEnemyReward(heavyEnemy)).toBe(25);
    });
  });

  describe("createEnemyWithConfig", () => {
    it("should create enemy component with config", () => {
      const result = createEnemyWithConfig("basic");

      expect(result.enemy.enemyType).toBe("basic");
      expect(result.config).toEqual(ENEMY_CONFIGS.basic);
    });

    it("should create enemy with custom spawn time", () => {
      const customSpawnTime = 123456;
      const result = createEnemyWithConfig("heavy", customSpawnTime);

      expect(result.enemy.spawnTime).toBe(customSpawnTime);
      expect(result.config).toEqual(ENEMY_CONFIGS.heavy);
    });

    it("should create different enemy types correctly", () => {
      const basicResult = createEnemyWithConfig("basic");
      const fastResult = createEnemyWithConfig("fast");
      const heavyResult = createEnemyWithConfig("heavy");

      expect(basicResult.enemy.enemyType).toBe("basic");

      expect(fastResult.enemy.enemyType).toBe("fast");

      expect(heavyResult.enemy.enemyType).toBe("heavy");
    });
  });
});
