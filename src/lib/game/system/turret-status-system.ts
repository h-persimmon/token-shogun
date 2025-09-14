import type { PositionComponent } from "../components/position-component";
import type { StructureComponent } from "../components/structure-component";
import { Entity } from "../entities/entity";
import type { createEntityManager } from "../entities/entity-manager";

type EntityManager = ReturnType<typeof createEntityManager>;

export type TurretStatusConfig = {
  offsetY: number;
  fontSize: string;
  availableColor: string;
  inUseColor: string;
  backgroundColor: number;
  padding: number;
};

export class TurretStatusSystem {
  private entityManager: EntityManager;
  private scene: Phaser.Scene;
  private statusTexts: Map<string, Phaser.GameObjects.Container> = new Map();
  private config: TurretStatusConfig;

  constructor(
    entityManager: EntityManager,
    scene: Phaser.Scene,
    config?: Partial<TurretStatusConfig>,
  ) {
    this.entityManager = entityManager;
    this.scene = scene;

    // デフォルト設定
    this.config = {
      offsetY: -50,
      fontSize: "12px",
      availableColor: "#00ff00",
      inUseColor: "#ff6600",
      backgroundColor: 0x000000,
      padding: 4,
      ...config,
    };
  }

  /**
   * システムの更新処理
   * 全ての砲台のステータステキストを更新
   */
  public update(): void {
    const entities = this.entityManager.getAllEntities();

    for (const entity of entities) {
      this.updateTurretStatus(entity);
    }

    // 削除されたエンティティのステータステキストをクリーンアップ
    this.cleanupStatusTexts(entities);
  }

  /**
   * 指定されたエンティティの砲台ステータステキストを更新
   * @param entity エンティティ
   */
  private updateTurretStatus(entity: Entity): void {
    const structureComponent = entity.components.structure as StructureComponent;
    const positionComponent = entity.components.position as PositionComponent;

    // 砲台でない場合、またはwith-unitタイプでない場合はスキップ
    if (
      !structureComponent ||
      !positionComponent ||
      structureComponent.structureType !== "cannon" ||
      structureComponent.attackableType !== "with-unit"
    ) {
      this.removeStatusText(entity.id);
      return;
    }

    // ステータステキストを作成または更新
    let statusContainer = this.statusTexts.get(entity.id);

    if (!statusContainer) {
      statusContainer = this.createStatusText(entity.id);
      this.statusTexts.set(entity.id, statusContainer);
    }

    // ステータステキストの位置を更新
    statusContainer.setPosition(
      positionComponent.point.x,
      positionComponent.point.y + this.config.offsetY,
    );

    // ステータステキストの内容を更新
    this.updateStatusTextContent(statusContainer, structureComponent);
  }

  /**
   * ステータステキストコンテナを作成
   * @param entityId エンティティID
   * @returns ステータステキストコンテナ
   */
  private createStatusText(entityId: string): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 背景
    const background = this.scene.add.rectangle(
      0,
      0,
      80,
      20,
      this.config.backgroundColor,
      0.7,
    );

    // ステータステキスト
    const statusText = this.scene.add.text(0, 0, "Available", {
      fontSize: this.config.fontSize,
      color: this.config.availableColor,
      align: "center",
    });
    statusText.setOrigin(0.5, 0.5);

    container.add([background, statusText]);
    container.setData("entityId", entityId);
    container.setData("statusText", statusText);
    container.setData("background", background);

    return container;
  }

  /**
   * ステータステキストの内容を更新
   * @param container ステータステキストコンテナ
   * @param structureComponent 構造物コンポーネント
   */
  private updateStatusTextContent(
    container: Phaser.GameObjects.Container,
    structureComponent: StructureComponent,
  ): void {
    const statusText = container.getData("statusText") as Phaser.GameObjects.Text;
    const background = container.getData("background") as Phaser.GameObjects.Rectangle;

    if (!statusText || !background) return;

    // 配備されたユニットがいるかチェック
    const isInUse = structureComponent.deployedUnitId !== undefined;
    
    if (isInUse) {
      statusText.setText("In Use");
      statusText.setColor(this.config.inUseColor);
      
      // 座席番号を表示（要件に従って1に設定）
      const seatNumber = 1;
      statusText.setText(`In Use (${seatNumber})`);
    } else {
      statusText.setText("Available");
      statusText.setColor(this.config.availableColor);
    }

    // 背景サイズをテキストに合わせて調整
    const textBounds = statusText.getBounds();
    background.setSize(
      textBounds.width + this.config.padding * 2,
      textBounds.height + this.config.padding * 2,
    );
  }

  /**
   * 指定されたエンティティのステータステキストを削除
   * @param entityId エンティティID
   */
  private removeStatusText(entityId: string): void {
    const statusText = this.statusTexts.get(entityId);
    if (statusText) {
      statusText.destroy();
      this.statusTexts.delete(entityId);
    }
  }

  /**
   * 削除されたエンティティのステータステキストをクリーンアップ
   * @param currentEntities 現在存在するエンティティ配列
   */
  private cleanupStatusTexts(currentEntities: any[]): void {
    const currentEntityIds = new Set(
      currentEntities.map((entity) => entity.id),
    );

    for (const [entityId, statusText] of this.statusTexts) {
      if (!currentEntityIds.has(entityId)) {
        statusText.destroy();
        this.statusTexts.delete(entityId);
      }
    }
  }

  /**
   * 全てのステータステキストを削除
   */
  public destroy(): void {
    for (const [_entityId, statusText] of this.statusTexts) {
      statusText.destroy();
    }
    this.statusTexts.clear();
  }

  /**
   * ステータステキスト設定を更新
   * @param config 新しい設定
   */
  public updateConfig(config: Partial<TurretStatusConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 特定のエンティティのステータステキスト表示を切り替え
   * @param entityId エンティティID
   * @param visible 表示するかどうか
   */
  public setStatusTextVisible(entityId: string, visible: boolean): void {
    const statusText = this.statusTexts.get(entityId);
    if (statusText) {
      statusText.setVisible(visible);
    }
  }
}