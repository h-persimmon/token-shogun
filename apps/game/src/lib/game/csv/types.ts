import type {
  EnemyType,
  StructureTargetPriority,
} from "../components/enemy-component";

/**
 * CSVファイルの各行を表現する型
 */
export type CSVRow = {
  waveNumber: number;
  enemyType: EnemyType;
  count: number;
  spawnInterval: number;
  spawnDelay: number;
  spawnX: number;
  spawnY: number;
  structureTargetPriority?: StructureTargetPriority;
};

/**
 * CSVファイルの生データ（パース前）
 */
export type CSVRawRow = {
  waveNumber: string;
  enemyType: string;
  count: string;
  spawnInterval: string;
  spawnDelay: string;
  spawnX: string;
  spawnY: string;
  structureTargetPriority?: string;
};

/**
 * CSV検証エラーの種類
 */
export type CSVValidationErrorType =
  | "INVALID_WAVE_NUMBER"
  | "INVALID_ENEMY_TYPE"
  | "INVALID_COUNT"
  | "INVALID_SPAWN_INTERVAL"
  | "INVALID_SPAWN_DELAY"
  | "INVALID_SPAWN_X"
  | "INVALID_SPAWN_Y"
  | "INVALID_STRUCTURE_TARGET_PRIORITY"
  | "MISSING_REQUIRED_FIELD";

/**
 * CSV検証エラー情報
 */
export type CSVValidationError = {
  type: CSVValidationErrorType;
  message: string;
  rowIndex: number;
  fieldName?: string;
  value?: string;
};

/**
 * CSV検証結果
 */
export type CSVValidationResult = {
  isValid: boolean;
  validRows: CSVRow[];
  errors: CSVValidationError[];
  totalRows: number;
  validRowCount: number;
};

/**
 * CSVファイル読み込み結果
 */
export type CSVLoadResult = {
  success: boolean;
  data: CSVRow[];
  errors: CSVValidationError[];
  filePath: string;
  lastModified?: number;
};

/**
 * CSVファイルスキーマ定義
 */
export const CSV_SCHEMA = {
  requiredFields: [
    "waveNumber",
    "enemyType",
    "count",
    "spawnInterval",
    "spawnDelay",
    "spawnX",
    "spawnY",
  ] as const,

  optionalFields: ["structureTargetPriority"] as const,

  fieldTypes: {
    waveNumber: "number",
    enemyType: "string",
    count: "number",
    spawnInterval: "number",
    spawnDelay: "number",
    spawnX: "number",
    spawnY: "number",
    structureTargetPriority: "string",
  } as const,

  fieldConstraints: {
    waveNumber: { min: 1, max: 999 },
    count: { min: 1, max: 100 },
    spawnInterval: { min: 100, max: 60000 }, // 0.1秒から60秒
    spawnDelay: { min: 0, max: 300000 }, // 0秒から5分
    spawnX: { min: -1000, max: 1000 },
    spawnY: { min: -1000, max: 1000 },
  } as const,

  validEnemyTypes: ["basic", "fast", "heavy"] as const,
  validStructureTargetPriorities: ["gate", "defense", "any"] as const,
} as const;

/**
 * CSVファイルのヘッダー行
 */
export const CSV_HEADERS = [
  "waveNumber",
  "enemyType",
  "count",
  "spawnInterval",
  "spawnDelay",
  "spawnX",
  "spawnY",
  "structureTargetPriority",
] as const;

/**
 * デフォルトのCSVファイルパス
 */
export const DEFAULT_CSV_PATH = "/config/enemy-waves.csv";

/**
 * CSVファイル設定
 */
export const CSV_CONFIG = {
  encoding: "utf-8",
  delimiter: ",",
  skipEmptyLines: true,
  header: true,
  transformHeader: (header: string) => header.trim(),
  transform: (value: string) => value.trim(),
} as const;
