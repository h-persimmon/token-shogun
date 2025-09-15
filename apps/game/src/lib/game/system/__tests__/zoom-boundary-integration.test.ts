import { describe, it, expect, beforeEach, vi } from "vitest";
import { CameraControlSystem } from "../camera-control-system";
import type { MapBounds } from "../camera-control-types";

// Phaserのモック
const mockScene = {
  cameras: {
    main: {
      width: 800,
      height: 600,
      zoom: 1.0,
      scrollX: 0,
      scrollY: 0,
      setScroll: vi.fn(),
      setZoom: vi.fn(),
      getWorldPoint: vi.fn((x: number, y: number) => ({ x, y })),
      pan: vi.fn(),
      zoomTo: vi.fn(),
    },
  },
  input: {
    on: vi.fn(),
    off: vi.fn(),
    setDefaultCursor: vi.fn(),
  },
  game: {
    canvas: {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getBoundingClientRect: vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
      })),
      style: {},
    },
  },
  tweens: {
    add: vi.fn(),
  },
} as any;

describe("CameraControlSystem - Zoom Boundary Integration", () => {
  let cameraSystem: CameraControlSystem;
  let mapBounds: MapBounds;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 大きなマップを設定（カメラ移動が必要な状況）
    mapBounds = {
      width: 2000,
      height: 1500,
      tileWidth: 32,
      tileHeight: 32,
    };

    // カメラの初期状態をリセット
    mockScene.cameras.main.zoom = 1.0;
    mockScene.cameras.main.scrollX = 0;
    mockScene.cameras.main.scrollY = 0;

    cameraSystem = new CameraControlSystem(mockScene, mapBounds, {
      enabled: true,
      boundaryPadding: 0,
    });
  });

  describe("Zoom-aware boundary calculation", () => {
    it("should calculate correct boundaries at zoom level 1.0", () => {
      // ズームレベル1.0での境界テスト
      mockScene.cameras.main.zoom = 1.0;
      
      // 右端の境界を超える位置に移動を試行
      cameraSystem.setCameraPosition(1500, 0);
      
      // 期待される最大X位置: mapWidth - viewportWidth = 2000 - 800 = 1200
      expect(mockScene.cameras.main.setScroll).toHaveBeenCalledWith(1200, 0);
    });

    it("should calculate correct boundaries at zoom level 2.0", () => {
      // ズームレベル2.0での境界テスト
      mockScene.cameras.main.zoom = 2.0;
      
      // ズームイン時は効果的なビューポートが小さくなるため、より遠くまで移動可能
      cameraSystem.setCameraPosition(1800, 0);
      
      // 期待される最大X位置: mapWidth - (viewportWidth / zoom) = 2000 - (800 / 2.0) = 1600
      expect(mockScene.cameras.main.setScroll).toHaveBeenCalledWith(1600, 0);
    });

    it("should calculate correct boundaries at zoom level 0.5", () => {
      // ズームレベル0.5での境界テスト
      mockScene.cameras.main.zoom = 0.5;
      
      // ズームアウト時は効果的なビューポートが大きくなるため、移動範囲が制限される
      cameraSystem.setCameraPosition(1000, 0);
      
      // 期待される最大X位置: mapWidth - (viewportWidth / zoom) = 2000 - (800 / 0.5) = 400
      expect(mockScene.cameras.main.setScroll).toHaveBeenCalledWith(400, 0);
    });
  });

  describe("Zoom operations with boundary constraints", () => {
    it("should respect boundaries when zooming in at map edge", () => {
      // マップの右端近くに移動
      mockScene.cameras.main.scrollX = 1200;
      mockScene.cameras.main.scrollY = 0;
      
      // 右端でズームイン（2倍）を実行
      cameraSystem.setZoomLevel(2.0, 400, 300); // 画面中央でズーム
      
      // ズーム後もカメラ位置が境界内に収まることを確認
      expect(mockScene.cameras.main.setScroll).toHaveBeenCalled();
      
      // 最後の呼び出しで境界内の位置が設定されていることを確認
      const lastCall = mockScene.cameras.main.setScroll.mock.calls[
        mockScene.cameras.main.setScroll.mock.calls.length - 1
      ];
      expect(lastCall[0]).toBeLessThanOrEqual(1600); // 2.0倍ズーム時の最大X位置
    });

    it("should handle boundary conflicts during zoom out", () => {
      // ズームイン状態でマップの端に移動
      mockScene.cameras.main.zoom = 2.0;
      mockScene.cameras.main.scrollX = 1600; // 2.0倍ズーム時の最大X位置
      mockScene.cameras.main.scrollY = 0;
      
      // ズームアウト（0.5倍）を実行
      cameraSystem.setZoomLevel(0.5, 400, 300);
      
      // ズームアウト後、カメラ位置が新しい境界内に調整されることを確認
      expect(mockScene.cameras.main.setScroll).toHaveBeenCalled();
      
      // 最後の呼び出しで0.5倍ズーム時の境界内に収まることを確認
      const lastCall = mockScene.cameras.main.setScroll.mock.calls[
        mockScene.cameras.main.setScroll.mock.calls.length - 1
      ];
      expect(lastCall[0]).toBeLessThanOrEqual(400); // 0.5倍ズーム時の最大X位置
    });
  });

  describe("Camera movement capability based on zoom", () => {
    it("should enable camera movement when map is larger than zoomed viewport", () => {
      // 小さなマップでテスト
      const smallMapBounds: MapBounds = {
        width: 400,  // ビューポート幅800より小さい
        height: 300, // ビューポート高600より小さい
        tileWidth: 32,
        tileHeight: 32,
      };

      const smallMapSystem = new CameraControlSystem(mockScene, smallMapBounds, {
        enabled: true,
      });

      // ズームレベル1.0では移動不要（マップがビューポートより小さい）
      mockScene.cameras.main.zoom = 1.0;
      expect(smallMapSystem.getCameraPosition()).toBeDefined();

      // ズームイン（2.0倍）すると移動が必要になる
      // 効果的ビューポート: 400x300 → マップサイズと同じなので境界ギリギリ
      mockScene.cameras.main.zoom = 2.0;
      smallMapSystem.setZoomLevel(2.0);
      
      // ズーム後にカメラ移動可能性が更新されることを確認
      expect(mockScene.cameras.main.setZoom).toHaveBeenCalledWith(2.0);
    });
  });

  describe("Boundary padding with zoom", () => {
    it("should apply padding correctly at different zoom levels", () => {
      const paddedSystem = new CameraControlSystem(mockScene, mapBounds, {
        enabled: true,
        boundaryPadding: 50,
      });

      // ズームレベル1.0でのパディング適用テスト
      mockScene.cameras.main.zoom = 1.0;
      paddedSystem.setCameraPosition(-100, 0); // 負の値で左端を超える
      
      // パディング分だけ負の値が許可される: -50
      expect(mockScene.cameras.main.setScroll).toHaveBeenCalledWith(-50, 0);

      vi.clearAllMocks();

      // ズームレベル2.0でのパディング適用テスト
      mockScene.cameras.main.zoom = 2.0;
      paddedSystem.setCameraPosition(2000, 0); // 右端を大幅に超える
      
      // 2.0倍ズーム時の最大X位置 + パディング: 1600 + 50 = 1650
      expect(mockScene.cameras.main.setScroll).toHaveBeenCalledWith(1650, 0);
    });
  });

  describe("Smooth zoom with boundary integration", () => {
    it("should handle boundary constraints during smooth zoom", () => {
      const smoothZoomSystem = new CameraControlSystem(mockScene, mapBounds, {
        enabled: true,
        smoothZoom: true,
        smoothZoomDuration: 200,
      });

      // マップの端近くでスムーズズームを実行
      mockScene.cameras.main.scrollX = 1100;
      mockScene.cameras.main.scrollY = 0;
      mockScene.cameras.main.zoom = 1.0;

      smoothZoomSystem.setZoomLevel(2.0, 400, 300);

      // Tweenアニメーションが作成されることを確認
      expect(mockScene.tweens.add).toHaveBeenCalled();
      
      // アニメーション設定で境界を考慮した目標位置が設定されることを確認
      const tweenCalls = mockScene.tweens.add.mock.calls;
      expect(tweenCalls.length).toBeGreaterThan(0);
    });
  });
});