import type {
  CSVValidationError,
  CSVValidationErrorType,
  CSVValidationResult,
} from "./types";

// CSVウェーブ設定ローダー
export { CSVWaveConfigLoader } from "./csv-wave-config-loader";
export type { CSVLogEntry, CSVLogLevel } from "./logger";
// ロガー
export { CSVLogger, CSVPerformanceTracker } from "./logger";

// パーサー
export { CSVParser } from "./parser";
// 型定義
export type {
  CSVLoadResult,
  CSVRawRow,
  CSVRow,
  CSVValidationError,
  CSVValidationErrorType,
  CSVValidationResult,
} from "./types";
export {
  CSV_CONFIG,
  CSV_HEADERS,
  CSV_SCHEMA,
  DEFAULT_CSV_PATH,
} from "./types";
// バリデーター
export { CSVValidator } from "./validator";

// ユーティリティ関数
export const createCSVValidationSummary = (result: CSVValidationResult) => {
  const successRate =
    result.totalRows > 0
      ? ((result.validRowCount / result.totalRows) * 100).toFixed(1)
      : "0";

  return {
    isValid: result.isValid,
    totalRows: result.totalRows,
    validRows: result.validRowCount,
    invalidRows: result.totalRows - result.validRowCount,
    errorCount: result.errors.length,
    successRate: `${successRate}%`,
    summary: result.isValid
      ? `✅ All ${result.totalRows} rows are valid`
      : `⚠️ ${result.validRowCount}/${result.totalRows} rows valid (${successRate}%)`,
  };
};

export const formatCSVError = (error: CSVValidationError): string => {
  const prefix = `Row ${error.rowIndex}`;
  const field = error.fieldName ? ` [${error.fieldName}]` : "";
  const value = error.value ? ` (value: "${error.value}")` : "";
  return `${prefix}${field}: ${error.message}${value}`;
};

export const groupCSVErrorsByType = (errors: CSVValidationError[]) => {
  return errors.reduce(
    (acc, error) => {
      if (!acc[error.type]) {
        acc[error.type] = [];
      }
      acc[error.type].push(error);
      return acc;
    },
    {} as Record<CSVValidationErrorType, CSVValidationError[]>,
  );
};
