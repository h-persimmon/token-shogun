import { type EnemyType } from "../components/enemy-component";
import { type Point } from "../components/position-component";
import { CSVWaveConfigLoader } from "../csv/csv-wave-config-loader";
import { enemyUnitConfigToEntity } from "../entities/enemyUnitConfigToEntity";
import type { Entity } from "../entities/entity";
import type { EntityManager } from "../entities/entity-manager";

/**
 * 敵生成設定
 */
export type EnemyWaveConfig = {
  waveNumber: number;
  enemies: Array<{
    type: EnemyType;
    count: number;
    spawnInterval: number; // ミリ秒
    spawnDelay: number; // ウェーブ開始からの遅延
    structureTargetPriority?: string; // 構造物ターゲット優先度
  }>;
  spawnPoints: Point[];
};

/**
 * 敵タイプ別のスポーン状態
 */
type EnemyTypeSpawnState = {
  enemyTypeIndex: number;
  spawnedCount: number;
  lastSpawnTime: number;
  isCompleted: boolean;
  nextSpawnTime: number; // 次のスポーン予定時刻
};

/**
 * スポーン状態の管理
 */
type SpawnState = {
  waveNumber: number;
  waveStartTime: number;
  isWaveActive: boolean;
  currentSpawnPointIndex: number;
  enemyTypeStates: Map<number, EnemyTypeSpawnState>; // 敵タイプ別の状態管理
  completedEnemyTypes: Set<number>; // 完了した敵タイプのインデックス
};

export class EnemySpawnSystem {
  private entityManager: EntityManager;
  private waveConfigs: EnemyWaveConfig[];
  private spawnState: SpawnState;
  private totalEnemiesSpawned: number;
  private waveCompletionCallbacks: Map<number, () => void>;
  private csvLoader: CSVWaveConfigLoader | null;
  private gameStateSystem?: any; // GameStateSystemの参照

  constructor(
    entityManager: EntityManager,
    _scene: Phaser.Scene,
    waveConfigs: EnemyWaveConfig[] = [],
  ) {
    this.entityManager = entityManager;
    this.waveConfigs = waveConfigs;
    this.totalEnemiesSpawned = 0;
    this.waveCompletionCallbacks = new Map();
    this.csvLoader = null;

    // スポーン状態の初期化
    this.spawnState = {
      waveNumber: 0,
      waveStartTime: 0,
      isWaveActive: false,
      currentSpawnPointIndex: 0,
      enemyTypeStates: new Map(),
      completedEnemyTypes: new Set(),
    };
  }

  /**
   * GameStateSystemの参照を設定
   * @param gameStateSystem GameStateSystemのインスタンス
   */
  public setGameStateSystem(gameStateSystem: any): void {
    this.gameStateSystem = gameStateSystem;
  }

  /**
   * システムの更新処理
   * @param currentTime 現在時刻（ミリ秒）
   */
  public update(currentTime: number): void {
    if (!this.spawnState.isWaveActive) {
      return;
    }

    const currentWaveConfig = this.getCurrentWaveConfig();
    if (!currentWaveConfig) {
      return;
    }

    // 各敵タイプの状態を並行して処理
    let hasActiveEnemyTypes = false;

    for (
      let enemyTypeIndex = 0;
      enemyTypeIndex < currentWaveConfig.enemies.length;
      enemyTypeIndex++
    ) {
      const enemyConfig = currentWaveConfig.enemies[enemyTypeIndex];

      // 敵タイプの状態を取得または初期化
      let enemyTypeState = this.spawnState.enemyTypeStates.get(enemyTypeIndex);
      if (!enemyTypeState) {
        enemyTypeState = this.initializeEnemyTypeState(
          enemyTypeIndex,
          enemyConfig,
          currentTime,
        );
        this.spawnState.enemyTypeStates.set(enemyTypeIndex, enemyTypeState);
      }

      // 完了済みの敵タイプはスキップ
      if (enemyTypeState.isCompleted) {
        continue;
      }

      hasActiveEnemyTypes = true;

      // スポーン遅延チェック
      const timeSinceWaveStart = currentTime - this.spawnState.waveStartTime;
      if (timeSinceWaveStart < enemyConfig.spawnDelay) {
        continue;
      }

      // 次のスポーン時刻チェック
      if (currentTime < enemyTypeState.nextSpawnTime) {
        continue;
      }

      // 敵を生成
      if (enemyTypeState.spawnedCount < enemyConfig.count) {
        const spawnedEnemy = this.spawnEnemy(
          enemyConfig.type,
          currentTime
        );
        if (spawnedEnemy) {
          enemyTypeState.spawnedCount++;
          enemyTypeState.lastSpawnTime = currentTime;
          enemyTypeState.nextSpawnTime =
            currentTime + enemyConfig.spawnInterval;

          // 生成完了チェック
          if (enemyTypeState.spawnedCount >= enemyConfig.count) {
            enemyTypeState.isCompleted = true;
            this.spawnState.completedEnemyTypes.add(enemyTypeIndex);
            console.log(
              `EnemySpawnSystem: Completed spawning ${enemyConfig.type} enemies for wave ${this.spawnState.waveNumber}`,
            );
          }
        }
      }
    }

    // すべての敵タイプが完了した場合はウェーブ完了
    if (!hasActiveEnemyTypes) {
      this.checkWaveCompletion();
    }
  }

