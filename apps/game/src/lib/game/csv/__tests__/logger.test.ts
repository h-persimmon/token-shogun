import { beforeEach, describe, expect, it, vi } from "vitest";
import { CSVLogger, CSVPerformanceTracker } from "../logger";
import type { CSVLoadResult, CSVValidationResult } from "../types";

// コンソールメソッドをモック
const mockConsole = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

vi.stubGlobal("console", mockConsole);

describe("CSVLogger", () => {
  beforeEach(() => {
    CSVLogger.clearLogs();
    CSVLogger.setLogLevel("DEBUG");
    vi.clearAllMocks();
  });

  describe("basic logging", () => {
    it("should log debug messages", () => {
      CSVLogger.debug("Test debug message", { test: "data" });

      const logs = CSVLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe("DEBUG");
      expect(logs[0].message).toBe("Test debug message");
      expect(logs[0].context).toEqual({ test: "data" });
      expect(mockConsole.debug).toHaveBeenCalled();
    });

    it("should log info messages", () => {
      CSVLogger.info("Test info message");

      const logs = CSVLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe("INFO");
      expect(logs[0].message).toBe("Test info message");
      expect(mockConsole.info).toHaveBeenCalled();
    });

    it("should log warn messages", () => {
      CSVLogger.warn("Test warn message");

      const logs = CSVLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe("WARN");
      expect(logs[0].message).toBe("Test warn message");
      expect(mockConsole.warn).toHaveBeenCalled();
    });

    it("should log error messages", () => {
      CSVLogger.error("Test error message");

      const logs = CSVLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe("ERROR");
      expect(logs[0].message).toBe("Test error message");
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe("log level filtering", () => {
    it("should filter logs by level", () => {
      CSVLogger.setLogLevel("WARN");

      CSVLogger.debug("Debug message");
      CSVLogger.info("Info message");
      CSVLogger.warn("Warn message");
      CSVLogger.error("Error message");

      const allLogs = CSVLogger.getLogs();
      expect(allLogs).toHaveLength(2); // Only WARN and ERROR

      const warnLogs = CSVLogger.getLogs("WARN");
      expect(warnLogs).toHaveLength(2);

      const errorLogs = CSVLogger.getLogs("ERROR");
      expect(errorLogs).toHaveLength(1);
    });

    it("should not log below current level", () => {
      CSVLogger.setLogLevel("ERROR");

      CSVLogger.debug("Debug message");
      CSVLogger.info("Info message");
      CSVLogger.warn("Warn message");

      const logs = CSVLogger.getLogs();
      expect(logs).toHaveLength(0);

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
    });
  });

  describe("validation error logging", () => {
    it("should log validation errors", () => {
      const errors = [
        {
          type: "INVALID_WAVE_NUMBER" as const,
          message: "Invalid wave number",
          rowIndex: 1,
          fieldName: "waveNumber",
          value: "invalid",
        },
        {
          type: "INVALID_ENEMY_TYPE" as const,
          message: "Invalid enemy type",
          rowIndex: 2,
          fieldName: "enemyType",
          value: "unknown",
        },
      ];

      CSVLogger.logValidationErrors(errors, "/test/file.csv");

      const logs = CSVLogger.getLogs();
      expect(logs.length).toBeGreaterThan(0);

      // エラーログが出力されていることを確認
      const errorLogs = logs.filter((log) => log.level === "ERROR");
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toContain(
        "CSV validation failed with 2 error(s)",
      );

      // 警告ログが出力されていることを確認
      const warnLogs = logs.filter((log) => log.level === "WARN");
      expect(warnLogs.length).toBeGreaterThan(0);
    });

    it("should not log when no errors", () => {
      CSVLogger.logValidationErrors([], "/test/file.csv");

      const logs = CSVLogger.getLogs();
      expect(logs).toHaveLength(0);
    });

    it("should limit detailed error output", () => {
      const errors = Array.from({ length: 15 }, (_, i) => ({
        type: "INVALID_WAVE_NUMBER" as const,
        message: `Invalid wave number ${i}`,
        rowIndex: i + 1,
        fieldName: "waveNumber",
        value: `invalid${i}`,
      }));

      CSVLogger.logValidationErrors(errors);

      const logs = CSVLogger.getLogs();
      const warnLogs = logs.filter((log) => log.level === "WARN");

      // 詳細エラー10件 + サマリー + "... and X more errors" メッセージ
      expect(warnLogs.length).toBeGreaterThanOrEqual(12);

      // "... and X more errors" メッセージが含まれていることを確認
      const moreErrorsLog = warnLogs.find((log) =>
        log.message.includes("and 5 more errors"),
      );
      expect(moreErrorsLog).toBeDefined();
    });
  });

  describe("validation result logging", () => {
    it("should log successful validation result", () => {
      const result: CSVValidationResult = {
        isValid: true,
        validRows: [
          {
            waveNumber: 1,
            enemyType: "basic",
            count: 5,
            spawnInterval: 2000,
            spawnDelay: 0,
            spawnX: 3,
            spawnY: 8,
          },
        ],
        errors: [],
        totalRows: 1,
        validRowCount: 1,
      };

      CSVLogger.logValidationResult(result, "/test/file.csv");

      const logs = CSVLogger.getLogs();
      const infoLogs = logs.filter((log) => log.level === "INFO");
      expect(infoLogs).toHaveLength(1);
      expect(infoLogs[0].message).toContain("CSV validation successful");
      expect(infoLogs[0].context?.totalRows).toBe(1);
      expect(infoLogs[0].context?.validRows).toBe(1);
    });

    it("should log validation result with errors", () => {
      const result: CSVValidationResult = {
        isValid: false,
        validRows: [
          {
            waveNumber: 1,
            enemyType: "basic",
            count: 5,
            spawnInterval: 2000,
            spawnDelay: 0,
            spawnX: 3,
            spawnY: 8,
          },
        ],
        errors: [
          {
            type: "INVALID_WAVE_NUMBER",
            message: "Invalid wave number",
            rowIndex: 2,
          },
        ],
        totalRows: 2,
        validRowCount: 1,
      };

      CSVLogger.logValidationResult(result, "/test/file.csv");

      const logs = CSVLogger.getLogs();
      const warnLogs = logs.filter((log) => log.level === "WARN");
      expect(warnLogs.length).toBeGreaterThan(0);

      const mainWarnLog = warnLogs.find((log) =>
        log.message.includes("CSV validation completed with errors"),
      );
      expect(mainWarnLog).toBeDefined();
      expect(mainWarnLog?.context?.successRate).toBe("50.0%");
    });
  });

  describe("load result logging", () => {
    it("should log successful load result", () => {
      const result: CSVLoadResult = {
        success: true,
        data: [
          {
            waveNumber: 1,
            enemyType: "basic",
            count: 5,
            spawnInterval: 2000,
            spawnDelay: 0,
            spawnX: 3,
            spawnY: 8,
          },
        ],
        errors: [],
        filePath: "/test/file.csv",
        lastModified: Date.now(),
      };

      CSVLogger.logLoadResult(result);

      const logs = CSVLogger.getLogs();
      const infoLogs = logs.filter((log) => log.level === "INFO");
      expect(infoLogs).toHaveLength(1);
      expect(infoLogs[0].message).toContain("CSV file loaded successfully");
      expect(infoLogs[0].context?.rowCount).toBe(1);
    });

    it("should log failed load result", () => {
      const result: CSVLoadResult = {
        success: false,
        data: [],
        errors: [
          {
            type: "MISSING_REQUIRED_FIELD",
            message: "File not found",
            rowIndex: 0,
          },
        ],
        filePath: "/test/file.csv",
      };

      CSVLogger.logLoadResult(result);

      const logs = CSVLogger.getLogs();
      const errorLogs = logs.filter((log) => log.level === "ERROR");
      expect(errorLogs.length).toBeGreaterThan(0);

      const mainErrorLog = errorLogs.find((log) =>
        log.message.includes("CSV file loading failed"),
      );
      expect(mainErrorLog).toBeDefined();
    });
  });

  describe("log management", () => {
    it("should limit log count", () => {
      // maxLogsを超える数のログを生成
      for (let i = 0; i < 1100; i++) {
        CSVLogger.info(`Log message ${i}`);
      }

      const logs = CSVLogger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(1000);
    });

    it("should clear logs", () => {
      CSVLogger.info("Test message");
      expect(CSVLogger.getLogs()).toHaveLength(1);

      CSVLogger.clearLogs();
      expect(CSVLogger.getLogs()).toHaveLength(0);
    });

    it("should get log statistics", () => {
      CSVLogger.debug("Debug message");
      CSVLogger.info("Info message");
      CSVLogger.warn("Warn message");
      CSVLogger.error("Error message");

      const stats = CSVLogger.getLogStats();
      expect(stats.DEBUG).toBe(1);
      expect(stats.INFO).toBe(1);
      expect(stats.WARN).toBe(1);
      expect(stats.ERROR).toBe(1);
    });

    it("should export logs as JSON", () => {
      CSVLogger.info("Test message", { test: "data" });

      const jsonLogs = CSVLogger.exportLogsAsJSON();
      expect(typeof jsonLogs).toBe("string");

      const parsedLogs = JSON.parse(jsonLogs);
      expect(Array.isArray(parsedLogs)).toBe(true);
      expect(parsedLogs).toHaveLength(1);
      expect(parsedLogs[0].message).toBe("Test message");
      expect(parsedLogs[0].context).toEqual({ test: "data" });
    });
  });
});

describe("CSVPerformanceTracker", () => {
  beforeEach(() => {
    CSVPerformanceTracker.clear();
    CSVLogger.clearLogs();
    CSVLogger.setLogLevel("DEBUG");
    vi.clearAllMocks();
  });

  it("should track operation performance", () => {
    const operationId = "test-operation";

    CSVPerformanceTracker.start(operationId);

    // 少し待機
    const startTime = Date.now();
    while (Date.now() - startTime < 10) {
      // 10ms待機
    }

    const duration = CSVPerformanceTracker.end(operationId, "/test/file.csv");

    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThan(1000); // 1秒未満

    // ログが出力されていることを確認
    const logs = CSVLogger.getLogs();
    const startLog = logs.find((log) =>
      log.message.includes("CSV operation started"),
    );
    const endLog = logs.find((log) =>
      log.message.includes("CSV operation completed"),
    );

    expect(startLog).toBeDefined();
    expect(endLog).toBeDefined();
    expect(endLog?.context?.duration).toBe(duration);
  });

  it("should handle unknown operation", () => {
    const duration = CSVPerformanceTracker.end("unknown-operation");

    expect(duration).toBe(0);

    // 警告ログが出力されていることを確認
    const logs = CSVLogger.getLogs();
    const warnLog = logs.find(
      (log) => log.level === "WARN" && log.message.includes("was not started"),
    );
    expect(warnLog).toBeDefined();
  });

  it("should track active operations", () => {
    CSVPerformanceTracker.start("operation1");
    CSVPerformanceTracker.start("operation2");

    const activeOps = CSVPerformanceTracker.getActiveOperations();
    expect(activeOps).toHaveLength(2);
    expect(activeOps).toContain("operation1");
    expect(activeOps).toContain("operation2");

    CSVPerformanceTracker.end("operation1");

    const remainingOps = CSVPerformanceTracker.getActiveOperations();
    expect(remainingOps).toHaveLength(1);
    expect(remainingOps).toContain("operation2");
  });

  it("should clear all operations", () => {
    CSVPerformanceTracker.start("operation1");
    CSVPerformanceTracker.start("operation2");

    expect(CSVPerformanceTracker.getActiveOperations()).toHaveLength(2);

    CSVPerformanceTracker.clear();

    expect(CSVPerformanceTracker.getActiveOperations()).toHaveLength(0);
  });
});
