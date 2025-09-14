// PopupRendererクラスのテスト

import { beforeEach, describe, expect, test, vi } from "vitest";
import { PopupRenderer } from "../popup-renderer";
import type { UnitInfoData } from "../types";

// Phaserのモック
const mockScene = {
  add: {
    container: vi.fn(),
    rectangle: vi.fn(),
    text: vi.fn(),
  },
  cameras: {
    main: {
      width: 800,
      height: 600,
      scrollX: 0,
      scrollY: 0,
    },
  },
  tweens: {
    add: vi.fn(),
  },
} as any;

const mockContainer = {
  setDepth: vi.fn().mockReturnThis(),
  add: vi.fn(),
  setPosition: vi.fn(),
  destroy: vi.fn(),
  setAlpha: vi.fn().mockReturnThis(),
  setScale: vi.fn().mockReturnThis(),
  active: true,
} as any;

const mockRectangle = {
  setStrokeStyle: vi.fn().mockReturnThis(),
  height: 120,
} as any;

const mockText = {
  // テキストオブジェクトのモック
} as any;

describe("PopupRenderer", () => {
  let popupRenderer: PopupRenderer;

  beforeEach(() => {
    vi.clearAllMocks();

    // モックの設定
    mockScene.add.container.mockReturnValue(mockContainer);
    mockScene.add.rectangle.mockReturnValue(mockRectangle);
    mockScene.add.text.mockReturnValue(mockText);

    popupRenderer = new PopupRenderer(mockScene);
  });

  describe("createPopup", () => {
    test("味方ユニットのポップアップを正しく作成する", () => {
      const unitData: UnitInfoData = {
        entityId: "ally-001",
        unitType: "ally",
        unitClass: "戦士",
        health: { current: 80, max: 100 },
        attack: {
          damage: 25,
          range: 50,
          attackType: "近接",
        },
      };

      const position = { x: 100, y: 100 };
      const popup = popupRenderer.createPopup(unitData, position);

      // コンテナが作成されることを確認
      expect(mockScene.add.container).toHaveBeenCalledWith(0, 0);
      expect(mockContainer.setDepth).toHaveBeenCalledWith(1000);

      // 背景が作成されることを確認
      expect(mockScene.add.rectangle).toHaveBeenCalledWith(
        0,
        0,
        200, // POPUP_WIDTH
        expect.any(Number), // 計算された高さ
        0x000000,
        0.8,
      );

      // タイトルテキストが作成されることを確認
      expect(mockScene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        "味方: 戦士",
        expect.objectContaining({
          fontSize: "14px",
          color: "#ffffff",
          fontStyle: "bold",
        }),
      );

      // ポップアップオブジェクトが正しく構成されることを確認
      expect(popup).toEqual({
        container: mockContainer,
        background: mockRectangle,
        titleText: mockText,
        infoTexts: expect.any(Array),
        entityId: "ally-001",
      });

      // アニメーション効果が適用されることを確認
      expect(mockContainer.setAlpha).toHaveBeenCalledWith(0);
      expect(mockContainer.setScale).toHaveBeenCalledWith(0.8);
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: mockContainer,
          alpha: 1,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: "Back.easeOut",
        }),
      );
    });

    test("敵ユニットのポップアップを正しく作成する", () => {
      const unitData: UnitInfoData = {
        entityId: "enemy-001",
        unitType: "enemy",
        enemyType: "スライム",
        health: { current: 30, max: 50 },
      };

      const position = { x: 200, y: 150 };
      const popup = popupRenderer.createPopup(unitData, position);

      // 敵ユニット用のタイトルが設定されることを確認
      expect(mockScene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        "敵: スライム",
        expect.objectContaining({
          fontSize: "14px",
          color: "#ffffff",
          fontStyle: "bold",
        }),
      );

      expect(popup.entityId).toBe("enemy-001");
    });

    test("構造物のポップアップを正しく作成する", () => {
      const unitData: UnitInfoData = {
        entityId: "structure-001",
        unitType: "structure",
        structureType: "大砲",
        health: { current: 200, max: 200 },
        attack: {
          damage: 100,
          range: 150,
          attackType: "砲撃",
        },
      };

      const position = { x: 300, y: 200 };
      const popup = popupRenderer.createPopup(unitData, position);

      // 構造物用のタイトルが設定されることを確認
      expect(mockScene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        "構造物: 大砲",
        expect.objectContaining({
          fontSize: "14px",
          color: "#ffffff",
          fontStyle: "bold",
        }),
      );

      expect(popup.entityId).toBe("structure-001");
    });

    test("攻撃能力のないユニットのポップアップを正しく作成する", () => {
      const unitData: UnitInfoData = {
        entityId: "ally-002",
        unitType: "ally",
        unitClass: "回復師",
        health: { current: 60, max: 80 },
        // attack情報なし
      };

      const position = { x: 150, y: 120 };
      popupRenderer.createPopup(unitData, position);

      // 攻撃情報がない場合でも正常に作成されることを確認
      expect(mockScene.add.container).toHaveBeenCalled();
      expect(mockScene.add.rectangle).toHaveBeenCalled();
      expect(mockScene.add.text).toHaveBeenCalled();
    });
  });

  describe("adjustPopupPosition", () => {
    test("ポップアップの位置を正しく調整する", () => {
      const popup = {
        container: mockContainer,
        background: mockRectangle,
        titleText: mockText,
        infoTexts: [],
        entityId: "test-001",
      };

      const newPosition = { x: 400, y: 300 };
      popupRenderer.adjustPopupPosition(popup, newPosition);

      // コンテナの位置が更新されることを確認
      expect(mockContainer.setPosition).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  describe("destroyPopup", () => {
    test("ポップアップをアニメーション付きで破棄する", () => {
      const popup = {
        container: mockContainer,
        background: mockRectangle,
        titleText: mockText,
        infoTexts: [],
        entityId: "test-001",
      };

      popupRenderer.destroyPopup(popup);

      // フェードアウトアニメーションが開始されることを確認
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: mockContainer,
          alpha: 0,
          scaleX: 0.8,
          scaleY: 0.8,
          duration: 200,
          ease: "Back.easeIn",
          onComplete: expect.any(Function),
        }),
      );
    });

    test("コンテナがnullの場合でもエラーが発生しない", () => {
      const popup = {
        container: null as any,
        background: mockRectangle,
        titleText: mockText,
        infoTexts: [],
        entityId: "test-001",
      };

      // エラーが発生しないことを確認
      expect(() => popupRenderer.destroyPopup(popup)).not.toThrow();
    });

    test("コンテナが非アクティブの場合は何もしない", () => {
      const inactiveContainer = { ...mockContainer, active: false };
      const popup = {
        container: inactiveContainer,
        background: mockRectangle,
        titleText: mockText,
        infoTexts: [],
        entityId: "test-001",
      };

      popupRenderer.destroyPopup(popup);

      // アニメーションが開始されないことを確認
      expect(mockScene.tweens.add).not.toHaveBeenCalled();
    });
  });

  describe("destroyPopupImmediate", () => {
    test("ポップアップを即座に破棄する", () => {
      const popup = {
        container: mockContainer,
        background: mockRectangle,
        titleText: mockText,
        infoTexts: [],
        entityId: "test-001",
      };

      popupRenderer.destroyPopupImmediate(popup);

      // コンテナが即座に破棄されることを確認
      expect(mockContainer.destroy).toHaveBeenCalled();
      // アニメーションは開始されないことを確認
      expect(mockScene.tweens.add).not.toHaveBeenCalled();
    });
  });

  describe("transitionToNewPopup", () => {
    test("ポップアップの切り替えアニメーションを実行する", () => {
      const oldPopup = {
        container: mockContainer,
        background: mockRectangle,
        titleText: mockText,
        infoTexts: [],
        entityId: "old-001",
      };

      const newUnitData: UnitInfoData = {
        entityId: "new-001",
        unitType: "ally",
        health: { current: 100, max: 100 },
      };

      const newPosition = { x: 200, y: 200 };

      const newPopup = popupRenderer.transitionToNewPopup(
        oldPopup,
        newUnitData,
        newPosition,
      );

      // 新しいポップアップが作成されることを確認
      expect(newPopup.entityId).toBe("new-001");

      // 古いポップアップのフェードアウトアニメーションが開始されることを確認
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: mockContainer,
          alpha: 0,
          scaleX: 0.8,
          scaleY: 0.8,
          duration: 200,
          ease: "Back.easeIn",
        }),
      );

      // 新しいポップアップのフェードインアニメーションが開始されることを確認
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          alpha: 1,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: "Back.easeOut",
        }),
      );
    });
  });

  describe("画面外回避機能とポップアップ位置", () => {
    test("ユニットの上側に配置される", () => {
      const unitData: UnitInfoData = {
        entityId: "test-001",
        unitType: "ally",
        health: { current: 100, max: 100 },
      };

      const position = { x: 400, y: 300 };
      popupRenderer.createPopup(unitData, position);

      // setPositionが呼ばれた引数を確認
      const setPositionCall = mockContainer.setPosition.mock.calls[0];
      const [adjustedX, adjustedY] = setPositionCall;

      // X座標は元の位置と同じ（中央配置）
      expect(adjustedX).toBe(position.x);
      // Y座標は元の位置より上側に配置される
      expect(adjustedY).toBeLessThan(position.y);
    });

    test("上端に近い位置では下側に配置される", () => {
      const unitData: UnitInfoData = {
        entityId: "test-001",
        unitType: "ally",
        health: { current: 100, max: 100 },
      };

      // 画面上端近くの位置
      const position = { x: 400, y: 50 };
      popupRenderer.createPopup(unitData, position);

      // setPositionが呼ばれた引数を確認
      const setPositionCall = mockContainer.setPosition.mock.calls[0];
      const [, adjustedY] = setPositionCall;

      // 元の位置より下側に配置されることを確認
      expect(adjustedY).toBeGreaterThan(position.y);
    });

    test("左端に近い位置では右側にずらされる", () => {
      const unitData: UnitInfoData = {
        entityId: "test-001",
        unitType: "ally",
        health: { current: 100, max: 100 },
      };

      // 画面左端近くの位置
      const position = { x: 50, y: 300 };
      popupRenderer.createPopup(unitData, position);

      // setPositionが呼ばれた引数を確認
      const setPositionCall = mockContainer.setPosition.mock.calls[0];
      const [adjustedX] = setPositionCall;

      // 元の位置より右側に配置されることを確認
      expect(adjustedX).toBeGreaterThan(position.x);
    });

    test("右端に近い位置では左側にずらされる", () => {
      const unitData: UnitInfoData = {
        entityId: "test-001",
        unitType: "ally",
        health: { current: 100, max: 100 },
      };

      // 画面右端近くの位置
      const position = { x: 750, y: 300 };
      popupRenderer.createPopup(unitData, position);

      // setPositionが呼ばれた引数を確認
      const setPositionCall = mockContainer.setPosition.mock.calls[0];
      const [adjustedX] = setPositionCall;

      // 元の位置より左側に配置されることを確認
      expect(adjustedX).toBeLessThan(position.x);
    });

    test("カメラがスクロールしている場合の位置調整", () => {
      // カメラのスクロール位置を設定
      mockScene.cameras.main.scrollX = 100;
      mockScene.cameras.main.scrollY = 50;

      const unitData: UnitInfoData = {
        entityId: "test-001",
        unitType: "ally",
        health: { current: 100, max: 100 },
      };

      const position = { x: 200, y: 100 };
      popupRenderer.createPopup(unitData, position);

      // スクロール位置を考慮した位置調整が行われることを確認
      expect(mockContainer.setPosition).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
      );
    });
  });
});
