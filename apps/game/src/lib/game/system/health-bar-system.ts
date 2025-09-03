import type { HealthComponent } from "../components/health-component";
import type { PositionComponent } from "../components/position-component";
import type { createEntityManager } from "../entities/entity-manager";

type EntityManager = ReturnType<typeof createEntityManager>;

export type HealthBarConfig = {
  width: number;
  height: number;
  offsetY: number;
  backgroundColor: number;
  healthColor: number;
  lowHealthColor: number;
  criticalHealthColor: number;
  borderColor: number;
  showOnlyWhenDamaged: boolean;
};

export class HealthBarSystem {
  private entityManager: EntityManager;
  private scene: Phaser.Scene;
  private healthBars: Map<string, Phaser.GameObjects.Container> = new Map();
  private config: HealthBarConfig;

  constructor(
    entityManager: EntityManager,
    scene: Phaser.Scene,
    config?: Partial<HealthBarConfig>,
  ) {
    this.entityManager = entityManager;
    this.scene = scene;

    // デフォルト設定
    this.config = {
      width: 40,
      height: 6,
      offsetY: -35,
      backgroundColor: 0x333333,
      healthColor: 0x00ff00,
      lowHealthColor: 0xffff00,
      criticalHealthColor: 0xff0000,
      borderColor: 0x666666,
      showOnlyWhenDamaged: false,
      ...config,
    };
  }

  /**
   * システムの更新処理
   * 全エンティティのHPバーを更新
   */
  public update(): void {
    const entities = this.entityManager.getAllEntities();

    for (const entity of entities) {
      this.updateHealthBar(entity);
    }

    // 削除されたエンティティのHPバーをクリーンアップ
    this.cleanupHealthBars(entities);
  }

  /**
   * 指定されたエンティティのHPバーを更新
   * @param entity エンティティ
   */
  private updateHealthBar(entity: any): void {
    const healthComponent = entity.components.get("health") as HealthComponent;
    const positionComponent = entity.components.get(
      "position",
    ) as PositionComponent;

    if (!healthComponent || !positionComponent) {
      // HPバーが存在する場合は削除
      this.removeHealthBar(entity.id);
      return;
    }

    // HPバーを表示するかチェック
    if (!this.shouldShowHealthBar(healthComponent)) {
      this.removeHealthBar(entity.id);
      return;
    }

    // HPバーを作成または更新
    let healthBarContainer = this.healthBars.get(entity.id);

    if (!healthBarContainer) {
      healthBarContainer = this.createHealthBar(entity.id);
      this.healthBars.set(entity.id, healthBarContainer);
    }

    // HPバーの位置を更新
    healthBarContainer.setPosition(
      positionComponent.point.x,
      positionComponent.point.y + this.config.offsetY,
    );

    // HPバーの内容を更新
    this.updateHealthBarContent(healthBarContainer, healthComponent);
  }

  /**
   * HPバーを表示すべきかチェック
   * @param healthComponent 体力コンポーネント
   * @returns 表示すべき場合true
   */
  private shouldShowHealthBar(healthComponent: HealthComponent): boolean {
    // 死亡している場合は表示しない
    if (healthComponent.isDead) {
      return false;
    }

    // ダメージを受けている場合のみ表示する設定の場合
    if (this.config.showOnlyWhenDamaged) {
      return healthComponent.currentHealth < healthComponent.maxHealth;
    }

    return true;
  }

  /**
   * HPバーコンテナを作成
   * @param entityId エンティティID
   * @returns HPバーコンテナ
   */
  private createHealthBar(entityId: string): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 背景
    const background = this.scene.add.rectangle(
      0,
      0,
      this.config.width,
      this.config.height,
      this.config.backgroundColor,
    );
    background.setStrokeStyle(1, this.config.borderColor);

    // HP表示バー
    const healthBar = this.scene.add.rectangle(
      -this.config.width / 2,
      0,
      this.config.width,
      this.config.height - 2,
      this.config.healthColor,
    );
    healthBar.setOrigin(0, 0.5);

    container.add([background, healthBar]);
    container.setData("entityId", entityId);
    container.setData("healthBar", healthBar);

    return container;
  }

  /**
   * HPバーの内容を更新
   * @param container HPバーコンテナ
   * @param healthComponent 体力コンポーネント
   */
  private updateHealthBarContent(
    container: Phaser.GameObjects.Container,
    healthComponent: HealthComponent,
  ): void {
    const healthBar = container.getData(
      "healthBar",
    ) as Phaser.GameObjects.Rectangle;

    if (!healthBar) return;

    // HP割合を計算
    const healthRatio =
      healthComponent.maxHealth > 0
        ? healthComponent.currentHealth / healthComponent.maxHealth
        : 0;

    // HPバーの幅を更新
    const barWidth = Math.max(0, (this.config.width - 2) * healthRatio);
    healthBar.setSize(barWidth, this.config.height - 2);

    // HP割合に応じて色を変更
    let barColor = this.config.healthColor;
    if (healthRatio <= 0.2) {
      barColor = this.config.criticalHealthColor; // 赤
    } else if (healthRatio <= 0.5) {
      barColor = this.config.lowHealthColor; // 黄
    }

    healthBar.setFillStyle(barColor);
  }

  /**
   * 指定されたエンティティのHPバーを削除
   * @param entityId エンティティID
   */
  private removeHealthBar(entityId: string): void {
    const healthBar = this.healthBars.get(entityId);
    if (healthBar) {
      healthBar.destroy();
      this.healthBars.delete(entityId);
    }
  }

  /**
   * 削除されたエンティティのHPバーをクリーンアップ
   * @param currentEntities 現在存在するエンティティ配列
   */
  private cleanupHealthBars(currentEntities: any[]): void {
    const currentEntityIds = new Set(
      currentEntities.map((entity) => entity.id),
    );

    for (const [entityId, healthBar] of this.healthBars) {
      if (!currentEntityIds.has(entityId)) {
        healthBar.destroy();
        this.healthBars.delete(entityId);
      }
    }
  }

  /**
   * 全てのHPバーを削除
   */
  public destroy(): void {
    for (const [_entityId, healthBar] of this.healthBars) {
      healthBar.destroy();
    }
    this.healthBars.clear();
  }

  /**
   * HPバー設定を更新
   * @param config 新しい設定
   */
  public updateConfig(config: Partial<HealthBarConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 特定のエンティティのHPバー表示を切り替え
   * @param entityId エンティティID
   * @param visible 表示するかどうか
   */
  public setHealthBarVisible(entityId: string, visible: boolean): void {
    const healthBar = this.healthBars.get(entityId);
    if (healthBar) {
      healthBar.setVisible(visible);
    }
  }
}
