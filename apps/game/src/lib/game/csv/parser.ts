import Papa from "papaparse";
import {
  CSV_CONFIG,
  CSV_HEADERS,
  type CSVRawRow,
  type CSVValidationResult,
} from "./types";
import { CSVValidator } from "./validator";

/**
 * CSVパーサークラス
 * react-papaparseを使用してCSVファイルを解析する
 */
export class CSVParser {
  /**
   * CSVテキストを解析して検証済みデータを返す
   * @param csvText CSVファイルの内容
   * @returns 検証結果
   */
  public static parseCSVText(csvText: string): CSVValidationResult {
    try {
      // Papa Parseを使用してCSVを解析
      const parseResult = Papa.parse<CSVRawRow>(csvText, {
        ...CSV_CONFIG,
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          const trimmed = header.trim();
          // ヘッダー名の正規化
          return CSVParser.normalizeHeaderName(trimmed);
        },
        transform: (value: string) => value.trim(),
      });

      if (parseResult.errors.length > 0) {
        console.warn("CSV Parse warnings:", parseResult.errors);
      }

      // ヘッダーの検証
      const headerValidation = CSVParser.validateHeaders(
        parseResult.meta.fields || [],
      );
      if (!headerValidation.isValid) {
        return {
          isValid: false,
          validRows: [],
          errors: headerValidation.errors,
          totalRows: 0,
          validRowCount: 0,
        };
      }

      // データの検証
      return CSVValidator.validateCSVData(parseResult.data);
    } catch (error) {
      console.error("CSV parsing failed:", error);
      return {
        isValid: false,
        validRows: [],
        errors: [
          {
            type: "MISSING_REQUIRED_FIELD",
            message: `CSV parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            rowIndex: 0,
          },
        ],
        totalRows: 0,
        validRowCount: 0,
      };
    }
  }

  /**
   * CSVファイルを非同期で読み込んで解析する
   * @param file ファイルオブジェクト
   * @returns 検証結果のPromise
   */
  public static async parseCSVFile(file: File): Promise<CSVValidationResult> {
    return new Promise((resolve) => {
      Papa.parse<CSVRawRow>(file, {
        ...CSV_CONFIG,
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          const trimmed = header.trim();
          return CSVParser.normalizeHeaderName(trimmed);
        },
        transform: (value: string) => value.trim(),
        complete: (result) => {
          if (result.errors.length > 0) {
            console.warn("CSV Parse warnings:", result.errors);
          }

          // ヘッダーの検証
          const headerValidation = CSVParser.validateHeaders(
            result.meta.fields || [],
          );
          if (!headerValidation.isValid) {
            resolve({
              isValid: false,
              validRows: [],
              errors: headerValidation.errors,
              totalRows: 0,
              validRowCount: 0,
            });
            return;
          }

          // データの検証
          const validationResult = CSVValidator.validateCSVData(result.data);
          resolve(validationResult);
        },
        error: (error) => {
          console.error("CSV parsing failed:", error);
          resolve({
            isValid: false,
            validRows: [],
            errors: [
              {
                type: "MISSING_REQUIRED_FIELD",
                message: `CSV parsing failed: ${error.message}`,
                rowIndex: 0,
              },
            ],
            totalRows: 0,
            validRowCount: 0,
          });
        },
      });
    });
  }

  /**
   * ヘッダー名を正規化する
   * @param header 元のヘッダー名
   * @returns 正規化されたヘッダー名
   */
  private static normalizeHeaderName(header: string): string {
    // 一般的なヘッダー名のバリエーションを正規化
    const normalizedMap: Record<string, string> = {
      wave: "waveNumber",
      wave_number: "waveNumber",
      wavenum: "waveNumber",
      enemy: "enemyType",
      enemy_type: "enemyType",
      type: "enemyType",
      spawn_interval: "spawnInterval",
      interval: "spawnInterval",
      spawn_delay: "spawnDelay",
      delay: "spawnDelay",
      spawn_x: "spawnX",
      x: "spawnX",
      spawn_y: "spawnY",
      y: "spawnY",
    };

    const lowerHeader = header.toLowerCase();
    return normalizedMap[lowerHeader] || header;
  }

  /**
   * CSVヘッダーを検証する
   * @param headers 解析されたヘッダー配列
   * @returns ヘッダー検証結果
   */
  private static validateHeaders(headers: string[]): {
    isValid: boolean;
    errors: any[];
  } {
    const errors: any[] = [];
    const normalizedHeaders = headers.map((h) =>
      CSVParser.normalizeHeaderName(h.trim()),
    );

    // 必須ヘッダーの存在チェック
    for (const requiredHeader of CSV_HEADERS) {
      if (!normalizedHeaders.includes(requiredHeader)) {
        errors.push({
          type: "MISSING_REQUIRED_FIELD",
          message: `Missing required header: '${requiredHeader}'. Found headers: ${headers.join(", ")}`,
          rowIndex: 0,
          fieldName: requiredHeader,
        });
      }
    }

    // 重複ヘッダーのチェック
    const headerCounts = normalizedHeaders.reduce(
      (acc, header) => {
        acc[header] = (acc[header] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    for (const [header, count] of Object.entries(headerCounts)) {
      if (count > 1) {
        errors.push({
          type: "MISSING_REQUIRED_FIELD",
          message: `Duplicate header found: '${header}' appears ${count} times`,
          rowIndex: 0,
          fieldName: header,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * CSVデータをテキスト形式で出力する
   * @param data CSVデータ
   * @returns CSV形式のテキスト
   */
  public static generateCSVText(data: CSVRawRow[]): string {
    return Papa.unparse(data, {
      header: true,
      delimiter: CSV_CONFIG.delimiter,
    });
  }

  /**
   * サンプルCSVデータを生成する
   * @returns サンプルCSVデータ
   */
  public static generateSampleCSV(): string {
    const sampleData: CSVRawRow[] = [
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
        waveNumber: "1",
        enemyType: "basic",
        count: "3",
        spawnInterval: "2000",
        spawnDelay: "0",
        spawnX: "3",
        spawnY: "9",
      },
      {
        waveNumber: "2",
        enemyType: "basic",
        count: "8",
        spawnInterval: "1500",
        spawnDelay: "0",
        spawnX: "3",
        spawnY: "8",
      },
      {
        waveNumber: "2",
        enemyType: "fast",
        count: "3",
        spawnInterval: "3000",
        spawnDelay: "5000",
        spawnX: "3",
        spawnY: "9",
      },
      {
        waveNumber: "3",
        enemyType: "basic",
        count: "10",
        spawnInterval: "1000",
        spawnDelay: "0",
        spawnX: "3",
        spawnY: "8",
      },
      {
        waveNumber: "3",
        enemyType: "fast",
        count: "5",
        spawnInterval: "2000",
        spawnDelay: "3000",
        spawnX: "3",
        spawnY: "9",
      },
      {
        waveNumber: "3",
        enemyType: "heavy",
        count: "2",
        spawnInterval: "5000",
        spawnDelay: "10000",
        spawnX: "3",
        spawnY: "8",
      },
    ];

    return CSVParser.generateCSVText(sampleData);
  }

  /**
   * CSVパース設定を取得する
   * @returns Papa Parse設定オブジェクト
   */
  public static getParseConfig() {
    return { ...CSV_CONFIG };
  }
}
