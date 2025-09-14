// UnitInfoPopupSystem - ユニット情報ポップアップの管理システム

import type { Entity } from "../../entities/entity";
import type { EntityManager } from "../../entities/entity-manager";
import { PopupRenderer } from "./popup-renderer";
import { RangeVisualizer } from "./range-visualizer";
import type { UnitInfoData, UnitInfoPopup } from "./types";
import { canUnitAttack, extractUnitInfo } from "./unit-info-utils";

/**
 * UnitInfoPopupSystem - ユニット情報ポップアップの表示・管理を行うシステム
 *
 * 機能:
 * - ユニットクリック時のポップアップ表示
 * - ポップアップの非表示
 * - 射程表示の管理
 * - エラーハンドリングとリソース管理
 */
export class UnitInfoPopupSystem {
  private scene: Phaser.Scene;
  private entityManager: EntityManager;
  private popupRenderer: PopupRenderer;
  private rangeVisualizer: RangeVisualizer;

  // 現在表示中のポップアップ状態
  private currentPopup: UnitInfoPopup | null = null;
  private currentEntityId: string | null = null;

  // システムの有効/無効状態
  private isEnabled: boolean = true;

  constructor(scene: Phaser.Scene, entityManager: EntityManager) {
    this.scene = scene;
    this.entityManager = entityManager;

    // レンダラーとビジュアライザーを初期化
    this.popupRenderer = new PopupRenderer(scene);
    this.rangeVisualizer = new RangeVisualizer(scene);

    console.log("UnitInfoPopupSystem initialized");
  }

  /**
   * ユニット情報ポップアップを表示する
   * Requirements: 1.1, 1.2, 1.3, 4.3, 5.1, 5.3
   *
   * @param entityId - 表示するエンティティのID
   */
  showUnitInfo(entityId: string): void {
    try {
      // システムが無効な場合は処理しない
      if (!this.isEnabled) {
        console.warn("UnitInfoPopupSystem: System is disabled");
        return;
      }

      // エンティティの存在確認
      const entity = this.entityManager.getEntity(entityId);
      if (!entity) {
        console.warn(`UnitInfoPopupSystem: Entity not found: ${entityId}`);
        return;
      }

      // 同じエンティティの場合は何もしない
      if (this.currentEntityId === entityId) {
        return;
      }

      // ユニット情報を抽出
      const unitInfo = this.extractUnitInfoSafely(entity);
      if (!unitInfo) {
        console.warn(
          `UnitInfoPopupSystem: Failed to extract unit info for entity: ${entityId}`,
        );
        return;
      }

      // エンティティの位置を取得
      const unitPosition = this.getEntityPosition(entity);
      if (!unitPosition) {
        console.warn(
          `UnitInfoPopupSystem: Could not determine position for entity: ${entityId}`,
        );
        return;
      }
      const position = { x: unitPosition.x, y: unitPosition.y + 48 * 10 };

      // 既存のポップアップがある場合はスムーズに切り替え
      if (this.currentPopup && this.currentEntityId) {
        // 射程表示を先に更新
        this.updateRangeDisplay(entity, unitInfo, position);

        // ポップアップを切り替え
        this.currentPopup = this.popupRenderer.transitionToNewPopup(
          this.currentPopup,
          unitInfo,
          position,
        );
        this.currentEntityId = entityId;
      } else {
        // 新規表示の場合
        this.currentPopup = this.popupRenderer.createPopup(unitInfo, position);
        this.currentEntityId = entityId;

        // 攻撃可能なユニットの場合は射程を表示
        this.updateRangeDisplay(entity, unitInfo, position);
      }

      console.log(`UnitInfoPopupSystem: Showing unit info for ${entityId}`);
    } catch (error) {
      console.error("UnitInfoPopupSystem: Error showing unit info:", error);
      // エラー時はクリーンアップを実行
      this.hideUnitInfo();
    }
  }

  /**
   * ポップアップを非表示にする
   * Requirements: 1.2, 1.3, 5.2
   */
  hideUnitInfo(): void {
    try {
      // 現在のポップアップを破棄（アニメーション付き）
      if (this.currentPopup) {
        this.popupRenderer.destroyPopup(this.currentPopup);
        this.currentPopup = null;
      }

      // 射程表示を非表示
      this.rangeVisualizer.hideRange();

      // 現在のエンティティIDをクリア
      this.currentEntityId = null;

      console.log("UnitInfoPopupSystem: Unit info hidden");
    } catch (error) {
      console.error("UnitInfoPopupSystem: Error hiding unit info:", error);
      // エラーが発生してもリソースをクリアする
      this.currentPopup = null;
      this.currentEntityId = null;
    }
  }

  /**
   * ポップアップを即座に非表示にする（アニメーションなし）
   */
  hideUnitInfoImmediate(): void {
    try {
      // 現在のポップアップを即座に破棄
      if (this.currentPopup) {
        this.popupRenderer.destroyPopupImmediate(this.currentPopup);
        this.currentPopup = null;
      }

      // 射程表示を非表示
      this.rangeVisualizer.hideRange();

      // 現在のエンティティIDをクリア
      this.currentEntityId = null;

      console.log("UnitInfoPopupSystem: Unit info hidden immediately");
    } catch (error) {
      console.error(
        "UnitInfoPopupSystem: Error hiding unit info immediately:",
        error,
      );
      // エラーが発生してもリソースをクリアする
      this.currentPopup = null;
      this.currentEntityId = null;
    }
  }

