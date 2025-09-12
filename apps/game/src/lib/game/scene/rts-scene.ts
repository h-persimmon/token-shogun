"use client";
import { enemyUnitConfigs } from "@kiro-rts/characters";
import {
  isAttackTargetOrder,
  isDeploymentTargetOrder,
  type Order,
} from "@kiro-rts/vibe-strategy";
import { Scene } from "phaser";
import PhaserNavMeshPlugin from "phaser-navmesh";
import {
  isDefenseCrystalOrder,
  isReviveAllyUnitOrder,
} from "../../../../../../packages/vibe-strategy/interfaces";
import type { MovementComponent } from "../components/movement-component";
import type { PositionComponent } from "../components/position-component";
import type { StructureComponent } from "../components/structure-component";
import type { Entity } from "../entities/entity";
import type { createEntityManager } from "../entities/entity-manager";
import { setupEntityManager } from "../example";
import { OrderListener } from "../order-listner/index";
import { AttackSystem } from "../system/attack-system";
import { AutoDeploymentSystem } from "../system/auto-deployment-system";
import { AutoWaveSystem } from "../system/auto-wave-system";
import { CameraControlSystem } from "../system/camera-control-system";
import { DeploymentSystem } from "../system/deployment-system";
import {
  createDefaultWaveConfigs,
  EnemySpawnSystem,
} from "../system/enemy-spawn-system";
import { FrameTestSystem } from "../system/frame-test-system";
import { GameStateSystem } from "../system/game-state-system";
import { HealthBarSystem } from "../system/health-bar-system";
import { InteractionSystem } from "../system/interaction-system";
import { MapBoundsCalculator } from "../system/map-bounds-calculator";
import { MovementSystem } from "../system/movement-system";
import { TargetingSystem } from "../system/targeting-system";
import { spriteSheetNumber } from "../ui/sprite/character-chip";

export class GameScene extends Scene {
  private entityManager?: ReturnType<typeof createEntityManager>;
  private unitSprites: Phaser.GameObjects.Sprite[] = [];
  private navMeshPlugin!: PhaserNavMeshPlugin;
  private movementSystem?: MovementSystem;
  private targetingSystem?: TargetingSystem;
  private attackSystem?: AttackSystem;
  private enemySpawnSystem?: EnemySpawnSystem;
  private gameStateSystem?: GameStateSystem;
  private deploymentSystem?: DeploymentSystem;
  private interactionSystem?: InteractionSystem;
  private autoDeploymentSystem?: AutoDeploymentSystem;
  private healthBarSystem?: HealthBarSystem;
  private autoWaveSystem?: AutoWaveSystem;
  private frameTestSystem?: FrameTestSystem;
  private cameraControlSystem?: CameraControlSystem;
  private csvFilePath?: string;
  private orderListener?: OrderListener;

  // パフォーマンス監視用
  private performanceStats = {
    frameCount: 0,
    lastFpsUpdate: 0,
    currentFps: 0,
    systemUpdateTimes: new Map<string, number>(),
    entityCount: 0,
    averageFrameTime: 0,
    maxFrameTime: 0,
    minFrameTime: Infinity,
  };
  private fpsText?: Phaser.GameObjects.Text;
  private performanceText?: Phaser.GameObjects.Text;
  private showPerformanceStats = true;

  // ゲーム状態UI要素
  private gameStateUI = {
    waveText: null as Phaser.GameObjects.Text | null,
    enemyCountText: null as Phaser.GameObjects.Text | null,
    gateHealthText: null as Phaser.GameObjects.Text | null,
    gateHealthBar: null as Phaser.GameObjects.Rectangle | null,
    gateHealthBarBg: null as Phaser.GameObjects.Rectangle | null,
    scoreText: null as Phaser.GameObjects.Text | null,
    gameOverScreen: null as Phaser.GameObjects.Container | null,
    victoryScreen: null as Phaser.GameObjects.Container | null,
  };

  // スプライトの向きを更新する関数
  private updateSpriteDirection(entity: Entity): void {
    if (!entity.sprite) return;

    const healthComponent = entity.components["health"];
    const movementComponent = entity.components["movement"] as
      | MovementComponent
      | undefined;
    if (!movementComponent) return;

    // 移動方向とアニメーションフレームに基づいてスプライトフレームを設定
    const direction = movementComponent.currentDirection;
    const animFrame = movementComponent.animationFrame; // 0, 1, 2

    const frameNumber = healthComponent?.isDead
      ? 1
      : spriteSheetNumber[direction][animFrame];
    entity.sprite.setFrame(frameNumber);
    entity.sprite.setAngle(healthComponent?.isDead ? 90 : 0);
  }

  constructor(
    config?: { csvFilePath?: string },
    orderListener?: OrderListener,
  ) {
    super({ key: "GameScene" });
    this.csvFilePath = config?.csvFilePath;
    this.orderListener = orderListener || new OrderListener();
  }

  /**
   * 全システムを初期化する
   */
  private initializeSystems(navMesh: any): void {
    if (!this.entityManager) {
      console.error("EntityManager is not initialized");
      return;
    }

    // MovementSystemを初期化
    this.movementSystem = new MovementSystem(
      this.entityManager,
      this.navMeshPlugin,
      navMesh,
    );

    // TargetingSystemを初期化
    this.targetingSystem = new TargetingSystem(
      this.entityManager,
      this.movementSystem,
    );

    this.cameraControlSystem = new CameraControlSystem(this, {
      height: 20,
      width: 20,
      tileHeight: 32,
      tileWidth: 32,
    });

    // AttackSystemを初期化
    this.attackSystem = new AttackSystem(this.entityManager);

    // GameStateSystemを初期化
    this.gameStateSystem = new GameStateSystem(
      this.entityManager,
      3,
      200,
      this,
    );

    // AttackSystemにGameStateSystemの参照を設定
    this.attackSystem.setGameStateSystem(this.gameStateSystem);

    // EnemySpawnSystemを初期化
    const spawnPoints = [
      { x: 3, y: 7 },
      { x: 3, y: 8 },
    ];
    const waveConfigs = createDefaultWaveConfigs(spawnPoints);
    this.enemySpawnSystem = new EnemySpawnSystem(
      this.entityManager,
      this,
      waveConfigs,
    );

    // CSVファイルが指定されている場合は読み込む
    if (this.csvFilePath) {
      this.enemySpawnSystem
        .loadWaveConfigsFromCSV(this.csvFilePath)
        .then((success) => {
          if (success) {
            console.log(
              `GameScene: Successfully loaded wave configs from CSV: ${this.csvFilePath}`,
            );
          } else {
            console.warn(
              `GameScene: Failed to load wave configs from CSV: ${this.csvFilePath}, using default configs`,
            );
          }
        })
        .catch((error) => {
          console.error(
            `GameScene: Error loading CSV configs: ${error.message}`,
          );
        });
    }

    // EnemySpawnSystemにGameStateSystemの参照を設定
    this.enemySpawnSystem.setGameStateSystem(this.gameStateSystem);

    // DeploymentSystemを初期化
    this.deploymentSystem = new DeploymentSystem(this.entityManager);

    // InteractionSystemを初期化
    const interactionCallbacks = {
      onStructureClicked: (structureId: string) => {
        console.log(`Structure clicked: ${structureId}`);
      },
      onDeploymentSuccess: (structureId: string, unitId: string) => {
        console.log(
          `Deployment successful: Unit ${unitId} deployed to structure ${structureId}`,
        );
      },
      onDeploymentFailed: (
        _structureId: string,
        _unitId: string,
        reason: string,
      ) => {
        console.log(`Deployment failed: ${reason}`);
      },
    };
    this.interactionSystem = new InteractionSystem(
      this,
      this.entityManager,
      this.deploymentSystem,
      this.movementSystem,
      interactionCallbacks,
    );

    // AutoDeploymentSystemを初期化
    this.autoDeploymentSystem = new AutoDeploymentSystem(this.entityManager);

    // HealthBarSystemを初期化
    this.healthBarSystem = new HealthBarSystem(this.entityManager, this, {
      showOnlyWhenDamaged: true, // ダメージを受けた時のみ表示
    });

    // AutoWaveSystemを初期化
    this.autoWaveSystem = new AutoWaveSystem(
      this.entityManager,
      this.enemySpawnSystem,
      this.gameStateSystem,
      {
        gameStartDelay: 3000, // 3秒後にゲーム開始
        nextWaveDelay: 2000, // 敵全滅後2秒で次ウェーブ
        enabled: true,
      },
    );

    // FrameTestSystemを初期化
    this.frameTestSystem = new FrameTestSystem(this.entityManager, this);

    console.log("All systems initialized successfully");
  }

