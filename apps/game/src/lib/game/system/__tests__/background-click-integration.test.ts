// 背景クリック時のポップアップ非表示機能の統合テスト

import { Scene } from "phaser";
import { createEntityManager } from "../../entities/entity-manager";
import { UnitInfoPopupSystem } from "../../ui/unit-info/unit-info-popup-system";
import { DeploymentSystem } from "../deployment-system";
import { InteractionSystem } from "../interaction-system";
import { MovementSystem } from "../movement-system";

// Phaserのモック
jest.mock("phaser", () => ({
  Scene: jest.fn().mockImplementation(() => ({
    input: {
      on: jest.fn(),
    },
    add: {
      graphics: jest.fn(() => ({
        lineStyle: jest.fn(),
        strokeCircle: jest.fn(),
        destroy: jest.fn(),
      })),
      container: jest.fn(() => ({
        add: jest.fn(),
        setVisible: jest.fn(),
        destroy: jest.fn(),
      })),
      text: jest.fn(() => ({
        setOrigin: jest.fn(),
        destroy: jest.fn(),
      })),
      rectangle: jest.fn(() => ({
        setOrigin: jest.fn(),
        destroy: jest.fn(),
      })),
    },
    cameras: {
      main: {
        width: 800,
        height: 600,
      },
    },
  })),
}));

// PhaserNavMeshPluginのモック
const mockNavMeshPlugin = {
  findPath: jest.fn(() => []),
};

