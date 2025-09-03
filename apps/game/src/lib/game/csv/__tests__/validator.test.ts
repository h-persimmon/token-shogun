import { describe, expect, it } from "vitest";
import type { CSVRawRow } from "../types";
import { CSVValidator } from "../validator";

describe("CSVValidator", () => {
  describe("validateCSVData", () => {
    it("should validate correct CSV data", () => {
      const rawRows: CSVRawRow[] = [
        {
          waveNumber: "1",
          enemyType: "basic",
          count: "5",
          spawnInterval: "2000",
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "8",
        },
        {
          waveNumber: "2",
          enemyType: "fast",
          count: "3",
          spawnInterval: "1500",
          spawnDelay: "1000",
          spawnX: "5",
          spawnY: "10",
        },
      ];

      const result = CSVValidator.validateCSVData(rawRows);

      expect(result.isValid).toBe(true);
      expect(result.validRows).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.totalRows).toBe(2);
      expect(result.validRowCount).toBe(2);

      // 最初の行の検証
      expect(result.validRows[0]).toEqual({
        waveNumber: 1,
        enemyType: "basic",
        count: 5,
        spawnInterval: 2000,
        spawnDelay: 0,
        spawnX: 3,
        spawnY: 8,
      });

      // 2番目の行の検証
      expect(result.validRows[1]).toEqual({
        waveNumber: 2,
        enemyType: "fast",
        count: 3,
        spawnInterval: 1500,
        spawnDelay: 1000,
        spawnX: 5,
        spawnY: 10,
      });
    });

    it("should handle invalid wave numbers", () => {
      const rawRows: CSVRawRow[] = [
        {
          waveNumber: "invalid",
          enemyType: "basic",
          count: "5",
          spawnInterval: "2000",
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "8",
        },
        {
          waveNumber: "0", // 範囲外
          enemyType: "basic",
          count: "5",
          spawnInterval: "2000",
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "8",
        },
        {
          waveNumber: "1000", // 範囲外
          enemyType: "basic",
          count: "5",
          spawnInterval: "2000",
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "8",
        },
      ];

      const result = CSVValidator.validateCSVData(rawRows);

      expect(result.isValid).toBe(false);
      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(3);
      expect(result.totalRows).toBe(3);
      expect(result.validRowCount).toBe(0);

      // エラーの内容を確認
      expect(result.errors[0].type).toBe("INVALID_WAVE_NUMBER");
      expect(result.errors[0].rowIndex).toBe(1);
      expect(result.errors[1].type).toBe("INVALID_WAVE_NUMBER");
      expect(result.errors[1].rowIndex).toBe(2);
      expect(result.errors[2].type).toBe("INVALID_WAVE_NUMBER");
      expect(result.errors[2].rowIndex).toBe(3);
    });

    it("should handle invalid enemy types", () => {
      const rawRows: CSVRawRow[] = [
        {
          waveNumber: "1",
          enemyType: "invalid_enemy",
          count: "5",
          spawnInterval: "2000",
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "8",
        },
        {
          waveNumber: "1",
          enemyType: "BASIC", // 大文字（正規化されるべき）
          count: "5",
          spawnInterval: "2000",
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "8",
        },
      ];

      const result = CSVValidator.validateCSVData(rawRows);

      expect(result.isValid).toBe(false);
      expect(result.validRows).toHaveLength(1); // 2番目の行は正規化されて有効
      expect(result.errors).toHaveLength(1);

      // 有効な行の確認（大文字が小文字に正規化される）
      expect(result.validRows[0].enemyType).toBe("basic");

      // エラーの確認
      expect(result.errors[0].type).toBe("INVALID_ENEMY_TYPE");
      expect(result.errors[0].rowIndex).toBe(1);
    });

    it("should handle invalid numeric fields", () => {
      const rawRows: CSVRawRow[] = [
        {
          waveNumber: "1",
          enemyType: "basic",
          count: "invalid",
          spawnInterval: "2000",
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "8",
        },
        {
          waveNumber: "1",
          enemyType: "basic",
          count: "5",
          spawnInterval: "invalid",
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "8",
        },
        {
          waveNumber: "1",
          enemyType: "basic",
          count: "5",
          spawnInterval: "2000",
          spawnDelay: "invalid",
          spawnX: "3",
          spawnY: "8",
        },
      ];

      const result = CSVValidator.validateCSVData(rawRows);

      expect(result.isValid).toBe(false);
      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(3);

      expect(result.errors[0].type).toBe("INVALID_COUNT");
      expect(result.errors[1].type).toBe("INVALID_SPAWN_INTERVAL");
      expect(result.errors[2].type).toBe("INVALID_SPAWN_DELAY");
    });

    it("should handle out-of-range numeric values", () => {
      const rawRows: CSVRawRow[] = [
        {
          waveNumber: "1",
          enemyType: "basic",
          count: "0", // 範囲外（最小値未満）
          spawnInterval: "2000",
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "8",
        },
        {
          waveNumber: "1",
          enemyType: "basic",
          count: "101", // 範囲外（最大値超過）
          spawnInterval: "2000",
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "8",
        },
        {
          waveNumber: "1",
          enemyType: "basic",
          count: "5",
          spawnInterval: "50", // 範囲外（最小値未満）
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "8",
        },
      ];

      const result = CSVValidator.validateCSVData(rawRows);

      expect(result.isValid).toBe(false);
      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(3);

      expect(result.errors[0].type).toBe("INVALID_COUNT");
      expect(result.errors[1].type).toBe("INVALID_COUNT");
      expect(result.errors[2].type).toBe("INVALID_SPAWN_INTERVAL");
    });

    it("should handle missing required fields", () => {
      const rawRows: CSVRawRow[] = [
        {
          waveNumber: "",
          enemyType: "basic",
          count: "5",
          spawnInterval: "2000",
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "8",
        },
        {
          waveNumber: "1",
          enemyType: "",
          count: "5",
          spawnInterval: "2000",
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "8",
        },
      ];

      const result = CSVValidator.validateCSVData(rawRows);

      expect(result.isValid).toBe(false);
      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(2);

      expect(result.errors[0].type).toBe("MISSING_REQUIRED_FIELD");
      expect(result.errors[0].fieldName).toBe("waveNumber");
      expect(result.errors[1].type).toBe("MISSING_REQUIRED_FIELD");
      expect(result.errors[1].fieldName).toBe("enemyType");
    });

    it("should handle mixed valid and invalid rows", () => {
      const rawRows: CSVRawRow[] = [
        {
          waveNumber: "1",
          enemyType: "basic",
          count: "5",
          spawnInterval: "2000",
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "8",
        },
        {
          waveNumber: "invalid",
          enemyType: "basic",
          count: "5",
          spawnInterval: "2000",
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "8",
        },
        {
          waveNumber: "2",
          enemyType: "fast",
          count: "3",
          spawnInterval: "1500",
          spawnDelay: "1000",
          spawnX: "5",
          spawnY: "10",
        },
      ];

      const result = CSVValidator.validateCSVData(rawRows);

      expect(result.isValid).toBe(false);
      expect(result.validRows).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.totalRows).toBe(3);
      expect(result.validRowCount).toBe(2);

      // 有効な行の確認
      expect(result.validRows[0].waveNumber).toBe(1);
      expect(result.validRows[1].waveNumber).toBe(2);

      // エラーの確認
      expect(result.errors[0].type).toBe("INVALID_WAVE_NUMBER");
      expect(result.errors[0].rowIndex).toBe(2);
    });

    it("should handle coordinate validation", () => {
      const rawRows: CSVRawRow[] = [
        {
          waveNumber: "1",
          enemyType: "basic",
          count: "5",
          spawnInterval: "2000",
          spawnDelay: "0",
          spawnX: "-1001", // 範囲外
          spawnY: "8",
        },
        {
          waveNumber: "1",
          enemyType: "basic",
          count: "5",
          spawnInterval: "2000",
          spawnDelay: "0",
          spawnX: "3",
          spawnY: "1001", // 範囲外
        },
      ];

      const result = CSVValidator.validateCSVData(rawRows);

      expect(result.isValid).toBe(false);
      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(2);

      expect(result.errors[0].type).toBe("INVALID_SPAWN_X");
      expect(result.errors[1].type).toBe("INVALID_SPAWN_Y");
    });
  });

  describe("getValidationStats", () => {
    it("should generate correct statistics", () => {
      const validationResult = {
        isValid: false,
        validRows: [
          {
            waveNumber: 1,
            enemyType: "basic" as const,
            count: 5,
            spawnInterval: 2000,
            spawnDelay: 0,
            spawnX: 3,
            spawnY: 8,
          },
          {
            waveNumber: 2,
            enemyType: "fast" as const,
            count: 3,
            spawnInterval: 1500,
            spawnDelay: 1000,
            spawnX: 5,
            spawnY: 10,
          },
        ],
        errors: [
          {
            type: "INVALID_WAVE_NUMBER" as const,
            message: "Invalid wave number",
            rowIndex: 3,
          },
          {
            type: "INVALID_ENEMY_TYPE" as const,
            message: "Invalid enemy type",
            rowIndex: 4,
          },
        ],
        totalRows: 4,
        validRowCount: 2,
      };

      const stats = CSVValidator.getValidationStats(validationResult);

      expect(stats.totalRows).toBe(4);
      expect(stats.validRows).toBe(2);
      expect(stats.invalidRows).toBe(2);
      expect(stats.errorCount).toBe(2);
      expect(stats.successRate).toBe(50);
      expect(stats.waveNumbers).toEqual([1, 2]);
      expect(stats.enemyTypes).toEqual(["basic", "fast"]);
      expect(stats.errorsByType).toEqual({
        INVALID_WAVE_NUMBER: 1,
        INVALID_ENEMY_TYPE: 1,
      });
    });

    it("should handle empty validation result", () => {
      const validationResult = {
        isValid: true,
        validRows: [],
        errors: [],
        totalRows: 0,
        validRowCount: 0,
      };

      const stats = CSVValidator.getValidationStats(validationResult);

      expect(stats.totalRows).toBe(0);
      expect(stats.validRows).toBe(0);
      expect(stats.invalidRows).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.waveNumbers).toEqual([]);
      expect(stats.enemyTypes).toEqual([]);
      expect(stats.errorsByType).toEqual({});
    });
  });
});
