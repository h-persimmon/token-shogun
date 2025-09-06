import type {
  EnemyType,
  StructureTargetPriority,
} from "../components/enemy-component";
import {
  CSV_SCHEMA,
  type CSVRawRow,
  type CSVRow,
  type CSVValidationError,
  type CSVValidationErrorType,
  type CSVValidationResult,
} from "./types";

/**
 * CSVスキーマ検証クラス
 */
export class CSVValidator {
  /**
   * CSVの生データを検証して型安全なデータに変換する
   * @param rawRows パース済みの生データ
   * @returns 検証結果
   */
  public static validateCSVData(rawRows: CSVRawRow[]): CSVValidationResult {
    const validRows: CSVRow[] = [];
    const errors: CSVValidationError[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const rawRow = rawRows[i];
      const rowIndex = i + 1; // 1から開始（ヘッダー行を除く）

      try {
        const validatedRow = CSVValidator.validateRow(rawRow, rowIndex);
        if (validatedRow) {
          validRows.push(validatedRow);
        }
      } catch (error) {
        if (Array.isArray(error)) {
          errors.push(...error);
        } else {
          errors.push({
            type: "MISSING_REQUIRED_FIELD",
            message: `Row ${rowIndex}: Unexpected validation error`,
            rowIndex,
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      validRows,
      errors,
      totalRows: rawRows.length,
      validRowCount: validRows.length,
    };
  }

  /**
   * 単一行を検証する
   * @param rawRow 生データの行
   * @param rowIndex 行番号（1から開始）
   * @returns 検証済みの行データ、または検証失敗時はnull
   */
  private static validateRow(
    rawRow: CSVRawRow,
    rowIndex: number,
  ): CSVRow | null {
    const errors: CSVValidationError[] = [];

    // 必須フィールドの存在チェック
    for (const field of CSV_SCHEMA.requiredFields) {
      if (!rawRow[field] || rawRow[field].trim() === "") {
        errors.push({
          type: "MISSING_REQUIRED_FIELD",
          message: `Row ${rowIndex}: Missing required field '${field}'`,
          rowIndex,
          fieldName: field,
        });
      }
    }

    if (errors.length > 0) {
      throw errors;
    }

    // 各フィールドの検証
    const waveNumber = CSVValidator.validateWaveNumber(
      rawRow.waveNumber,
      rowIndex,
    );
    const enemyType = CSVValidator.validateEnemyType(
      rawRow.enemyType,
      rowIndex,
    );
    const count = CSVValidator.validateCount(rawRow.count, rowIndex);
    const spawnInterval = CSVValidator.validateSpawnInterval(
      rawRow.spawnInterval,
      rowIndex,
    );
    const spawnDelay = CSVValidator.validateSpawnDelay(
      rawRow.spawnDelay,
      rowIndex,
    );
    const spawnX = CSVValidator.validateSpawnX(rawRow.spawnX, rowIndex);
    const spawnY = CSVValidator.validateSpawnY(rawRow.spawnY, rowIndex);
    const structureTargetPriority =
      CSVValidator.validateStructureTargetPriority(
        rawRow.structureTargetPriority,
        rowIndex,
      );

    // 検証エラーを収集
    const validationResults = [
      waveNumber,
      enemyType,
      count,
      spawnInterval,
      spawnDelay,
      spawnX,
      spawnY,
      structureTargetPriority,
    ];

    for (const result of validationResults) {
      if (result.error) {
        errors.push(result.error);
      }
    }

    if (errors.length > 0) {
      throw errors;
    }

    // 検証済みデータを返す
    return {
      waveNumber: waveNumber.value!,
      enemyType: enemyType.value!,
      count: count.value!,
      spawnInterval: spawnInterval.value!,
      spawnDelay: spawnDelay.value!,
      spawnX: spawnX.value!,
      spawnY: spawnY.value!,
      structureTargetPriority: structureTargetPriority.value || undefined,
    };
  }

  /**
   * ウェーブ番号を検証する
   */
  private static validateWaveNumber(
    value: string,
    rowIndex: number,
  ): ValidationResult<number> {
    const numValue = CSVValidator.parseNumber(value);

    if (numValue === null) {
      return {
        value: null,
        error: {
          type: "INVALID_WAVE_NUMBER",
          message: `Row ${rowIndex}: Wave number must be a valid number, got '${value}'`,
          rowIndex,
          fieldName: "waveNumber",
          value,
        },
      };
    }

    const { min, max } = CSV_SCHEMA.fieldConstraints.waveNumber;
    if (numValue < min || numValue > max) {
      return {
        value: null,
        error: {
          type: "INVALID_WAVE_NUMBER",
          message: `Row ${rowIndex}: Wave number must be between ${min} and ${max}, got ${numValue}`,
          rowIndex,
          fieldName: "waveNumber",
          value,
        },
      };
    }

    return { value: numValue, error: null };
  }

  /**
   * 敵タイプを検証する
   */
  private static validateEnemyType(
    value: string,
    rowIndex: number,
  ): ValidationResult<EnemyType> {
    const trimmedValue = value.trim().toLowerCase();

    return { value: trimmedValue as EnemyType, error: null };
  }

  /**
   * 敵の数を検証する
   */
  private static validateCount(
    value: string,
    rowIndex: number,
  ): ValidationResult<number> {
    const numValue = CSVValidator.parseNumber(value);

    if (numValue === null) {
      return {
        value: null,
        error: {
          type: "INVALID_COUNT",
          message: `Row ${rowIndex}: Count must be a valid number, got '${value}'`,
          rowIndex,
          fieldName: "count",
          value,
        },
      };
    }

    const { min, max } = CSV_SCHEMA.fieldConstraints.count;
    if (numValue < min || numValue > max) {
      return {
        value: null,
        error: {
          type: "INVALID_COUNT",
          message: `Row ${rowIndex}: Count must be between ${min} and ${max}, got ${numValue}`,
          rowIndex,
          fieldName: "count",
          value,
        },
      };
    }

    return { value: numValue, error: null };
  }

  /**
   * スポーン間隔を検証する
   */
  private static validateSpawnInterval(
    value: string,
    rowIndex: number,
  ): ValidationResult<number> {
    const numValue = CSVValidator.parseNumber(value);

    if (numValue === null) {
      return {
        value: null,
        error: {
          type: "INVALID_SPAWN_INTERVAL",
          message: `Row ${rowIndex}: Spawn interval must be a valid number, got '${value}'`,
          rowIndex,
          fieldName: "spawnInterval",
          value,
        },
      };
    }

    const { min, max } = CSV_SCHEMA.fieldConstraints.spawnInterval;
    if (numValue < min || numValue > max) {
      return {
        value: null,
        error: {
          type: "INVALID_SPAWN_INTERVAL",
          message: `Row ${rowIndex}: Spawn interval must be between ${min}ms and ${max}ms, got ${numValue}ms`,
          rowIndex,
          fieldName: "spawnInterval",
          value,
        },
      };
    }

    return { value: numValue, error: null };
  }

  /**
   * スポーン遅延を検証する
   */
  private static validateSpawnDelay(
    value: string,
    rowIndex: number,
  ): ValidationResult<number> {
    const numValue = CSVValidator.parseNumber(value);

    if (numValue === null) {
      return {
        value: null,
        error: {
          type: "INVALID_SPAWN_DELAY",
          message: `Row ${rowIndex}: Spawn delay must be a valid number, got '${value}'`,
          rowIndex,
          fieldName: "spawnDelay",
          value,
        },
      };
    }

    const { min, max } = CSV_SCHEMA.fieldConstraints.spawnDelay;
    if (numValue < min || numValue > max) {
      return {
        value: null,
        error: {
          type: "INVALID_SPAWN_DELAY",
          message: `Row ${rowIndex}: Spawn delay must be between ${min}ms and ${max}ms, got ${numValue}ms`,
          rowIndex,
          fieldName: "spawnDelay",
          value,
        },
      };
    }

    return { value: numValue, error: null };
  }

  /**
   * スポーンX座標を検証する
   */
  private static validateSpawnX(
    value: string,
    rowIndex: number,
  ): ValidationResult<number> {
    const numValue = CSVValidator.parseNumber(value);

    if (numValue === null) {
      return {
        value: null,
        error: {
          type: "INVALID_SPAWN_X",
          message: `Row ${rowIndex}: Spawn X coordinate must be a valid number, got '${value}'`,
          rowIndex,
          fieldName: "spawnX",
          value,
        },
      };
    }

    const { min, max } = CSV_SCHEMA.fieldConstraints.spawnX;
    if (numValue < min || numValue > max) {
      return {
        value: null,
        error: {
          type: "INVALID_SPAWN_X",
          message: `Row ${rowIndex}: Spawn X coordinate must be between ${min} and ${max}, got ${numValue}`,
          rowIndex,
          fieldName: "spawnX",
          value,
        },
      };
    }

    return { value: numValue, error: null };
  }

  /**
   * スポーンY座標を検証する
   */
  private static validateSpawnY(
    value: string,
    rowIndex: number,
  ): ValidationResult<number> {
    const numValue = CSVValidator.parseNumber(value);

    if (numValue === null) {
      return {
        value: null,
        error: {
          type: "INVALID_SPAWN_Y",
          message: `Row ${rowIndex}: Spawn Y coordinate must be a valid number, got '${value}'`,
          rowIndex,
          fieldName: "spawnY",
          value,
        },
      };
    }

    const { min, max } = CSV_SCHEMA.fieldConstraints.spawnY;
    if (numValue < min || numValue > max) {
      return {
        value: null,
        error: {
          type: "INVALID_SPAWN_Y",
          message: `Row ${rowIndex}: Spawn Y coordinate must be between ${min} and ${max}, got ${numValue}`,
          rowIndex,
          fieldName: "spawnY",
          value,
        },
      };
    }

    return { value: numValue, error: null };
  }

  /**
   * 構造物ターゲット優先度を検証する
   */
  private static validateStructureTargetPriority(
    value: string | undefined,
    rowIndex: number,
  ): ValidationResult<StructureTargetPriority | null> {
    // オプショナルフィールドなので、値がない場合はnullを返す
    if (!value || value.trim() === "") {
      return { value: null, error: null };
    }

    const trimmedValue = value.trim().toLowerCase();

    if (
      !CSV_SCHEMA.validStructureTargetPriorities.includes(trimmedValue as any)
    ) {
      return {
        value: null,
        error: {
          type: "INVALID_STRUCTURE_TARGET_PRIORITY",
          message: `Row ${rowIndex}: Invalid structure target priority '${value}'. Valid priorities: ${CSV_SCHEMA.validStructureTargetPriorities.join(", ")}`,
          rowIndex,
          fieldName: "structureTargetPriority",
          value,
        },
      };
    }

    return { value: trimmedValue as StructureTargetPriority, error: null };
  }

  /**
   * 文字列を数値に変換する
   * @param value 変換する文字列
   * @returns 変換された数値、または変換失敗時はnull
   */
  private static parseNumber(value: string): number | null {
    const trimmedValue = value.trim();

    if (trimmedValue === "") {
      return null;
    }

    const numValue = Number(trimmedValue);

    if (Number.isNaN(numValue) || !Number.isFinite(numValue)) {
      return null;
    }

    return numValue;
  }

  /**
   * CSVデータの統計情報を取得する
   * @param validationResult 検証結果
   * @returns 統計情報
   */
  public static getValidationStats(validationResult: CSVValidationResult) {
    const errorsByType = validationResult.errors.reduce(
      (acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      },
      {} as Record<CSVValidationErrorType, number>,
    );

    const waveNumbers = [
      ...new Set(validationResult.validRows.map((row) => row.waveNumber)),
    ].sort((a, b) => a - b);
    const enemyTypes = [
      ...new Set(validationResult.validRows.map((row) => row.enemyType)),
    ];

    return {
      totalRows: validationResult.totalRows,
      validRows: validationResult.validRowCount,
      invalidRows: validationResult.totalRows - validationResult.validRowCount,
      errorCount: validationResult.errors.length,
      errorsByType,
      waveNumbers,
      enemyTypes,
      successRate:
        validationResult.totalRows > 0
          ? (validationResult.validRowCount / validationResult.totalRows) * 100
          : 0,
    };
  }
}

/**
 * 検証結果の型
 */
type ValidationResult<T> = {
  value: T | null;
  error: CSVValidationError | null;
};
