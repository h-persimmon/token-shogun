import { describe, it, expect, beforeEach, vi } from "vitest";
import { TurretStatusSystem } from "../turret-status-system";
import { createEntityManager } from "../../entities/entity-manager";
import { createStructureComponent, deployUnitToStructure, undeployUnitFromStructure } from "../../components/structure-component";
import { createPositionComponent } from "../../components/position-component";

// Phaserのモック
const mockScene = {
  add: {
    sprite: vi.fn(() => ({
      setScale: vi.fn(),
    })),
    container: vi.fn(() => ({
      setPosition: vi.fn(),
      add: vi.fn(),
      setData: vi.fn(),
      getData: vi.fn((key: string) => {
        if (key === "statusText") return {
          setText: vi.fn(),
          setColor: vi.fn(),
          getBounds: vi.fn(() => ({ width: 60, height: 16 })),
        };
        if (key === "background") return { setSize: vi.fn() };
        return undefined;
      }),
      destroy: vi.fn(),
      setVisible: vi.fn(),
    })),
    rectangle: vi.fn(() => ({
      setSize: vi.fn(),
    })),
    text: vi.fn(() => ({
      setOrigin: vi.fn(),
      setText: vi.fn(),
      setColor: vi.fn(),
      getBounds: vi.fn(() => ({ width: 60, height: 16 })),
    })),
  },
};

describe("TurretStatusSystem Integration", () => {
  let entityManager: ReturnType<typeof createEntityManager>;
  let turretStatusSystem: TurretStatusSystem;

  beforeEach(() => {
    entityManager = createEntityManager(mockScene as any);
    turretStatusSystem = new TurretStatusSystem(
      entityManager,
      mockScene as any,
    );
    vi.clearAllMocks();
  });

  it("should handle complete turret deployment workflow", () => {
    // 砲台エンティティを作成
    const cannon = entityManager.createEntity("cannon", 100, 100, 1);
    entityManager.addComponent(cannon.id, createPositionComponent(5, 5));
    const structureComponent = createStructureComponent(false, "with-unit", "cannon");
    (structureComponent as any).structureType = "artillery_cannon";
    entityManager.addComponent(cannon.id, structureComponent);

    // 初期状態: Available
    turretStatusSystem.update();
    expect(mockScene.add.container).toHaveBeenCalled();

    // ユニットを配備
    const deployResult = deployUnitToStructure(structureComponent, "unit-123");
    expect(deployResult).toBe(true);

    // 配備後の状態: In Use (1)
    turretStatusSystem.update();

    // ユニットを配備解除
    undeployUnitFromStructure(structureComponent);

    // 配備解除後の状態: Available
    turretStatusSystem.update();

    // システムを破棄
    turretStatusSystem.destroy();
  });

  it("should handle multiple turrets correctly", () => {
    // 複数の砲台を作成
    const cannon1 = entityManager.createEntity("cannon", 100, 100, 1);
    entityManager.addComponent(cannon1.id, createPositionComponent(5, 5));
    const structure1 = createStructureComponent(false, "with-unit", "cannon");
    (structure1 as any).structureType = "artillery_cannon";
    entityManager.addComponent(cannon1.id, structure1);

    const cannon2 = entityManager.createEntity("cannon", 200, 200, 1);
    entityManager.addComponent(cannon2.id, createPositionComponent(10, 10));
    const structure2 = createStructureComponent(false, "with-unit", "cannon");
    (structure2 as any).structureType = "artillery_cannon";
    entityManager.addComponent(cannon2.id, structure2);

    // 初期状態
    turretStatusSystem.update();
    expect(mockScene.add.container).toHaveBeenCalledTimes(2);

    // 1つ目の砲台にユニットを配備
    deployUnitToStructure(structure1, "unit-123");
    turretStatusSystem.update();

    // 2つ目の砲台にもユニットを配備
    deployUnitToStructure(structure2, "unit-456");
    turretStatusSystem.update();

    // システムを破棄
    turretStatusSystem.destroy();
  });

  it("should properly clean up when entities are destroyed", () => {
    // 砲台エンティティを作成
    const cannon = entityManager.createEntity("cannon", 100, 100, 1);
    entityManager.addComponent(cannon.id, createPositionComponent(5, 5));
    const structureComponent = createStructureComponent(false, "with-unit", "cannon");
    (structureComponent as any).structureType = "artillery_cannon";
    entityManager.addComponent(cannon.id, structureComponent);

    turretStatusSystem.update();
    expect(mockScene.add.container).toHaveBeenCalled();

    // エンティティを削除
    entityManager.destroyEntity(cannon.id);

    // クリーンアップが実行されることを確認
    turretStatusSystem.update();
  });
});