  /**
   * ゲームエンティティをセットアップ
   */
  private setupGameEntities(): void {
    if (!this.entityManager || !this.gameStateSystem) return;

    // ゲートエンティティを検索してGameStateSystemに設定
    const allEntities = this.entityManager.getAllEntities();
    for (const entity of allEntities) {
      const structureComponent = entity.components["structure"];
      if (
        structureComponent &&
        (structureComponent as any).structureType === "gate"
      ) {
        this.gameStateSystem.setGateEntity(entity.id);
        console.log(`Gate entity set: ${entity.id}`);
        break;
      }
    }
  }

  private initializePerformanceUI(): void {
    if (!this.showPerformanceStats) return;

    // FPS表示
    this.fpsText = this.add.text(10, 10, "FPS: 0", {
      fontSize: "14px",
      color: "#00ff00",
      backgroundColor: "#000000",
      padding: { x: 5, y: 2 },
    });

    // パフォーマンス統計表示
    this.performanceText = this.add.text(10, 35, "", {
      fontSize: "12px",
      color: "#ffff00",
      backgroundColor: "#000000",
      padding: { x: 5, y: 2 },
    });

    // パフォーマンス統計の初期化
    this.performanceStats.lastFpsUpdate = Date.now();
  }

  /**
   * フレーム時間統計を更新
   */
  private updateFrameTimeStats(frameTime: number): void {
    this.performanceStats.frameCount++;

    // フレーム時間の統計を更新
    if (frameTime > this.performanceStats.maxFrameTime) {
      this.performanceStats.maxFrameTime = frameTime;
    }
    if (frameTime < this.performanceStats.minFrameTime) {
      this.performanceStats.minFrameTime = frameTime;
    }

    // 移動平均でフレーム時間を計算
    const alpha = 0.1; // 平滑化係数
    this.performanceStats.averageFrameTime =
      this.performanceStats.averageFrameTime * (1 - alpha) + frameTime * alpha;
  }

  /**
   * パフォーマンス統計を更新
   */
  private updatePerformanceStats(): void {
    if (!this.showPerformanceStats) return;

    const currentTime = Date.now();
    const timeSinceLastUpdate =
      currentTime - this.performanceStats.lastFpsUpdate;

    // 1秒ごとにFPSを更新
    if (timeSinceLastUpdate >= 1000) {
      this.performanceStats.currentFps = Math.round(
        (this.performanceStats.frameCount * 1000) / timeSinceLastUpdate,
      );
      this.performanceStats.frameCount = 0;
      this.performanceStats.lastFpsUpdate = currentTime;

      // エンティティ数を更新
      if (this.entityManager) {
        this.performanceStats.entityCount =
          this.entityManager.getAllEntities().length;
      }

      // UI表示を更新
      this.updatePerformanceUI();

      // フレーム時間統計をリセット
      this.performanceStats.maxFrameTime = 0;
      this.performanceStats.minFrameTime = Infinity;
    }
  }

  /**
   * パフォーマンスUIを更新
   */
  private updatePerformanceUI(): void {
    if (!this.fpsText || !this.performanceText) return;

    // FPS表示を更新
    const fpsColor =
      this.performanceStats.currentFps >= 50
        ? "#00ff00"
        : this.performanceStats.currentFps >= 30
          ? "#ffff00"
          : "#ff0000";
    this.fpsText.setColor(fpsColor);
    this.fpsText.setText(`FPS: ${this.performanceStats.currentFps}`);

    // パフォーマンス統計を更新
    const stats = [
      `Entities: ${this.performanceStats.entityCount}`,
      `Avg Frame: ${this.performanceStats.averageFrameTime.toFixed(2)}ms`,
      `Max Frame: ${this.performanceStats.maxFrameTime.toFixed(2)}ms`,
    ];

    // システム別更新時間を追加
    const systemTimes: string[] = [];
    this.performanceStats.systemUpdateTimes.forEach((time, system) => {
      if (time > 0.1) {
        // 0.1ms以上の場合のみ表示
        systemTimes.push(`${system}: ${time.toFixed(2)}ms`);
      }
    });

    if (systemTimes.length > 0) {
      stats.push("System Times:");
      stats.push(...systemTimes);
    }

    this.performanceText.setText(stats.join("\n"));
  }

  /**
   * パフォーマンス統計の表示/非表示を切り替え
   */
  public togglePerformanceStats(): void {
    this.showPerformanceStats = !this.showPerformanceStats;

    if (this.fpsText) {
      this.fpsText.setVisible(this.showPerformanceStats);
    }
    if (this.performanceText) {
      this.performanceText.setVisible(this.showPerformanceStats);
    }
  }

  /**
   * ゲーム状態UIを初期化
   */
  private initializeGameStateUI(): void {
    const uiX = this.cameras.main.width - 200;
    const uiY = 20;

    // ウェーブ情報表示
    this.gameStateUI.waveText = this.add.text(uiX, uiY, "Wave: 0/3", {
      fontSize: "16px",
      color: "#ffffff",
      backgroundColor: "#000000",
      padding: { x: 8, y: 4 },
    });

    // 敵数表示
    this.gameStateUI.enemyCountText = this.add.text(
      uiX,
      uiY + 30,
      "Enemies: 0",
      {
        fontSize: "14px",
        color: "#ff6666",
        backgroundColor: "#000000",
        padding: { x: 8, y: 4 },
      },
    );

    // 門の体力表示
    this.gameStateUI.gateHealthText = this.add.text(
      uiX,
      uiY + 60,
      "Gate Health:",
      {
        fontSize: "14px",
        color: "#66ff66",
        backgroundColor: "#000000",
        padding: { x: 8, y: 4 },
      },
    );

    // 門の体力バー背景
    this.gameStateUI.gateHealthBarBg = this.add.rectangle(
      uiX + 10,
      uiY + 85,
      150,
      12,
      0x333333,
    );
    this.gameStateUI.gateHealthBarBg.setStrokeStyle(1, 0x666666);
    this.gameStateUI.gateHealthBarBg.setOrigin(0, 0.5);

    // 門の体力バー
    this.gameStateUI.gateHealthBar = this.add.rectangle(
      uiX + 10,
      uiY + 85,
      150,
      10,
      0x00ff00,
    );
    this.gameStateUI.gateHealthBar.setOrigin(0, 0.5);

    // スコア表示
    this.gameStateUI.scoreText = this.add.text(uiX, uiY + 110, "Score: 0", {
      fontSize: "16px",
      color: "#ffff00",
      backgroundColor: "#000000",
      padding: { x: 8, y: 4 },
    });

    // ゲーム状態システムのイベントリスナーを設定
    this.setupGameStateEventListeners();
  }

