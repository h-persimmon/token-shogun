import type {
  CSVLoadResult,
  CSVValidationError,
  CSVValidationResult,
} from "./types";

/**
 * CSVログレベル
 */
export type CSVLogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

/**
 * CSVログエントリ
 */
export type CSVLogEntry = {
  level: CSVLogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
};

/**
 * CSV処理用ロガークラス
 */
export class CSVLogger {
  private static logs: CSVLogEntry[] = [];
  private static maxLogs = 1000;
  private static logLevel: CSVLogLevel = "INFO";

  /**
   * ログレベルを設定する
   * @param level ログレベル
   */
  public static setLogLevel(level: CSVLogLevel): void {
    CSVLogger.logLevel = level;
  }

  /**
   * ログエントリを追加する
   * @param level ログレベル
   * @param message メッセージ
   * @param context 追加のコンテキスト情報
   */
  public static log(
    level: CSVLogLevel,
    message: string,
    context?: Record<string, any>,
  ): void {
    const levelPriority = CSVLogger.getLevelPriority(level);
    const currentLevelPriority = CSVLogger.getLevelPriority(CSVLogger.logLevel);

    if (levelPriority < currentLevelPriority) {
      return;
    }

    const entry: CSVLogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
    };

    CSVLogger.logs.push(entry);

    // ログ数の制限
    if (CSVLogger.logs.length > CSVLogger.maxLogs) {
      CSVLogger.logs = CSVLogger.logs.slice(-CSVLogger.maxLogs);
    }

