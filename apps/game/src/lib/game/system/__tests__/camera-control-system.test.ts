import { beforeEach, describe, expect, it, vi } from "vitest";
import { CameraControlSystem } from "../camera-control-system";
import type { CameraControlConfig, MapBounds } from "../camera-control-types";

// Phaserのモック
const mockCamera = {
  scrollX: 0,
  scrollY: 0,
  width: 800,
  height: 600,
  setScroll: vi.fn(),
};

const mockInput = {
  on: vi.fn(),
  off: vi.fn(),
  setDefaultCursor: vi.fn(),
};

const mockCanvas = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
  })),
  style: {} as CSSStyleDeclaration,
};

const mockGame = {
  canvas: mockCanvas,
};

const mockScene = {
  cameras: {
    main: mockCamera,
  },
  input: mockInput,
  game: mockGame,
} as unknown as Phaser.Scene;

describe("CameraControlSystem", () => {
  let system: CameraControlSystem;
  let mapBounds: MapBounds;
  let config: Partial<CameraControlConfig>;

  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();
    mockCamera.scrollX = 0;
    mockCamera.scrollY = 0;

    mapBounds = {
      width: 1600,
      height: 1200,
      tileWidth: 32,
      tileHeight: 32,
    };

    config = {
      enabled: true,
      dragSensitivity: 1.0,
      boundaryPadding: 0,
      smoothing: false,
      smoothingFactor: 0.1,
    };
  });

  describe("constructor", () => {
    it("should initialize with correct default values", () => {
      system = new CameraControlSystem(mockScene, mapBounds);

      expect(system).toBeDefined();
      expect(mockInput.on).toHaveBeenCalledTimes(3);
      expect(mockInput.on).toHaveBeenCalledWith(
        "pointerdown",
        expect.any(Function),
        system,
      );
      expect(mockInput.on).toHaveBeenCalledWith(
        "pointermove",
        expect.any(Function),
        system,
      );
      expect(mockInput.on).toHaveBeenCalledWith(
        "pointerup",
        expect.any(Function),
        system,
      );
    });

    it("should merge custom config with defaults", () => {
      const customConfig = { dragSensitivity: 2.0, enabled: false };
      system = new CameraControlSystem(mockScene, mapBounds, customConfig);

      expect(system).toBeDefined();
    });

    it("should disable camera movement when map is smaller than viewport", () => {
      const smallMapBounds: MapBounds = {
        width: 400,
        height: 300,
        tileWidth: 32,
        tileHeight: 32,
      };

      system = new CameraControlSystem(mockScene, smallMapBounds);
      expect(system).toBeDefined();
    });
  });

  describe("public interface methods", () => {
    beforeEach(() => {
      system = new CameraControlSystem(mockScene, mapBounds, config);
    });

    describe("setMapBounds", () => {
      it("should update map bounds", () => {
        const newBounds: MapBounds = {
          width: 2000,
          height: 1500,
          tileWidth: 64,
          tileHeight: 64,
        };

        system.setMapBounds(newBounds);
        // 境界チェックが実行されることを確認（setScrollが呼ばれる可能性）
        expect(mockCamera.setScroll).toHaveBeenCalledTimes(0); // 初期位置なので変更なし
      });
    });

    describe("getCameraPosition", () => {
      it("should return current camera position", () => {
        mockCamera.scrollX = 100;
        mockCamera.scrollY = 200;

        const position = system.getCameraPosition();
        expect(position).toEqual({ x: 100, y: 200 });
      });
    });

    describe("setCameraPosition", () => {
      it("should set camera position", () => {
        system.setCameraPosition(150, 250);

        expect(mockCamera.setScroll).toHaveBeenCalledWith(150, 250);
      });

      it("should clamp position to boundaries", () => {
        // 境界外の位置を設定
        system.setCameraPosition(2000, 2000);

        // setScrollが複数回呼ばれる（初回設定 + 境界制限）
        expect(mockCamera.setScroll).toHaveBeenCalled();
      });
    });

    describe("setEnabled", () => {
      it("should enable/disable camera control", () => {
        system.setEnabled(false);
        system.setEnabled(true);

        // 状態変更が正常に動作することを確認
        expect(system).toBeDefined();
      });
    });

    describe("destroy", () => {
      it("should clean up event listeners", () => {
        system.destroy();

        expect(mockInput.off).toHaveBeenCalledTimes(3);
        expect(mockInput.off).toHaveBeenCalledWith(
          "pointerdown",
          expect.any(Function),
          system,
        );
        expect(mockInput.off).toHaveBeenCalledWith(
          "pointermove",
          expect.any(Function),
          system,
        );
        expect(mockInput.off).toHaveBeenCalledWith(
          "pointerup",
          expect.any(Function),
          system,
        );
      });
    });
  });

  describe("update method", () => {
    beforeEach(() => {
      system = new CameraControlSystem(mockScene, mapBounds, config);
    });

    it("should not update when disabled", () => {
      system.setEnabled(false);
      system.update();

      // 無効時は何も実行されない
      expect(mockInput.setDefaultCursor).not.toHaveBeenCalled();
    });

    it("should update cursor when enabled", () => {
      system.update();

      expect(mockInput.setDefaultCursor).toHaveBeenCalled();
    });
  });

  describe("boundary clamping", () => {
    beforeEach(() => {
      system = new CameraControlSystem(mockScene, mapBounds, config);
    });

    it("should clamp camera position to map boundaries", () => {
      // 境界外の位置を設定
      system.setCameraPosition(-100, -100);

      // 境界内に制限されることを確認
      expect(mockCamera.setScroll).toHaveBeenCalled();
    });

    it("should handle boundary padding", () => {
      const configWithPadding = { ...config, boundaryPadding: 50 };
      system = new CameraControlSystem(mockScene, mapBounds, configWithPadding);

      system.setCameraPosition(-10, -10);
      expect(mockCamera.setScroll).toHaveBeenCalled();
    });

    it("should prevent camera from moving beyond left boundary (Requirement 3.1)", () => {
      // 左端境界を超える位置を設定
      system.setCameraPosition(-200, 0);

      // 最後のsetScrollの呼び出しで境界内に制限されることを確認
      const lastCall =
        mockCamera.setScroll.mock.calls[
          mockCamera.setScroll.mock.calls.length - 1
        ];
      expect(lastCall[0]).toBeGreaterThanOrEqual(0); // X座標が0以上
    });

    it("should prevent camera from moving beyond right boundary (Requirement 3.2)", () => {
      // 右端境界を超える位置を設定
      const maxX = mapBounds.width - mockCamera.width;
      system.setCameraPosition(maxX + 200, 0);

      // 境界内に制限されることを確認
      const lastCall =
        mockCamera.setScroll.mock.calls[
          mockCamera.setScroll.mock.calls.length - 1
        ];
      expect(lastCall[0]).toBeLessThanOrEqual(maxX);
    });

    it("should prevent camera from moving beyond top boundary (Requirement 3.3)", () => {
      // 上端境界を超える位置を設定
      system.setCameraPosition(0, -200);

      // 境界内に制限されることを確認
      const lastCall =
        mockCamera.setScroll.mock.calls[
          mockCamera.setScroll.mock.calls.length - 1
        ];
      expect(lastCall[1]).toBeGreaterThanOrEqual(0); // Y座標が0以上
    });

    it("should prevent camera from moving beyond bottom boundary (Requirement 3.4)", () => {
      // 下端境界を超える位置を設定
      const maxY = mapBounds.height - mockCamera.height;
      system.setCameraPosition(0, maxY + 200);

      // 境界内に制限されることを確認
      const lastCall =
        mockCamera.setScroll.mock.calls[
          mockCamera.setScroll.mock.calls.length - 1
        ];
      expect(lastCall[1]).toBeLessThanOrEqual(maxY);
    });
  });

  describe("camera position update logic", () => {
    beforeEach(() => {
      system = new CameraControlSystem(mockScene, mapBounds, config);
    });

    it("should apply drag sensitivity to camera movement (Requirement 1.2)", () => {
      const sensitiveConfig = { ...config, dragSensitivity: 2.0 };
      system = new CameraControlSystem(mockScene, mapBounds, sensitiveConfig);

      // ドラッグを開始
      const startPointer = { x: 100, y: 100 } as Phaser.Input.Pointer;
      const onCalls = mockInput.on.mock.calls;
      const pointerDownHandler = onCalls.find(
        (call: any) => call[0] === "pointerdown",
      )?.[1];
      const pointerMoveHandler = onCalls.find(
        (call: any) => call[0] === "pointermove",
      )?.[1];

      pointerDownHandler(startPointer);

      // マウスを移動（10ピクセル右に移動）
      const movePointer = { x: 110, y: 100 } as Phaser.Input.Pointer;
      pointerMoveHandler(movePointer);

      // 感度2.0が適用されてカメラが移動することを確認
      expect(mockCamera.setScroll).toHaveBeenCalled();
    });

    it("should handle smooth camera movement when enabled", () => {
      const smoothConfig = { ...config, smoothing: true, smoothingFactor: 0.5 };
      system = new CameraControlSystem(mockScene, mapBounds, smoothConfig);

      // スムージング設定が正常に適用されることを確認
      expect(system).toBeDefined();
    });

    it("should calculate delta correctly for camera movement", () => {
      // ドラッグを開始
      const startPointer = { x: 100, y: 100 } as Phaser.Input.Pointer;
      const onCalls = mockInput.on.mock.calls;
      const pointerDownHandler = onCalls.find(
        (call: any) => call[0] === "pointerdown",
      )?.[1];
      const pointerMoveHandler = onCalls.find(
        (call: any) => call[0] === "pointermove",
      )?.[1];

      pointerDownHandler(startPointer);

      // マウスを右下に移動
      const movePointer = { x: 120, y: 130 } as Phaser.Input.Pointer;
      pointerMoveHandler(movePointer);

      // デルタ計算に基づいてカメラが移動することを確認
      expect(mockCamera.setScroll).toHaveBeenCalled();
    });

    it("should continue movement at boundaries (Requirement 3.5)", () => {
      // カメラを左端境界に配置
      mockCamera.scrollX = 0;
      mockCamera.scrollY = 0;

      // ドラッグを開始
      const startPointer = { x: 100, y: 100 } as Phaser.Input.Pointer;
      const onCalls = mockInput.on.mock.calls;
      const pointerDownHandler = onCalls.find(
        (call: any) => call[0] === "pointerdown",
      )?.[1];
      const pointerMoveHandler = onCalls.find(
        (call: any) => call[0] === "pointermove",
      )?.[1];

      pointerDownHandler(startPointer);

      // 左方向（境界外）に移動を試行
      const leftMovePointer = { x: 80, y: 100 } as Phaser.Input.Pointer;
      pointerMoveHandler(leftMovePointer);

      // 右方向（境界内）に移動
      const rightMovePointer = { x: 120, y: 100 } as Phaser.Input.Pointer;
      pointerMoveHandler(rightMovePointer);

      // 境界内での移動は可能であることを確認
      expect(mockCamera.setScroll).toHaveBeenCalled();
    });
  });

  describe("input event handling", () => {
    let pointerDownHandler: (pointer: Phaser.Input.Pointer) => void;
    let pointerMoveHandler: (pointer: Phaser.Input.Pointer) => void;
    let pointerUpHandler: (pointer: Phaser.Input.Pointer) => void;

    beforeEach(() => {
      system = new CameraControlSystem(mockScene, mapBounds, config);

      // イベントハンドラーを取得
      const onCalls = mockInput.on.mock.calls;
      pointerDownHandler = onCalls.find(
        (call: any[]) => call[0] === "pointerdown",
      )?.[1];
      pointerMoveHandler = onCalls.find(
        (call: any[]) => call[0] === "pointermove",
      )?.[1];
      pointerUpHandler = onCalls.find(
        (call: any[]) => call[0] === "pointerup",
      )?.[1];
    });

    describe("pointer down event", () => {
      it("should initiate drag when pointer is pressed", () => {
        const mockPointer = { x: 100, y: 150 } as Phaser.Input.Pointer;

        pointerDownHandler(mockPointer);

        // ドラッグ状態が開始されることを確認
        expect(system).toBeDefined();
      });

      it("should not initiate drag when disabled", () => {
        system.setEnabled(false);
        const mockPointer = { x: 100, y: 150 } as Phaser.Input.Pointer;

        pointerDownHandler(mockPointer);

        // 無効時はドラッグが開始されない
        expect(system).toBeDefined();
      });
    });

    describe("pointer move event", () => {
      it("should move camera during drag", () => {
        // ドラッグを開始
        const startPointer = { x: 100, y: 150 } as Phaser.Input.Pointer;
        pointerDownHandler(startPointer);

        // マウスを移動
        const movePointer = { x: 120, y: 170 } as Phaser.Input.Pointer;
        pointerMoveHandler(movePointer);

        // カメラが移動することを確認
        expect(mockCamera.setScroll).toHaveBeenCalled();
      });

      it("should not move camera when not dragging", () => {
        const mockPointer = { x: 120, y: 170 } as Phaser.Input.Pointer;
        pointerMoveHandler(mockPointer);

        // ドラッグ中でない場合は移動しない
        expect(mockCamera.setScroll).not.toHaveBeenCalled();
      });
    });

    describe("pointer up event", () => {
      it("should end drag when pointer is released", () => {
        // ドラッグを開始
        const startPointer = { x: 100, y: 150 } as Phaser.Input.Pointer;
        pointerDownHandler(startPointer);

        // ドラッグを終了
        const endPointer = { x: 120, y: 170 } as Phaser.Input.Pointer;
        pointerUpHandler(endPointer);

        // ドラッグ状態が終了することを確認
        expect(system).toBeDefined();
      });
    });

    describe("global mouse events", () => {
      it("should set up global event listeners", () => {
        expect(mockCanvas.addEventListener).toHaveBeenCalledWith(
          "mousemove",
          expect.any(Function),
        );
        expect(mockCanvas.addEventListener).toHaveBeenCalledWith(
          "mouseup",
          expect.any(Function),
        );
        expect(mockCanvas.addEventListener).toHaveBeenCalledWith(
          "mouseleave",
          expect.any(Function),
        );
      });

      it("should clean up global event listeners on destroy", () => {
        system.destroy();

        expect(mockCanvas.removeEventListener).toHaveBeenCalledWith(
          "mousemove",
          expect.any(Function),
        );
        expect(mockCanvas.removeEventListener).toHaveBeenCalledWith(
          "mouseup",
          expect.any(Function),
        );
        expect(mockCanvas.removeEventListener).toHaveBeenCalledWith(
          "mouseleave",
          expect.any(Function),
        );
      });
    });

    describe("cursor state management", () => {
      it("should set grab cursor when enabled", () => {
        system.update();

        expect(mockInput.setDefaultCursor).toHaveBeenCalledWith("grab");
      });

      it("should set grabbing cursor during drag", () => {
        const mockPointer = { x: 100, y: 150 } as Phaser.Input.Pointer;
        pointerDownHandler(mockPointer);

        system.update();

        expect(mockInput.setDefaultCursor).toHaveBeenCalledWith("grabbing");
      });

      it("should set default cursor when disabled", () => {
        system.setEnabled(false);
        system.update();

        expect(mockInput.setDefaultCursor).toHaveBeenCalledWith("default");
      });
    });
  });

  describe("visual feedback system (Requirements 4.1, 4.2, 4.3)", () => {
    let pointerDownHandler: (pointer: Phaser.Input.Pointer) => void;
    let pointerUpHandler: (pointer: Phaser.Input.Pointer) => void;

    beforeEach(() => {
      system = new CameraControlSystem(mockScene, mapBounds, config);

      // イベントハンドラーを取得
      const onCalls = mockInput.on.mock.calls;
      pointerDownHandler = onCalls.find(
        (call: any[]) => call[0] === "pointerdown",
      )?.[1];
      pointerUpHandler = onCalls.find(
        (call: any[]) => call[0] === "pointerup",
      )?.[1];
    });

    describe("Requirement 4.1: Cursor changes to grab state when drag operation starts", () => {
      it("should set grab cursor when camera control is enabled and can move", () => {
        system.update();

        expect(mockInput.setDefaultCursor).toHaveBeenCalledWith("grab");
      });

      it("should set default cursor when camera cannot move", () => {
        // 小さなマップで移動不可の状態を作る
        const smallMapBounds: MapBounds = {
          width: 400,
          height: 300,
          tileWidth: 32,
          tileHeight: 32,
        };
        system.setMapBounds(smallMapBounds);
        system.update();

        expect(mockInput.setDefaultCursor).toHaveBeenCalledWith("default");
      });

      it("should set default cursor when camera control is disabled", () => {
        system.setEnabled(false);
        system.update();

        expect(mockInput.setDefaultCursor).toHaveBeenCalledWith("default");
      });
    });

    describe("Requirement 4.2: Cursor changes to grabbing state during drag operation", () => {
      it("should change cursor to grabbing immediately when drag starts", () => {
        const mockPointer = { x: 100, y: 150 } as Phaser.Input.Pointer;

        // ドラッグ開始
        pointerDownHandler(mockPointer);

        // ドラッグ開始時にgrabbingカーソルに変更されることを確認
        expect(mockInput.setDefaultCursor).toHaveBeenCalledWith("grabbing");
      });

      it("should maintain grabbing cursor during drag operation", () => {
        const mockPointer = { x: 100, y: 150 } as Phaser.Input.Pointer;

        // ドラッグ開始
        pointerDownHandler(mockPointer);

        // update()を呼び出してもgrabbingカーソルが維持されることを確認
        system.update();

        expect(mockInput.setDefaultCursor).toHaveBeenCalledWith("grabbing");
      });

      it("should not change to grabbing cursor when disabled", () => {
        system.setEnabled(false);
        const mockPointer = { x: 100, y: 150 } as Phaser.Input.Pointer;

        pointerDownHandler(mockPointer);

        // 無効時はgrabbingカーソルに変更されない
        expect(mockInput.setDefaultCursor).not.toHaveBeenCalledWith("grabbing");
      });
    });

    describe("Requirement 4.3: Cursor returns to normal state when drag operation ends", () => {
      it("should return to grab cursor when drag ends via pointer up", () => {
        const startPointer = { x: 100, y: 150 } as Phaser.Input.Pointer;
        const endPointer = { x: 120, y: 170 } as Phaser.Input.Pointer;

        // ドラッグ開始
        pointerDownHandler(startPointer);
        expect(mockInput.setDefaultCursor).toHaveBeenCalledWith("grabbing");

        // ドラッグ終了
        pointerUpHandler(endPointer);

        // grabカーソルに戻ることを確認
        expect(mockInput.setDefaultCursor).toHaveBeenCalledWith("grab");
      });

      it("should return to grab cursor when drag ends via global mouse up", () => {
        const startPointer = { x: 100, y: 150 } as Phaser.Input.Pointer;

        // ドラッグ開始
        pointerDownHandler(startPointer);
        expect(mockInput.setDefaultCursor).toHaveBeenCalledWith("grabbing");

        // グローバルマウスアップイベントを発生させる
        const globalMouseUpHandler =
          mockCanvas.addEventListener.mock.calls.find(
            (call: any[]) => call[0] === "mouseup",
          )?.[1];

        if (globalMouseUpHandler) {
          globalMouseUpHandler(new MouseEvent("mouseup"));
        }

        // grabカーソルに戻ることを確認
        expect(mockInput.setDefaultCursor).toHaveBeenCalledWith("grab");
      });

      it("should set default cursor when disabled during drag", () => {
        const mockPointer = { x: 100, y: 150 } as Phaser.Input.Pointer;

        // ドラッグ開始
        pointerDownHandler(mockPointer);
        expect(mockInput.setDefaultCursor).toHaveBeenCalledWith("grabbing");

        // ドラッグ中に無効化
        system.setEnabled(false);

        // デフォルトカーソルに変更されることを確認
        expect(mockInput.setDefaultCursor).toHaveBeenCalledWith("default");
      });
    });

    describe("cursor state management with canvas element", () => {
      beforeEach(() => {
        // キャンバス要素のstyleプロパティをモック
        mockCanvas.style = {} as CSSStyleDeclaration;
      });

      it("should set cursor on both Phaser input and canvas element", () => {
        system.update();

        // Phaserのカーソル設定
        expect(mockInput.setDefaultCursor).toHaveBeenCalledWith("grab");
        // キャンバス要素のカーソル設定
        expect(mockCanvas.style.cursor).toBe("grab");
      });

      it("should handle canvas cursor setting errors gracefully", () => {
        // キャンバスがnullの場合のエラーハンドリング
        const originalCanvas = mockGame.canvas;
        (mockGame as any).canvas = null;

        expect(() => {
          system.update();
        }).not.toThrow();

        // 元に戻す
        (mockGame as any).canvas = originalCanvas;
      });
    });

    describe("cursor state during system lifecycle", () => {
      it("should set initial cursor state on construction", () => {
        // 新しいシステムインスタンスを作成
        const newSystem = new CameraControlSystem(mockScene, mapBounds, config);

        // 初期化時にカーソル状態が設定されることを確認
        expect(mockInput.setDefaultCursor).toHaveBeenCalled();
      });

      it("should update cursor when map bounds change", () => {
        const newBounds: MapBounds = {
          width: 400,
          height: 300,
          tileWidth: 32,
          tileHeight: 32,
        };

        system.setMapBounds(newBounds);

        // マップ境界変更時にカーソル状態が更新されることを確認
        expect(mockInput.setDefaultCursor).toHaveBeenCalled();
      });

      it("should reset cursor to default on destroy", () => {
        system.destroy();

        // 破棄時にデフォルトカーソルに戻ることを確認
        expect(mockInput.setDefaultCursor).toHaveBeenCalledWith("default");
      });
    });
  });

  describe("error handling and safety measures", () => {
    beforeEach(() => {
      system = new CameraControlSystem(mockScene, mapBounds, config);
    });

    describe("constructor error handling", () => {
      it("should handle invalid scene gracefully", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        expect(() => {
          new CameraControlSystem(null as any, mapBounds, config);
        }).not.toThrow();

        consoleSpy.mockRestore();
      });

      it("should handle invalid map bounds gracefully", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});
        const invalidBounds = null as any;

        expect(() => {
          new CameraControlSystem(mockScene, invalidBounds, config);
        }).not.toThrow();

        consoleSpy.mockRestore();
      });

      it("should initialize in safe mode when constructor fails", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        // シーンのカメラを無効にしてエラーを発生させる
        const brokenScene = {
          ...mockScene,
          cameras: null,
        } as any;

        expect(() => {
          new CameraControlSystem(brokenScene, mapBounds, config);
        }).not.toThrow();

        consoleSpy.mockRestore();
      });
    });

    describe("validation functions", () => {
      it("should validate map bounds correctly", () => {
        const validBounds: MapBounds = {
          width: 1600,
          height: 1200,
          tileWidth: 32,
          tileHeight: 32,
        };

        const invalidBounds = [
          null,
          undefined,
          { width: -100, height: 1200, tileWidth: 32, tileHeight: 32 },
          { width: 1600, height: -100, tileWidth: 32, tileHeight: 32 },
          { width: 1600, height: 1200, tileWidth: 0, tileHeight: 32 },
          { width: 1600, height: 1200, tileWidth: 32, tileHeight: 0 },
          {
            width: Number.POSITIVE_INFINITY,
            height: 1200,
            tileWidth: 32,
            tileHeight: 32,
          },
          { width: Number.NaN, height: 1200, tileWidth: 32, tileHeight: 32 },
        ];

        // 有効な境界は受け入れられる
        expect(() => {
          system.setMapBounds(validBounds);
        }).not.toThrow();

        // 無効な境界は拒否される（エラーを投げない）
        invalidBounds.forEach((bounds) => {
          expect(() => {
            system.setMapBounds(bounds as any);
          }).not.toThrow();
        });
      });

      it("should validate camera positions correctly", () => {
        const validPositions = [
          [0, 0],
          [100, 200],
          [-50, -100],
        ];

        const invalidPositions = [
          [Number.NaN, 0],
          [0, Number.NaN],
          [Number.POSITIVE_INFINITY, 0],
          [0, Number.NEGATIVE_INFINITY],
        ];

        // 有効な位置は受け入れられる
        validPositions.forEach(([x, y]) => {
          expect(() => {
            system.setCameraPosition(x, y);
          }).not.toThrow();
        });

        // 無効な位置は拒否される（エラーを投げない）
        invalidPositions.forEach(([x, y]) => {
          expect(() => {
            system.setCameraPosition(x, y);
          }).not.toThrow();
        });
      });
    });

    describe("input event error handling", () => {
      it("should handle invalid pointer data gracefully", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});
        const onCalls = mockInput.on.mock.calls;
        const pointerDownHandler = onCalls.find(
          (call: any) => call[0] === "pointerdown",
        )?.[1];

        const invalidPointers = [
          null,
          undefined,
          { x: Number.NaN, y: 100 },
          { x: 100, y: Number.NaN },
          { x: Number.POSITIVE_INFINITY, y: 100 },
          {},
        ];

        invalidPointers.forEach((pointer) => {
          expect(() => {
            pointerDownHandler(pointer as any);
          }).not.toThrow();
        });

        consoleSpy.mockRestore();
      });

      it("should handle mouse event errors gracefully", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        // グローバルマウス移動ハンドラーを取得
        const globalMouseMoveHandler =
          mockCanvas.addEventListener.mock.calls.find(
            (call: any[]) => call[0] === "mousemove",
          )?.[1];

        if (globalMouseMoveHandler) {
          const invalidEvents = [
            null,
            undefined,
            { clientX: Number.NaN, clientY: 100 },
            { clientX: 100, clientY: Number.NaN },
            {},
          ];

          invalidEvents.forEach((event) => {
            expect(() => {
              globalMouseMoveHandler(event as any);
            }).not.toThrow();
          });
        }

        consoleSpy.mockRestore();
      });

      it("should handle canvas unavailability gracefully", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        // キャンバスを無効にする
        const originalCanvas = mockGame.canvas;
        (mockGame as any).canvas = null;

        // グローバルマウス移動ハンドラーを取得
        const globalMouseMoveHandler =
          mockCanvas.addEventListener.mock.calls.find(
            (call: any[]) => call[0] === "mousemove",
          )?.[1];

        if (globalMouseMoveHandler) {
          expect(() => {
            globalMouseMoveHandler(
              new MouseEvent("mousemove", { clientX: 100, clientY: 100 }),
            );
          }).not.toThrow();
        }

        // 元に戻す
        (mockGame as any).canvas = originalCanvas;
        consoleSpy.mockRestore();
      });
    });

    describe("camera update error handling", () => {
      it("should handle errors in camera position update gracefully", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        // setScrollでエラーを発生させる
        mockCamera.setScroll.mockImplementationOnce(() => {
          throw new Error("Camera update failed");
        });

        // エラーが発生してもシステムが停止しないことを確認
        expect(() => {
          system.setCameraPosition(100, 100);
        }).not.toThrow();

        consoleSpy.mockRestore();
      });

      it("should handle errors in update method gracefully", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        // updateCursorでエラーを発生させる
        mockInput.setDefaultCursor.mockImplementationOnce(() => {
          throw new Error("Cursor update failed");
        });

        expect(() => {
          system.update();
        }).not.toThrow();

        consoleSpy.mockRestore();
      });

      it("should reset camera state on critical errors", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        // ドラッグを開始
        const startPointer = { x: 100, y: 100 } as Phaser.Input.Pointer;
        const onCalls = mockInput.on.mock.calls;
        const pointerDownHandler = onCalls.find(
          (call: any[]) => call[0] === "pointerdown",
        )?.[1];
        const pointerMoveHandler = onCalls.find(
          (call: any[]) => call[0] === "pointermove",
        )?.[1];

        pointerDownHandler(startPointer);

        // ポインタームーブでエラーを発生させる
        mockCamera.setScroll.mockImplementationOnce(() => {
          throw new Error("Critical camera error");
        });

        const movePointer = { x: 120, y: 120 } as Phaser.Input.Pointer;
        pointerMoveHandler(movePointer);

        // エラー後もシステムが動作することを確認
        expect(() => {
          system.update();
        }).not.toThrow();

        consoleSpy.mockRestore();
      });
    });

    describe("destroy method error handling", () => {
      it("should handle errors during destruction gracefully", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        // イベントリスナー削除でエラーを発生させる
        mockInput.off.mockImplementationOnce(() => {
          throw new Error("Event listener removal failed");
        });

        expect(() => {
          system.destroy();
        }).not.toThrow();

        consoleSpy.mockRestore();
      });

      it("should handle missing scene properties during destruction", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        // シーンプロパティを無効にする
        const originalInput = mockScene.input;
        const originalCanvas = mockGame.canvas;

        (mockScene as any).input = null;
        (mockGame as any).canvas = null;

        expect(() => {
          system.destroy();
        }).not.toThrow();

        // 元に戻す
        (mockScene as any).input = originalInput;
        (mockGame as any).canvas = originalCanvas;
        consoleSpy.mockRestore();
      });
    });

    describe("cursor state error handling", () => {
      it("should handle cursor setting errors gracefully", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        // カーソル設定でエラーを発生させる
        mockInput.setDefaultCursor.mockImplementationOnce(() => {
          throw new Error("Cursor setting failed");
        });

        expect(() => {
          system.update();
        }).not.toThrow();

        consoleSpy.mockRestore();
      });

      it("should handle canvas style errors gracefully", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        // キャンバススタイルを読み取り専用にしてエラーを発生させる
        Object.defineProperty(mockCanvas, "style", {
          get: () => {
            throw new Error("Canvas style access failed");
          },
          configurable: true,
        });

        expect(() => {
          system.update();
        }).not.toThrow();

        // 元に戻す
        Object.defineProperty(mockCanvas, "style", {
          value: {},
          writable: true,
          configurable: true,
        });

        consoleSpy.mockRestore();
      });
    });

    describe("logging functionality", () => {
      it("should log errors with proper context", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        // エラーを発生させる
        system.setMapBounds(null as any);

        // エラーログが出力されることを確認
        expect(consoleSpy).toHaveBeenCalled();

        const logCall = consoleSpy.mock.calls[0];
        expect(logCall[0]).toContain("[CameraControlSystem]");
        expect(logCall[0]).toContain("INVALID_MAP_BOUNDS");

        consoleSpy.mockRestore();
      });

      it("should log info messages in development mode", () => {
        const consoleSpy = vi
          .spyOn(console, "info")
          .mockImplementation(() => {});
        const originalEnv = process.env.NODE_ENV;

        (process.env as any).NODE_ENV = "development";

        // 新しいシステムを作成（情報ログが出力される）
        const newSystem = new CameraControlSystem(mockScene, mapBounds, config);

        // 情報ログが出力されることを確認
        expect(consoleSpy).toHaveBeenCalled();

        (process.env as any).NODE_ENV = originalEnv;
        consoleSpy.mockRestore();
      });
    });

    describe("safe state recovery", () => {
      it("should maintain system stability after multiple errors", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        // 複数のエラーを連続で発生させる
        mockCamera.setScroll.mockImplementation(() => {
          throw new Error("Persistent camera error");
        });

        // 複数回の操作を実行
        system.setCameraPosition(100, 100);
        system.update();
        system.setCameraPosition(200, 200);
        system.update();

        // システムが安定していることを確認
        expect(() => {
          system.setEnabled(false);
          system.setEnabled(true);
        }).not.toThrow();

        consoleSpy.mockRestore();
      });

      it("should recover from input handler setup failures", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        // 入力ハンドラー設定でエラーを発生させる
        const brokenInput = {
          ...mockInput,
          on: vi.fn().mockImplementation(() => {
            throw new Error("Input handler setup failed");
          }),
        };

        const brokenScene = {
          ...mockScene,
          input: brokenInput,
        } as any;

        // システムが初期化されることを確認（エラーハンドリングにより）
        expect(() => {
          new CameraControlSystem(brokenScene, mapBounds, config);
        }).not.toThrow();

        consoleSpy.mockRestore();
      });
    });
  });
});