  /**
   * ウェーブを開始する
   * @param waveNumber ウェーブ番号（1から開始）
   * @param currentTime 現在時刻（ミリ秒）
   * @returns 開始に成功した場合true
   */
  public startWave(
    waveNumber: number,
    currentTime: number = Date.now(),
  ): boolean {
    if (this.spawnState.isWaveActive) {
      console.warn(
        `EnemySpawnSystem: Wave ${this.spawnState.waveNumber} is already active`,
      );
      return false;
    }

    const waveConfig = this.getWaveConfig(waveNumber);
    if (!waveConfig) {
      console.warn(
        `EnemySpawnSystem: Wave config for wave ${waveNumber} not found`,
      );
      return false;
    }

    // スポーン状態をリセット
    this.spawnState = {
      waveNumber,
      waveStartTime: currentTime,
      isWaveActive: true,
      currentSpawnPointIndex: 0,
      enemyTypeStates: new Map(),
      completedEnemyTypes: new Set(),
    };

    console.log(`EnemySpawnSystem: Started wave ${waveNumber}`);
    return true;
  }

  /**
   * 現在のウェーブを停止する
   */
  public stopCurrentWave(): void {
    if (!this.spawnState.isWaveActive) {
      return;
    }

    this.spawnState.isWaveActive = false;
    console.log(`EnemySpawnSystem: Stopped wave ${this.spawnState.waveNumber}`);
  }

  /**
   * 敵を生成する
   * @param enemyType 敵の種類
   * @param currentTime 現在時刻（ミリ秒）
   * @param structureTargetPriority 構造物ターゲット優先度（オプション）
   * @returns 生成されたエンティティ（失敗時はnull）
   */
  public spawnEnemy(
    enemyType: EnemyType,
    currentTime: number = Date.now(),
  ): Entity | null {
    const spawnPoint = this.getNextSpawnPoint();
    if (!spawnPoint) {
      console.warn("EnemySpawnSystem: No spawn points available");
      return null;
    }

    const entity = enemyUnitConfigToEntity(enemyType, this.entityManager, spawnPoint.x, spawnPoint.y);
    // 統計を更新
    this.totalEnemiesSpawned++;

    // GameStateSystemに敵生成を通知
    if (this.gameStateSystem) {
      this.gameStateSystem.notifyEnemySpawned(entity.id, currentTime);
    }

    console.log(
      `EnemySpawnSystem: Spawned ${enemyType} enemy at (${spawnPoint.x}, ${spawnPoint.y}) [Total: ${this.totalEnemiesSpawned}]`,
    );
    return entity;
  }

  /**
   * ウェーブ設定を追加する
   * @param waveConfig ウェーブ設定
   */
  public addWaveConfig(waveConfig: EnemyWaveConfig): void {
    this.waveConfigs.push(waveConfig);
    this.waveConfigs.sort((a, b) => a.waveNumber - b.waveNumber);
  }