  /**
   * ゲーム状態システムのイベントリスナーを設定
   */
  private setupGameStateEventListeners(): void {
    if (!this.gameStateSystem) return;

    // ゲーム終了イベント
    this.gameStateSystem.addEventListener("game_ended", (event) => {
      if (event.data.result === "victory") {
        this.showVictoryScreen();
      } else {
        this.showGameOverScreen();
      }
    });

    // ウェーブ開始イベント
    this.gameStateSystem.addEventListener("wave_started", (event) => {
      console.log(`Wave ${event.data.waveNumber} started!`);
    });

    // ウェーブ完了イベント
    this.gameStateSystem.addEventListener("wave_completed", (event) => {
      console.log(`Wave ${event.data.waveNumber} completed!`);
    });
  }

  /**
   * ゲーム状態UIを更新
   */
  private updateGameStateUI(): void {
    if (!this.gameStateSystem) return;

    const gameState = this.gameStateSystem.getGameState();

    // ウェーブ情報を更新
    if (this.gameStateUI.waveText) {
      this.gameStateUI.waveText.setText(
        `Wave: ${gameState.currentWave}/${gameState.totalWaves}`,
      );
    }

    // 敵数を更新
    if (this.gameStateUI.enemyCountText) {
      this.gameStateUI.enemyCountText.setText(
        `Enemies: ${gameState.enemiesRemaining}`,
      );
    }

    // 門の体力を更新
    if (this.gameStateUI.gateHealthText) {
      this.gameStateUI.gateHealthText.setText(
        `Gate: ${gameState.gateHealth}/${gameState.maxGateHealth}`,
      );
    }

    // 門の体力バーを更新
    if (this.gameStateUI.gateHealthBar && gameState.maxGateHealth > 0) {
      const healthRatio = gameState.gateHealth / gameState.maxGateHealth;
      const barWidth = 150 * healthRatio;
      this.gameStateUI.gateHealthBar.setSize(barWidth, 10);

      // 体力に応じて色を変更
      let barColor = 0x00ff00; // 緑
      if (healthRatio < 0.3) {
        barColor = 0xff0000; // 赤
      } else if (healthRatio < 0.6) {
        barColor = 0xffff00; // 黄
      }
      this.gameStateUI.gateHealthBar.setFillStyle(barColor);
    }

    // スコアを更新
    if (this.gameStateUI.scoreText) {
      this.gameStateUI.scoreText.setText(`Score: ${gameState.score}`);
    }
  }

  /**
   * 勝利画面を表示
   */
  private showVictoryScreen(): void {
    if (this.gameStateUI.victoryScreen) {
      this.gameStateUI.victoryScreen.setVisible(true);
      return;
    }

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // 勝利画面コンテナを作成
    this.gameStateUI.victoryScreen = this.add.container(centerX, centerY);

    // 背景
    const background = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.8);
    background.setStrokeStyle(3, 0x00ff00);

    // タイトル
    const titleText = this.add.text(0, -100, "VICTORY!", {
      fontSize: "48px",
      color: "#00ff00",
      fontStyle: "bold",
    });
    titleText.setOrigin(0.5);

    // 統計情報
    const gameState = this.gameStateSystem?.getGameState();
    const _statistics = this.gameStateSystem?.getGameStatistics();

    const statsText = [
      `Final Score: ${gameState?.score || 0}`,
      `Waves Completed: ${gameState?.currentWave || 0}/${gameState?.totalWaves || 0}`,
      `Enemies Defeated: ${(gameState?.enemiesSpawned || 0) - (gameState?.enemiesRemaining || 0)}`,
      `Gate Health: ${gameState?.gateHealth || 0}/${gameState?.maxGateHealth || 0}`,
    ];

    const statsDisplay = this.add.text(0, -20, statsText.join("\n"), {
      fontSize: "16px",
      color: "#ffffff",
      align: "center",
    });
    statsDisplay.setOrigin(0.5);

    // リスタートボタン
    const restartButton = this.createButton(0, 80, "Restart Game", () => {
      this.restartGame();
    });

