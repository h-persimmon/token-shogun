import { beforeEach, describe, expect, it, vi } from "vitest";
import { type MapBounds, MapBoundsCalculator } from "../map-bounds-calculator";

describe("MapBoundsCalculator", () => {
  describe("fromTilemap", () => {
    it("should calculate bounds from a valid tilemap", () => {
      const mockTilemap = {
        width: 10,
        height: 8,
        tileWidth: 32,
        tileHeight: 32,
      } as Phaser.Tilemaps.Tilemap;

      const bounds = MapBoundsCalculator.fromTilemap(mockTilemap);

      expect(bounds).toEqual({
        width: 320, // 10 * 32
        height: 256, // 8 * 32
        tileWidth: 32,
        tileHeight: 32,
      });
    });

    it("should throw error for null tilemap", () => {
      expect(() => {
        MapBoundsCalculator.fromTilemap(null as any);
      }).toThrow("Tilemap cannot be null or undefined");
    });

    it("should throw error for undefined tilemap", () => {
      expect(() => {
        MapBoundsCalculator.fromTilemap(undefined as any);
      }).toThrow("Tilemap cannot be null or undefined");
    });

    it("should handle different tile sizes", () => {
      const mockTilemap = {
        width: 5,
        height: 4,
        tileWidth: 64,
        tileHeight: 48,
      } as Phaser.Tilemaps.Tilemap;

      const bounds = MapBoundsCalculator.fromTilemap(mockTilemap);

      expect(bounds).toEqual({
        width: 320, // 5 * 64
        height: 192, // 4 * 48
        tileWidth: 64,
        tileHeight: 48,
      });
    });
  });

  describe("fromDimensions", () => {
    it("should calculate bounds from valid dimensions", () => {
      const bounds = MapBoundsCalculator.fromDimensions(15, 12, 32, 32);

      expect(bounds).toEqual({
        width: 480, // 15 * 32
        height: 384, // 12 * 32
        tileWidth: 32,
        tileHeight: 32,
      });
    });

    it("should throw error for zero width", () => {
      expect(() => {
        MapBoundsCalculator.fromDimensions(0, 10, 32, 32);
      }).toThrow("All dimensions must be positive numbers");
    });

    it("should throw error for negative height", () => {
      expect(() => {
        MapBoundsCalculator.fromDimensions(10, -5, 32, 32);
      }).toThrow("All dimensions must be positive numbers");
    });

    it("should throw error for zero tile width", () => {
      expect(() => {
        MapBoundsCalculator.fromDimensions(10, 10, 0, 32);
      }).toThrow("All dimensions must be positive numbers");
    });

    it("should throw error for negative tile height", () => {
      expect(() => {
        MapBoundsCalculator.fromDimensions(10, 10, 32, -16);
      }).toThrow("All dimensions must be positive numbers");
    });

    it("should handle non-square tiles", () => {
      const bounds = MapBoundsCalculator.fromDimensions(8, 6, 48, 24);

      expect(bounds).toEqual({
        width: 384, // 8 * 48
        height: 144, // 6 * 24
        tileWidth: 48,
        tileHeight: 24,
      });
    });
  });

  describe("getViewportBounds", () => {
    it("should return camera viewport dimensions", () => {
      const mockCamera = {
        width: 800,
        height: 600,
      } as Phaser.Cameras.Scene2D.Camera;

      const viewportBounds = MapBoundsCalculator.getViewportBounds(mockCamera);

      expect(viewportBounds).toEqual({
        width: 800,
        height: 600,
      });
    });

    it("should throw error for null camera", () => {
      expect(() => {
        MapBoundsCalculator.getViewportBounds(null as any);
      }).toThrow("Camera cannot be null or undefined");
    });

    it("should throw error for undefined camera", () => {
      expect(() => {
        MapBoundsCalculator.getViewportBounds(undefined as any);
      }).toThrow("Camera cannot be null or undefined");
    });

    it("should handle different viewport sizes", () => {
      const mockCamera = {
        width: 1920,
        height: 1080,
      } as Phaser.Cameras.Scene2D.Camera;

      const viewportBounds = MapBoundsCalculator.getViewportBounds(mockCamera);

      expect(viewportBounds).toEqual({
        width: 1920,
        height: 1080,
      });
    });
  });

  describe("isMapLargerThanViewport", () => {
    const mapBounds: MapBounds = {
      width: 1000,
      height: 800,
      tileWidth: 32,
      tileHeight: 32,
    };

    it("should return true when map is larger than viewport", () => {
      const viewportBounds = { width: 800, height: 600 };

      const result = MapBoundsCalculator.isMapLargerThanViewport(
        mapBounds,
        viewportBounds,
      );

      expect(result).toBe(true);
    });

    it("should return true when map width is larger", () => {
      const viewportBounds = { width: 800, height: 900 };

      const result = MapBoundsCalculator.isMapLargerThanViewport(
        mapBounds,
        viewportBounds,
      );

      expect(result).toBe(true);
    });

    it("should return true when map height is larger", () => {
      const viewportBounds = { width: 1200, height: 600 };

      const result = MapBoundsCalculator.isMapLargerThanViewport(
        mapBounds,
        viewportBounds,
      );

      expect(result).toBe(true);
    });

    it("should return false when viewport is larger than map", () => {
      const viewportBounds = { width: 1200, height: 1000 };

      const result = MapBoundsCalculator.isMapLargerThanViewport(
        mapBounds,
        viewportBounds,
      );

      expect(result).toBe(false);
    });

    it("should return false when viewport equals map size", () => {
      const viewportBounds = { width: 1000, height: 800 };

      const result = MapBoundsCalculator.isMapLargerThanViewport(
        mapBounds,
        viewportBounds,
      );

      expect(result).toBe(false);
    });
  });

  describe("getCameraBounds", () => {
    it("should calculate camera movement bounds correctly", () => {
      const mapBounds: MapBounds = {
        width: 1000,
        height: 800,
        tileWidth: 32,
        tileHeight: 32,
      };
      const viewportBounds = { width: 400, height: 300 };

      const cameraBounds = MapBoundsCalculator.getCameraBounds(
        mapBounds,
        viewportBounds,
      );

      expect(cameraBounds).toEqual({
        minX: 200, // 400 / 2
        maxX: 800, // 1000 - 200
        minY: 150, // 300 / 2
        maxY: 650, // 800 - 150
      });
    });

    it("should handle edge case where viewport is larger than map", () => {
      const mapBounds: MapBounds = {
        width: 400,
        height: 300,
        tileWidth: 32,
        tileHeight: 32,
      };
      const viewportBounds = { width: 800, height: 600 };

      const cameraBounds = MapBoundsCalculator.getCameraBounds(
        mapBounds,
        viewportBounds,
      );

      expect(cameraBounds).toEqual({
        minX: 400, // 800 / 2
        maxX: 0, // 400 - 400 (negative range)
        minY: 300, // 600 / 2
        maxY: 0, // 300 - 300 (negative range)
      });
    });

    it("should handle square viewport and map", () => {
      const mapBounds: MapBounds = {
        width: 800,
        height: 800,
        tileWidth: 32,
        tileHeight: 32,
      };
      const viewportBounds = { width: 400, height: 400 };

      const cameraBounds = MapBoundsCalculator.getCameraBounds(
        mapBounds,
        viewportBounds,
      );

      expect(cameraBounds).toEqual({
        minX: 200, // 400 / 2
        maxX: 600, // 800 - 200
        minY: 200, // 400 / 2
        maxY: 600, // 800 - 200
      });
    });

    it("should handle non-square dimensions", () => {
      const mapBounds: MapBounds = {
        width: 1200,
        height: 600,
        tileWidth: 48,
        tileHeight: 24,
      };
      const viewportBounds = { width: 800, height: 400 };

      const cameraBounds = MapBoundsCalculator.getCameraBounds(
        mapBounds,
        viewportBounds,
      );

      expect(cameraBounds).toEqual({
        minX: 400, // 800 / 2
        maxX: 800, // 1200 - 400
        minY: 200, // 400 / 2
        maxY: 400, // 600 - 200
      });
    });
  });
});
