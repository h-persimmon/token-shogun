import { beforeEach, describe, expect, it, vi } from "vitest";
import { RangeVisualizer } from "../range-visualizer";

// Phaserのモック
const mockGraphics = {
  lineStyle: vi.fn(),
  fillStyle: vi.fn(),
  fillCircle: vi.fn(),
  strokeCircle: vi.fn(),
  setDepth: vi.fn(),
  destroy: vi.fn(),
  x: 0,
  y: 0,
};

const mockScene = {
  add: {
    graphics: vi.fn(() => mockGraphics),
  },
} as any;

describe("RangeVisualizer", () => {
  let rangeVisualizer: RangeVisualizer;

  beforeEach(() => {
    vi.clearAllMocks();
    rangeVisualizer = new RangeVisualizer(mockScene);
  });

  describe("showRange", () => {
    it("射程円を正しく描画する", () => {
      const position = { x: 100, y: 200 };
      const range = 50;

      rangeVisualizer.showRange(position, range);

      expect(mockScene.add.graphics).toHaveBeenCalled();
      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(2, 0x00ff00, 0.3);
      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0x00ff00, 0.1);
      expect(mockGraphics.fillCircle).toHaveBeenCalledWith(100, 200, 50);
      expect(mockGraphics.strokeCircle).toHaveBeenCalledWith(100, 200, 50);
      expect(mockGraphics.setDepth).toHaveBeenCalledWith(5);
    });

    it("カスタムオプションで射程円を描画する", () => {
      const position = { x: 150, y: 250 };
      const range = 75;
      const options = {
        color: 0xff0000,
        alpha: 0.5,
        lineWidth: 3,
        fillAlpha: 0.2,
      };

      rangeVisualizer.showRange(position, range, options);

      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(3, 0xff0000, 0.5);
      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0xff0000, 0.2);
      expect(mockGraphics.fillCircle).toHaveBeenCalledWith(150, 250, 75);
      expect(mockGraphics.strokeCircle).toHaveBeenCalledWith(150, 250, 75);
    });

    it("射程が0以下の場合は描画しない", () => {
      const position = { x: 100, y: 200 };

      rangeVisualizer.showRange(position, 0);
      expect(mockScene.add.graphics).not.toHaveBeenCalled();

      rangeVisualizer.showRange(position, -10);
      expect(mockScene.add.graphics).not.toHaveBeenCalled();
    });

    it("既存の射程表示がある場合は削除してから新しく表示する", () => {
      const position = { x: 100, y: 200 };
      const range = 50;

      // 最初の表示
      rangeVisualizer.showRange(position, range);
      expect(mockScene.add.graphics).toHaveBeenCalledTimes(1);

      // 2回目の表示
      rangeVisualizer.showRange(position, range);
      expect(mockGraphics.destroy).toHaveBeenCalledTimes(1);
      expect(mockScene.add.graphics).toHaveBeenCalledTimes(2);
    });
  });

  describe("hideRange", () => {
    it("射程表示を非表示にする", () => {
      const position = { x: 100, y: 200 };
      const range = 50;

      rangeVisualizer.showRange(position, range);
      rangeVisualizer.hideRange();

      expect(mockGraphics.destroy).toHaveBeenCalled();
    });

    it("射程表示がない場合でもエラーにならない", () => {
      expect(() => rangeVisualizer.hideRange()).not.toThrow();
    });
  });

  describe("updateRange", () => {
    it("射程表示を更新する", () => {
      const position1 = { x: 100, y: 200 };
      const position2 = { x: 150, y: 250 };
      const range = 50;

      rangeVisualizer.showRange(position1, range);
      rangeVisualizer.updateRange(position2, range);

      expect(mockGraphics.destroy).toHaveBeenCalledTimes(1);
      expect(mockScene.add.graphics).toHaveBeenCalledTimes(2);
      expect(mockGraphics.fillCircle).toHaveBeenLastCalledWith(150, 250, 50);
    });
  });

  describe("デフォルト設定", () => {
    it("デフォルト色を設定できる", () => {
      rangeVisualizer.setDefaultColor(0xff0000);

      const position = { x: 100, y: 200 };
      const range = 50;
      rangeVisualizer.showRange(position, range);

      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(2, 0xff0000, 0.3);
      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0xff0000, 0.1);
    });

    it("デフォルト透明度を設定できる", () => {
      rangeVisualizer.setDefaultAlpha(0.7);

      const position = { x: 100, y: 200 };
      const range = 50;
      rangeVisualizer.showRange(position, range);

      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(2, 0x00ff00, 0.7);
    });

    it("デフォルト線幅を設定できる", () => {
      rangeVisualizer.setDefaultLineWidth(5);

      const position = { x: 100, y: 200 };
      const range = 50;
      rangeVisualizer.showRange(position, range);

      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(5, 0x00ff00, 0.3);
    });

    it("透明度の範囲を0-1に制限する", () => {
      rangeVisualizer.setDefaultAlpha(-0.5);
      rangeVisualizer.showRange({ x: 100, y: 200 }, 50);
      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(2, 0x00ff00, 0);

      rangeVisualizer.setDefaultAlpha(1.5);
      rangeVisualizer.showRange({ x: 100, y: 200 }, 50);
      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(2, 0x00ff00, 1);
    });

    it("線幅の最小値を1に制限する", () => {
      rangeVisualizer.setDefaultLineWidth(0);
      rangeVisualizer.showRange({ x: 100, y: 200 }, 50);
      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(1, 0x00ff00, 0.3);
    });
  });

  describe("状態確認メソッド", () => {
    it("isVisible()で表示状態を確認できる", () => {
      expect(rangeVisualizer.isVisible()).toBe(false);

      rangeVisualizer.showRange({ x: 100, y: 200 }, 50);
      expect(rangeVisualizer.isVisible()).toBe(true);

      rangeVisualizer.hideRange();
      expect(rangeVisualizer.isVisible()).toBe(false);
    });

    it("getCurrentPosition()で現在位置を取得できる", () => {
      expect(rangeVisualizer.getCurrentPosition()).toBeNull();

      rangeVisualizer.showRange({ x: 100, y: 200 }, 50);
      const position = rangeVisualizer.getCurrentPosition();
      expect(position).toEqual({ x: 0, y: 0 }); // mockGraphicsのx, y値

      rangeVisualizer.hideRange();
      expect(rangeVisualizer.getCurrentPosition()).toBeNull();
    });
  });

  describe("destroy", () => {
    it("リソースをクリーンアップする", () => {
      rangeVisualizer.showRange({ x: 100, y: 200 }, 50);
      rangeVisualizer.destroy();

      expect(mockGraphics.destroy).toHaveBeenCalled();
      expect(rangeVisualizer.isVisible()).toBe(false);
    });
  });
});
