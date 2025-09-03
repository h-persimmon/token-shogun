import type { Point } from "../components/position-component";
import type { EnemyWaveConfig } from "../system/enemy-spawn-system";
import { CSVLogger } from "./logger";
import { CSVParser } from "./parser";
import { type CSVLoadResult, type CSVRow, DEFAULT_CSV_PATH } from "./types";

/**
 * CSVファイルからウェーブ設定を読み込むクラス
 */
export class CSVWaveConfigLoader {
  private csvFilePath: string;
  private cachedConfigs: EnemyWaveConfig[] | null = null;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1秒

  constructor(csvFilePath: string = DEFAULT_CSV_PATH) {
    this.csvFilePath = csvFilePath;
    CSVLogger.info(`CSVWaveConfigLoader initialized with path: ${csvFilePath}`);
  }

  /**
   * CSVファイルからウェーブ設定を読み込む
   * @param forceReload キャッシュを無視して強制的に再読み込みする場合true
   * @returns ウェーブ設定の配列
   */
  public async loadWaveConfigs(
    forceReload: boolean = false,
  ): Promise<EnemyWaveConfig[]> {
    try {
      // キャッシュが有効で強制再読み込みでない場合はキャッシュを返す
      if (!forceReload && this.cachedConfigs !== null) {
        CSVLogger.debug("Returning cached wave configs");
        return this.cachedConfigs;
      }

      CSVLogger.info(`Loading wave configs from: ${this.csvFilePath}`);

      // CSVファイルを読み込む
      const loadResult = await this.loadCSVFileWithRetry();
      console.log(loadResult);

      if (!loadResult.success) {
        CSVLogger.error("Failed to load CSV file, using default configs");
        return this.getDefaultWaveConfigs();
      }

      // CSVデータをウェーブ設定に変換
      const waveConfigs = this.convertToWaveConfigs(loadResult.data);

      // キャッシュを更新
      this.cachedConfigs = waveConfigs;

      CSVLogger.info(`Successfully loaded ${waveConfigs.length} wave configs`);
      return waveConfigs;
    } catch (error) {
      CSVLogger.error(
        "Unexpected error during wave config loading",
        error as any,
      );
      return this.getDefaultWaveConfigs();
    }
  }

  /**
   * CSVファイルのパスを設定する
   * @param csvFilePath 新しいCSVファイルパス
   */
  public setCSVFilePath(csvFilePath: string): void {
    if (this.csvFilePath !== csvFilePath) {
      this.csvFilePath = csvFilePath;
      this.cachedConfigs = null; // キャッシュをクリア
      CSVLogger.info(`CSV file path changed to: ${csvFilePath}`);
    }
  }

  /**
   * 現在のCSVファイルパスを取得する
   * @returns CSVファイルパス
   */
  public getCSVFilePath(): string {
    return this.csvFilePath;
  }

  /**
   * CSVファイルを再試行付きで読み込む
   * @returns CSV読み込み結果
   */
  private async loadCSVFileWithRetry(): Promise<CSVLoadResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        CSVLogger.debug(
          `Loading CSV file (attempt ${attempt}/${this.maxRetries})`,
        );

        const response = await fetch(this.csvFilePath);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const csvText = await response.text();
        const lastModified = this.parseLastModified(
          response.headers.get("last-modified"),
        );

