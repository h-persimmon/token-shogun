import type { HealthComponent } from "../components/health-component";
import type { createEntityManager } from "../entities/entity-manager";

type EntityManager = ReturnType<typeof createEntityManager>;

/**
 * ゲーム状態の種類
 */
export type GamePhase = "preparation" | "wave" | "victory" | "defeat";

/**
 * ゲーム状態管理データ
 */
export type GameState = {
  phase: GamePhase;
  currentWave: number;
  totalWaves: number;
  enemiesRemaining: number;
  enemiesSpawned: number;
  gateHealth: number;
  maxGateHealth: number;
  score: number;
  gameStartTime: number;
  waveStartTime: number;
  gameEndTime?: number;
};

/**
 * 勝利条件の設定
 */
export type VictoryCondition = {
  type: "all_enemies_defeated" | "waves_completed" | "time_survived";
  value?: number; // 時間生存の場合の秒数など
};

/**
 * 敗北条件の設定
 */
export type DefeatCondition = {
  type: "gate_destroyed" | "critical_structure_destroyed" | "time_limit";
  value?: number; // 制限時間の場合の秒数など
};

/**
 * ゲーム状態変更イベント
 */
export type GameStateEvent = {
  type:
    | "phase_changed"
    | "wave_started"
    | "wave_completed"
    | "enemy_spawned"
    | "enemy_defeated"
    | "structure_damaged"
    | "game_ended";
  data?: any;
  timestamp: number;
};

/**
 * UI表示設定
 */
export type UIDisplayConfig = {
  showGameOverScreen: boolean;
  showVictoryScreen: boolean;
  showWaveInfo: boolean;
  showEnemyCount: boolean;
  showGateHealth: boolean;
  showScore: boolean;
};

/**
 * ゲーム終了時の処理設定
 */
export type GameEndConfig = {
  pauseGameOnEnd: boolean;
  showEndScreen: boolean;
  allowRestart: boolean;
  autoRestartDelay?: number; // ミリ秒
};

/**
 * ゲーム状態システム
 * ゲーム全体の状態管理と勝敗判定を行う
 */
export class GameStateSystem {
  private entityManager: EntityManager;
  private gameState: GameState;
  private victoryConditions: VictoryCondition[];
  private defeatConditions: DefeatCondition[];
  private eventListeners: Map<string, ((event: GameStateEvent) => void)[]>;
  private gateEntityId?: string;
  private criticalStructureIds: Set<string>;
  private uiDisplayConfig: UIDisplayConfig;
  private gameEndConfig: GameEndConfig;
  private scene?: Phaser.Scene;

  constructor(
    entityManager: EntityManager,
    totalWaves: number = 3,
    initialGateHealth: number = 100,
    scene?: Phaser.Scene,
  ) {
    this.entityManager = entityManager;
    this.eventListeners = new Map();
    this.criticalStructureIds = new Set();
    this.scene = scene;

    // 初期ゲーム状態を設定
    this.gameState = {
      phase: "preparation",
      currentWave: 0,
      totalWaves,
      enemiesRemaining: 0,
      enemiesSpawned: 0,
      gateHealth: initialGateHealth,
      maxGateHealth: initialGateHealth,
      score: 0,
      gameStartTime: Date.now(),
      waveStartTime: 0,
    };

    // デフォルトの勝利条件を設定
    this.victoryConditions = [{ type: "waves_completed" }];

    // デフォルトの敗北条件を設定
    this.defeatConditions = [
      { type: "gate_destroyed" },
      { type: "critical_structure_destroyed" },
    ];

    // デフォルトのUI表示設定
    this.uiDisplayConfig = {
      showGameOverScreen: true,
      showVictoryScreen: true,
      showWaveInfo: true,
      showEnemyCount: true,
      showGateHealth: true,
      showScore: true,
    };

    // デフォルトのゲーム終了設定
    this.gameEndConfig = {
      pauseGameOnEnd: true,
      showEndScreen: true,
      allowRestart: true,
    };
  }

