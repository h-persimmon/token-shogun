import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CSVWaveConfigLoader } from "../csv-wave-config-loader";

// fetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("CSVWaveConfigLoader", () => {
  let loader: CSVWaveConfigLoader;

  beforeEach(() => {
    loader = new CSVWaveConfigLoader("/test/enemy-waves.csv");
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default path when no path provided", () => {
      const defaultLoader = new CSVWaveConfigLoader();
      expect(defaultLoader.getCSVFilePath()).toBe("/config/enemy-waves.csv");
    });

    it("should initialize with provided path", () => {
      expect(loader.getCSVFilePath()).toBe("/test/enemy-waves.csv");
    });
  });

  describe("loadWaveConfigs", () => {
    const validCSVContent = `waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY
1,basic,5,2000,0,3,8
1,basic,3,2000,0,3,9
2,basic,8,1500,0,3,8
2,fast,3,3000,5000,3,9`;

    it("should load and parse valid CSV file successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(validCSVContent),
        headers: new Map([["last-modified", new Date().toUTCString()]]),
      });

      const configs = await loader.loadWaveConfigs();

      expect(configs).toHaveLength(2);
      expect(configs[0].waveNumber).toBe(1);
      expect(configs[0].enemies).toHaveLength(2);
      expect(configs[0].spawnPoints).toHaveLength(2);
      expect(configs[1].waveNumber).toBe(2);
      expect(configs[1].enemies).toHaveLength(2);
    });

    it("should return cached configs when not forcing reload", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(validCSVContent),
        headers: new Map([["last-modified", new Date().toUTCString()]]),
      });

      // 最初の読み込み
      const configs1 = await loader.loadWaveConfigs();

      // 2回目の読み込み（キャッシュを使用）
      const configs2 = await loader.loadWaveConfigs();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(configs1).toBe(configs2); // 同じオブジェクト参照
    });

    it("should force reload when forceReload is true", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(validCSVContent),
          headers: new Map([["last-modified", new Date().toUTCString()]]),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(validCSVContent),
          headers: new Map([["last-modified", new Date().toUTCString()]]),
        });

      await loader.loadWaveConfigs();
      await loader.loadWaveConfigs(true);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should return default configs when CSV file fails to load", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const configs = await loader.loadWaveConfigs();

      expect(configs).toHaveLength(3); // デフォルト設定は3ウェーブ
      expect(configs[0].waveNumber).toBe(1);
      expect(configs[1].waveNumber).toBe(2);
      expect(configs[2].waveNumber).toBe(3);
    });

    it("should return default configs when HTTP request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const configs = await loader.loadWaveConfigs();

      expect(configs).toHaveLength(3); // デフォルト設定
    });

    it("should handle invalid CSV content gracefully", async () => {
      const invalidCSVContent = `invalid,csv,content
1,invalid_enemy,5,invalid_number,0,3,8`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(invalidCSVContent),
        headers: new Map([["last-modified", new Date().toUTCString()]]),
      });

      const configs = await loader.loadWaveConfigs();

      // 無効なデータの場合はデフォルト設定を返す
      expect(configs).toHaveLength(3);
    });
  });

  describe("retry mechanism", () => {
    it("should retry on network failure", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          text: () =>
            Promise.resolve(
              "waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY\n1,basic,5,2000,0,3,8",
            ),
          headers: new Map([["last-modified", new Date().toUTCString()]]),
        });

      const configs = await loader.loadWaveConfigs();

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(configs).toHaveLength(1);
    });

    it("should return default configs after all retries fail", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"));

      const configs = await loader.loadWaveConfigs();

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(configs).toHaveLength(3); // デフォルト設定
    });
  });

  describe("wave config conversion", () => {
    it("should group CSV rows by wave number correctly", async () => {
      const csvContent = `waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY
1,basic,5,2000,0,3,8
1,fast,3,1500,2000,3,9
2,basic,10,1000,0,3,8
3,heavy,2,5000,0,3,8`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(csvContent),
        headers: new Map([["last-modified", new Date().toUTCString()]]),
      });

      const configs = await loader.loadWaveConfigs();

      expect(configs).toHaveLength(3);
      expect(configs[0].waveNumber).toBe(1);
      expect(configs[0].enemies).toHaveLength(2);
      expect(configs[1].waveNumber).toBe(2);
      expect(configs[1].enemies).toHaveLength(1);
      expect(configs[2].waveNumber).toBe(3);
      expect(configs[2].enemies).toHaveLength(1);
    });

    it("should collect unique spawn points correctly", async () => {
      const csvContent = `waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY
1,basic,5,2000,0,3,8
1,fast,3,1500,2000,3,8
1,heavy,2,3000,4000,5,10`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(csvContent),
        headers: new Map([["last-modified", new Date().toUTCString()]]),
      });

      const configs = await loader.loadWaveConfigs();

      expect(configs).toHaveLength(1);
      expect(configs[0].spawnPoints).toHaveLength(2); // (3,8) と (5,10)
      expect(configs[0].spawnPoints).toContainEqual({ x: 3, y: 8 });
      expect(configs[0].spawnPoints).toContainEqual({ x: 5, y: 10 });
    });

    it("should sort wave configs by wave number", async () => {
      const csvContent = `waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY
3,basic,5,2000,0,3,8
1,fast,3,1500,2000,3,9
2,heavy,2,3000,4000,5,10`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(csvContent),
        headers: new Map([["last-modified", new Date().toUTCString()]]),
      });

      const configs = await loader.loadWaveConfigs();

      expect(configs).toHaveLength(3);
      expect(configs[0].waveNumber).toBe(1);
      expect(configs[1].waveNumber).toBe(2);
      expect(configs[2].waveNumber).toBe(3);
    });
  });

  describe("default wave configs", () => {
    it("should provide valid default wave configurations", async () => {
      mockFetch.mockRejectedValue(new Error("File not found"));

      const configs = await loader.loadWaveConfigs();

      expect(configs).toHaveLength(3);

      // Wave 1
      expect(configs[0].waveNumber).toBe(1);
      expect(configs[0].enemies).toHaveLength(1);
      expect(configs[0].enemies[0].type).toBe("basic");
      expect(configs[0].spawnPoints).toHaveLength(2);

      // Wave 2
      expect(configs[1].waveNumber).toBe(2);
      expect(configs[1].enemies).toHaveLength(2);
      expect(configs[1].enemies[0].type).toBe("basic");
      expect(configs[1].enemies[1].type).toBe("fast");

      // Wave 3
      expect(configs[2].waveNumber).toBe(3);
      expect(configs[2].enemies).toHaveLength(3);
      expect(configs[2].enemies[0].type).toBe("basic");
      expect(configs[2].enemies[1].type).toBe("fast");
      expect(configs[2].enemies[2].type).toBe("heavy");
    });
  });
});