        // CSVテキストを解析
        const validationResult = CSVParser.parseCSVText(csvText);
        return {
          success:
            validationResult.isValid || validationResult.validRows.length > 0,
          data: validationResult.validRows,
          errors: validationResult.errors,
          filePath: this.csvFilePath,
          lastModified,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        CSVLogger.warn(`Attempt ${attempt} failed: ${lastError.message}`);

        // 最後の試行でない場合は待機
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay);
        }
      }
    }

    // すべての試行が失敗した場合
    CSVLogger.error(
      `All ${this.maxRetries} attempts failed. Last error: ${lastError?.message}`,
    );

    return {
      success: false,
      data: [],
      errors: [
        {
          type: "MISSING_REQUIRED_FIELD",
          message: `Failed to load CSV file after ${this.maxRetries} attempts: ${lastError?.message}`,
          rowIndex: 0,
        },
      ],
      filePath: this.csvFilePath,
    };
  }

  /**
   * Last-Modifiedヘッダーを解析する
   * @param lastModifiedHeader Last-Modifiedヘッダーの値
   * @returns タイムスタンプ（解析できない場合は現在時刻）
   */
  private parseLastModified(lastModifiedHeader: string | null): number {
    if (!lastModifiedHeader) {
      return Date.now();
    }

    const timestamp = Date.parse(lastModifiedHeader);
    return Number.isNaN(timestamp) ? Date.now() : timestamp;
  }

  /**
   * 指定時間待機する
   * @param ms 待機時間（ミリ秒）
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * CSVRowの配列をEnemyWaveConfigの配列に変換する
   * @param csvRows CSVデータの配列
   * @returns ウェーブ設定の配列
   */
  private convertToWaveConfigs(csvRows: CSVRow[]): EnemyWaveConfig[] {
    if (csvRows.length === 0) {
      CSVLogger.warn("No valid CSV rows to convert");
      return this.getDefaultWaveConfigs();
    }

    // ウェーブ番号でグループ化
    const waveGroups = new Map<number, CSVRow[]>();

    for (const row of csvRows) {
      if (!waveGroups.has(row.waveNumber)) {
        waveGroups.set(row.waveNumber, []);
      }
      waveGroups.get(row.waveNumber)?.push(row);
    }

    // 各ウェーブグループをEnemyWaveConfigに変換
    const waveConfigs: EnemyWaveConfig[] = [];

    waveGroups.forEach((rows, waveNumber) => {
      const waveConfig = this.convertRowsToWaveConfig(waveNumber, rows);
      if (waveConfig) {
        waveConfigs.push(waveConfig);
      }
    });

    // ウェーブ番号でソート
    waveConfigs.sort((a, b) => a.waveNumber - b.waveNumber);

    CSVLogger.info(
      `Converted ${csvRows.length} CSV rows into ${waveConfigs.length} wave configs`,
    );
    return waveConfigs;
  }

  /**
   * 同一ウェーブの行をEnemyWaveConfigに変換する
   * @param waveNumber ウェーブ番号
   * @param rows 同一ウェーブの行の配列
   * @returns ウェーブ設定（変換に失敗した場合はnull）
   */
  private convertRowsToWaveConfig(
    waveNumber: number,
    rows: CSVRow[],
  ): EnemyWaveConfig | null {
    if (rows.length === 0) {
      return null;
    }

    try {
      // スポーン地点を収集（重複を除去）
      const spawnPointsSet = new Set<string>();
      const spawnPoints: Point[] = [];

      for (const row of rows) {
        const pointKey = `${row.spawnX},${row.spawnY}`;
        if (!spawnPointsSet.has(pointKey)) {
          spawnPointsSet.add(pointKey);
          spawnPoints.push({ x: row.spawnX, y: row.spawnY });
        }
      }

      // 敵設定を作成
      const enemies = rows.map((row) => ({
        type: row.enemyType,
        count: row.count,
        spawnInterval: row.spawnInterval,
        spawnDelay: row.spawnDelay,
        structureTargetPriority: row.structureTargetPriority,
      }));

      const waveConfig: EnemyWaveConfig = {
        waveNumber,
        enemies,
        spawnPoints,
      };

      CSVLogger.debug(
        `Created wave config for wave ${waveNumber} with ${enemies.length} enemy types and ${spawnPoints.length} spawn points`,
      );
      return waveConfig;
    } catch (error) {
      CSVLogger.error(
        `Failed to convert rows to wave config for wave ${waveNumber}`,
        error as any,
      );
      return null;
    }
  }

  /**
   * デフォルトのウェーブ設定を取得する
   * @returns デフォルトのウェーブ設定配列
   */
  private getDefaultWaveConfigs(): EnemyWaveConfig[] {
    const defaultSpawnPoints: Point[] = [
      { x: 3, y: 8 },
      { x: 3, y: 9 },
    ];

    return [
      {
        waveNumber: 1,
        enemies: [
          {
            type: "basic",
            count: 5,
            spawnInterval: 2000,
            spawnDelay: 0,
          },
        ],
        spawnPoints: defaultSpawnPoints,
      },
      {
        waveNumber: 2,
        enemies: [
          {
            type: "basic",
            count: 8,
            spawnInterval: 1500,
            spawnDelay: 0,
          },
          {
            type: "fast",
            count: 3,
            spawnInterval: 3000,
            spawnDelay: 5000,
          },
        ],
        spawnPoints: defaultSpawnPoints,
      },
      {
        waveNumber: 3,
        enemies: [
          {
            type: "basic",
            count: 10,
            spawnInterval: 1000,
            spawnDelay: 0,
          },
          {
            type: "fast",
            count: 5,
            spawnInterval: 2000,
            spawnDelay: 3000,
          },
          {
            type: "heavy",
            count: 2,
            spawnInterval: 5000,
            spawnDelay: 10000,
          },
        ],
        spawnPoints: defaultSpawnPoints,
      },
    ];
  }
}