  /**
   * システムの更新処理
   * ゲーム状態の監視と勝敗判定を行う
   * @param currentTime 現在時刻（ミリ秒）
   */
  public update(currentTime: number): void {
    // ゲーム状態に応じた処理
    switch (this.gameState.phase) {
      case "preparation":
        this.updatePreparationPhase(currentTime);
        break;
      case "wave":
        this.updateWavePhase(currentTime);
        break;
      case "victory":
      case "defeat":
        // ゲーム終了状態では更新処理なし
        break;
    }
  }

  /**
   * ゲームを開始する
   * @param currentTime 現在時刻（ミリ秒）
   */
  public startGame(currentTime: number = Date.now()): void {
    if (this.gameState.phase !== "preparation") {
      console.warn(
        "GameStateSystem: Game can only be started from preparation phase",
      );
      return;
    }

    this.gameState.gameStartTime = currentTime;
    this.gameState.currentWave = 1;
    this.changePhase("wave", currentTime);

    console.log("GameStateSystem: Game started");
  }

  /**
   * ウェーブを開始する
   * @param waveNumber ウェーブ番号
   * @param currentTime 現在時刻（ミリ秒）
   */
  public startWave(waveNumber: number, currentTime: number = Date.now()): void {
    if (
      this.gameState.phase !== "preparation" &&
      this.gameState.phase !== "wave"
    ) {
      console.warn(
        "GameStateSystem: Wave can only be started from preparation or wave phase",
      );
      return;
    }

    this.gameState.currentWave = waveNumber;
    this.gameState.waveStartTime = currentTime;
    this.changePhase("wave", currentTime);

    this.emitEvent({
      type: "wave_started",
      data: { waveNumber },
      timestamp: currentTime,
    });

    console.log(`GameStateSystem: Wave ${waveNumber} started`);
  }

  /**
   * ウェーブを完了する
   * @param currentTime 現在時刻（ミリ秒）
   */
  public completeWave(currentTime: number = Date.now()): void {
    if (this.gameState.phase !== "wave") {
      console.warn(
        "GameStateSystem: Wave can only be completed from wave phase",
      );
      return;
    }

    this.emitEvent({
      type: "wave_completed",
      data: { waveNumber: this.gameState.currentWave },
      timestamp: currentTime,
    });

    // 最終ウェーブの場合は勝利判定
    if (this.gameState.currentWave >= this.gameState.totalWaves) {
      this.checkVictoryConditions(currentTime);
    } else {
      // 次のウェーブの準備フェーズに移行
      this.changePhase("preparation", currentTime);
    }

    console.log(
      `GameStateSystem: Wave ${this.gameState.currentWave} completed`,
    );
  }

  /**
   * 敵が生成されたことを通知する
   * @param enemyEntityId 敵エンティティID
   * @param currentTime 現在時刻（ミリ秒）
   */
  public notifyEnemySpawned(
    enemyEntityId: string,
    currentTime: number = Date.now(),
  ): void {
    this.gameState.enemiesSpawned++;
    this.gameState.enemiesRemaining++;

    this.emitEvent({
      type: "enemy_spawned",
      data: { enemyEntityId },
      timestamp: currentTime,
    });
  }

  /**
   * 敵が撃破されたことを通知する
   * @param enemyEntityId 敵エンティティID
   * @param rewardValue 撃破報酬
   * @param currentTime 現在時刻（ミリ秒）
   */
  public notifyEnemyDefeated(
    enemyEntityId: string,
    rewardValue: number = 10,
    currentTime: number = Date.now(),
  ): void {
    // 敵数を実際にカウントして更新
    this.updateEnemyCount();
    this.gameState.score += rewardValue;

    this.emitEvent({
      type: "enemy_defeated",
      data: { enemyEntityId, rewardValue },
      timestamp: currentTime,
    });

    console.log(
      `GameStateSystem: Enemy defeated. Remaining: ${this.gameState.enemiesRemaining}`,
    );

    // 勝利条件をチェック
    this.checkVictoryConditions(currentTime);
  }

