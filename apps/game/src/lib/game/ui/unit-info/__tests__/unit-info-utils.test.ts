// ユニット情報ユーティリティ関数のテスト

import { describe, test, expect } from "vitest";
import { createAttackComponent } from "../../../components/attack-component";
import { createEnemyComponent } from "../../../components/enemy-component";
import { createHealthComponent } from "../../../components/health-component";
import { createStructureComponent } from "../../../components/structure-component";
import { createUnitComponent } from "../../../components/unit-component";
import type { Entity } from "../../../entities/entity";
import {
  calculateHealthPercentage,
  canUnitAttack,
  determineUnitType,
  extractUnitInfo,
  generateUnitDisplayName,
  getHealthStatus,
} from "../unit-info-utils";

// テスト用のエンティティ作成ヘルパー
function createTestEntity(id: string): Entity {
  return {
    id,
    components: {},
    sprite: null,
  };
}

describe("unit-info-utils", () => {
  describe("determineUnitType", () => {
    test("構造物コンポーネントがある場合はstructureを返す", () => {
      const entity = createTestEntity("test-1");
      entity.components.structure = createStructureComponent(
        true,
        "auto",
        "cannon",
      );

      expect(determineUnitType(entity)).toBe("structure");
    });

    test("敵コンポーネントがある場合はenemyを返す", () => {
      const entity = createTestEntity("test-2");
      entity.components.enemy = createEnemyComponent(
        "basic",
        Date.now(),
        "gate",
        10,
      );

      expect(determineUnitType(entity)).toBe("enemy");
    });

    test("ユニットコンポーネントがある場合はallyを返す", () => {
      const entity = createTestEntity("test-3");
      entity.components.unit = createUnitComponent("soldier");

      expect(determineUnitType(entity)).toBe("ally");
    });

    test("特定のコンポーネントがない場合はallyを返す", () => {
      const entity = createTestEntity("test-4");

      expect(determineUnitType(entity)).toBe("ally");
    });
  });

  describe("extractUnitInfo", () => {
    test("味方ユニットの情報を正しく抽出する", () => {
      const entity = createTestEntity("ally-1");
      entity.components.unit = createUnitComponent("archer");
      entity.components.health = createHealthComponent(100);
      entity.components.attack = createAttackComponent(30, 150, 1.2, "homing");

      const info = extractUnitInfo(entity);

      expect(info).toEqual({
        entityId: "ally-1",
        unitType: "ally",
        health: { current: 100, max: 100 },
        attack: { damage: 30, range: 150, attackType: "homing" },
        unitClass: "archer",
      });
    });

    test("敵ユニットの情報を正しく抽出する", () => {
      const entity = createTestEntity("enemy-1");
      entity.components.enemy = createEnemyComponent(
        "heavy",
        Date.now(),
        "defense",
        20,
      );
      entity.components.health = createHealthComponent(200);
      entity.components.attack = createAttackComponent(50, 80, 2.0, "direct");

      const info = extractUnitInfo(entity);

      expect(info).toEqual({
        entityId: "enemy-1",
        unitType: "enemy",
        health: { current: 200, max: 200 },
        attack: { damage: 50, range: 80, attackType: "direct" },
        enemyType: "heavy",
      });
    });

    test("構造物の情報を正しく抽出する", () => {
      const entity = createTestEntity("structure-1");
      entity.components.structure = createStructureComponent(
        false,
        "with-unit",
        "tower",
      );
      entity.components.health = createHealthComponent(500);

      const info = extractUnitInfo(entity);

      expect(info).toEqual({
        entityId: "structure-1",
        unitType: "structure",
        health: { current: 500, max: 500 },
        attack: undefined,
        structureType: "tower",
      });
    });

    test("体力コンポーネントがない場合はデフォルト値を使用する", () => {
      const entity = createTestEntity("no-health");
      entity.components.unit = createUnitComponent("soldier");

      const info = extractUnitInfo(entity);

      expect(info.health).toEqual({ current: 0, max: 0 });
    });
  });

  describe("canUnitAttack", () => {
    test("攻撃コンポーネントがある場合はtrueを返す", () => {
      const entity = createTestEntity("attacker");
      entity.components.attack = createAttackComponent(25, 100);

      expect(canUnitAttack(entity)).toBe(true);
    });

    test("攻撃コンポーネントがない場合はfalseを返す", () => {
      const entity = createTestEntity("non-attacker");

      expect(canUnitAttack(entity)).toBe(false);
    });
  });

  describe("generateUnitDisplayName", () => {
    test("敵ユニットの表示名を生成する", () => {
      const unitInfo = {
        entityId: "enemy-1",
        unitType: "enemy" as const,
        health: { current: 100, max: 100 },
        enemyType: "fast",
      };

      expect(generateUnitDisplayName(unitInfo)).toBe("敵: fast");
    });

    test("構造物の表示名を生成する", () => {
      const unitInfo = {
        entityId: "structure-1",
        unitType: "structure" as const,
        health: { current: 500, max: 500 },
        structureType: "gate",
      };

      expect(generateUnitDisplayName(unitInfo)).toBe("構造物: gate");
    });

    test("味方ユニットの表示名を生成する", () => {
      const unitInfo = {
        entityId: "ally-1",
        unitType: "ally" as const,
        health: { current: 80, max: 100 },
        unitClass: "mage",
      };

      expect(generateUnitDisplayName(unitInfo)).toBe("味方: mage");
    });

    test("種別情報がない場合はデフォルト名を使用する", () => {
      const unitInfo = {
        entityId: "unknown-1",
        unitType: "enemy" as const,
        health: { current: 50, max: 100 },
      };

      expect(generateUnitDisplayName(unitInfo)).toBe("敵ユニット");
    });
  });

  describe("calculateHealthPercentage", () => {
    test("正常な体力割合を計算する", () => {
      expect(calculateHealthPercentage({ current: 75, max: 100 })).toBe(0.75);
      expect(calculateHealthPercentage({ current: 50, max: 200 })).toBe(0.25);
      expect(calculateHealthPercentage({ current: 100, max: 100 })).toBe(1.0);
    });

    test("最大体力が0の場合は0を返す", () => {
      expect(calculateHealthPercentage({ current: 0, max: 0 })).toBe(0);
    });

    test("現在体力が負の値の場合は0を返す", () => {
      expect(calculateHealthPercentage({ current: -10, max: 100 })).toBe(0);
    });

    test("現在体力が最大体力を超える場合は1を返す", () => {
      expect(calculateHealthPercentage({ current: 150, max: 100 })).toBe(1);
    });
  });

  describe("getHealthStatus", () => {
    test("体力状態を正しく判定する", () => {
      expect(getHealthStatus({ current: 0, max: 100 })).toBe("死亡");
      expect(getHealthStatus({ current: 20, max: 100 })).toBe("重傷");
      expect(getHealthStatus({ current: 40, max: 100 })).toBe("中傷");
      expect(getHealthStatus({ current: 60, max: 100 })).toBe("軽傷");
      expect(getHealthStatus({ current: 80, max: 100 })).toBe("健康");
      expect(getHealthStatus({ current: 100, max: 100 })).toBe("健康");
    });
  });
});