  /**
   * ウェーブ設定を取得する
   * @param waveNumber ウェーブ番号
   * @returns ウェーブ設定（見つからない場合はundefined）
   */
  public getWaveConfig(waveNumber: number): EnemyWaveConfig | undefined {
    return this.waveConfigs.find((config) => config.waveNumber === waveNumber);
  }

  /**
   * 利用可能なウェーブ番号の一覧を取得する
   * @returns ソートされたウェーブ番号の配列
   */
  public getAvailableWaveNumbers(): number[] {
    return this.waveConfigs
      .map((config) => config.waveNumber)
      .sort((a, b) => a - b);
  }

  /**
   * 指定されたウェーブ番号の次に利用可能なウェーブ番号を取得する
   * @param currentWaveNumber 現在のウェーブ番号
   * @returns 次のウェーブ番号（存在しない場合はnull）
   */
  public getNextAvailableWaveNumber(currentWaveNumber: number): number | null {
    const availableWaves = this.getAvailableWaveNumbers();
    const nextWave = availableWaves.find(
      (waveNumber) => waveNumber > currentWaveNumber,
    );
    return nextWave || null;
  }

  /**
   * 指定されたウェーブ番号の前に利用可能なウェーブ番号を取得する
   * @param currentWaveNumber 現在のウェーブ番号
   * @returns 前のウェーブ番号（存在しない場合はnull）
   */
  public getPreviousAvailableWaveNumber(
    currentWaveNumber: number,
  ): number | null {
    const availableWaves = this.getAvailableWaveNumbers();
    const previousWaves = availableWaves.filter(
      (waveNumber) => waveNumber < currentWaveNumber,
    );
    return previousWaves.length > 0
      ? previousWaves[previousWaves.length - 1]
      : null;
  }

  /**
   * 現在のウェーブ設定を取得する
   * @returns 現在のウェーブ設定（見つからない場合はundefined）
   */
  public getCurrentWaveConfig(): EnemyWaveConfig | undefined {
    return this.getWaveConfig(this.spawnState.waveNumber);
  }

  /**
   * 現在のウェーブ状態を取得する
   * @returns ウェーブ状態の情報
   */
  public getWaveStatus() {
    const currentWaveConfig = this.getCurrentWaveConfig();
    const totalEnemiesInWave =
      currentWaveConfig?.enemies.reduce((sum, enemy) => sum + enemy.count, 0) ||
      0;
    const totalSpawnedInWave = this.getTotalSpawnedInCurrentWave();

    // 敵タイプ別の進捗情報を作成
    const enemyTypeProgress: Array<{
      type: EnemyType;
      spawned: number;
      total: number;
      completed: boolean;
    }> = [];

    if (currentWaveConfig) {
      for (let i = 0; i < currentWaveConfig.enemies.length; i++) {
        const enemyConfig = currentWaveConfig.enemies[i];
        const state = this.spawnState.enemyTypeStates.get(i);

        enemyTypeProgress.push({
          type: enemyConfig.type,
          spawned: state?.spawnedCount || 0,
          total: enemyConfig.count,
          completed: state?.isCompleted || false,
        });
      }
    }

    return {
      isActive: this.spawnState.isWaveActive,
      waveNumber: this.spawnState.waveNumber,
      totalEnemiesInWave,
      totalSpawnedInWave,
      waveProgress:
        totalEnemiesInWave > 0 ? totalSpawnedInWave / totalEnemiesInWave : 0,
      enemyTypeProgress,
      completedEnemyTypes: this.spawnState.completedEnemyTypes.size,
      totalEnemyTypes: currentWaveConfig?.enemies.length || 0,
    };
  }

  /**
   * 敵エンティティの統計を取得する
   * @returns エンティティ統計情報
   */
  public getEnemyStats() {
    return {
      totalEnemiesSpawned: this.totalEnemiesSpawned,
      activeEnemies: this.entityManager.queryEntities({ required: ["enemy"] })
        .length,
    };
  }

  /**
   * ウェーブ完了時のコールバックを設定する
   * @param waveNumber ウェーブ番号
   * @param callback 完了時に呼び出されるコールバック関数
   */
  public setWaveCompletionCallback(
    waveNumber: number,
    callback: () => void,
  ): void {
    this.waveCompletionCallbacks.set(waveNumber, callback);
  }

