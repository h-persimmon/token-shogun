// UnitInfoPopupSystemのテスト

import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import type { Entity } from "../../../entities/entity";
import type { EntityManager } from "../../../entities/entity-manager";
import { PopupRenderer } from "../popup-renderer";
import { RangeVisualizer } from "../range-visualizer";
import type { UnitInfoData, UnitInfoPopup } from "../types";
import { UnitInfoPopupSystem } from "../unit-info-popup-system";

// モックの作成
vi.mock("../popup-renderer");
vi.mock("../range-visualizer");
vi.mock("../unit-info-utils", () => ({
  extractUnitInfo: vi.fn(),
  canUnitAttack: vi.fn(),
}));

describe("UnitInfoPopupSystem", () => {
  let system: UnitInfoPopupSystem;
  let mockScene: Phaser.Scene;
  let mockEntityManager: EntityManager;
  let mockPopupRenderer: PopupRenderer;
  let mockRangeVisualizer: RangeVisualizer;
  let mockEntity: Entity;
  let mockUnitInfo: UnitInfoData;
  let mockPopup: UnitInfoPopup;

  beforeEach(() => {
    // Phaserシーンのモック
    mockScene = {
      add: {
        container: vi.fn(),
        rectangle: vi.fn(),
        text: vi.fn(),
        graphics: vi.fn(),
      },
      cameras: {
        main: {
          width: 800,
          height: 600,
          scrollX: 0,
          scrollY: 0,
        },
      },
    } as any;

    // EntityManagerのモック
    mockEntityManager = {
      getEntity: vi.fn(),
      getAllEntities: vi.fn(),
    } as any;

    // エンティティのモック
    mockEntity = {
      id: "test-entity-1",
      sprite: {
        x: 100,
        y: 200,
      },
      components: {
        health: {
          currentHealth: 80,
          maxHealth: 100,
        },
        attack: {
          damage: 25,
          range: 150,
          attackType: "ranged",
        },
      },
    } as any;

    // ユニット情報のモック
    mockUnitInfo = {
      entityId: "test-entity-1",
      unitType: "ally",
      health: {
        current: 80,
        max: 100,
      },
      attack: {
        damage: 25,
        range: 150,
        attackType: "ranged",
      },
    };

    // ポップアップのモック
    mockPopup = {
      container: {
        setPosition: vi.fn(),
        destroy: vi.fn(),
      },
      background: {
        height: 120,
      },
      titleText: {},
      infoTexts: [],
      entityId: "test-entity-1",
    } as any;

    // PopupRendererのモック
    mockPopupRenderer = {
      createPopup: vi.fn().mockReturnValue(mockPopup),
      adjustPopupPosition: vi.fn(),
      destroyPopup: vi.fn(),
      destroyPopupImmediate: vi.fn(),
      transitionToNewPopup: vi.fn().mockReturnValue(mockPopup),
    } as any;

    // RangeVisualizerのモック
    mockRangeVisualizer = {
      showRange: vi.fn(),
      hideRange: vi.fn(),
      updateRange: vi.fn(),
      isVisible: vi.fn().mockReturnValue(false),
      destroy: vi.fn(),
    } as any;

    // モッククラスのインスタンスを返すように設定
    (PopupRenderer as any).mockImplementation(() => mockPopupRenderer);
    (RangeVisualizer as any).mockImplementation(() => mockRangeVisualizer);

    // システムを初期化
    system = new UnitInfoPopupSystem(mockScene, mockEntityManager);
  });

  describe("constructor", () => {
    it("should initialize with scene and entity manager", () => {
      expect(system).toBeDefined();
      expect(PopupRenderer).toHaveBeenCalledWith(mockScene);
      expect(RangeVisualizer).toHaveBeenCalledWith(mockScene);
    });
  });

  describe("showUnitInfo", () => {
    beforeEach(() => {
      (mockEntityManager.getEntity as Mock).mockReturnValue(mockEntity);

      // unit-info-utilsのモック関数を設定
      const { extractUnitInfo, canUnitAttack } = require("../unit-info-utils");
      (extractUnitInfo as Mock).mockReturnValue(mockUnitInfo);
      (canUnitAttack as Mock).mockReturnValue(true);
    });

    it("should show unit info popup for valid entity", () => {
      system.showUnitInfo("test-entity-1");

      expect(mockEntityManager.getEntity).toHaveBeenCalledWith("test-entity-1");
      expect(mockPopupRenderer.createPopup).toHaveBeenCalledWith(mockUnitInfo, {
        x: 100,
        y: 200,
      });
      expect(system.isPopupVisible()).toBe(true);
      expect(system.getCurrentEntityId()).toBe("test-entity-1");
    });

    it("should show range for attackable units", () => {
      system.showUnitInfo("test-entity-1");

      expect(mockRangeVisualizer.showRange).toHaveBeenCalledWith(
        { x: 100, y: 200 },
        150,
        {
          color: 0x00ff00, // 味方の色（緑）
          alpha: 0.4,
          fillAlpha: 0.1,
        },
      );
    });

    it("should not show range for non-attackable units", () => {
      const { canUnitAttack } = require("../unit-info-utils");
      (canUnitAttack as Mock).mockReturnValue(false);

      system.showUnitInfo("test-entity-1");

      expect(mockRangeVisualizer.showRange).not.toHaveBeenCalled();
    });

    it("should handle non-existent entity gracefully", () => {
      (mockEntityManager.getEntity as Mock).mockReturnValue(undefined);

      system.showUnitInfo("non-existent-entity");

      expect(mockPopupRenderer.createPopup).not.toHaveBeenCalled();
      expect(system.isPopupVisible()).toBe(false);
    });

    it("should hide existing popup before showing new one", () => {
      // 最初のポップアップを表示
      system.showUnitInfo("test-entity-1");
      expect(system.isPopupVisible()).toBe(true);

      // 2番目のエンティティのモックを設定
      const secondEntity = { ...mockEntity, id: "test-entity-2" };
      (mockEntityManager.getEntity as Mock).mockReturnValue(secondEntity);

      // 2番目のポップアップを表示
      system.showUnitInfo("test-entity-2");

      // 最初のポップアップが破棄されたことを確認
      expect(mockPopupRenderer.destroyPopup).toHaveBeenCalledWith(mockPopup);
      expect(mockRangeVisualizer.hideRange).toHaveBeenCalled();
    });

    it("should handle errors gracefully", () => {
      const { extractUnitInfo } = require("../unit-info-utils");
      (extractUnitInfo as Mock).mockImplementation(() => {
        throw new Error("Test error");
      });

      // エラーが発生してもクラッシュしないことを確認
      expect(() => system.showUnitInfo("test-entity-1")).not.toThrow();
      expect(system.isPopupVisible()).toBe(false);
    });
  });

  describe("hideUnitInfo", () => {
    beforeEach(() => {
      (mockEntityManager.getEntity as Mock).mockReturnValue(mockEntity);

      const { extractUnitInfo, canUnitAttack } = require("../unit-info-utils");
      (extractUnitInfo as Mock).mockReturnValue(mockUnitInfo);
      (canUnitAttack as Mock).mockReturnValue(true);

      // ポップアップを表示
      system.showUnitInfo("test-entity-1");
    });

    it("should hide popup and range display", () => {
      system.hideUnitInfo();

      expect(mockPopupRenderer.destroyPopup).toHaveBeenCalledWith(mockPopup);
      expect(mockRangeVisualizer.hideRange).toHaveBeenCalled();
      expect(system.isPopupVisible()).toBe(false);
      expect(system.getCurrentEntityId()).toBe(null);
    });

    it("should handle multiple hide calls gracefully", () => {
      system.hideUnitInfo();
      system.hideUnitInfo(); // 2回目の呼び出し

      // エラーが発生しないことを確認
      expect(system.isPopupVisible()).toBe(false);
    });
  });

  describe("update", () => {
    beforeEach(() => {
      (mockEntityManager.getEntity as Mock).mockReturnValue(mockEntity);

      const { extractUnitInfo, canUnitAttack } = require("../unit-info-utils");
      (extractUnitInfo as Mock).mockReturnValue(mockUnitInfo);
      (canUnitAttack as Mock).mockReturnValue(true);

      system.showUnitInfo("test-entity-1");
    });

    it("should do nothing when no popup is visible", () => {
      system.hideUnitInfo();
      system.update();

      expect(mockEntityManager.getEntity).not.toHaveBeenCalled();
    });

    it("should hide popup when entity no longer exists", () => {
      (mockEntityManager.getEntity as Mock).mockReturnValue(undefined);

      system.update();

      expect(system.isPopupVisible()).toBe(false);
    });

    it("should update popup position when entity moves", () => {
      // エンティティの位置を変更
      mockEntity.sprite.x = 150;
      mockEntity.sprite.y = 250;

      system.update();

      expect(mockPopupRenderer.adjustPopupPosition).toHaveBeenCalledWith(
        mockPopup,
        { x: 150, y: 250 },
      );
    });

    it("should update range display when entity moves", () => {
      (mockRangeVisualizer.isVisible as Mock).mockReturnValue(true);

      // エンティティの位置を変更
      mockEntity.sprite.x = 150;
      mockEntity.sprite.y = 250;

      system.update();

      expect(mockRangeVisualizer.updateRange).toHaveBeenCalledWith(
        { x: 150, y: 250 },
        150,
      );
    });
  });

  describe("destroy", () => {
    it("should cleanup all resources", () => {
      system.destroy();

      expect(mockRangeVisualizer.destroy).toHaveBeenCalled();
      expect(system.isPopupVisible()).toBe(false);
    });
  });

  describe("setEnabled", () => {
    beforeEach(() => {
      (mockEntityManager.getEntity as Mock).mockReturnValue(mockEntity);

      const { extractUnitInfo, canUnitAttack } = require("../unit-info-utils");
      (extractUnitInfo as Mock).mockReturnValue(mockUnitInfo);
      (canUnitAttack as Mock).mockReturnValue(true);
    });

    it("should disable system and hide popup", () => {
      system.showUnitInfo("test-entity-1");
      expect(system.isPopupVisible()).toBe(true);

      system.setEnabled(false);

      expect(system.isPopupVisible()).toBe(false);
    });

    it("should prevent showing popup when disabled", () => {
      system.setEnabled(false);
      system.showUnitInfo("test-entity-1");

      expect(system.isPopupVisible()).toBe(false);
      expect(mockPopupRenderer.createPopup).not.toHaveBeenCalled();
    });

    it("should allow showing popup when re-enabled", () => {
      system.setEnabled(false);
      system.setEnabled(true);
      system.showUnitInfo("test-entity-1");

      expect(system.isPopupVisible()).toBe(true);
    });
  });

  describe("range color selection", () => {
    beforeEach(() => {
      (mockEntityManager.getEntity as Mock).mockReturnValue(mockEntity);

      const { extractUnitInfo, canUnitAttack } = require("../unit-info-utils");
      (canUnitAttack as Mock).mockReturnValue(true);
    });

    it("should use green color for ally units", () => {
      const { extractUnitInfo } = require("../unit-info-utils");
      (extractUnitInfo as Mock).mockReturnValue({
        ...mockUnitInfo,
        unitType: "ally",
      });

      system.showUnitInfo("test-entity-1");

      expect(mockRangeVisualizer.showRange).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Number),
        expect.objectContaining({ color: 0x00ff00 }),
      );
    });

    it("should use red color for enemy units", () => {
      const { extractUnitInfo } = require("../unit-info-utils");
      (extractUnitInfo as Mock).mockReturnValue({
        ...mockUnitInfo,
        unitType: "enemy",
      });

      system.showUnitInfo("test-entity-1");

      expect(mockRangeVisualizer.showRange).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Number),
        expect.objectContaining({ color: 0xff0000 }),
      );
    });

    it("should use blue color for structure units", () => {
      const { extractUnitInfo } = require("../unit-info-utils");
      (extractUnitInfo as Mock).mockReturnValue({
        ...mockUnitInfo,
        unitType: "structure",
      });

      system.showUnitInfo("test-entity-1");

      expect(mockRangeVisualizer.showRange).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Number),
        expect.objectContaining({ color: 0x0088ff }),
      );
    });
  });
});
  describe("アニメーション効果", () => {
    beforeEach(() => {
      (mockEntityManager.getEntity as Mock).mockReturnValue(mockEntity);

      const { extractUnitInfo, canUnitAttack } = require("../unit-info-utils");
      (extractUnitInfo as Mock).mockReturnValue(mockUnitInfo);
      (canUnitAttack as Mock).mockReturnValue(true);
    });

    it("should use smooth transition when switching between units", () => {
      // 最初のポップアップを表示
      system.showUnitInfo("test-entity-1");

      // 2番目のエンティティのモックを設定
      const mockEntity2 = { ...mockEntity, id: "test-entity-2" };
      const mockUnitInfo2 = { ...mockUnitInfo, entityId: "test-entity-2" };
      (mockEntityManager.getEntity as Mock).mockReturnValue(mockEntity2);

      const { extractUnitInfo } = require("../unit-info-utils");
      (extractUnitInfo as Mock).mockReturnValue(mockUnitInfo2);

      // 2番目のポップアップを表示
      system.showUnitInfo("test-entity-2");

      // スムーズな切り替えアニメーションが使用されることを確認
      expect(mockPopupRenderer.transitionToNewPopup).toHaveBeenCalledWith(
        mockPopup,
        mockUnitInfo2,
        { x: 100, y: 200 }
      );
    });

    it("should not create new popup for same entity", () => {
      // 最初のポップアップを表示
      system.showUnitInfo("test-entity-1");
      
      // createPopupの呼び出し回数をリセット
      vi.clearAllMocks();

      // 同じエンティティを再度表示
      system.showUnitInfo("test-entity-1");

      // 新しいポップアップが作成されないことを確認
      expect(mockPopupRenderer.createPopup).not.toHaveBeenCalled();
      expect(mockPopupRenderer.transitionToNewPopup).not.toHaveBeenCalled();
    });

    it("should use animated destroy when hiding popup", () => {
      // ポップアップを表示
      system.showUnitInfo("test-entity-1");

      // ポップアップを非表示
      system.hideUnitInfo();

      // アニメーション付きの破棄が使用されることを確認
      expect(mockPopupRenderer.destroyPopup).toHaveBeenCalledWith(mockPopup);
      expect(mockPopupRenderer.destroyPopupImmediate).not.toHaveBeenCalled();
    });

    it("should use immediate destroy when hiding popup immediately", () => {
      // ポップアップを表示
      system.showUnitInfo("test-entity-1");

      // ポップアップを即座に非表示
      system.hideUnitInfoImmediate();

      // 即座の破棄が使用されることを確認
      expect(mockPopupRenderer.destroyPopupImmediate).toHaveBeenCalledWith(mockPopup);
    });

    it("should use immediate destroy when system is disabled", () => {
      // ポップアップを表示
      system.showUnitInfo("test-entity-1");

      // システムを無効化
      system.setEnabled(false);

      // 即座の破棄が使用されることを確認
      expect(mockPopupRenderer.destroyPopupImmediate).toHaveBeenCalledWith(mockPopup);
    });

    it("should use immediate destroy when system is destroyed", () => {
      // ポップアップを表示
      system.showUnitInfo("test-entity-1");

      // システムを破棄
      system.destroy();

      // 即座の破棄が使用されることを確認
      expect(mockPopupRenderer.destroyPopupImmediate).toHaveBeenCalledWith(mockPopup);
    });
  });
});