    // コンソールにも出力
    CSVLogger.outputToConsole(entry);
  }

  /**
   * デバッグログを出力する
   * @param message メッセージ
   * @param context コンテキスト
   */
  public static debug(message: string, context?: Record<string, any>): void {
    CSVLogger.log("DEBUG", message, context);
  }

  /**
   * 情報ログを出力する
   * @param message メッセージ
   * @param context コンテキスト
   */
  public static info(message: string, context?: Record<string, any>): void {
    CSVLogger.log("INFO", message, context);
  }

  /**
   * 警告ログを出力する
   * @param message メッセージ
   * @param context コンテキスト
   */
  public static warn(message: string, context?: Record<string, any>): void {
    CSVLogger.log("WARN", message, context);
  }

  /**
   * エラーログを出力する
   * @param message メッセージ
   * @param context コンテキスト
   */
  public static error(message: string, context?: Record<string, any>): void {
    CSVLogger.log("ERROR", message, context);
  }

  /**
   * CSV検証エラーをログに出力する
   * @param errors 検証エラー配列
   * @param filePath ファイルパス
   */
  public static logValidationErrors(
    errors: CSVValidationError[],
    filePath?: string,
  ): void {
    if (errors.length === 0) {
      return;
    }

    CSVLogger.error(`CSV validation failed with ${errors.length} error(s)`, {
      filePath,
      errorCount: errors.length,
    });

    // エラータイプ別の集計
    const errorsByType = errors.reduce(
      (acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    CSVLogger.warn("Validation error summary:", errorsByType);

    // 個別エラーの詳細（最初の10件のみ）
    const maxDetailedErrors = 10;
    const detailedErrors = errors.slice(0, maxDetailedErrors);

    for (const error of detailedErrors) {
      CSVLogger.warn(`Row ${error.rowIndex}: ${error.message}`, {
        type: error.type,
        fieldName: error.fieldName,
        value: error.value,
      });
    }

    if (errors.length > maxDetailedErrors) {
      CSVLogger.warn(
        `... and ${errors.length - maxDetailedErrors} more errors`,
      );
    }
  }

  /**
   * CSV検証結果をログに出力する
   * @param result 検証結果
   * @param filePath ファイルパス
   */
  public static logValidationResult(
    result: CSVValidationResult,
    filePath?: string,
  ): void {
    const successRate =
      result.totalRows > 0
        ? ((result.validRowCount / result.totalRows) * 100).toFixed(1)
        : "0";

    if (result.isValid) {
      CSVLogger.info(
        `CSV validation successful: ${result.validRowCount} rows processed`,
        {
          filePath,
          totalRows: result.totalRows,
          validRows: result.validRowCount,
          successRate: `${successRate}%`,
        },
      );
    } else {
      CSVLogger.warn(
        `CSV validation completed with errors: ${result.validRowCount}/${result.totalRows} rows valid (${successRate}%)`,
        {
          filePath,
          totalRows: result.totalRows,
          validRows: result.validRowCount,
          errorCount: result.errors.length,
          successRate: `${successRate}%`,
        },
      );

      CSVLogger.logValidationErrors(result.errors, filePath);
    }
  }

  /**
   * CSV読み込み結果をログに出力する
   * @param result 読み込み結果
   */
  public static logLoadResult(result: CSVLoadResult): void {
    if (result.success) {
      CSVLogger.info(
        `CSV file loaded successfully: ${result.data.length} valid rows`,
        {
          filePath: result.filePath,
          rowCount: result.data.length,
          lastModified: result.lastModified,
        },
      );
    } else {
      CSVLogger.error(`CSV file loading failed: ${result.filePath}`, {
        filePath: result.filePath,
        errorCount: result.errors.length,
      });

      CSVLogger.logValidationErrors(result.errors, result.filePath);
    }
  }

  /**
   * CSV処理の開始をログに出力する
   * @param operation 操作名
   * @param filePath ファイルパス
   */
  public static logOperationStart(operation: string, filePath?: string): void {
    CSVLogger.debug(`CSV operation started: ${operation}`, { filePath });
  }

  /**
   * CSV処理の完了をログに出力する
   * @param operation 操作名
   * @param duration 処理時間（ミリ秒）
   * @param filePath ファイルパス
   */
  public static logOperationComplete(
    operation: string,
    duration: number,
    filePath?: string,
  ): void {
    CSVLogger.debug(`CSV operation completed: ${operation} (${duration}ms)`, {
      filePath,
      duration,
    });
  }

  /**
   * 全ログを取得する
   * @param level 指定レベル以上のログのみ取得（省略時は全て）
   * @returns ログエントリ配列
   */
  public static getLogs(level?: CSVLogLevel): CSVLogEntry[] {
    if (!level) {
      return [...CSVLogger.logs];
    }

    const levelPriority = CSVLogger.getLevelPriority(level);
    return CSVLogger.logs.filter(
      (log) => CSVLogger.getLevelPriority(log.level) >= levelPriority,
    );
  }

  /**
   * ログをクリアする
   */
  public static clearLogs(): void {
    CSVLogger.logs = [];
  }

  /**
   * ログ統計を取得する
   * @returns ログ統計情報
   */
  public static getLogStats(): Record<CSVLogLevel, number> {
    return CSVLogger.logs.reduce(
      (acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      },
      {} as Record<CSVLogLevel, number>,
    );
  }

  /**
   * ログをJSON形式で出力する
   * @param level 指定レベル以上のログのみ出力（省略時は全て）
   * @returns JSON文字列
   */
  public static exportLogsAsJSON(level?: CSVLogLevel): string {
    const logs = CSVLogger.getLogs(level);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * ログレベルの優先度を取得する
   * @param level ログレベル
   * @returns 優先度（数値が大きいほど重要）
   */
  private static getLevelPriority(level: CSVLogLevel): number {
    switch (level) {
      case "DEBUG":
        return 0;
      case "INFO":
        return 1;
      case "WARN":
        return 2;
      case "ERROR":
        return 3;
      default:
        return 0;
    }
  }

  /**
   * ログエントリをコンソールに出力する
   * @param entry ログエントリ
   */
  private static outputToConsole(entry: CSVLogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[CSV ${entry.level}] ${timestamp}:`;
    const message = entry.context
      ? `${entry.message} ${JSON.stringify(entry.context)}`
      : entry.message;

    switch (entry.level) {
      case "DEBUG":
        console.debug(prefix, message);
        break;
      case "INFO":
        console.info(prefix, message);
        break;
      case "WARN":
        console.warn(prefix, message);
        break;
      case "ERROR":
        console.error(prefix, message);
        break;
    }
  }
}

/**
 * CSV処理のパフォーマンス測定用ユーティリティ
 */
export class CSVPerformanceTracker {
  private static operations: Map<string, number> = new Map();

  /**
   * 操作の開始時刻を記録する
   * @param operationId 操作ID
   */
  public static start(operationId: string): void {
    CSVPerformanceTracker.operations.set(operationId, Date.now());
    CSVLogger.logOperationStart(operationId);
  }

  /**
   * 操作の完了時刻を記録してログに出力する
   * @param operationId 操作ID
   * @param filePath ファイルパス（省略可能）
   * @returns 処理時間（ミリ秒）
   */
  public static end(operationId: string, filePath?: string): number {
    const startTime = CSVPerformanceTracker.operations.get(operationId);
    if (!startTime) {
      CSVLogger.warn(
        `Performance tracking: Operation '${operationId}' was not started`,
      );
      return 0;
    }

    const duration = Date.now() - startTime;
    CSVPerformanceTracker.operations.delete(operationId);

    CSVLogger.logOperationComplete(operationId, duration, filePath);
    return duration;
  }

  /**
   * 実行中の操作一覧を取得する
   * @returns 操作ID配列
   */
  public static getActiveOperations(): string[] {
    return Array.from(CSVPerformanceTracker.operations.keys());
  }

  /**
   * 全ての操作をクリアする
   */
  public static clear(): void {
    CSVPerformanceTracker.operations.clear();
  }
}