  /**
   * 構造物がダメージを受けたことを通知する
   * @param structureEntityId 構造物エンティティID
   * @param damage ダメージ量
   * @param currentTime 現在時刻（ミリ秒）
   */
  public notifyStructureDamaged(
    structureEntityId: string,
    damage: number,
    currentTime: number = Date.now(),
  ): void {
    // 門のダメージの場合はゲーム状態を更新
    if (structureEntityId === this.gateEntityId) {
      const gateEntity = this.entityManager.getEntity(structureEntityId);
      if (gateEntity) {
        const healthComponent = gateEntity.components.health as HealthComponent;
        if (healthComponent) {
          this.gameState.gateHealth = Math.max(
            0,
            healthComponent.currentHealth,
          );
        }
      }
    }

    this.emitEvent({
      type: "structure_damaged",
      data: { structureEntityId, damage },
      timestamp: currentTime,
    });

    // 敗北条件をチェック
    this.checkDefeatConditions(currentTime);
  }

  /**
   * ゲート体力を手動で更新（AttackSystemから呼び出される）
   */
  public updateGateHealth(): void {
    if (!this.gateEntityId) return;

    const gateEntity = this.entityManager.getEntity(this.gateEntityId);
    if (gateEntity) {
      const healthComponent = gateEntity.components.health
      if (healthComponent) {
        this.gameState.gateHealth = Math.max(0, healthComponent.currentHealth);
      }
    }
  }

  /**
   * 門エンティティを設定する
   * @param gateEntityId 門エンティティID
   */
  public setGateEntity(gateEntityId: string): void {
    this.gateEntityId = gateEntityId;

    // 門の初期体力を設定
    const gateEntity = this.entityManager.getEntity(gateEntityId);
    if (gateEntity) {
      const healthComponent = gateEntity.components.health as HealthComponent;
      if (healthComponent) {
        this.gameState.gateHealth = healthComponent.currentHealth;
        this.gameState.maxGateHealth = healthComponent.maxHealth;
      }
    }
  }

  /**
   * 重要な構造物を追加する
   * @param structureEntityId 構造物エンティティID
   */
  public addCriticalStructure(structureEntityId: string): void {
    this.criticalStructureIds.add(structureEntityId);
  }

  /**
   * 重要な構造物を削除する
   * @param structureEntityId 構造物エンティティID
   */
  public removeCriticalStructure(structureEntityId: string): void {
    this.criticalStructureIds.delete(structureEntityId);
  }

  /**
   * 現在のゲーム状態を取得する
   * @returns ゲーム状態のコピー
   */
  public getGameState(): Readonly<GameState> {
    return { ...this.gameState };
  }

  /**
   * ゲーム状態の特定の値を更新する
   * @param updates 更新する値のオブジェクト
   */
  public updateGameState(updates: Partial<GameState>): void {
    Object.assign(this.gameState, updates);
  }

  /**
   * 勝利条件を追加する
   * @param condition 勝利条件
   */
  public addVictoryCondition(condition: VictoryCondition): void {
    this.victoryConditions.push(condition);
  }

  /**
   * 敗北条件を追加する
   * @param condition 敗北条件
   */
  public addDefeatCondition(condition: DefeatCondition): void {
    this.defeatConditions.push(condition);
  }

