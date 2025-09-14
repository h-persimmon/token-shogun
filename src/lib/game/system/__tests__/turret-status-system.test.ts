import { describe, it, expect, beforeEach, vi } from "vitest";
import { TurretStatusSystem } from "../turret-status-system";
import { createEntityManager } from "../../entities/entity-manager";
import { createStructureComponent } from "../../components/structure-component";
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
      getData: vi.fn(),
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

describe("TurretStatusSystem", () => {
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

  describe("update", () => {
    it("should create status text for cannon structures with with-unit type", () => {
      // 砲台エンティティを作成
      const cannon = entityManager.createEntity("cannon", 100, 100, 1);
      entityManager.addComponent(cannon.id, createPositionComponent(5, 5));
      entityManager.addComponent(
        cannon.id,
        createStructureComponent(false, "with-unit", "cannon"),
      );

      turretStatusSystem.update();

      expect(mockScene.add.container).toHaveBeenCalled();
    });

    it("should not create status text for non-cannon structures", () => {
      // 門エンティティを作成
      const gate = entityManager.createEntity("gate", 100, 100, 1);
      entityManager.addComponent(gate.id, createPositionComponent(5, 5));
      entityManager.addComponent(
        gate.id,
        createStructureComponent(true, "none", "gate"),
      );

      turretStatusSystem.update();

      expect(mockScene.add.container).not.toHaveBeenCalled();
    });

    it("should not create status text for cannon with auto attack type", () => {
      // 自動砲台エンティティを作成
      const autoCannon = entityManager.createEntity("cannon", 100, 100, 1);
      entityManager.addComponent(autoCannon.id, createPositionComponent(5, 5));
      entityManager.addComponent(
        autoCannon.id,
        createStructureComponent(false, "auto", "cannon"),
      );

      turretStatusSystem.update();

      expect(mockScene.add.container).not.toHaveBeenCalled();
    });

    it("should update status text content based on deployment status", () => {
      const mockStatusText = {
        setText: vi.fn(),
        setColor: vi.fn(),
        getBounds: vi.fn(() => ({ width: 60, height: 16 })),
      };

      const mockContainer = {
        setPosition: vi.fn(),
        add: vi.fn(),
        setData: vi.fn(),
        getData: vi.fn((key: string) => {
          if (key === "statusText") return mockStatusText;
          if (key === "background") return { setSize: vi.fn() };
          return undefined;
        }),
        destroy: vi.fn(),
        setVisible: vi.fn(),
      };

      mockScene.add.container.mockReturnValue(mockContainer);

      // 砲台エンティティを作成
      const cannon = entityManager.createEntity("cannon", 100, 100, 1);
      entityManager.addComponent(cannon.id, createPositionComponent(5, 5));
      const structureComponent = createStructureComponent(false, "with-unit", "cannon");
      entityManager.addComponent(cannon.id, structureComponent);

      // 最初の更新（Available状態）
      turretStatusSystem.update();

      expect(mockStatusText.setText).toHaveBeenCalledWith("Available");

      // ユニットを配備
      structureComponent.deployedUnitId = "unit-123";

      // 2回目の更新（In Use状態）
      turretStatusSystem.update();

      expect(mockStatusText.setText).toHaveBeenCalledWith("In Use (1)");
    });
  });

  describe("destroy", () => {
    it("should destroy all status texts", () => {
      const mockContainer = {
        setPosition: vi.fn(),
        add: vi.fn(),
        setData: vi.fn(),
        getData: vi.fn(),
        destroy: vi.fn(),
        setVisible: vi.fn(),
      };

      mockScene.add.container.mockReturnValue(mockContainer);

      // 砲台エンティティを作成
      const cannon = entityManager.createEntity("cannon", 100, 100, 1);
      entityManager.addComponent(cannon.id, createPositionComponent(5, 5));
      entityManager.addComponent(
        cannon.id,
        createStructureComponent(false, "with-unit", "cannon"),
      );

      turretStatusSystem.update();
      turretStatusSystem.destroy();

      expect(mockContainer.destroy).toHaveBeenCalled();
    });
  });

  describe("setStatusTextVisible", () => {
    it("should set visibility of status text", () => {
      const mockContainer = {
        setPosition: vi.fn(),
        add: vi.fn(),
        setData: vi.fn(),
        getData: vi.fn(),
        destroy: vi.fn(),
        setVisible: vi.fn(),
      };

      mockScene.add.container.mockReturnValue(mockContainer);

      // 砲台エンティティを作成
      const cannon = entityManager.createEntity("cannon", 100, 100, 1);
      entityManager.addComponent(cannon.id, createPositionComponent(5, 5));
      entityManager.addComponent(
        cannon.id,
        createStructureComponent(false, "with-unit", "cannon"),
      );

      turretStatusSystem.update();
      turretStatusSystem.setStatusTextVisible(cannon.id, false);

      expect(mockContainer.setVisible).toHaveBeenCalledWith(false);
    });
  });
});