    this.gameStateUI.victoryScreen.add([
      background,
      titleText,
      statsDisplay,
      restartButton,
    ]);
  }

  /**
   * ゲームオーバー画面を表示
   */
  private showGameOverScreen(): void {
    if (this.gameStateUI.gameOverScreen) {
      this.gameStateUI.gameOverScreen.setVisible(true);
      return;
    }

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // ゲームオーバー画面コンテナを作成
    this.gameStateUI.gameOverScreen = this.add.container(centerX, centerY);

    // 背景
    const background = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.8);
    background.setStrokeStyle(3, 0xff0000);

    // タイトル
    const titleText = this.add.text(0, -100, "GAME OVER", {
      fontSize: "48px",
      color: "#ff0000",
      fontStyle: "bold",
    });
    titleText.setOrigin(0.5);

    // 統計情報
    const gameState = this.gameStateSystem?.getGameState();

    const statsText = [
      `Final Score: ${gameState?.score || 0}`,
      `Wave Reached: ${gameState?.currentWave || 0}/${gameState?.totalWaves || 0}`,
      `Enemies Defeated: ${(gameState?.enemiesSpawned || 0) - (gameState?.enemiesRemaining || 0)}`,
      `Gate Health: ${gameState?.gateHealth || 0}/${gameState?.maxGateHealth || 0}`,
    ];

    const statsDisplay = this.add.text(0, -20, statsText.join("\n"), {
      fontSize: "16px",
      color: "#ffffff",
      align: "center",
    });
    statsDisplay.setOrigin(0.5);

    // リスタートボタン
    const restartButton = this.createButton(0, 80, "Restart Game", () => {
      this.restartGame();
    });

    this.gameStateUI.gameOverScreen.add([
      background,
      titleText,
      statsDisplay,
      restartButton,
    ]);
  }

  /**
   * ボタンを作成するヘルパーメソッド
   */
  private createButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const button = this.add.container(x, y);

    const buttonBg = this.add.rectangle(0, 0, 200, 40, 0x333333);
    buttonBg.setStrokeStyle(2, 0x666666);
    buttonBg.setInteractive();

    const buttonText = this.add.text(0, 0, text, {
      fontSize: "16px",
      color: "#ffffff",
    });
    buttonText.setOrigin(0.5);

    // ホバーエフェクト
    buttonBg.on("pointerover", () => {
      buttonBg.setFillStyle(0x444444);
    });

    buttonBg.on("pointerout", () => {
      buttonBg.setFillStyle(0x333333);
    });

    buttonBg.on("pointerdown", onClick);

    button.add([buttonBg, buttonText]);
    return button;
  }

  /**
   * ゲームをリスタート
   */
  private restartGame(): void {
    console.log("Restarting game...");

    // ゲーム終了画面を非表示
    if (this.gameStateUI.victoryScreen) {
      this.gameStateUI.victoryScreen.setVisible(false);
    }
    if (this.gameStateUI.gameOverScreen) {
      this.gameStateUI.gameOverScreen.setVisible(false);
    }

    // 全てのシステムをクリーンアップ
    this.cleanupSystems();

    // 全てのエンティティを削除
    this.cleanupEntities();

    // HPバーをクリーンアップ
    if (this.healthBarSystem) {
      this.healthBarSystem.destroy();
    }

    // 攻撃エフェクトをクリーンアップ
    this.cleanupAttackEffects();

    // シーンを再開
    if (this.scene.isPaused()) {
      this.scene.resume();
    }

    // 少し遅延してからゲームを再初期化
    this.time.delayedCall(100, () => {
      this.reinitializeGame();
    });
  }

  /**
   * システムをクリーンアップ
   */
  private cleanupSystems(): void {
    // ゲーム状態をリセット
    if (this.gameStateSystem) {
      this.gameStateSystem.resetGame();
    }

    // 敵スポーンシステムを停止
    if (this.enemySpawnSystem) {
      this.enemySpawnSystem.stopCurrentWave();
    }

    // 自動ウェーブシステムをリセット
    if (this.autoWaveSystem) {
      this.autoWaveSystem.reset();
    }

    // フレームテストシステムをクリーンアップ
    if (this.frameTestSystem) {
      this.frameTestSystem.destroy();
    }
  }

  /**
   * 全てのエンティティを削除
   */
  private cleanupEntities(): void {
    if (!this.entityManager) return;

    // 全てのエンティティのスプライトとカスタムグラフィックスを削除
    const entities = this.entityManager.getAllEntities();
    entities.forEach((entity) => {
      if (entity.sprite?.active) {
        entity.sprite.destroy();
      }
      // カスタムグラフィックスも削除
      const customGraphics = (entity as any).customGraphics;
      if (customGraphics?.active) {
        customGraphics.destroy();
      }
    });

    // ユニットスプライト配列をクリア
    this.unitSprites.forEach((sprite) => {
      if (sprite?.active) {
        sprite.destroy();
      }
    });
    this.unitSprites = [];

    // エンティティマネージャーをクリア
    // 注意: この実装はentity-manager.tsにclearAllEntitiesメソッドが必要
    if (typeof (this.entityManager as any).clearAllEntities === "function") {
      (this.entityManager as any).clearAllEntities();
    }
  }

  /**
   * 攻撃エフェクトをクリーンアップ
   */
  private cleanupAttackEffects(): void {
    // 攻撃エフェクト関連のグラフィックスを削除
    this.children.getChildren().forEach((child) => {
      if (
        child.getData &&
        (child.getData("isAttackEffect") ||
          child.getData("isTargetMarker") ||
          child.getData("isHighlight"))
      ) {
        child.destroy();
      }
    });
  }

  /**
   * ゲームを再初期化
   */
  private reinitializeGame(): void {
    console.log("Reinitializing game...");

    // EntityManagerを再セットアップ
    this.entityManager = setupEntityManager(this);

    // システムを再初期化
    if (this.navMeshPlugin) {
      // NavMeshを再取得
      const tilemap = this.add.tilemap("map");
      const objectLayer = tilemap.getObjectLayer("navMesh");
      const navMesh = this.navMeshPlugin.buildMeshFromTiled(
        "mesh",
        objectLayer,
        12.5,
      );

      this.initializeSystems(navMesh);
    }

    // ゲームエンティティを再セットアップ
    this.setupGameEntities();

    // ユニットスプライトを再表示
    this.displayUnitSprites();

    // クリックイベントを再設定
    this.setupMovementControls();

    // HealthBarSystemを再初期化
    this.healthBarSystem = new HealthBarSystem(this.entityManager, this, {
      showOnlyWhenDamaged: true,
    });

    // EnemySpawnSystemにGameStateSystemの参照を再設定
    if (this.enemySpawnSystem && this.gameStateSystem) {
      this.enemySpawnSystem.setGameStateSystem(this.gameStateSystem);
    }

    // AutoWaveSystemを再初期化
    if (this.enemySpawnSystem && this.gameStateSystem) {
      this.autoWaveSystem = new AutoWaveSystem(
        this.entityManager,
        this.enemySpawnSystem,
        this.gameStateSystem,
        {
          gameStartDelay: 3000,
          nextWaveDelay: 2000,
          enabled: true,
        },
      );
    }

    // FrameTestSystemを再初期化
    this.frameTestSystem = new FrameTestSystem(this.entityManager, this);
    if (this.frameTestSystem) {
      this.frameTestSystem.setupManualControls(this.autoWaveSystem);
    }

    console.log("Game reinitialized successfully");
  }

  /**
   * ゲームを開始
   */
  private startGame(): void {
    if (this.autoWaveSystem) {
      // 自動ウェーブシステムを使用してゲームを開始
      this.autoWaveSystem.startGame();
    } else {
      // フォールバック: 従来の方法でゲームを開始
      if (this.gameStateSystem) {
        this.gameStateSystem.startGame();
      }
      if (this.enemySpawnSystem) {
        this.enemySpawnSystem.startWave(1);
      }
    }
    console.log("Game started");
  }

  /**
   * 次のウェーブを開始
   */
  private startNextWave(): void {
    if (this.autoWaveSystem) {
      // 自動ウェーブシステムを使用して次のウェーブを開始
      this.autoWaveSystem.startNextWave();
    } else {
      // フォールバック: 従来の方法で次のウェーブを開始
      if (this.enemySpawnSystem) {
        const currentWave =
          this.gameStateSystem?.getGameState().currentWave || 0;
        this.enemySpawnSystem.startWave(currentWave + 1);
      }
    }
    console.log("Next wave started");
  }

  /**
   * 攻撃エフェクトイベントリスナーを設定
   */
  private setupAttackEffectListeners(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("attackEffect", (event: any) => {
      this.handleAttackEffect(event.detail);
    });

    // 弾丸エフェクトイベントリスナーを追加
    window.addEventListener("projectileEffect", (event: any) => {
      this.handleProjectileEffect(event.detail);
    });
  }

  /**
   * 攻撃エフェクトを処理
   * @param effectData エフェクトデータ
   */
  private handleAttackEffect(effectData: any): void {
    switch (effectData.type) {
      case "attack_line":
        this.createAttackLineEffect(effectData);
        break;
      case "impact":
        this.createImpactEffect(effectData);
        break;
    }
  }

  /**
   * 攻撃線エフェクトを作成
   * @param effectData エフェクトデータ
   */
  private createAttackLineEffect(effectData: any): void {
    const line = this.add.graphics();
    line.lineStyle(2, effectData.color || 0xffffff, 0.8);
    line.beginPath();
    line.moveTo(effectData.from.x, effectData.from.y);
    line.lineTo(effectData.to.x, effectData.to.y);
    line.strokePath();

    // エフェクトを一定時間後に削除
    this.time.delayedCall(effectData.duration || 200, () => {
      if (line?.active) {
        line.destroy();
      }
    });
  }

  /**
   * 着弾エフェクトを作成
   * @param effectData エフェクトデータ
   */
  private createImpactEffect(effectData: any): void {
    const impact = this.add.graphics();
    const radius = 8 * (effectData.scale || 1.0);

    impact.fillStyle(effectData.color || 0xffffff, 0.6);
    impact.fillCircle(effectData.position.x, effectData.position.y, radius);

    // パルスエフェクト
    this.tweens.add({
      targets: impact,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: effectData.duration || 300,
      ease: "Power2",
      onComplete: () => {
        if (impact?.active) {
          impact.destroy();
        }
      },
    });
  }

  preload() {
    // for debug
    const enemyCharachips = enemyUnitConfigs
      .map((c) => c.charachip)
      .filter(Boolean);
    console.log(enemyCharachips);
    for (const configs of enemyUnitConfigs) {
      const charachip = configs.charachip;
      const config = configs.charachipConfig || {
        frameWidth: 32,
        frameHeight: 32,
      };
      if (!this.textures.exists(charachip)) {
        console.log(`AutoWaveSystem: Preloading charachip ${charachip}`);
        this.load.spritesheet(charachip, `/charachips/${charachip}`, {
          frameWidth: config.frameWidth,
          frameHeight: config.frameHeight,
        });
      }
    }

    // ユニット用のアセットをロード（4行6列のスプライトシート）
    this.load.spritesheet("soldier", "/game-assets/slime.png", {
      frameWidth: 20, // 各フレームの幅
      frameHeight: 28, // 各フレームの高さ
      // 4行6列（24フレーム）のスプライトシート
    });
    this.load.spritesheet("enemy", "/game-assets/slime6.png", {
      frameWidth: 20, // 各フレームの幅
      frameHeight: 28, // 各フレームの高さ
      // 4行6列（24フレーム）のスプライトシート
    });
    // サイズ小さくして読み取り
    this.load.image("cannon", "/game-assets/cannon.png");
    this.load.tilemapTiledJSON("map", "/game-assets/tilemaps/map_01.json");
    this.load.image("tiles", "/game-assets/tilemaps/tiles.png");
  }

  create() {
    this.plugins.installScenePlugin(
      "PhaserNavMeshPlugin",
      PhaserNavMeshPlugin,
      "navMeshPlugin",
      this,
    );

    // navMeshPluginの型安全なアクセス
    this.navMeshPlugin = (this as any).navMeshPlugin;

    const tilemap = this.add.tilemap("map");
    const tileset = tilemap.addTilesetImage("tiles", "tiles", 32, 32)!;
    console.log(tileset);
    tilemap.createLayer("bg", tileset);
    const _wallLayer = tilemap.createLayer("walls", tileset);

    // Load the navMesh from the tilemap object layer "navmesh" (created in Tiled). The navMesh was
    // created with 12.5 pixels of space around obstacles.
    const objectLayer = tilemap.getObjectLayer("navmesh");
    const navMesh = this.navMeshPlugin.buildMeshFromTiled("mesh", objectLayer);

    // タイトルテキスト
    this.add
      .text(400, 50, "Next.js + Phaser ECS Game", {
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Entity Manager をセットアップ（example.tsのセットアップを利用）
    this.entityManager = setupEntityManager(this);
    ((window as any).entityManager as any) = this.entityManager;

    // システムを初期化
    this.initializeSystems(navMesh);

    // ゲートをGameStateSystemに設定
    this.setupGameEntities();

    // ユニットSpriteを配置
    this.displayUnitSprites();

    // 右クリックで移動命令を設定
    this.setupMovementControls();

    // FrameTestSystemのマニュアルコントロールを設定
    if (this.frameTestSystem) {
      this.frameTestSystem.setupManualControls(this.autoWaveSystem);
    }

    // パフォーマンス監視UIを初期化
    this.initializePerformanceUI();

    // ゲーム状態UIを初期化
    this.initializeGameStateUI();

    // 攻撃エフェクトイベントリスナーを設定
    this.setupAttackEffectListeners();

    // OrderListnerを初期化
    if (this.orderListener && this.entityManager) {
      this.orderListener.setEntityManager(this.entityManager);
    }
  }
  // ユニットSpriteを表示
  private displayUnitSprites() {
    if (!this.entityManager) return;
    this.unitSprites.forEach((sprite) => sprite.destroy());
    this.unitSprites = [];

    const entities = this.entityManager.getAllEntities();
    entities.forEach((entity) => {
      // Spriteの座標をPositionComponentから取得（ピクセル座標として扱う）
      const pos = entity.components["position"] as
        | PositionComponent
        | undefined;
      if (pos && entity.sprite) {
        entity.sprite.setPosition(pos.point.x, pos.point.y);

        // 初期のスプライトの向きを設定
        this.updateSpriteDirection(entity);

        this.unitSprites.push(entity.sprite);
      }
    });
  }

  private setupMovementControls() {
    let selectedEntity: Entity | null = null;

    // エンティティ選択
    this.entityManager?.getAllEntities().forEach((entity) => {
      if (entity.sprite) {
        entity.sprite.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
          if (pointer.leftButtonDown()) {
            if (entity?.components["unit"]) {
              selectedEntity = entity;
            } else if (selectedEntity && entity.components["structure"]) {
              // Unitのターゲットを選択された構造物に設定
              const structureComponent = entity.components["structure"];
              if (
                (structureComponent as StructureComponent).attackableType ===
                "with-unit"
              ) {
                // selectedEntityのターゲットをentityに設定
                const positionComponent = entity.components[
                  "position"
                ] as PositionComponent;
                this.movementSystem?.moveEntityTo(
                  selectedEntity.id,
                  {
                    x: positionComponent.point.x,
                    y: positionComponent.point.y,
                  },
                  entity.id,
                );
              }
            }
            console.log(`Selected entity: ${entity.id}`);

            // 選択されたエンティティをハイライト
            this.highlightSelectedEntity(entity);
          }
        });
      }
    });
  }

  private highlightSelectedEntity(entity: Entity) {
    // 既存のハイライトをクリア
    this.children.getChildren().forEach((child) => {
      if (child.getData("isHighlight")) {
        child.destroy();
      }
    });

    // 選択されたエンティティの周りに円を描画
    if (entity.sprite) {
      const highlight = this.add.graphics();
      highlight.lineStyle(2, 0xffd700); // 金色の枠
      highlight.strokeCircle(entity.sprite.x, entity.sprite.y, 25);
      highlight.setData("isHighlight", true);
    }
  }

  update(time: number, delta: number) {
    // 命令を取得
    const orders = this.orderListener?.getOrders();

    const nowTime = Date.now();
    // 各システムの更新処理を実行
    this.updateSystems(nowTime, delta, orders || []);

    // ユニットSpriteの位置と向きをコンポーネントに合わせて更新
    this.updateEntitySprites();

    // ゲートの見た目を更新
    this.updateGateAppearance();

    // パフォーマンス統計を更新
    this.updatePerformanceStats();

    // ゲーム状態UIを更新
    this.updateGameStateUI();

    // OrderListenerのゲーム状態情報を更新
    if (this.orderListener && this.entityManager) {
      this.orderListener.setEntityManager(this.entityManager);
      this.orderListener.updateGameStatusInfo();
    }
  }

  /**
   * 全システムの更新処理を実行
   * システム更新順序は依存関係を考慮して最適化されている
   */
  private updateSystems(time: number, delta: number, orders: Order[]): number {
    const frameStartTime = performance.now();

    // システム更新時間を測定するためのヘルパー関数
    const measureSystemUpdate = (systemName: string, updateFn: () => void) => {
      const startTime = performance.now();
      updateFn();
      const endTime = performance.now();
      this.performanceStats.systemUpdateTimes.set(
        systemName,
        endTime - startTime,
      );
    };

    // 1. EnemySpawnSystem - 敵の生成
    if (this.enemySpawnSystem) {
      measureSystemUpdate("EnemySpawn", () => {
        this.enemySpawnSystem?.update(time);
      });
    }

    // 2. MovementSystem - エンティティの移動
    if (this.movementSystem) {
      measureSystemUpdate("Movement", () => {
        this.movementSystem?.update(delta);
      });
    }

    // 3. TargetingSystem - 攻撃目標の選択
    if (this.targetingSystem) {
      measureSystemUpdate("Targeting", () => {
        this.targetingSystem?.update(
          orders.filter(
            (o) =>
              isAttackTargetOrder(o) ||
              isDefenseCrystalOrder(o) ||
              isDeploymentTargetOrder(o),
          ),
        );
      });
    }

    // 4. AttackSystem - 攻撃処理
    if (this.attackSystem) {
      measureSystemUpdate("Attack", () => {
        this.attackSystem?.update(time);
      });
    }

    // 5. GameStateSystem - ゲーム状態の管理と勝敗判定
    if (this.gameStateSystem) {
      measureSystemUpdate("GameState", () => {
        this.gameStateSystem?.update(time);
      });
    }

    // 6. InteractionSystem - ユーザーインタラクション
    if (this.interactionSystem) {
      measureSystemUpdate("Interaction", () => {
        this.interactionSystem?.update();
      });
    }

    // 7. AutoDeploymentSystem - 自動配備
    if (this.autoDeploymentSystem) {
      measureSystemUpdate("AutoDeployment", () => {
        this.autoDeploymentSystem?.update();
      });
    }

    // 8. HealthBarSystem - HPバー表示
    if (this.healthBarSystem) {
      measureSystemUpdate("HealthBar", () => {
        this.healthBarSystem?.update();
      });
    }

    // 9. AutoWaveSystem - 自動ウェーブ進行
    if (this.autoWaveSystem) {
      measureSystemUpdate("AutoWave", () => {
        this.autoWaveSystem?.update(time);
      });
    }

    // 10. FrameTestSystem - フレームテストとデバッグ機能
    if (this.frameTestSystem) {
      measureSystemUpdate("FrameTest", () => {
        this.frameTestSystem?.update();
      });
    }

    const reviveAllyUnitOrder = orders.filter((o) => isReviveAllyUnitOrder(o));
    for (const order of reviveAllyUnitOrder) {
      const entityId = order.entityId;
      const entity = this.entityManager?.getEntity(entityId);
      if (entity?.components.health?.isDead) {
        entity.components.health.isDead = false;
        entity.components.health.currentHealth =
          entity.components.health.maxHealth;
        if (entity?.components.position) {
          const gatePosition = this.entityManager
            ?.queryEntities({ required: ["structure"] })
            .find(
              (e) =>
                (e.components.structure as StructureComponent).structureType ===
                "gate",
            )?.components.position;
          if (gatePosition) {
            entity.components.position.point = {
              x: gatePosition.point.x,
              y: gatePosition.point.y + 50,
            };
          }
        }
      }

      if (this.cameraControlSystem) {
        this.cameraControlSystem.update();
      }
    }

    // フレーム時間統計を更新
    const frameEndTime = performance.now();
    const frameTime = frameEndTime - frameStartTime;
    this.updateFrameTimeStats(frameTime);

    return time;
  }

  /**
   * エンティティのスプライト表示を更新
   */
  private updateEntitySprites(): void {
    if (!this.entityManager) return;

    const entities = this.entityManager.getAllEntities();
    entities.forEach((entity) => {
      const pos = entity.components["position"] as
        | PositionComponent
        | undefined;
      if (pos && entity.sprite) {
        // 位置を更新
        entity.sprite.setPosition(pos.point.x, pos.point.y);

        // スプライトの向きを更新
        this.updateSpriteDirection(entity);
      }
    });
  }

  /**
   * ゲートの見た目を体力に応じて更新
   */
  private updateGateAppearance(): void {
    if (!this.entityManager) return;

    const entities = this.entityManager.getAllEntities();
    for (const entity of entities) {
      const structureComponent = entity.components["structure"] as any;
      const healthComponent = entity.components["health"] as any;

      if (
        structureComponent &&
        structureComponent.structureType === "gate" &&
        healthComponent
      ) {
        const customGraphics = (entity as any).customGraphics;
        if (customGraphics) {
          // 体力の割合を計算
          const healthRatio =
            healthComponent.currentHealth / healthComponent.maxHealth;

          // 前回の状態を記録して、変化があった時のみ再描画
          const lastHealthState = (entity as any).lastHealthState || "healthy";
          let currentHealthState = "healthy";

          if (healthRatio <= 0) {
            currentHealthState = "destroyed";
          } else if (healthRatio <= 0.3) {
            currentHealthState = "heavy_damage";
          } else if (healthRatio <= 0.6) {
            currentHealthState = "light_damage";
          }

          // 状態が変化した場合のみ再描画
          if (lastHealthState !== currentHealthState) {
            customGraphics.clear();

            switch (currentHealthState) {
              case "destroyed":
                this.drawDestroyedGate(customGraphics, 29 * 32, 10 * 32);
                break;
              case "heavy_damage":
                this.drawDamagedGate(customGraphics, 29 * 32, 10 * 32, "heavy");
                break;
              case "light_damage":
                this.drawDamagedGate(customGraphics, 29 * 32, 10 * 32, "light");
                break;
              case "healthy":
                this.drawHealthyGate(customGraphics, 29 * 32, 10 * 32);
                break;
            }

            // 状態を記録
            (entity as any).lastHealthState = currentHealthState;
          }
        }
      }
    }
  }

  /**
   * 健康なゲートを描画
   */
  private drawHealthyGate(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
  ): void {
    // 門の基本構造（石造りの門）
    graphics.fillStyle(0x8b4513, 1.0); // 茶色の石
    graphics.fillRect(x - 30, y - 40, 60, 80); // メインの門構造

    // 門の装飾（上部のアーチ）
    graphics.fillStyle(0x654321, 1.0); // 濃い茶色
    graphics.fillRect(x - 35, y - 45, 70, 15); // 上部の梁

    // 門の扉部分
    graphics.fillStyle(0x2f4f4f, 1.0); // 暗いスレートグレー
    graphics.fillRect(x - 25, y - 35, 50, 70); // 扉

    // 扉の装飾（縦の線）
    graphics.lineStyle(2, 0x1c1c1c, 1.0);
    graphics.beginPath();
    graphics.moveTo(x - 15, y - 30);
    graphics.lineTo(x - 15, y + 30);
    graphics.moveTo(x - 5, y - 30);
    graphics.lineTo(x - 5, y + 30);
    graphics.moveTo(x + 5, y - 30);
    graphics.lineTo(x + 5, y + 30);
    graphics.moveTo(x + 15, y - 30);
    graphics.lineTo(x + 15, y + 30);
    graphics.strokePath();

    // 門の取っ手
    graphics.fillStyle(0xffd700, 1.0); // 金色
    graphics.fillCircle(x - 10, y, 3); // 左の取っ手
    graphics.fillCircle(x + 10, y, 3); // 右の取っ手

    // 門の周りの石壁
    graphics.fillStyle(0x696969, 1.0); // グレーの石
    graphics.fillRect(x - 45, y - 50, 15, 100); // 左の壁
    graphics.fillRect(x + 30, y - 50, 15, 100); // 右の壁

    // 門の上部の装飾（旗や紋章のような装飾）
    graphics.fillStyle(0x4169e1, 1.0); // 青色の旗
    graphics.fillRect(x - 20, y - 55, 40, 15); // 旗の部分

    // 旗の装飾（十字マーク）
    graphics.lineStyle(2, 0xffffff, 1.0);
    graphics.beginPath();
    graphics.moveTo(x - 10, y - 50);
    graphics.lineTo(x + 10, y - 50);
    graphics.moveTo(x, y - 55);
    graphics.lineTo(x, y - 45);
    graphics.strokePath();
  }

  /**
   * 損傷したゲートを描画
   */
  private drawDamagedGate(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    damageLevel: "light" | "heavy",
  ): void {
    // 基本的なゲート構造を描画（色を暗くする）
    const baseColor = damageLevel === "heavy" ? 0x654321 : 0x8b4513;
    graphics.fillStyle(baseColor, 1.0);
    graphics.fillRect(x - 30, y - 40, 60, 80);

    // 上部の梁（ひび割れ表現）
    graphics.fillStyle(0x4a4a4a, 1.0);
    graphics.fillRect(x - 35, y - 45, 70, 15);

    // 扉部分（損傷表現）
    const doorColor = damageLevel === "heavy" ? 0x1c1c1c : 0x2f4f4f;
    graphics.fillStyle(doorColor, 1.0);
    graphics.fillRect(x - 25, y - 35, 50, 70);

    // ひび割れを描画
    graphics.lineStyle(2, 0x8b0000, 1.0); // 暗い赤色のひび
    graphics.beginPath();

    if (damageLevel === "light") {
      // 軽度の損傷：少しのひび
      graphics.moveTo(x - 20, y - 30);
      graphics.lineTo(x - 10, y - 10);
      graphics.lineTo(x - 15, y + 10);
      graphics.moveTo(x + 10, y - 25);
      graphics.lineTo(x + 20, y - 5);
    } else {
      // 重度の損傷：多くのひび
      graphics.moveTo(x - 25, y - 35);
      graphics.lineTo(x - 15, y - 15);
      graphics.lineTo(x - 20, y + 5);
      graphics.lineTo(x - 10, y + 25);
      graphics.moveTo(x + 5, y - 30);
      graphics.lineTo(x + 15, y - 10);
      graphics.lineTo(x + 10, y + 10);
      graphics.lineTo(x + 20, y + 30);
      graphics.moveTo(x - 5, y - 20);
      graphics.lineTo(x + 5, y - 5);
    }

    graphics.strokePath();

    // 残った装飾部分
    if (damageLevel === "light") {
      // 取っ手（片方だけ残存）
      graphics.fillStyle(0xb8860b, 1.0); // くすんだ金色
      graphics.fillCircle(x - 10, y, 3);

      // 石壁（一部損傷）
      graphics.fillStyle(0x555555, 1.0);
      graphics.fillRect(x - 45, y - 50, 15, 100);
      graphics.fillRect(x + 30, y - 50, 15, 100);
    } else {
      // 重度の損傷では装飾はほとんど失われる
      graphics.fillStyle(0x444444, 1.0);
      graphics.fillRect(x - 45, y - 50, 15, 80); // 石壁も短くなる
      graphics.fillRect(x + 30, y - 50, 15, 80);
    }
  }

  /**
   * 破壊されたゲートを描画
   */
  private drawDestroyedGate(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
  ): void {
    // 瓦礫の山を描画
    graphics.fillStyle(0x2f2f2f, 1.0); // 暗いグレー

    // 不規則な瓦礫の形
    graphics.fillRect(x - 35, y + 10, 25, 30); // 左の瓦礫
    graphics.fillRect(x - 5, y + 5, 30, 35); // 中央の瓦礫
    graphics.fillRect(x + 15, y + 15, 20, 25); // 右の瓦礫
    graphics.fillRect(x - 20, y + 25, 15, 15); // 小さな瓦礫

    // 残った石壁の一部
    graphics.fillStyle(0x444444, 1.0);
    graphics.fillRect(x - 45, y - 50, 15, 60); // 左の壁（一部残存）
    graphics.fillRect(x + 30, y - 30, 15, 40); // 右の壁（一部残存）

    // 煙や塵のエフェクト（点で表現）
    graphics.fillStyle(0x696969, 0.6);
    for (let i = 0; i < 10; i++) {
      const offsetX = (Math.random() - 0.5) * 60;
      const offsetY = (Math.random() - 0.5) * 40 - 20;
      graphics.fillCircle(x + offsetX, y + offsetY, 2);
    }

    // 破壊の印（赤い×マーク）
    graphics.lineStyle(4, 0xff0000, 0.8);
    graphics.beginPath();
    graphics.moveTo(x - 30, y - 30);
    graphics.lineTo(x + 30, y + 30);
    graphics.moveTo(x + 30, y - 30);
    graphics.lineTo(x - 30, y + 30);
    graphics.strokePath();
  }

  /**
   * 弾丸エフェクトを処理
   * @param effectData エフェクトデータ
   */
  private handleProjectileEffect(effectData: any): void {
    switch (effectData.type) {
      case "artillery_trajectory":
        this.createArtilleryTrajectoryEffect(effectData);
        break;
      case "artillery_trajectory_update":
        this.updateArtilleryTrajectoryEffect(effectData);
        break;
      case "homing_trajectory":
        this.createHomingTrajectoryEffect(effectData);
        break;
      case "homing_trajectory_cleanup":
        this.cleanupHomingTrajectoryEffect(effectData);
        break;
      case "explosion":
        this.createExplosionEffect(effectData);
        break;
      case "projectile_hit":
        this.createProjectileHitEffect(effectData);
        break;
    }
  }

  // 軌道エフェクト管理用のマップ
  private trajectoryEffects = new Map<string, Phaser.GameObjects.Graphics>();
  private homingTrails = new Map<
    string,
    Array<{ x: number; y: number; alpha: number }>
  >();

  /**
   * 砲台攻撃の軌道エフェクトを作成（要件5.1対応）
   * @param effectData エフェクトデータ
   */
  private createArtilleryTrajectoryEffect(effectData: any): void {
    const trajectory = this.add.graphics();
    trajectory.lineStyle(
      3,
      effectData.color || 0xff8800,
      effectData.alpha || 0.6,
    );

    // 放物線軌道を描画
    const startPos = effectData.startPosition;
    const targetPos = effectData.targetPosition;
    const distance = Math.sqrt(
      (targetPos.x - startPos.x) ** 2 + (targetPos.y - startPos.y) ** 2,
    );
    const maxHeight = distance * 0.2;

    trajectory.beginPath();
    trajectory.moveTo(startPos.x, startPos.y);

    // 放物線を複数の点で描画
    const segments = 20;
    for (let i = 1; i <= segments; i++) {
      const progress = i / segments;
      const x = startPos.x + (targetPos.x - startPos.x) * progress;
      const y =
        startPos.y +
        (targetPos.y - startPos.y) * progress -
        Math.sin(progress * Math.PI) * maxHeight;
      trajectory.lineTo(x, y);
    }
    trajectory.strokePath();

    // 着弾予定地点を表示
    trajectory.fillStyle(effectData.color || 0xff8800, 0.3);
    trajectory.fillCircle(targetPos.x, targetPos.y, 30);

    // エフェクトを管理マップに追加
    this.trajectoryEffects.set(effectData.projectileId, trajectory);

    // 一定時間後に削除
    this.time.delayedCall((effectData.flightTime || 1.0) * 1000 + 500, () => {
      this.trajectoryEffects.delete(effectData.projectileId);
      if (trajectory?.active) {
        trajectory.destroy();
      }
    });
  }

  /**
   * 砲台攻撃の軌道エフェクトを更新
   * @param effectData エフェクトデータ
   */
  private updateArtilleryTrajectoryEffect(effectData: any): void {
    const trajectory = this.trajectoryEffects.get(effectData.projectileId);
    if (!trajectory) return;

    // 進捗に応じて軌道の透明度を調整
    const alpha = Math.max(0.2, 1 - effectData.progress);
    trajectory.setAlpha(alpha);
  }

  /**
   * 弓矢攻撃の追跡軌道エフェクトを作成（要件5.3対応）
   * @param effectData エフェクトデータ
   */
  private createHomingTrajectoryEffect(effectData: any): void {
    // 軌跡ポイントを管理
    let trail = this.homingTrails.get(effectData.projectileId);
    if (!trail) {
      trail = [];
      this.homingTrails.set(effectData.projectileId, trail);
    }

    // 新しいポイントを追加
    trail.push({
      x: effectData.currentPosition.x,
      y: effectData.currentPosition.y,
      alpha: 1.0,
    });

    // 古いポイントの透明度を減少
    trail.forEach((point, index) => {
      point.alpha = Math.max(0, 1 - (trail?.length - index) * 0.2);
    });

    // 最大長を制限
    if (trail.length > effectData.trailLength || 5) {
      trail.shift();
    }

    // 軌跡を描画
    const graphics = this.add.graphics();
    graphics.lineStyle(2, effectData.color || 0x00ff88);

    if (trail.length > 1) {
      graphics.beginPath();
      graphics.moveTo(trail[0].x, trail[0].y);

      for (let i = 1; i < trail.length; i++) {
        graphics.setAlpha(trail[i].alpha);
        graphics.lineTo(trail[i].x, trail[i].y);
      }
      graphics.strokePath();
    }

    // 対象への予測線を描画
    graphics.setAlpha(0.4);
    graphics.lineStyle(1, effectData.color || 0x00ff88, 0.4);
    graphics.beginPath();
    graphics.moveTo(effectData.currentPosition.x, effectData.currentPosition.y);
    graphics.lineTo(effectData.targetPosition.x, effectData.targetPosition.y);
    graphics.strokePath();

    // 短時間で削除
    this.time.delayedCall(100, () => {
      if (graphics?.active) {
        graphics.destroy();
      }
    });
  }

  /**
   * 弓矢攻撃の軌道エフェクトをクリーンアップ
   * @param effectData エフェクトデータ
   */
  private cleanupHomingTrajectoryEffect(effectData: any): void {
    this.homingTrails.delete(effectData.projectileId);
  }

  /**
   * 砲台攻撃の爆発エフェクトを作成（要件5.2対応）
   * @param effectData エフェクトデータ
   */
  private createExplosionEffect(effectData: any): void {
    const position = effectData.position;
    const radius = effectData.radius || 50;

    // メインの爆発エフェクト
    const explosion = this.add.graphics();
    explosion.fillStyle(effectData.color || 0xff4400, 0.8);
    explosion.fillCircle(position.x, position.y, radius * 0.3);

    // 爆発の拡散エフェクト
    this.tweens.add({
      targets: explosion,
      scaleX: effectData.scale || 2.0,
      scaleY: effectData.scale || 2.0,
      alpha: 0,
      duration: effectData.duration || 800,
      ease: "Power2",
      onComplete: () => {
        if (explosion?.active) {
          explosion.destroy();
        }
      },
    });

    // 衝撃波エフェクト
    if (effectData.shockwave) {
      const shockwave = this.add.graphics();
      shockwave.lineStyle(4, effectData.color || 0xff4400, 0.6);
      shockwave.strokeCircle(position.x, position.y, radius * 0.5);

      this.tweens.add({
        targets: shockwave,
        scaleX: 2.5,
        scaleY: 2.5,
        alpha: 0,
        duration: (effectData.duration || 800) * 0.7,
        ease: "Power1",
        onComplete: () => {
          if (shockwave?.active) {
            shockwave.destroy();
          }
        },
      });
    }

    // パーティクルエフェクト
    if (effectData.particles) {
      this.createExplosionParticles(
        position,
        radius,
        effectData.color || 0xff4400,
      );
    }
  }

  /**
   * 爆発パーティクルエフェクトを作成
   * @param position 爆発位置
   * @param radius 爆発範囲
   * @param color パーティクル色
   */
  private createExplosionParticles(
    position: { x: number; y: number },
    radius: number,
    color: number,
  ): void {
    const particleCount = Math.min(20, Math.max(8, radius / 5));

    for (let i = 0; i < particleCount; i++) {
      const angle =
        (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const distance = radius * (0.3 + Math.random() * 0.7);
      const particle = this.add.graphics();

      particle.fillStyle(color, 0.8);
      particle.fillCircle(0, 0, 2 + Math.random() * 3);
      particle.setPosition(position.x, position.y);

      const targetX = position.x + Math.cos(angle) * distance;
      const targetY = position.y + Math.sin(angle) * distance;

      this.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 400 + Math.random() * 400,
        ease: "Power2",
        onComplete: () => {
          if (particle?.active) {
            particle.destroy();
          }
        },
      });
    }
  }

  /**
   * 弾丸命中エフェクトを作成（要件5.4対応）
   * @param effectData エフェクトデータ
   */
  private createProjectileHitEffect(effectData: any): void {
    const position = effectData.position;
    const hit = this.add.graphics();

    // 命中エフェクトの種類に応じて異なる表現
    if (effectData.attackType === "homing") {
      // 弓矢の命中エフェクト：鋭い星型
      hit.fillStyle(effectData.color || 0x00ff88, 0.9);
      this.drawStar(hit, position.x, position.y, 5, 8, 4);
    } else {
      // 砲台の命中エフェクト：円形
      hit.fillStyle(effectData.color || 0xff8800, 0.8);
      hit.fillCircle(position.x, position.y, 6 * (effectData.scale || 0.8));
    }

    // パルスエフェクト
    this.tweens.add({
      targets: hit,
      scaleX: 2.0,
      scaleY: 2.0,
      alpha: 0,
      duration: effectData.duration || 400,
      ease: "Power2",
      onComplete: () => {
        if (hit?.active) {
          hit.destroy();
        }
      },
    });

    // パーティクルエフェクト
    if (effectData.particles) {
      this.createHitParticles(position, effectData.color || 0xff8800);
    }
  }

  /**
   * 星型を描画するヘルパー関数
   * @param graphics グラフィックスオブジェクト
   * @param x 中心X座標
   * @param y 中心Y座標
   * @param points 星の頂点数
   * @param outerRadius 外側の半径
   * @param innerRadius 内側の半径
   */
  private drawStar(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    points: number,
    outerRadius: number,
    innerRadius: number,
  ): void {
    graphics.beginPath();

    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;

      if (i === 0) {
        graphics.moveTo(px, py);
      } else {
        graphics.lineTo(px, py);
      }
    }

    graphics.closePath();
    graphics.fillPath();
  }

  /**
   * 命中パーティクルエフェクトを作成
   * @param position 命中位置
   * @param color パーティクル色
   */
  private createHitParticles(
    position: { x: number; y: number },
    color: number,
  ): void {
    const particleCount = 6;

    for (let i = 0; i < particleCount; i++) {
      const angle =
        (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.3;
      const distance = 15 + Math.random() * 10;
      const particle = this.add.graphics();

      particle.fillStyle(color, 0.9);
      particle.fillCircle(0, 0, 1 + Math.random() * 2);
      particle.setPosition(position.x, position.y);

      const targetX = position.x + Math.cos(angle) * distance;
      const targetY = position.y + Math.sin(angle) * distance;

      this.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 200 + Math.random() * 200,
        ease: "Power1",
        onComplete: () => {
          if (particle?.active) {
            particle.destroy();
          }
        },
      });
    }
  }
}
