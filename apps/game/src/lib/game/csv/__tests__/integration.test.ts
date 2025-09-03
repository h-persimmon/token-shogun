import { beforeEach, describe, expect, it } from "vitest";
import {
  CSVLogger,
  CSVParser,
  CSVValidator,
  createCSVValidationSummary,
  formatCSVError,
  groupCSVErrorsByType,
} from "../index";

describe("CSV Integration Tests", () => {
  beforeEach(() => {
    CSVLogger.clearLogs();
    CSVLogger.setLogLevel("DEBUG");
  });

  describe("complete CSV processing workflow", () => {
    it("should process valid CSV from text to validated data", () => {
      const csvText = `waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY
1,basic,5,2000,0,3,8
1,basic,3,2000,0,3,9
2,basic,8,1500,0,3,8
2,fast,3,3000,5000,3,9
3,basic,10,1000,0,3,8
3,fast,5,2000,3000,3,9
3,heavy,2,5000,10000,3,8`;

      // CSVテキストを解析
      const parseResult = CSVParser.parseCSVText(csvText);

      // 結果の検証
      expect(parseResult.isValid).toBe(true);
      expect(parseResult.validRows).toHaveLength(7);
      expect(parseResult.errors).toHaveLength(0);
      expect(parseResult.totalRows).toBe(7);
      expect(parseResult.validRowCount).toBe(7);

      // 各ウェーブの内容を確認
      const wave1Rows = parseResult.validRows.filter(
        (row) => row.waveNumber === 1,
      );
      const wave2Rows = parseResult.validRows.filter(
        (row) => row.waveNumber === 2,
      );
      const wave3Rows = parseResult.validRows.filter(
        (row) => row.waveNumber === 3,
      );

      expect(wave1Rows).toHaveLength(2);
      expect(wave2Rows).toHaveLength(2);
      expect(wave3Rows).toHaveLength(3);

      // 敵タイプの確認
      const enemyTypes = [
        ...new Set(parseResult.validRows.map((row) => row.enemyType)),
      ];
      expect(enemyTypes).toContain("basic");
      expect(enemyTypes).toContain("fast");
      expect(enemyTypes).toContain("heavy");

      // 統計情報の生成
      const stats = CSVValidator.getValidationStats(parseResult);
      expect(stats.totalRows).toBe(7);
      expect(stats.validRows).toBe(7);
      expect(stats.invalidRows).toBe(0);
      expect(stats.successRate).toBe(100);
      expect(stats.waveNumbers).toEqual([1, 2, 3]);
      expect(stats.enemyTypes).toEqual(["basic", "fast", "heavy"]);
    });

    it("should handle mixed valid and invalid data", () => {
      const csvText = `waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY
1,basic,5,2000,0,3,8
invalid_wave,basic,5,2000,0,3,8
2,invalid_enemy,5,2000,0,3,8
3,basic,invalid_count,2000,0,3,8
4,basic,5,invalid_interval,0,3,8
5,basic,5,2000,invalid_delay,3,8
6,basic,5,2000,0,invalid_x,8
7,basic,5,2000,0,3,invalid_y
8,basic,5,2000,0,3,8`;

      const parseResult = CSVParser.parseCSVText(csvText);

      expect(parseResult.isValid).toBe(false);
      expect(parseResult.validRows).toHaveLength(2); // 最初と最後の行のみ有効
      expect(parseResult.errors).toHaveLength(7); // 7つのエラー
      expect(parseResult.totalRows).toBe(9);
      expect(parseResult.validRowCount).toBe(2);

      // エラーの種類を確認
      const errorTypes = [
        ...new Set(parseResult.errors.map((error) => error.type)),
      ];
      expect(errorTypes).toContain("INVALID_WAVE_NUMBER");
      expect(errorTypes).toContain("INVALID_ENEMY_TYPE");
      expect(errorTypes).toContain("INVALID_COUNT");
      expect(errorTypes).toContain("INVALID_SPAWN_INTERVAL");
      expect(errorTypes).toContain("INVALID_SPAWN_DELAY");
      expect(errorTypes).toContain("INVALID_SPAWN_X");
      expect(errorTypes).toContain("INVALID_SPAWN_Y");

      // 統計情報の確認
      const stats = CSVValidator.getValidationStats(parseResult);
      expect(stats.successRate).toBeCloseTo(22.2, 1); // 2/9 * 100
      expect(stats.errorCount).toBe(7);
    });

    it("should process sample CSV successfully", () => {
      const sampleCSV = CSVParser.generateSampleCSV();
      const parseResult = CSVParser.parseCSVText(sampleCSV);

      expect(parseResult.isValid).toBe(true);
      expect(parseResult.validRows.length).toBeGreaterThan(0);
      expect(parseResult.errors).toHaveLength(0);

      // サンプルデータの内容を確認
      const waveNumbers = [
        ...new Set(parseResult.validRows.map((row) => row.waveNumber)),
      ];
      expect(waveNumbers.length).toBeGreaterThan(1);

      const enemyTypes = [
        ...new Set(parseResult.validRows.map((row) => row.enemyType)),
      ];
      expect(enemyTypes).toContain("basic");
      expect(enemyTypes).toContain("fast");
      expect(enemyTypes).toContain("heavy");
    });
  });

  describe("utility functions", () => {
    it("should create validation summary", () => {
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
        ],
        errors: [
          {
            type: "INVALID_WAVE_NUMBER" as const,
            message: "Invalid wave number",
            rowIndex: 2,
          },
        ],
        totalRows: 2,
        validRowCount: 1,
      };

      const summary = createCSVValidationSummary(validationResult);

      expect(summary.isValid).toBe(false);
      expect(summary.totalRows).toBe(2);
      expect(summary.validRows).toBe(1);
      expect(summary.invalidRows).toBe(1);
      expect(summary.errorCount).toBe(1);
      expect(summary.successRate).toBe("50.0%");
      expect(summary.summary).toContain("⚠️");
      expect(summary.summary).toContain("1/2 rows valid");
    });

    it("should format CSV errors", () => {
      const error = {
        type: "INVALID_WAVE_NUMBER" as const,
        message: "Wave number must be a valid number",
        rowIndex: 5,
        fieldName: "waveNumber",
        value: "invalid",
      };

      const formatted = formatCSVError(error);

      expect(formatted).toContain("Row 5");
      expect(formatted).toContain("[waveNumber]");
      expect(formatted).toContain("Wave number must be a valid number");
      expect(formatted).toContain('(value: "invalid")');
    });

    it("should group errors by type", () => {
      const errors = [
        {
          type: "INVALID_WAVE_NUMBER" as const,
          message: "Invalid wave number 1",
          rowIndex: 1,
        },
        {
          type: "INVALID_WAVE_NUMBER" as const,
          message: "Invalid wave number 2",
          rowIndex: 2,
        },
        {
          type: "INVALID_ENEMY_TYPE" as const,
          message: "Invalid enemy type",
          rowIndex: 3,
        },
      ];

      const grouped = groupCSVErrorsByType(errors);

      expect(grouped.INVALID_WAVE_NUMBER).toHaveLength(2);
      expect(grouped.INVALID_ENEMY_TYPE).toHaveLength(1);
      expect(Object.keys(grouped)).toHaveLength(2);
    });
  });

  describe("logging integration", () => {
    it("should log complete processing workflow", () => {
      const csvText = `waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY
1,basic,5,2000,0,3,8
invalid_wave,basic,5,2000,0,3,8`;

      // 処理開始をログ
      CSVLogger.info("Starting CSV processing", { source: "integration-test" });

      // CSV解析
      const parseResult = CSVParser.parseCSVText(csvText);

      // 結果をログ
      CSVLogger.logValidationResult(parseResult, "test.csv");

      // ログの確認
      const logs = CSVLogger.getLogs();
      expect(logs.length).toBeGreaterThan(0);

      const infoLogs = logs.filter((log) => log.level === "INFO");
      const warnLogs = logs.filter((log) => log.level === "WARN");

      expect(infoLogs.length).toBeGreaterThan(0);
      expect(warnLogs.length).toBeGreaterThan(0);

      // 開始ログの確認
      const startLog = infoLogs.find((log) =>
        log.message.includes("Starting CSV processing"),
      );
      expect(startLog).toBeDefined();
      expect(startLog?.context?.source).toBe("integration-test");

      // 結果ログの確認
      const resultLog = warnLogs.find((log) =>
        log.message.includes("CSV validation completed with errors"),
      );
      expect(resultLog).toBeDefined();
    });

    it("should export comprehensive log data", () => {
      // 様々なレベルのログを生成
      CSVLogger.debug("Debug message");
      CSVLogger.info("Info message");
      CSVLogger.warn("Warn message");
      CSVLogger.error("Error message");

      // JSON形式でエクスポート
      const jsonLogs = CSVLogger.exportLogsAsJSON();
      const parsedLogs = JSON.parse(jsonLogs);

      expect(parsedLogs).toHaveLength(4);
      expect(parsedLogs.map((log: any) => log.level)).toEqual([
        "DEBUG",
        "INFO",
        "WARN",
        "ERROR",
      ]);

      // 統計情報の確認
      const stats = CSVLogger.getLogStats();
      expect(stats.DEBUG).toBe(1);
      expect(stats.INFO).toBe(1);
      expect(stats.WARN).toBe(1);
      expect(stats.ERROR).toBe(1);
    });
  });

  describe("error handling edge cases", () => {
    it("should handle completely malformed CSV", () => {
      const malformedCSV = `This is not CSV at all
Just some random text
With no structure whatsoever`;

      const parseResult = CSVParser.parseCSVText(malformedCSV);

      expect(parseResult.isValid).toBe(false);
      expect(parseResult.validRows).toHaveLength(0);
      expect(parseResult.errors.length).toBeGreaterThan(0);
    });

    it("should handle empty CSV gracefully", () => {
      const emptyCSV = "";

      const parseResult = CSVParser.parseCSVText(emptyCSV);

      expect(parseResult.isValid).toBe(false);
      expect(parseResult.validRows).toHaveLength(0);
      expect(parseResult.totalRows).toBe(0);
      expect(parseResult.validRowCount).toBe(0);
    });

    it("should handle CSV with only whitespace", () => {
      const whitespaceCSV = "   \n\n   \t\t   \n   ";

      const parseResult = CSVParser.parseCSVText(whitespaceCSV);

      expect(parseResult.isValid).toBe(false);
      expect(parseResult.validRows).toHaveLength(0);
    });

    it("should handle CSV with missing values", () => {
      const csvWithMissing = `waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY
1,basic,,2000,0,3,8
2,,5,2000,0,3,8
,basic,5,2000,0,3,8`;

      const parseResult = CSVParser.parseCSVText(csvWithMissing);

      expect(parseResult.isValid).toBe(false);
      expect(parseResult.validRows).toHaveLength(0);
      expect(parseResult.errors.length).toBe(3);

      // 各行で異なるフィールドが欠けていることを確認
      const errorFields = parseResult.errors.map((error) => error.fieldName);
      expect(errorFields).toContain("count");
      expect(errorFields).toContain("enemyType");
      expect(errorFields).toContain("waveNumber");
    });
  });

  describe("performance and scalability", () => {
    it("should handle large CSV data efficiently", () => {
      // 大量のデータを生成
      const headerLine =
        "waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY";
      const dataLines = Array.from({ length: 1000 }, (_, i) => {
        const waveNumber = Math.floor(i / 10) + 1;
        const enemyTypes = ["basic", "fast", "heavy"];
        const enemyType = enemyTypes[i % 3];
        return `${waveNumber},${enemyType},5,2000,0,3,8`;
      });

      const largeCsv = [headerLine, ...dataLines].join("\n");

      const startTime = Date.now();
      const parseResult = CSVParser.parseCSVText(largeCsv);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      expect(parseResult.isValid).toBe(true);
      expect(parseResult.validRows).toHaveLength(1000);
      expect(parseResult.errors).toHaveLength(0);

      // パフォーマンスの確認（1000行を1秒以内で処理）
      expect(processingTime).toBeLessThan(1000);

      // 統計情報の確認
      const stats = CSVValidator.getValidationStats(parseResult);
      expect(stats.waveNumbers.length).toBeGreaterThan(90); // 約100ウェーブ
      expect(stats.enemyTypes).toEqual(["basic", "fast", "heavy"]);
    });
  });
});
