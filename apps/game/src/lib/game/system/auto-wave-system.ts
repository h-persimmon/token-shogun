import { Scene } from "phaser";
import type { createEntityManager } from "../entities/entity-manager";
import type { EnemySpawnSystem } from "./enemy-spawn-system";
import type { GameStateSystem } from "./game-state-system";
import { enemyUnitConfigs } from "@kiro-rts/characters";

type EntityManager = ReturnType<typeof createEntityManager>;

/**
 * 自動ウェーブ進行システムの設定
 */
export type AutoWaveConfig = {
  /** ゲーム開始時の遅延（ミリ秒） */
  gameStartDelay: number;
  /** ウェーブ間の遅延（ミリ秒） */
  waveInterval: number;
  /** 敵を全て倒した後の次ウェーブまでの遅延（ミリ秒） */
  nextWaveDelay: number;
  /** 自動進行を有効にするか */
  enabled: boolean;
};

/**
 * 自動ウェーブ進行システム
 * ゲームの自動開始と、敵を全て倒した後の自動ウェーブ進行を管理する
 */
export class AutoWaveSystem {
  private entityManager: EntityManager;
  private enemySpawnSystem: EnemySpawnSystem;
  private gameStateSystem: GameStateSystem;
  private config: AutoWaveConfig;

  private gameStarted: boolean = false;
  private lastWaveCompletionTime: number = 0;
  private pendingNextWave: boolean = false;
  private nextWaveTimer?: ReturnType<typeof setTimeout>;

  constructor(
    entityManager: EntityManager,
    enemySpawnSystem: EnemySpawnSystem,
    gameStateSystem: GameStateSystem,
    config: Partial<AutoWaveConfig> = {},
  ) {
    this.entityManager = entityManager;
    this.enemySpawnSystem = enemySpawnSystem;
    this.gameStateSystem = gameStateSystem;

    // デフォルト設定
    this.config = {
      gameStartDelay: 3000, // 3秒後にゲーム開始
      waveInterval: 5000, // ウェーブ間5秒
      nextWaveDelay: 2000, // 敵全滅後2秒で次ウェーブ
      enabled: true,
      ...config,
    };

    this.setupEventListeners();
  }

  /**
   * システムの更新処理
   * @param currentTime 現在時刻（ミリ秒）
   */
  public update(currentTime: number): void {
    if (!this.config.enabled) {
      return;
    }

    // ゲーム自動開始の処理
    this.handleAutoGameStart(currentTime);

    // 自動ウェーブ進行の処理
    this.handleAutoWaveProgression(currentTime);
  }

  /**
   * 自動進行を有効/無効にする
   * @param enabled 有効にするかどうか
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;

    if (!enabled && this.nextWaveTimer) {
      (globalThis.clearTimeout || clearTimeout)(this.nextWaveTimer);
      this.nextWaveTimer = undefined;
      this.pendingNextWave = false;
    }

    console.log(
      `AutoWaveSystem: Auto progression ${enabled ? "enabled" : "disabled"}`,
    );
  }

  /**
   * 設定を更新する
   * @param config 新しい設定
   */
  public updateConfig(config: Partial<AutoWaveConfig>): void {
    Object.assign(this.config, config);
    console.log("AutoWaveSystem: Config updated", this.config);
  }

  /**
   * 現在の設定を取得する
   * @returns 設定のコピー
   */
  public getConfig(): Readonly<AutoWaveConfig> {
    return { ...this.config };
  }

  /**
   * システムの状態を取得する
   * @returns システム状態情報
   */
  public getStatus() {
    return {
      enabled: this.config.enabled,
      gameStarted: this.gameStarted,
      pendingNextWave: this.pendingNextWave,
      lastWaveCompletionTime: this.lastWaveCompletionTime,
    };
  }

  /**
   * 手動でゲームを開始する
   */
  public startGame(): void {
    if (this.gameStarted) {
      console.warn("AutoWaveSystem: Game already started");
      return;
    }

    this.gameStarted = true;
    this.gameStateSystem.startGame();
    this.enemySpawnSystem.startWave(1);

    console.log("AutoWaveSystem: Game started manually");
  }

  /**
   * 手動で次のウェーブを開始する
   */
  public startNextWave(): void {
    const gameState = this.gameStateSystem.getGameState();

    if (gameState.phase !== "preparation" && gameState.phase !== "wave") {
      console.warn("AutoWaveSystem: Cannot start wave in current game phase");
      return;
    }

    // 保留中のタイマーをクリア
    if (this.nextWaveTimer) {
      (globalThis.clearTimeout || clearTimeout)(this.nextWaveTimer);
      this.nextWaveTimer = undefined;
    }
    this.pendingNextWave = false;

    // 次のウェーブを開始
    const nextWaveNumber = this.enemySpawnSystem.getNextAvailableWaveNumber(
      gameState.currentWave,
    );
    if (nextWaveNumber !== null) {
      this.gameStateSystem.startWave(nextWaveNumber);
      this.enemySpawnSystem.startWave(nextWaveNumber);
      console.log(`AutoWaveSystem: Started wave ${nextWaveNumber} manually`);
    } else {
      console.log("AutoWaveSystem: No more waves available");
    }
  }

  /**
   * システムをリセットする
   */
  public reset(): void {
    this.gameStarted = false;
    this.lastWaveCompletionTime = 0;
    this.pendingNextWave = false;

    if (this.nextWaveTimer) {
      (globalThis.clearTimeout || clearTimeout)(this.nextWaveTimer);
      this.nextWaveTimer = undefined;
    }

    console.log("AutoWaveSystem: System reset");
  }