  /**
   * 指定された敵タイプの生成を強制的に開始する
   * @param enemyType 敵の種類
   * @param count 生成数
   * @param spawnInterval 生成間隔（ミリ秒）
   * @param spawnPoints スポーン地点（省略時は現在のウェーブ設定を使用）
   * @returns 強制生成に成功した場合true
   */
  public forceSpawnEnemyType(
    enemyType: EnemyType,
    count: number,
    spawnInterval: number,
    spawnPoints?: Point[],
  ): boolean {
    if (count <= 0) {
      return false;
    }

    // 一時的なウェーブ設定を作成
    const tempWaveConfig: EnemyWaveConfig = {
      waveNumber: -1, // 特別なウェーブ番号
      enemies: [
        {
          type: enemyType,
          count,
          spawnInterval,
          spawnDelay: 0,
        },
      ],
      spawnPoints:
        spawnPoints || this.getCurrentWaveConfig()?.spawnPoints || [],
    };

    if (tempWaveConfig.spawnPoints.length === 0) {
      console.warn(
        "EnemySpawnSystem: No spawn points available for force spawn",
      );
      return false;
    }

    // 現在のウェーブ設定を一時的に保存
    const originalWaveConfigs = [...this.waveConfigs];

    // 一時的なウェーブ設定を追加
    this.waveConfigs.push(tempWaveConfig);

    // 強制スポーンを開始
    const success = this.startWave(-1);

    // 元のウェーブ設定を復元
    this.waveConfigs = originalWaveConfigs;

    return success;
  }

  /**
   * 利用可能なウェーブ数を取得する
   * @returns 設定されているウェーブの総数
   */
  public getTotalWaves(): number {
    return this.waveConfigs.length;
  }

  /**
   * CSVファイルからウェーブ設定を読み込む
   * @param csvFilePath CSVファイルのパス（省略時はデフォルトパス）
   * @returns 読み込みに成功した場合true
   */
  public async loadWaveConfigsFromCSV(csvFilePath?: string): Promise<boolean> {
    try {
      // CSVローダーを初期化または更新
      if (!this.csvLoader) {
        this.csvLoader = new CSVWaveConfigLoader(csvFilePath);
      } else if (csvFilePath) {
        this.csvLoader.setCSVFilePath(csvFilePath);
      }

      // CSVファイルからウェーブ設定を読み込み
      const loadedConfigs = await this.csvLoader.loadWaveConfigs(true);

      if (loadedConfigs.length === 0) {
        console.warn(
          "EnemySpawnSystem: No wave configs loaded from CSV, using existing configs",
        );
        return false;
      }

      // 既存の設定を置き換え
      this.waveConfigs = loadedConfigs;

      // 現在のウェーブが実行中の場合は停止
      if (this.spawnState.isWaveActive) {
        console.log(
          "EnemySpawnSystem: Stopping current wave due to config reload",
        );
        this.stopCurrentWave();
      }

      console.log(
        `EnemySpawnSystem: Successfully loaded ${loadedConfigs.length} wave configs from CSV`,
      );
      return true;
    } catch (error) {
      console.error(
        "EnemySpawnSystem: Failed to load wave configs from CSV",
        error,
      );

      // エラー時はデフォルト設定にフォールバック
      if (this.waveConfigs.length === 0) {
        console.log("EnemySpawnSystem: Falling back to default wave configs");
        this.waveConfigs = this.getDefaultWaveConfigs();
      }

      return false;
    }
  }

  /**
   * CSVファイルのパスを設定する
   * @param csvFilePath CSVファイルのパス
   */
  public setCSVConfigPath(csvFilePath: string): void {
    if (!this.csvLoader) {
      this.csvLoader = new CSVWaveConfigLoader(csvFilePath);
    } else {
      this.csvLoader.setCSVFilePath(csvFilePath);
    }

    console.log(`EnemySpawnSystem: CSV config path set to: ${csvFilePath}`);
  }

  /**
   * 現在のCSVファイルパスを取得する
   * @returns CSVファイルパス（CSVローダーが初期化されていない場合はnull）
   */
  public getCSVConfigPath(): string | null {
    return this.csvLoader ? this.csvLoader.getCSVFilePath() : null;
  }

