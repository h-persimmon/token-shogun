import type { Entity } from "../entities/entity";
import type { createEntityManager } from "../entities/entity-manager";

/**
 * フレームテスト用のSystem
 * デバッグ目的でスプライトのフレームをテストするための機能を提供
 */
export class FrameTestSystem {
  private entityManager: ReturnType<typeof createEntityManager>;
  private scene: Phaser.Scene;
  private performanceStatsVisible: boolean = true;
  private autoProgressionEnabled: boolean = true;

  constructor(
    entityManager: ReturnType<typeof createEntityManager>,
    scene: Phaser.Scene,
  ) {
    this.entityManager = entityManager;
    this.scene = scene;
    this.setupControls();
  }

  /**
   * キーボードコントロールを設定
   */
  private setupControls(): void {
    // フレームテスト用キーボードイベント
    this.scene.input.keyboard?.on("keydown-ONE", () => this.testSpriteFrame(0));
    this.scene.input.keyboard?.on("keydown-TWO", () => this.testSpriteFrame(1));
    this.scene.input.keyboard?.on("keydown-THREE", () =>
      this.testSpriteFrame(2),
    );
    this.scene.input.keyboard?.on("keydown-FOUR", () =>
      this.testSpriteFrame(3),
    );

    // パフォーマンス統計の表示切り替え（Pキー）
    this.scene.input.keyboard?.on("keydown-P", () =>
      this.togglePerformanceStats(),
    );

    // 自動進行の有効/無効切り替え（Aキー）
    this.scene.input.keyboard?.on("keydown-A", () =>
      this.toggleAutoProgression(),
    );
  }

  /**
   * 指定されたフレーム番号でスプライトフレームをテスト
   * @param frameNumber テストするフレーム番号
   */
  public testSpriteFrame(frameNumber: number): void {
    const entities = this.entityManager.getAllEntities();
    entities.forEach((entity: Entity) => {
      if (entity.sprite) {
        entity.sprite.setFrame(frameNumber);
        console.log(`Testing frame ${frameNumber} for entity ${entity.id}`);
      }
    });
  }

  /**
   * パフォーマンス統計の表示/非表示を切り替え
   */
  public togglePerformanceStats(): void {
    this.performanceStatsVisible = !this.performanceStatsVisible;

    // シーンのメソッドを呼び出し（シーンがこのメソッドを持っている場合）
    if (typeof (this.scene as any).togglePerformanceStats === "function") {
      (this.scene as any).togglePerformanceStats();
    }

    console.log(
      `Performance stats ${this.performanceStatsVisible ? "enabled" : "disabled"}`,
    );
  }

  /**
   * 自動進行の有効/無効を切り替え
   */
  public toggleAutoProgression(): void {
    this.autoProgressionEnabled = !this.autoProgressionEnabled;

    // シーンのメソッドを呼び出し（シーンがこのメソッドを持っている場合）
    if (typeof (this.scene as any).toggleAutoProgression === "function") {
      (this.scene as any).toggleAutoProgression();
    }

    console.log(
      `Auto progression ${this.autoProgressionEnabled ? "enabled" : "disabled"}`,
    );
  }

  /**
   * 手動ゲーム開始をトリガー
   */
  public triggerManualGameStart(): void {
    if (typeof (this.scene as any).startGame === "function") {
      (this.scene as any).startGame();
    }
  }

  /**
   * 手動ウェーブ開始をトリガー
   */
  public triggerManualWaveStart(): void {
    if (typeof (this.scene as any).startNextWave === "function") {
      (this.scene as any).startNextWave();
    }
  }

  /**
   * 自動進行が無効な場合の手動コントロールキーを設定
   */
  public setupManualControls(autoWaveSystem?: any): void {
    // 手動ゲーム開始（Spaceキー） - 自動進行が無効の場合のみ
    this.scene.input.keyboard?.on("keydown-SPACE", () => {
      if (autoWaveSystem && !autoWaveSystem.getConfig().enabled) {
        this.triggerManualGameStart();
      }
    });

    // 手動ウェーブ開始（Wキー） - 自動進行が無効の場合のみ
    this.scene.input.keyboard?.on("keydown-W", () => {
      if (autoWaveSystem && !autoWaveSystem.getConfig().enabled) {
        this.triggerManualWaveStart();
      }
    });
  }

  /**
   * システムの更新処理（現在は特に処理なし）
   */
  public update(): void {
    // 必要に応じて更新処理を追加
  }

  /**
   * システムのクリーンアップ
   */
  public destroy(): void {
    // キーボードイベントリスナーのクリーンアップ
    this.scene.input.keyboard?.off("keydown-ONE");
    this.scene.input.keyboard?.off("keydown-TWO");
    this.scene.input.keyboard?.off("keydown-THREE");
    this.scene.input.keyboard?.off("keydown-FOUR");
    this.scene.input.keyboard?.off("keydown-P");
    this.scene.input.keyboard?.off("keydown-A");
    this.scene.input.keyboard?.off("keydown-SPACE");
    this.scene.input.keyboard?.off("keydown-W");
  }

  /**
   * 現在の設定を取得
   */
  public getConfig(): {
    performanceStatsVisible: boolean;
    autoProgressionEnabled: boolean;
  } {
    return {
      performanceStatsVisible: this.performanceStatsVisible,
      autoProgressionEnabled: this.autoProgressionEnabled,
    };
  }
}