  /**
   * イベントリスナーを設定する
   */
  private setupEventListeners(): void {
    // ゲーム状態の変更を監視
    this.gameStateSystem.addEventListener("phase_changed", (event) => {
      if (
        event.data.newPhase === "preparation" &&
        event.data.oldPhase === "wave"
      ) {
        // ウェーブ完了時の処理
        this.handleWaveCompletion(event.timestamp);
      }
    });

    // ゲーム終了時のリセット
    this.gameStateSystem.addEventListener("game_ended", () => {
      this.reset();
    });
  }

  /**
   * ゲーム自動開始の処理
   * @param currentTime 現在時刻（ミリ秒）
   */
  private handleAutoGameStart(currentTime: number): void {
    if (this.gameStarted) {
      return;
    }

    const gameState = this.gameStateSystem.getGameState();

    // 準備フェーズで一定時間経過後にゲームを開始
    if (gameState.phase === "preparation" && gameState.currentWave === 0) {
      const timeSinceGameStart = currentTime - gameState.gameStartTime;

      if (timeSinceGameStart >= this.config.gameStartDelay) {
        this.startGame();
      }
    }
  }

  /**
   * 自動ウェーブ進行の処理
   * @param currentTime 現在時刻（ミリ秒）
   */
  private handleAutoWaveProgression(currentTime: number): void {
    if (!this.gameStarted || this.pendingNextWave) {
      return;
    }

    const gameState = this.gameStateSystem.getGameState();

    // 準備フェーズで敵が残っていない場合、次のウェーブを開始
    if (gameState.phase === "preparation" && gameState.enemiesRemaining === 0) {
      const timeSinceCompletion = currentTime - this.lastWaveCompletionTime;

      if (timeSinceCompletion >= this.config.nextWaveDelay) {
        this.scheduleNextWave();
      }
    }

    // ウェーブ中で敵が全滅した場合の処理
    if (gameState.phase === "wave") {
      // 実際に生きている敵の数を直接カウント
      const aliveEnemies = this.countAliveEnemies();
      const waveStatus = this.enemySpawnSystem.getWaveStatus();

      // デバッグ情報を定期的に出力（5秒間隔）
      if (currentTime % 5000 < 100) {
        console.log(
          `AutoWaveSystem Debug: Wave ${gameState.currentWave}, Alive: ${aliveEnemies}, GameState remaining: ${gameState.enemiesRemaining}, Wave active: ${waveStatus.isActive}, Spawned: ${gameState.enemiesSpawned}`,
        );
      }

      // 敵が全滅し、スポーンも完了している場合
      // 条件: 生きている敵が0匹 AND スポーンが非アクティブ AND 少なくとも1匹は生成済み
      if (
        aliveEnemies === 0 &&
        !waveStatus.isActive &&
        gameState.enemiesSpawned > 0
      ) {
        console.log("AutoWaveSystem: All enemies defeated, completing wave");
        this.gameStateSystem.completeWave(currentTime);
      }

      // スポーンが完了したが敵がまだ生成されていない場合の特別処理（空のウェーブ）
      else if (
        aliveEnemies === 0 &&
        !waveStatus.isActive &&
        gameState.enemiesSpawned === 0 &&
        waveStatus.totalSpawnedInWave === 0
      ) {
        console.log(
          "AutoWaveSystem: Wave completed without spawning enemies (empty wave)",
        );
        this.gameStateSystem.completeWave(currentTime);
      }
    }
  }

  /**
   * 生きている敵の数を直接カウントする
   * @returns 生きている敵の数
   */
  private countAliveEnemies(): number {
    const enemies = this.entityManager.queryEntities({
      required: ["enemy", "health"],
    });

    let aliveCount = 0;
    for (const enemy of enemies) {
      const healthComponent = enemy.components.get("health") as any;
      if (
        healthComponent &&
        healthComponent.currentHealth > 0 &&
        !healthComponent.isDead
      ) {
        aliveCount++;
      }
    }

    return aliveCount;
  }

  /**
   * ウェーブ完了時の処理
   * @param completionTime 完了時刻
   */
  private handleWaveCompletion(completionTime: number): void {
    this.lastWaveCompletionTime = completionTime;

    const gameState = this.gameStateSystem.getGameState();
    console.log(`AutoWaveSystem: Wave ${gameState.currentWave} completed`);

    // 最終ウェーブでない場合は次のウェーブをスケジュール
    if (gameState.currentWave < gameState.totalWaves) {
      this.scheduleNextWave();
    }
  }

  /**
   * 次のウェーブをスケジュールする
   */
  private scheduleNextWave(): void {
    if (this.pendingNextWave) {
      return;
    }

    const gameState = this.gameStateSystem.getGameState();
    const nextWaveNumber = this.enemySpawnSystem.getNextAvailableWaveNumber(
      gameState.currentWave,
    );

    if (nextWaveNumber === null) {
      console.log("AutoWaveSystem: No more waves available");
      return;
    }

    this.pendingNextWave = true;

    console.log(
      `AutoWaveSystem: Scheduling wave ${nextWaveNumber} in ${this.config.nextWaveDelay}ms`,
    );

    this.nextWaveTimer = (globalThis.setTimeout || setTimeout)(() => {
      this.pendingNextWave = false;
      this.nextWaveTimer = undefined;

      // ゲームが終了していないかチェック
      const currentGameState = this.gameStateSystem.getGameState();
      if (
        currentGameState.phase === "victory" ||
        currentGameState.phase === "defeat"
      ) {
        return;
      }

      // 次のウェーブを開始
      this.gameStateSystem.startWave(nextWaveNumber);
      this.enemySpawnSystem.startWave(nextWaveNumber);

      console.log(
        `AutoWaveSystem: Started wave ${nextWaveNumber} automatically`,
      );
    }, this.config.nextWaveDelay);
  }
}