  /**
   * CSVローダーが初期化されているかチェックする
   * @returns CSVローダーが利用可能な場合true
   */
  public isCSVLoaderAvailable(): boolean {
    return this.csvLoader !== null;
  }

  /**
   * 指定されたウェーブのスポーン座標を取得する
   * @param waveNumber ウェーブ番号
   * @returns スポーン座標の配列（ウェーブが見つからない場合は空配列）
   */
  public getWaveSpawnPoints(waveNumber: number): Point[] {
    const waveConfig = this.getWaveConfig(waveNumber);
    return waveConfig?.spawnPoints || [];
  }

  /**
   * 指定されたウェーブにスポーン座標を追加する
   * @param waveNumber ウェーブ番号
   * @param spawnPoint 追加するスポーン座標
   * @returns 追加に成功した場合true
   */
  public addSpawnPointToWave(waveNumber: number, spawnPoint: Point): boolean {
    const waveConfig = this.getWaveConfig(waveNumber);
    if (!waveConfig) {
      console.warn(`EnemySpawnSystem: Wave ${waveNumber} not found`);
      return false;
    }

    // 重複チェック
    const isDuplicate = waveConfig.spawnPoints.some(
      (point) => point.x === spawnPoint.x && point.y === spawnPoint.y,
    );

    if (isDuplicate) {
      console.warn(
        `EnemySpawnSystem: Spawn point (${spawnPoint.x}, ${spawnPoint.y}) already exists in wave ${waveNumber}`,
      );
      return false;
    }

    waveConfig.spawnPoints.push(spawnPoint);
    console.log(
      `EnemySpawnSystem: Added spawn point (${spawnPoint.x}, ${spawnPoint.y}) to wave ${waveNumber}`,
    );
    return true;
  }

  /**
   * 指定されたウェーブの敵タイプ設定を取得する
   * @param waveNumber ウェーブ番号
   * @returns 敵タイプ設定の配列（ウェーブが見つからない場合は空配列）
   */
  public getWaveEnemyTypes(waveNumber: number): Array<{
    type: EnemyType;
    count: number;
    spawnInterval: number;
    spawnDelay: number;
  }> {
    const waveConfig = this.getWaveConfig(waveNumber);
    return waveConfig?.enemies || [];
  }

  /**
   * 指定されたウェーブに敵タイプ設定を追加する
   * @param waveNumber ウェーブ番号
   * @param enemyConfig 敵タイプ設定
   * @returns 追加に成功した場合true
   */
  public addEnemyTypeToWave(
    waveNumber: number,
    enemyConfig: {
      type: EnemyType;
      count: number;
      spawnInterval: number;
      spawnDelay: number;
    },
  ): boolean {
    const waveConfig = this.getWaveConfig(waveNumber);
    if (!waveConfig) {
      console.warn(`EnemySpawnSystem: Wave ${waveNumber} not found`);
      return false;
    }

    // 設定の妥当性チェック
    if (
      enemyConfig.count <= 0 ||
      enemyConfig.spawnInterval <= 0 ||
      enemyConfig.spawnDelay < 0
    ) {
      console.warn("EnemySpawnSystem: Invalid enemy config values");
      return false;
    }

    waveConfig.enemies.push(enemyConfig);
    console.log(
      `EnemySpawnSystem: Added ${enemyConfig.type} enemy type to wave ${waveNumber}`,
    );
    return true;
  }

  /**
   * 指定されたウェーブから敵タイプ設定を削除する
   * @param waveNumber ウェーブ番号
   * @param enemyTypeIndex 削除する敵タイプのインデックス
   * @returns 削除に成功した場合true
   */
  public removeEnemyTypeFromWave(
    waveNumber: number,
    enemyTypeIndex: number,
  ): boolean {
    const waveConfig = this.getWaveConfig(waveNumber);
    if (!waveConfig) {
      console.warn(`EnemySpawnSystem: Wave ${waveNumber} not found`);
      return false;
    }

    if (enemyTypeIndex < 0 || enemyTypeIndex >= waveConfig.enemies.length) {
      console.warn(
        `EnemySpawnSystem: Invalid enemy type index ${enemyTypeIndex} for wave ${waveNumber}`,
      );
      return false;
    }

    const removedEnemy = waveConfig.enemies.splice(enemyTypeIndex, 1)[0];
    console.log(
      `EnemySpawnSystem: Removed ${removedEnemy.type} enemy type from wave ${waveNumber}`,
    );
    return true;
  }