  /**
   * イベントリスナーを追加する
   * @param eventType イベントタイプ
   * @param listener リスナー関数
   */
  public addEventListener(
    eventType: string,
    listener: (event: GameStateEvent) => void,
  ): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)?.push(listener);
  }

  /**
   * イベントリスナーを削除する
   * @param eventType イベントタイプ
   * @param listener リスナー関数
   */
  public removeEventListener(
    eventType: string,
    listener: (event: GameStateEvent) => void,
  ): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * ゲームをリセットする
   * @param currentTime 現在時刻（ミリ秒）
   */
  public resetGame(currentTime: number = Date.now()): void {
    this.gameState = {
      phase: "preparation",
      currentWave: 0,
      totalWaves: this.gameState.totalWaves,
      enemiesRemaining: 0,
      enemiesSpawned: 0,
      gateHealth: this.gameState.maxGateHealth,
      maxGateHealth: this.gameState.maxGateHealth,
      score: 0,
      gameStartTime: currentTime,
      waveStartTime: 0,
    };

    console.log("GameStateSystem: Game reset");
  }

  /**
   * ゲーム統計を取得する
   * @param currentTime 現在時刻（ミリ秒）
   * @returns ゲーム統計情報
   */
  public getGameStatistics(currentTime: number = Date.now()): {
    totalPlayTime: number;
    currentWaveTime: number;
    enemiesPerMinute: number;
    scorePerMinute: number;
    survivalRate: number;
  } {
    const totalPlayTime = currentTime - this.gameState.gameStartTime;
    const currentWaveTime =
      this.gameState.waveStartTime > 0
        ? currentTime - this.gameState.waveStartTime
        : 0;

    const totalMinutes = totalPlayTime / (1000 * 60);
    const enemiesPerMinute =
      totalMinutes > 0 ? this.gameState.enemiesSpawned / totalMinutes : 0;
    const scorePerMinute =
      totalMinutes > 0 ? this.gameState.score / totalMinutes : 0;

    const survivalRate =
      this.gameState.maxGateHealth > 0
        ? this.gameState.gateHealth / this.gameState.maxGateHealth
        : 0;

    return {
      totalPlayTime,
      currentWaveTime,
      enemiesPerMinute,
      scorePerMinute,
      survivalRate,
    };
  }

  /**
   * 準備フェーズの更新処理
   * @param currentTime 現在時刻（ミリ秒）
   */
  private updatePreparationPhase(_currentTime: number): void {
    // 準備フェーズでは特別な処理は不要
    // 必要に応じて自動的に次のウェーブを開始する処理を追加可能
  }

  /**
   * ウェーブフェーズの更新処理
   * @param currentTime 現在時刻（ミリ秒）
   */
  private updateWavePhase(currentTime: number): void {
    // 現在の敵数を更新
    this.updateEnemyCount();

    // 勝敗条件をチェック
    this.checkVictoryConditions(currentTime);
    this.checkDefeatConditions(currentTime);
  }

  /**
   * 現在の敵数を更新する
   */
  private updateEnemyCount(): void {
    const enemies = this.entityManager.queryEntities({
      required: ["enemy", "health"],
    });

    // 生きている敵の数をカウント
    let aliveEnemies = 0;
    for (const enemy of enemies) {
      const healthComponent = enemy.components.health;
      if (healthComponent && healthComponent.currentHealth > 0) {
        aliveEnemies++;
      }
    }

    this.gameState.enemiesRemaining = aliveEnemies;
  }

  /**
   * 勝利条件をチェックする
   * @param currentTime 現在時刻（ミリ秒）
   */
  private checkVictoryConditions(currentTime: number): void {
    if (
      this.gameState.phase === "victory" ||
      this.gameState.phase === "defeat"
    ) {
      return;
    }

    for (const condition of this.victoryConditions) {
      if (this.isVictoryConditionMet(condition, currentTime)) {
        this.triggerVictory(currentTime);
        return;
      }
    }
  }

  /**
   * 敗北条件をチェックする
   * @param currentTime 現在時刻（ミリ秒）
   */
  private checkDefeatConditions(currentTime: number): void {
    if (
      this.gameState.phase === "victory" ||
      this.gameState.phase === "defeat"
    ) {
      return;
    }

    for (const condition of this.defeatConditions) {
      if (this.isDefeatConditionMet(condition, currentTime)) {
        this.triggerDefeat(currentTime);
        return;
      }
    }
  }

  /**
   * 勝利条件が満たされているかチェック
   * @param condition 勝利条件
   * @param currentTime 現在時刻（ミリ秒）
   * @returns 条件が満たされている場合true
   */
  private isVictoryConditionMet(
    condition: VictoryCondition,
    currentTime: number,
  ): boolean {
    switch (condition.type) {
      case "all_enemies_defeated":
        return (
          this.gameState.enemiesRemaining === 0 &&
          this.gameState.enemiesSpawned > 0
        );

      case "waves_completed":
        return (
          this.gameState.currentWave >= this.gameState.totalWaves &&
          this.gameState.enemiesRemaining === 0
        );

      case "time_survived":
        if (condition.value) {
          const survivedTime =
            (currentTime - this.gameState.gameStartTime) / 1000;
          return survivedTime >= condition.value;
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * 敗北条件が満たされているかチェック
   * @param condition 敗北条件
   * @param currentTime 現在時刻（ミリ秒）
   * @returns 条件が満たされている場合true
   */
  private isDefeatConditionMet(
    condition: DefeatCondition,
    currentTime: number,
  ): boolean {
    switch (condition.type) {
      case "gate_destroyed":
        return this.gameState.gateHealth <= 0;

      case "critical_structure_destroyed":
        return this.isCriticalStructureDestroyed();

      case "time_limit":
        if (condition.value) {
          const elapsedTime =
            (currentTime - this.gameState.gameStartTime) / 1000;
          return elapsedTime >= condition.value;
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * 重要な構造物が破壊されているかチェック
   * @returns 重要な構造物が破壊されている場合true
   */
  private isCriticalStructureDestroyed(): boolean {
    for (const structureId of this.criticalStructureIds) {
      const structure = this.entityManager.getEntity(structureId);
      if (!structure) {
        // エンティティが存在しない場合は破壊されたとみなす
        return true;
      }

      const healthComponent = structure.components.health;
      if (healthComponent && healthComponent.currentHealth <= 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * ゲームフェーズを変更する
   * @param newPhase 新しいフェーズ
   * @param currentTime 現在時刻（ミリ秒）
   */
  private changePhase(newPhase: GamePhase, currentTime: number): void {
    const oldPhase = this.gameState.phase;
    this.gameState.phase = newPhase;

    this.emitEvent({
      type: "phase_changed",
      data: { oldPhase, newPhase },
      timestamp: currentTime,
    });

    console.log(
      `GameStateSystem: Phase changed from ${oldPhase} to ${newPhase}`,
    );
  }

  /**
   * UI表示設定を更新する
   * @param config UI表示設定
   */
  public setUIDisplayConfig(config: Partial<UIDisplayConfig>): void {
    Object.assign(this.uiDisplayConfig, config);
  }

  /**
   * ゲーム終了設定を更新する
   * @param config ゲーム終了設定
   */
  public setGameEndConfig(config: Partial<GameEndConfig>): void {
    Object.assign(this.gameEndConfig, config);
  }

  /**
   * 現在のUI表示設定を取得する
   * @returns UI表示設定のコピー
   */
  public getUIDisplayConfig(): Readonly<UIDisplayConfig> {
    return { ...this.uiDisplayConfig };
  }

  /**
   * 勝利画面を表示する
   * @param currentTime 現在時刻（ミリ秒）
   */
  public showVictoryScreen(currentTime: number = Date.now()): void {
    if (!this.uiDisplayConfig.showVictoryScreen) {
      return;
    }

    const statistics = this.getGameStatistics(currentTime);
    const playTimeMinutes = Math.floor(statistics.totalPlayTime / (1000 * 60));
    const playTimeSeconds = Math.floor(
      (statistics.totalPlayTime % (1000 * 60)) / 1000,
    );

    console.log("=== VICTORY! ===");
    console.log(`Final Score: ${this.gameState.score}`);
    console.log(
      `Waves Completed: ${this.gameState.currentWave}/${this.gameState.totalWaves}`,
    );
    console.log(
      `Enemies Defeated: ${this.gameState.enemiesSpawned - this.gameState.enemiesRemaining}`,
    );
    console.log(
      `Play Time: ${playTimeMinutes}:${playTimeSeconds.toString().padStart(2, "0")}`,
    );
    console.log(
      `Gate Health: ${this.gameState.gateHealth}/${this.gameState.maxGateHealth}`,
    );
    console.log("===============");

    // Phaserシーンがある場合はUI要素を表示
    if (this.scene) {
      this.displayVictoryUI(statistics);
    }
  }

  /**
   * 敗北画面を表示する
   * @param currentTime 現在時刻（ミリ秒）
   */
  public showDefeatScreen(currentTime: number = Date.now()): void {
    if (!this.uiDisplayConfig.showGameOverScreen) {
      return;
    }

    const statistics = this.getGameStatistics(currentTime);
    const playTimeMinutes = Math.floor(statistics.totalPlayTime / (1000 * 60));
    const playTimeSeconds = Math.floor(
      (statistics.totalPlayTime % (1000 * 60)) / 1000,
    );

    console.log("=== DEFEAT ===");
    console.log(`Final Score: ${this.gameState.score}`);
    console.log(
      `Wave Reached: ${this.gameState.currentWave}/${this.gameState.totalWaves}`,
    );
    console.log(
      `Enemies Defeated: ${this.gameState.enemiesSpawned - this.gameState.enemiesRemaining}`,
    );
    console.log(
      `Play Time: ${playTimeMinutes}:${playTimeSeconds.toString().padStart(2, "0")}`,
    );
    console.log(
      `Gate Health: ${this.gameState.gateHealth}/${this.gameState.maxGateHealth}`,
    );
    console.log("==============");

    // Phaserシーンがある場合はUI要素を表示
    if (this.scene) {
      this.displayDefeatUI(statistics);
    }
  }

  /**
   * ゲーム情報UI要素を更新する
   */
  public updateGameInfoUI(): void {
    if (!this.scene) {
      return;
    }

    // ウェーブ情報の表示
    if (this.uiDisplayConfig.showWaveInfo) {
      this.updateWaveInfoUI();
    }

    // 敵数の表示
    if (this.uiDisplayConfig.showEnemyCount) {
      this.updateEnemyCountUI();
    }

    // 門の体力表示
    if (this.uiDisplayConfig.showGateHealth) {
      this.updateGateHealthUI();
    }

    // スコア表示
    if (this.uiDisplayConfig.showScore) {
      this.updateScoreUI();
    }
  }

  /**
   * ゲーム終了時の処理を実行する
   * @param result ゲーム結果（"victory" または "defeat"）
   * @param currentTime 現在時刻（ミリ秒）
   */
  public handleGameEnd(
    result: "victory" | "defeat",
    currentTime: number = Date.now(),
  ): void {
    // ゲーム終了画面を表示
    if (this.gameEndConfig.showEndScreen) {
      if (result === "victory") {
        this.showVictoryScreen(currentTime);
      } else {
        this.showDefeatScreen(currentTime);
      }
    }

    // ゲームを一時停止
    if (this.gameEndConfig.pauseGameOnEnd && this.scene) {
      this.scene.scene.pause();
    }

    // 自動リスタート
    if (
      this.gameEndConfig.autoRestartDelay &&
      this.gameEndConfig.allowRestart
    ) {
      setTimeout(() => {
        this.restartGame(currentTime);
      }, this.gameEndConfig.autoRestartDelay);
    }
  }

  /**
   * ゲームを再開始する
   * @param currentTime 現在時刻（ミリ秒）
   */
  public restartGame(currentTime: number = Date.now()): void {
    if (!this.gameEndConfig.allowRestart) {
      console.warn("GameStateSystem: Game restart is not allowed");
      return;
    }

    // ゲーム状態をリセット
    this.resetGame(currentTime);

    // シーンを再開
    if (this.scene?.scene.isPaused()) {
      this.scene.scene.resume();
    }

    // UI要素をクリア
    this.clearEndGameUI();

    console.log("GameStateSystem: Game restarted");
  }

  /**
   * 強制的にゲームを終了する
   * @param result ゲーム結果
   * @param reason 終了理由
   * @param currentTime 現在時刻（ミリ秒）
   */
  public forceGameEnd(
    result: "victory" | "defeat",
    reason: string,
    currentTime: number = Date.now(),
  ): void {
    console.log(`GameStateSystem: Force game end - ${result}: ${reason}`);

    if (result === "victory") {
      this.triggerVictory(currentTime);
    } else {
      this.triggerDefeat(currentTime);
    }
  }

  /**
   * ゲーム状態の詳細情報を取得する
   * @param currentTime 現在時刻（ミリ秒）
   * @returns 詳細なゲーム状態情報
   */
  public getDetailedGameState(currentTime: number = Date.now()): {
    gameState: Readonly<GameState>;
    statistics: {
      totalPlayTime: number;
      currentWaveTime: number;
      enemiesPerMinute: number;
      scorePerMinute: number;
      survivalRate: number;
    };
    victoryConditions: VictoryCondition[];
    defeatConditions: DefeatCondition[];
    criticalStructures: string[];
    isGameActive: boolean;
  } {
    return {
      gameState: this.getGameState(),
      statistics: this.getGameStatistics(currentTime),
      victoryConditions: [...this.victoryConditions],
      defeatConditions: [...this.defeatConditions],
      criticalStructures: Array.from(this.criticalStructureIds),
      isGameActive:
        this.gameState.phase === "wave" ||
        this.gameState.phase === "preparation",
    };
  }

  /**
   * 勝利UI要素を表示する
   * @param statistics ゲーム統計情報
   */
  private displayVictoryUI(
    _statistics: ReturnType<typeof this.getGameStatistics>,
  ): void {
    // TODO: Phaserのテキストやモーダルを使用してUI要素を作成
    // 現在はコンソール出力のみ実装
    console.log("GameStateSystem: Victory UI displayed");
  }

  /**
   * 敗北UI要素を表示する
   * @param statistics ゲーム統計情報
   */
  private displayDefeatUI(
    _statistics: ReturnType<typeof this.getGameStatistics>,
  ): void {
    // TODO: Phaserのテキストやモーダルを使用してUI要素を作成
    // 現在はコンソール出力のみ実装
    console.log("GameStateSystem: Defeat UI displayed");
  }

  /**
   * ウェーブ情報UIを更新する
   */
  private updateWaveInfoUI(): void {
    // TODO: Phaserのテキスト要素を更新
    console.log(
      `Wave: ${this.gameState.currentWave}/${this.gameState.totalWaves}`,
    );
  }

  /**
   * 敵数UIを更新する
   */
  private updateEnemyCountUI(): void {
    // TODO: Phaserのテキスト要素を更新
    console.log(`Enemies: ${this.gameState.enemiesRemaining}`);
  }

  /**
   * 門の体力UIを更新する
   */
  private updateGateHealthUI(): void {
    // TODO: Phaserのヘルスバーを更新
    const healthPercentage =
      this.gameState.maxGateHealth > 0
        ? (this.gameState.gateHealth / this.gameState.maxGateHealth) * 100
        : 0;
    console.log(
      `Gate Health: ${this.gameState.gateHealth}/${this.gameState.maxGateHealth} (${healthPercentage.toFixed(1)}%)`,
    );
  }

  /**
   * スコアUIを更新する
   */
  private updateScoreUI(): void {
    // TODO: Phaserのテキスト要素を更新
    console.log(`Score: ${this.gameState.score}`);
  }

  /**
   * ゲーム終了UI要素をクリアする
   */
  private clearEndGameUI(): void {
    // TODO: Phaserのゲーム終了UI要素を削除
    console.log("GameStateSystem: End game UI cleared");
  }

  /**
   * 勝利を発生させる
   * @param currentTime 現在時刻（ミリ秒）
   */
  private triggerVictory(currentTime: number): void {
    this.changePhase("victory", currentTime);
    this.gameState.gameEndTime = currentTime;

    this.emitEvent({
      type: "game_ended",
      data: { result: "victory", finalScore: this.gameState.score },
      timestamp: currentTime,
    });

    // ゲーム終了処理を実行
    this.handleGameEnd("victory", currentTime);

    console.log("GameStateSystem: Victory achieved!");
  }

  /**
   * 敗北を発生させる
   * @param currentTime 現在時刻（ミリ秒）
   */
  private triggerDefeat(currentTime: number): void {
    this.changePhase("defeat", currentTime);
    this.gameState.gameEndTime = currentTime;

    this.emitEvent({
      type: "game_ended",
      data: { result: "defeat", finalScore: this.gameState.score },
      timestamp: currentTime,
    });

    // ゲーム終了処理を実行
    this.handleGameEnd("defeat", currentTime);

    console.log("GameStateSystem: Defeat occurred!");
  }

  /**
   * イベントを発行する
   * @param event 発行するイベント
   */
  private emitEvent(event: GameStateEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          console.error(
            `GameStateSystem: Error in event listener for ${event.type}:`,
            error,
          );
        }
      }
    }
  }
}
