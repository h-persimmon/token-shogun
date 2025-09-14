import type { StructureComponent } from "../components/structure-component";
import type { createEntityManager } from "../entities/entity-manager";
import type { DeploymentSystem } from "./deployment-system";
import type { MovementSystem } from "./movement-system";

export type InteractionCallbacks = {
  onStructureClicked: (structureId: string) => void;
  onDeploymentSuccess: (structureId: string, unitId: string) => void;
  onDeploymentFailed: (
    structureId: string,
    unitId: string,
    reason: string,
  ) => void;
  onUnitClicked?: (unitId: string) => void;
};

export class InteractionSystem {
  private scene: Phaser.Scene;
  private entityManager: ReturnType<typeof createEntityManager>;
  private deploymentSystem: DeploymentSystem;
  private callbacks: InteractionCallbacks;
  private movementSystem: MovementSystem;
  private clickableStructures: Map<string, Phaser.GameObjects.Sprite> =
    new Map();
  private clickableUnits: Map<string, Phaser.GameObjects.Sprite> = new Map();

  constructor(
    scene: Phaser.Scene,
    entityManager: ReturnType<typeof createEntityManager>,
    deploymentSystem: DeploymentSystem,
    movementSystem: MovementSystem,
    callbacks: InteractionCallbacks,
  ) {
    this.scene = scene;
    this.entityManager = entityManager;
    this.deploymentSystem = deploymentSystem;
    this.callbacks = callbacks;
    this.movementSystem = movementSystem;
    this.setupStructureInteractions();
  }

  private setupStructureInteractions(): void {
    // 既存の砲台にクリックイベントを設定
    this.updateStructureInteractions();
    // ユニットのクリックイベントを設定
    this.updateUnitInteractions();
  }

  public updateStructureInteractions(): void {
    // 既存のインタラクションをクリア
    this.clearStructureInteractions();

    // 全ての砲台エンティティを取得してクリック可能にする
    for (const entity of this.entityManager.getAllEntities()) {
      const structureComponent = entity.components.structure;
      if (
        structureComponent &&
        structureComponent.attackableType === "with-unit"
      ) {
        this.makeStructureClickable(entity.id, entity.sprite!);
      }
    }
  }

  public updateUnitInteractions(): void {
    // 既存のユニットインタラクションをクリア
    this.clearUnitInteractions();

    // 全てのユニット（味方、敵、構造物）エンティティを取得してクリック可能にする
    for (const entity of this.entityManager.getAllEntities()) {
      // ユニットコンポーネント、敵コンポーネント、構造物コンポーネントのいずれかを持つエンティティをユニットとして扱う
      const hasUnitComponent = entity.components.unit;
      const hasEnemyComponent = entity.components.enemy;
      const hasStructureComponent = entity.components.structure;

      if (
        (hasUnitComponent || hasEnemyComponent || hasStructureComponent) &&
        entity.sprite
      ) {
        this.makeUnitClickable(entity.id, entity.sprite);
      }
    }
  }

  private makeStructureClickable(
    structureId: string,
    sprite: Phaser.GameObjects.Sprite,
  ): void {
    if (!sprite) return;

    // スプライトをインタラクティブにする
    sprite.setInteractive();

    // クリックイベントを追加（イベント伝播を停止して構造物クリックの優先度を確保）
    sprite.on(
      "pointerdown",
      (
        pointer: Phaser.Input.Pointer,
        localX: number,
        localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        // イベントの伝播を停止して背景クリックを防ぐ
        event.stopPropagation();
        this.handleStructureClick(structureId);
      },
    );

    // ホバーエフェクトを追加
    sprite.on("pointerover", () => {
      sprite.setTint(0xcccccc); // 少し明るくする
    });

    sprite.on("pointerout", () => {
      sprite.clearTint(); // 元の色に戻す
    });

    this.clickableStructures.set(structureId, sprite);
  }

  private makeUnitClickable(
    unitId: string,
    sprite: Phaser.GameObjects.Sprite,
  ): void {
    if (!sprite) return;

    // スプライトをインタラクティブにする
    sprite.setInteractive();

    // クリックイベントを追加（イベント伝播を停止してユニットクリックの優先度を確保）
    sprite.on(
      "pointerdown",
      (
        pointer: Phaser.Input.Pointer,
        localX: number,
        localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        // イベントの伝播を停止して背景クリックを防ぐ
        event.stopPropagation();
        this.handleUnitClick(unitId);
      },
    );

    // ホバーエフェクトを追加
    sprite.on("pointerover", () => {
      sprite.setTint(0xaaaaaa); // 少し暗くする
    });

    sprite.on("pointerout", () => {
      sprite.clearTint(); // 元の色に戻す
    });

    this.clickableUnits.set(unitId, sprite);
  }

  private clearStructureInteractions(): void {
    for (const [_structureId, sprite] of this.clickableStructures) {
      if (sprite?.active) {
        sprite.removeAllListeners();
        sprite.disableInteractive();
        sprite.clearTint();
      }
    }
    this.clickableStructures.clear();
  }

  private clearUnitInteractions(): void {
    for (const [_unitId, sprite] of this.clickableUnits) {
      if (sprite?.active) {
        sprite.removeAllListeners();
        sprite.disableInteractive();
        sprite.clearTint();
      }
    }
    this.clickableUnits.clear();
  }

  private handleStructureClick(structureId: string): void {
    // 砲台の配備状態をチェック
    const deploymentStatus =
      this.deploymentSystem.getStructureDeploymentStatus(structureId);

    if (!deploymentStatus.canDeploy) {
      // 既にユニットが配備されている場合は撤退処理
      if (deploymentStatus.hasUnit) {
        const result =
          this.deploymentSystem.undeployUnitFromStructure(structureId);
        this.movementSystem.clearMoveTarget(
          this.entityManager.getEntity(deploymentStatus.deployedUnitId!)!,
        );
        if (result.success) {
          this.showMessage("ユニットが砲台から撤退しました");
        } else {
          this.showMessage("撤退に失敗しました");
        }
      }
      return;
    }

    this.callbacks.onStructureClicked(structureId);
  }

  private handleUnitClick(unitId: string): void {
    console.log(`InteractionSystem: Unit clicked: ${unitId}`);

    try {
      // UnitInfoPopupSystemの呼び出し処理を実装
      if (this.callbacks.onUnitClicked) {
        this.callbacks.onUnitClicked(unitId);
        console.log(
          `InteractionSystem: Successfully called onUnitClicked callback for unit: ${unitId}`,
        );
      } else {
        console.warn(
          "InteractionSystem: onUnitClicked callback is not defined",
        );
      }
    } catch (error) {
      console.error(
        `InteractionSystem: Error handling unit click for ${unitId}:`,
        error,
      );
    }
  }

  private showMessage(message: string): void {
    // 簡単なメッセージ表示（実際のゲームではより洗練されたUIを使用）
    const messageText = this.scene.add.text(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY - 100,
      message,
      {
        fontSize: "16px",
        color: "#ff0000",
        backgroundColor: "#000000",
        padding: { x: 10, y: 5 },
      },
    );
    messageText.setOrigin(0.5);

    // 3秒後にメッセージを削除
    this.scene.time.delayedCall(3000, () => {
      if (messageText?.active) {
        messageText.destroy();
      }
    });
  }

  public update(): void {
    // 必要に応じて更新処理を追加
    // 新しいエンティティが追加された場合にインタラクションを更新
    this.updateUnitInteractions();
  }

  public destroy(): void {
    this.clearStructureInteractions();
    this.clearUnitInteractions();
  }
}