  /**
   * 現在のウェーブの敵タイプ別進捗状況を取得する
   * @returns 敵タイプ別の詳細進捗情報
   */
  public getCurrentWaveEnemyTypeProgress(): Array<{
    type: EnemyType;
    index: number;
    spawned: number;
    total: number;
    completed: boolean;
    nextSpawnTime: number;
    spawnDelay: number;
    spawnInterval: number;
  }> {
    const currentWaveConfig = this.getCurrentWaveConfig();
    if (!currentWaveConfig) {
      return [];
    }

    const progress: Array<{
      type: EnemyType;
      index: number;
      spawned: number;
      total: number;
      completed: boolean;
      nextSpawnTime: number;
      spawnDelay: number;
      spawnInterval: number;
    }> = [];

    for (let i = 0; i < currentWaveConfig.enemies.length; i++) {
      const enemyConfig = currentWaveConfig.enemies[i];
      const state = this.spawnState.enemyTypeStates.get(i);

      progress.push({
        type: enemyConfig.type,
        index: i,
        spawned: state?.spawnedCount || 0,
        total: enemyConfig.count,
        completed: state?.isCompleted || false,
        nextSpawnTime: state?.nextSpawnTime || 0,
        spawnDelay: enemyConfig.spawnDelay,
        spawnInterval: enemyConfig.spawnInterval,
      });
    }

    return progress;
  }

  /**
   * 次のスポーン地点を取得する
   * @param preferredSpawnPoint 優先するスポーン地点（省略時は順次使用）
   * @returns スポーン地点（利用可能な地点がない場合はnull）
   */
  private getNextSpawnPoint(preferredSpawnPoint?: Point): Point | null {
    const currentWaveConfig = this.getCurrentWaveConfig();
    if (!currentWaveConfig || currentWaveConfig.spawnPoints.length === 0) {
      // デフォルトのスポーン地点を使用
      console.warn(
        "EnemySpawnSystem: No spawn points in wave config, using default spawn point",
      );
      return { x: 3, y: 8 }; // デフォルトスポーン地点
    }

    // 優先スポーン地点が指定されている場合
    if (preferredSpawnPoint) {
      // 設定されたスポーン地点の中から最も近いものを選択
      let closestPoint = currentWaveConfig.spawnPoints[0];
      let minDistance = this.calculateDistance(
        preferredSpawnPoint,
        closestPoint,
      );

      for (const spawnPoint of currentWaveConfig.spawnPoints) {
        const distance = this.calculateDistance(
          preferredSpawnPoint,
          spawnPoint,
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = spawnPoint;
        }
      }

      return closestPoint;
    }

    // 通常の順次使用
    const spawnPoint =
      currentWaveConfig.spawnPoints[this.spawnState.currentSpawnPointIndex];

    // 次のスポーン地点インデックスを更新（循環）
    this.spawnState.currentSpawnPointIndex =
      (this.spawnState.currentSpawnPointIndex + 1) %
      currentWaveConfig.spawnPoints.length;

    return spawnPoint;
  }

  /**
   * 2点間の距離を計算する
   * @param point1 地点1
   * @param point2 地点2
   * @returns 距離
   */
  private calculateDistance(point1: Point, point2: Point): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 敵タイプの状態を初期化する
   * @param enemyTypeIndex 敵タイプのインデックス
   * @param enemyConfig 敵の設定
   * @param currentTime 現在時刻
   * @returns 初期化された敵タイプ状態
   */
  private initializeEnemyTypeState(
    enemyTypeIndex: number,
    enemyConfig: {
      type: EnemyType;
      count: number;
      spawnInterval: number;
      spawnDelay: number;
    },
    currentTime: number,
  ): EnemyTypeSpawnState {
    return {
      enemyTypeIndex,
      spawnedCount: 0,
      lastSpawnTime: 0,
      isCompleted: false,
      nextSpawnTime: currentTime + enemyConfig.spawnDelay,
    };
  }

