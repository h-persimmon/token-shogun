/**
 * MapBounds interface defining the structure for map boundary information
 */
export interface MapBounds {
  width: number; // マップの幅（ピクセル）
  height: number; // マップの高さ（ピクセル）
  tileWidth: number; // タイルの幅
  tileHeight: number; // タイルの高さ
}

/**
 * Utility class for calculating map boundaries from various sources
 */
export class MapBoundsCalculator {
  /**
   * Calculate map bounds from a Phaser tilemap
   * @param tilemap - The Phaser tilemap to calculate bounds from
   * @returns MapBounds object containing boundary information
   */
  static fromTilemap(tilemap: Phaser.Tilemaps.Tilemap): MapBounds {
    if (!tilemap) {
      throw new Error("Tilemap cannot be null or undefined");
    }

    const tileWidth = tilemap.tileWidth;
    const tileHeight = tilemap.tileHeight;
    const mapWidth = tilemap.width * tileWidth;
    const mapHeight = tilemap.height * tileHeight;

    return {
      width: mapWidth,
      height: mapHeight,
      tileWidth,
      tileHeight,
    };
  }

  /**
   * Calculate map bounds from explicit dimensions
   * @param width - Map width in tiles
   * @param height - Map height in tiles
   * @param tileWidth - Width of each tile in pixels
   * @param tileHeight - Height of each tile in pixels
   * @returns MapBounds object containing boundary information
   */
  static fromDimensions(
    width: number,
    height: number,
    tileWidth: number,
    tileHeight: number,
  ): MapBounds {
    if (width <= 0 || height <= 0 || tileWidth <= 0 || tileHeight <= 0) {
      throw new Error("All dimensions must be positive numbers");
    }

    return {
      width: width * tileWidth,
      height: height * tileHeight,
      tileWidth,
      tileHeight,
    };
  }

  /**
   * Get viewport bounds from a Phaser camera
   * @param camera - The Phaser camera to get viewport bounds from
   * @returns Object containing viewport width and height
   */
  static getViewportBounds(camera: Phaser.Cameras.Scene2D.Camera): {
    width: number;
    height: number;
  } {
    if (!camera) {
      throw new Error("Camera cannot be null or undefined");
    }

    return {
      width: camera.width,
      height: camera.height,
    };
  }

  /**
   * Check if the map is larger than the viewport
   * @param mapBounds - The map boundaries
   * @param viewportBounds - The viewport boundaries
   * @returns True if map is larger than viewport, false otherwise
   */
  static isMapLargerThanViewport(
    mapBounds: MapBounds,
    viewportBounds: { width: number; height: number },
  ): boolean {
    return (
      mapBounds.width > viewportBounds.width ||
      mapBounds.height > viewportBounds.height
    );
  }

  /**
   * Calculate camera movement bounds within the map
   * @param mapBounds - The map boundaries
   * @param viewportBounds - The viewport boundaries
   * @returns Object containing min/max camera positions
   */
  static getCameraBounds(
    mapBounds: MapBounds,
    viewportBounds: { width: number; height: number },
  ): { minX: number; maxX: number; minY: number; maxY: number } {
    const halfViewportWidth = viewportBounds.width / 2;
    const halfViewportHeight = viewportBounds.height / 2;

    return {
      minX: halfViewportWidth,
      maxX: mapBounds.width - halfViewportWidth,
      minY: halfViewportHeight,
      maxY: mapBounds.height - halfViewportHeight,
    };
  }
}