  /**
   * システムの更新処理
   * 現在表示中のポップアップの状態を監視し、必要に応じて更新
   */
  update(): void {
    try {
      // ポップアップが表示されていない場合は何もしない
      if (!this.currentPopup || !this.currentEntityId) {
        return;
      }

      // エンティティがまだ存在するかチェック
      const entity = this.entityManager.getEntity(this.currentEntityId);
      if (!entity) {
        // エンティティが削除された場合はポップアップを非表示
        console.log(
          `UnitInfoPopupSystem: Entity ${this.currentEntityId} no longer exists, hiding popup`,
        );
        this.hideUnitInfo();
        return;
      }

      // エンティティの位置が変更された場合はポップアップ位置を更新
      const currentPosition = this.getEntityPosition(entity);
      if (currentPosition) {
        this.popupRenderer.adjustPopupPosition(
          this.currentPopup,
          currentPosition,
        );

        // 射程表示も更新
        if (this.rangeVisualizer.isVisible()) {
          const unitInfo = this.extractUnitInfoSafely(entity);
          if (unitInfo?.attack) {
            this.rangeVisualizer.updateRange(
              currentPosition,
              unitInfo.attack.range,
            );
          }
        }
      }
    } catch (error) {
      console.error("UnitInfoPopupSystem: Error during update:", error);
    }
  }

  /**
   * システムを破棄する
   * 全てのリソースをクリーンアップ
   */
  destroy(): void {
    try {
      // ポップアップを即座に非表示（アニメーションなし）
      this.hideUnitInfoImmediate();

      // ビジュアライザーを破棄
      this.rangeVisualizer.destroy();

      // システムを無効化
      this.isEnabled = false;

      console.log("UnitInfoPopupSystem destroyed");
    } catch (error) {
      console.error("UnitInfoPopupSystem: Error during destroy:", error);
    }
  }

  /**
   * システムの有効/無効を切り替える
   *
   * @param enabled - 有効にする場合はtrue
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;

    if (!enabled) {
      // 無効化時は現在のポップアップを即座に非表示
      this.hideUnitInfoImmediate();
    }

    console.log(`UnitInfoPopupSystem: ${enabled ? "Enabled" : "Disabled"}`);
  }

  /**
   * 現在ポップアップが表示されているかどうか
   *
   * @returns 表示中の場合はtrue
   */
  isPopupVisible(): boolean {
    return this.currentPopup !== null;
  }

  /**
   * 現在表示中のエンティティIDを取得
   *
   * @returns 現在表示中のエンティティID、表示されていない場合はnull
   */
  getCurrentEntityId(): string | null {
    return this.currentEntityId;
  }

  // === プライベートメソッド ===

  /**
   * エラーハンドリング付きでユニット情報を抽出
   *
   * @param entity - 対象エンティティ
   * @returns ユニット情報、失敗時はnull
   */
  private extractUnitInfoSafely(entity: Entity): UnitInfoData | null {
    try {
      return extractUnitInfo(entity);
    } catch (error) {
      console.error("UnitInfoPopupSystem: Error extracting unit info:", error);
      return null;
    }
  }

  /**
   * エンティティの位置を取得
   *
   * @param entity - 対象エンティティ
   * @returns 位置情報、取得できない場合はnull
   */
  private getEntityPosition(entity: Entity): { x: number; y: number } | null {
    try {
      // スプライトから位置を取得
      if (entity.sprite) {
        return {
          x: entity.sprite.x,
          y: entity.sprite.y,
        };
      }

      // PositionComponentから位置を取得
      const positionComponent = entity.components.position;
      if (
        positionComponent &&
        "x" in positionComponent &&
        "y" in positionComponent
      ) {
        return {
          x: (positionComponent as any).x,
          y: (positionComponent as any).y,
        };
      }

      return null;
    } catch (error) {
      console.error(
        "UnitInfoPopupSystem: Error getting entity position:",
        error,
      );
      return null;
    }
  }

  /**
   * 射程表示を更新する
   *
   * @param entity - エンティティ
   * @param unitInfo - ユニット情報
   * @param position - 位置
   */
  private updateRangeDisplay(
    entity: Entity,
    unitInfo: UnitInfoData,
    position: { x: number; y: number },
  ): void {
    // 攻撃可能なユニットの場合は射程を表示
    if (canUnitAttack(entity) && unitInfo.attack) {
      this.rangeVisualizer.showRange(position, unitInfo.attack.range, {
        color: this.getRangeColor(unitInfo.unitType),
        alpha: 0.4,
        fillAlpha: 0.1,
      });
    } else {
      // 攻撃できない場合は射程表示を非表示
      this.rangeVisualizer.hideRange();
    }
  }

  /**
   * ユニットタイプに応じた射程表示の色を取得
   *
   * @param unitType - ユニットタイプ
   * @returns 色コード
   */
  private getRangeColor(unitType: UnitInfoData["unitType"]): number {
    switch (unitType) {
      case "ally":
        return 0x00ff00; // 緑色（味方）
      case "enemy":
        return 0xff0000; // 赤色（敵）
      case "structure":
        return 0x0088ff; // 青色（構造物）
      default:
        return 0xffffff; // 白色（デフォルト）
    }
  }
}