  /**
   * ウェーブ完了をチェックする
   */
  private checkWaveCompletion(): void {
    const currentWaveConfig = this.getCurrentWaveConfig();
    if (!currentWaveConfig) {
      return;
    }

    // すべての敵タイプの生成が完了したかチェック
    const allEnemyTypesCompleted =
      this.spawnState.completedEnemyTypes.size >=
      currentWaveConfig.enemies.length;

    if (allEnemyTypesCompleted) {
      this.spawnState.isWaveActive = false;
      console.log(
        `EnemySpawnSystem: Wave ${this.spawnState.waveNumber} spawn completed`,
      );

      // 統計情報をログ出力
      this.logWaveCompletionStats(currentWaveConfig);

      // ウェーブ完了コールバックを実行
      const callback = this.waveCompletionCallbacks.get(
        this.spawnState.waveNumber,
      );
      if (callback) {
        callback();
      }
    }
  }

  /**
   * ウェーブ完了時の統計情報をログ出力する
   * @param waveConfig ウェーブ設定
   */
  private logWaveCompletionStats(waveConfig: EnemyWaveConfig): void {
    const stats: Record<string, number> = {};
    let totalSpawned = 0;

    for (const [enemyTypeIndex, state] of this.spawnState.enemyTypeStates) {
      const enemyConfig = waveConfig.enemies[enemyTypeIndex];
      if (enemyConfig) {
        stats[enemyConfig.type] = state.spawnedCount;
        totalSpawned += state.spawnedCount;
      }
    }

    console.log(
      `EnemySpawnSystem: Wave ${this.spawnState.waveNumber} completion stats:`,
      {
        totalSpawned,
        byType: stats,
        spawnPointsUsed: waveConfig.spawnPoints.length,
      },
    );
  }

  /**
   * 現在のウェーブで生成された敵の総数を取得する
   * @returns 生成された敵の総数
   */
  private getTotalSpawnedInCurrentWave(): number {
    let totalSpawned = 0;

    // 各敵タイプの生成数を合計
    for (const [, state] of this.spawnState.enemyTypeStates) {
      totalSpawned += state.spawnedCount;
    }

    return totalSpawned;
  }

  /**
   * デフォルトのウェーブ設定を取得する
   * @returns デフォルトのウェーブ設定配列
   */
  private getDefaultWaveConfigs(): EnemyWaveConfig[] {
    // デフォルトのスポーン地点を設定
    const defaultSpawnPoints: Point[] = [
      { x: 3, y: 8 },
      { x: 3, y: 9 },
    ];

    return createDefaultWaveConfigs(defaultSpawnPoints);
  }
}

/**
 * デフォルトのウェーブ設定を作成するヘルパー関数
 * @param spawnPoints スポーン地点の配列
 * @returns デフォルトのウェーブ設定配列
 */
export const createDefaultWaveConfigs = (
  spawnPoints: Point[],
): EnemyWaveConfig[] => {
  return [
    // ウェーブ1: 基本敵のみ
    {
      waveNumber: 1,
      enemies: [
        {
          type: "basic",
          count: 5,
          spawnInterval: 2000, // 2秒間隔
          spawnDelay: 0,
        },
      ],
      spawnPoints,
    },
    // ウェーブ2: 基本敵と高速敵
    {
      waveNumber: 2,
      enemies: [
        {
          type: "basic",
          count: 8,
          spawnInterval: 1500, // 1.5秒間隔
          spawnDelay: 0,
        },
        {
          type: "fast",
          count: 3,
          spawnInterval: 3000, // 3秒間隔
          spawnDelay: 5000, // 5秒遅延
        },
      ],
      spawnPoints,
    },
    // ウェーブ3: 全種類の敵
    {
      waveNumber: 3,
      enemies: [
        {
          type: "basic",
          count: 10,
          spawnInterval: 1000, // 1秒間隔
          spawnDelay: 0,
        },
        {
          type: "fast",
          count: 5,
          spawnInterval: 2000, // 2秒間隔
          spawnDelay: 3000, // 3秒遅延
        },
        {
          type: "heavy",
          count: 2,
          spawnInterval: 5000, // 5秒間隔
          spawnDelay: 10000, // 10秒遅延
        },
      ],
      spawnPoints,
    },
  ];
};