describe("背景クリック時のポップアップ非表示機能", () => {
  let scene: Scene;
  let entityManager: ReturnType<typeof createEntityManager>;
  let unitInfoPopupSystem: UnitInfoPopupSystem;
  let interactionSystem: InteractionSystem;
  let deploymentSystem: DeploymentSystem;
  let movementSystem: MovementSystem;
  let mockInputHandler: jest.Mock;

  beforeEach(() => {
    // Sceneのモックを作成
    scene = new Scene({ key: "TestScene" });
    mockInputHandler = jest.fn();
    (scene.input.on as jest.Mock) = mockInputHandler;

    // EntityManagerを作成
    entityManager = createEntityManager();

    // システムを初期化
    deploymentSystem = new DeploymentSystem(entityManager);
    movementSystem = new MovementSystem(entityManager, mockNavMeshPlugin, null);
    unitInfoPopupSystem = new UnitInfoPopupSystem(scene, entityManager);

    // InteractionSystemを初期化
    const callbacks = {
      onStructureClicked: jest.fn(),
      onDeploymentSuccess: jest.fn(),
      onDeploymentFailed: jest.fn(),
      onUnitClicked: jest.fn((unitId: string) => {
        unitInfoPopupSystem.showUnitInfo(unitId);
      }),
    };

    interactionSystem = new InteractionSystem(
      scene,
      entityManager,
      deploymentSystem,
      movementSystem,
      callbacks,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("背景クリック検出", () => {
    test("背景クリック時にポップアップが非表示になる", () => {
      // テスト用エンティティを作成
      const testEntity = entityManager.createEntity();
      entityManager.addComponent(testEntity.id, "health", {
        currentHealth: 100,
        maxHealth: 100,
        isDead: false,
      });
      entityManager.addComponent(testEntity.id, "unit", {
        unitType: "ally",
      });

      // ポップアップを表示
      const hideUnitInfoSpy = jest.spyOn(unitInfoPopupSystem, "hideUnitInfo");
      unitInfoPopupSystem.showUnitInfo(testEntity.id);

      // 背景クリックイベントハンドラーを取得
      expect(mockInputHandler).toHaveBeenCalledWith(
        "pointerdown",
        expect.any(Function),
      );

      const backgroundClickHandler = mockInputHandler.mock.calls[0][1];

      // 背景クリック（currentlyOverが空の配列）をシミュレート
      const mockPointer = {
        leftButtonDown: jest.fn(() => true),
      };
      const currentlyOver: any[] = []; // 背景クリック（オブジェクトなし）

      backgroundClickHandler(mockPointer, currentlyOver);

      // hideUnitInfoが呼び出されることを確認
      expect(hideUnitInfoSpy).toHaveBeenCalled();
    });

    test("オブジェクトクリック時にはポップアップが非表示にならない", () => {
      // テスト用エンティティを作成
      const testEntity = entityManager.createEntity();
      entityManager.addComponent(testEntity.id, "health", {
        currentHealth: 100,
        maxHealth: 100,
        isDead: false,
      });

      // ポップアップを表示
      const hideUnitInfoSpy = jest.spyOn(unitInfoPopupSystem, "hideUnitInfo");
      unitInfoPopupSystem.showUnitInfo(testEntity.id);

      // 背景クリックイベントハンドラーを取得
      const backgroundClickHandler = mockInputHandler.mock.calls[0][1];

      // オブジェクトクリック（currentlyOverにオブジェクトがある）をシミュレート
      const mockPointer = {
        leftButtonDown: jest.fn(() => true),
      };
      const currentlyOver = [{ name: "testSprite" }]; // オブジェクトクリック

      backgroundClickHandler(mockPointer, currentlyOver);

      // hideUnitInfoが呼び出されないことを確認
      expect(hideUnitInfoSpy).not.toHaveBeenCalled();
    });

    test("右クリック時には処理されない", () => {
      // 背景クリックイベントハンドラーを取得
      const backgroundClickHandler = mockInputHandler.mock.calls[0][1];

      // 右クリックをシミュレート
      const mockPointer = {
        leftButtonDown: jest.fn(() => false), // 左クリックではない
      };
      const currentlyOver: any[] = [];

      const hideUnitInfoSpy = jest.spyOn(unitInfoPopupSystem, "hideUnitInfo");

      backgroundClickHandler(mockPointer, currentlyOver);

      // hideUnitInfoが呼び出されないことを確認
      expect(hideUnitInfoSpy).not.toHaveBeenCalled();
    });
  });

  describe("ユニットクリックの優先度管理", () => {
    test("ユニットクリック時にイベント伝播が停止される", () => {
      // テスト用エンティティとスプライトを作成
      const testEntity = entityManager.createEntity();
      entityManager.addComponent(testEntity.id, "health", {
        currentHealth: 100,
        maxHealth: 100,
        isDead: false,
      });
      entityManager.addComponent(testEntity.id, "unit", {
        unitType: "ally",
      });

      // モックスプライトを作成
      const mockSprite = {
        setInteractive: jest.fn(),
        on: jest.fn(),
        setTint: jest.fn(),
        clearTint: jest.fn(),
        removeAllListeners: jest.fn(),
        disableInteractive: jest.fn(),
        active: true,
      };

      testEntity.sprite = mockSprite as any;

      // InteractionSystemを更新してユニットをクリック可能にする
      interactionSystem.updateUnitInteractions();

      // pointerdownイベントハンドラーが登録されることを確認
      expect(mockSprite.on).toHaveBeenCalledWith(
        "pointerdown",
        expect.any(Function),
      );

      // pointerdownハンドラーを取得
      const pointerdownHandler = mockSprite.on.mock.calls.find(
        (call) => call[0] === "pointerdown",
      )[1];

      // イベント伝播停止のモック
      const mockEvent = {
        stopPropagation: jest.fn(),
      };

      // ユニットクリックをシミュレート
      pointerdownHandler(null, 0, 0, mockEvent);

      // イベント伝播が停止されることを確認
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe("エラーハンドリング", () => {
    test("背景クリック処理でエラーが発生しても例外が投げられない", () => {
      // UnitInfoPopupSystemのhideUnitInfoでエラーを発生させる
      jest.spyOn(unitInfoPopupSystem, "hideUnitInfo").mockImplementation(() => {
        throw new Error("Test error");
      });

      // 背景クリックイベントハンドラーを取得
      const backgroundClickHandler = mockInputHandler.mock.calls[0][1];

      // 背景クリックをシミュレート
      const mockPointer = {
        leftButtonDown: jest.fn(() => true),
      };
      const currentlyOver: any[] = [];

      // エラーが発生しても例外が投げられないことを確認
      expect(() => {
        backgroundClickHandler(mockPointer, currentlyOver);
      }).not.toThrow();
    });
  });
});
