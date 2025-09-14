// ユニット情報ポップアップの描画とレイアウト管理

import type { UnitInfoData, UnitInfoPopup } from "./types";
import { generateUnitDisplayName, getHealthStatus } from "./unit-info-utils";

export class PopupRenderer {
  private scene: Phaser.Scene;
  private readonly POPUP_WIDTH = 200;
  private readonly POPUP_MIN_HEIGHT = 120;
  private readonly POPUP_PADDING = 12;
  private readonly LINE_HEIGHT = 18;
  private readonly TITLE_HEIGHT = 24;
  private readonly POPUP_OFFSET = 120; // ユニットからのオフセット距離（上側に表示するため増加）

  // アニメーション設定
  private readonly FADE_DURATION = 200; // フェードイン/アウトの時間（ミリ秒）
  private readonly SCALE_DURATION = 150; // スケールアニメーションの時間（ミリ秒）
  private readonly TRANSITION_DURATION = 250; // 切り替えアニメーションの時間（ミリ秒）

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * ポップアップUIを作成する（アニメーション付き）
   */
  createPopup(
    data: UnitInfoData,
    position: { x: number; y: number },
  ): UnitInfoPopup {
    // ポップアップの内容を生成
    const content = this.generatePopupContent(data);
    const popupHeight = this.calculatePopupHeight(content);

    // コンテナを作成
    const container = this.scene.add.container(0, 0);
    container.setDepth(1000); // 他のUI要素より前面に表示

    // 背景を作成
    const background = this.scene.add.rectangle(
      0,
      0,
      this.POPUP_WIDTH,
      popupHeight,
      0x000000,
      0.8,
    );
    background.setStrokeStyle(2, 0xffffff, 0.6);
    container.add(background);

    // タイトルテキストを作成
    const titleText = this.scene.add.text(
      -this.POPUP_WIDTH / 2 + this.POPUP_PADDING,
      -popupHeight / 2 + this.POPUP_PADDING,
      content.title,
      {
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold",
      },
    );
    container.add(titleText);

    // 情報テキストを作成
    const infoTexts: Phaser.GameObjects.Text[] = [];
    let yOffset = -popupHeight / 2 + this.POPUP_PADDING + this.TITLE_HEIGHT;

    for (const line of content.lines) {
      const infoText = this.scene.add.text(
        -this.POPUP_WIDTH / 2 + this.POPUP_PADDING,
        yOffset,
        line,
        {
          fontSize: "12px",
          color: "#cccccc",
        },
      );
      container.add(infoText);
      infoTexts.push(infoText);
      yOffset += this.LINE_HEIGHT;
    }

    // ポップアップの位置を調整（ユニットの上側に配置）
    const adjustedPosition = this.calculatePopupPosition(
      position,
      this.POPUP_WIDTH,
      popupHeight,
    );
    container.setPosition(adjustedPosition.x, adjustedPosition.y);

    const popup: UnitInfoPopup = {
      container,
      background,
      titleText,
      infoTexts,
      entityId: data.entityId,
    };

    // フェードイン＋スケールアニメーションを実行
    this.animatePopupIn(popup);

    return popup;
  }

  /**
   * ポップアップの位置を調整する（画面外回避）
   */
  adjustPopupPosition(
    popup: UnitInfoPopup,
    targetPosition: { x: number; y: number },
  ): void {
    const popupWidth = this.POPUP_WIDTH;
    const popupHeight = popup.background.height;

    const adjustedPosition = this.calculatePopupPosition(
      targetPosition,
      popupWidth,
      popupHeight,
    );

    popup.container.setPosition(adjustedPosition.x, adjustedPosition.y);
  }

  /**
   * ポップアップを破棄する（アニメーション付き）
   */
  destroyPopup(popup: UnitInfoPopup): void {
    if (popup.container && popup.container.active) {
      this.animatePopupOut(popup);
    }
  }

  /**
   * ポップアップを即座に破棄する（アニメーションなし）
   */
  destroyPopupImmediate(popup: UnitInfoPopup): void {
    if (popup.container) {
      popup.container.destroy();
    }
  }

  /**
   * ポップアップの切り替えアニメーション
   */
  transitionToNewPopup(
    oldPopup: UnitInfoPopup,
    newData: UnitInfoData,
    newPosition: { x: number; y: number },
  ): UnitInfoPopup {
    // 新しいポップアップを作成（アニメーションなしで）
    const newPopup = this.createPopupWithoutAnimation(newData, newPosition);

    // 古いポップアップをフェードアウト
    this.animatePopupOut(oldPopup);

    // 新しいポップアップをフェードイン
    this.animatePopupIn(newPopup);

    return newPopup;
  }

  /**
   * ポップアップの内容を生成する
   */
  private generatePopupContent(data: UnitInfoData): {
    title: string;
    lines: string[];
  } {
    const title = generateUnitDisplayName(data);
    const lines: string[] = [];

    // ID情報
    lines.push(`ID: ${data.entityId}`);

    // 体力情報
    const healthStatus = getHealthStatus(data.health);
    lines.push(
      `体力: ${data.health.current}/${data.health.max} (${healthStatus})`,
    );

    // 攻撃情報（攻撃可能な場合のみ）
    if (data.attack) {
      lines.push(`攻撃力: ${data.attack.damage}`);
      lines.push(`射程: ${data.attack.range}`);
      lines.push(`攻撃タイプ: ${data.attack.attackType}`);
    }

    // ユニットタイプ別の追加情報
    switch (data.unitType) {
      case "enemy":
        if (data.enemyType) {
          lines.push(`種別: ${data.enemyType}`);
        }
        break;
      case "structure":
        if (data.structureType) {
          lines.push(`種別: ${data.structureType}`);
        }
        break;
      case "ally":
        if (data.unitClass) {
          lines.push(`クラス: ${data.unitClass}`);
        }
        break;
    }

    return { title, lines };
  }

  /**
   * ポップアップの高さを計算する
   */
  private calculatePopupHeight(content: {
    title: string;
    lines: string[];
  }): number {
    const contentHeight =
      this.TITLE_HEIGHT + content.lines.length * this.LINE_HEIGHT;
    const totalHeight = contentHeight + this.POPUP_PADDING * 2;
    return Math.max(this.POPUP_MIN_HEIGHT, totalHeight);
  }

  /**
   * 画面外回避を考慮したポップアップ位置を計算する（ユニットの上側優先）
   */
  private calculatePopupPosition(
    targetPosition: { x: number; y: number },
    popupWidth: number,
    popupHeight: number,
  ): { x: number; y: number } {
    const camera = this.scene.cameras.main;
    const screenWidth = camera.width;
    const screenHeight = camera.height;
    const cameraX = camera.scrollX;
    const cameraY = camera.scrollY;

    // 初期位置（ターゲットの上側中央）
    let x = targetPosition.x;
    let y = targetPosition.y - this.POPUP_OFFSET;

    // 上端チェック（最優先）
    if (y - popupHeight / 2 < cameraY) {
      // 下側に配置
      y = targetPosition.y + this.POPUP_OFFSET;
    }

    // 下端チェック
    if (y + popupHeight / 2 > cameraY + screenHeight) {
      // 上側に配置
      y = targetPosition.y - this.POPUP_OFFSET;
      // それでも画面外なら画面内に収める
      if (y - popupHeight / 2 < cameraY) {
        y = cameraY + popupHeight / 2 + 10;
      }
    }

    // 左端チェック
    if (x - popupWidth / 2 < cameraX) {
      // 右側にずらす
      x = cameraX + popupWidth / 2 + 10;
    }

    // 右端チェック
    if (x + popupWidth / 2 > cameraX + screenWidth) {
      // 左側にずらす
      x = cameraX + screenWidth - popupWidth / 2 - 10;
    }

    return { x, y };
  }

  /**
   * ポップアップのフェードイン＋スケールアニメーション
   */
  private animatePopupIn(popup: UnitInfoPopup): void {
    const container = popup.container;

    // 初期状態を設定（透明＋小さいスケール）
    container.setAlpha(0);
    container.setScale(0.8);

    // フェードイン＋スケールアニメーション
    this.scene.tweens.add({
      targets: container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: this.FADE_DURATION,
      ease: "Back.easeOut",
    });
  }

  /**
   * ポップアップのフェードアウト＋スケールアニメーション
   */
  private animatePopupOut(popup: UnitInfoPopup): void {
    const container = popup.container;

    if (!container || !container.active) {
      return;
    }

    // フェードアウト＋スケールアニメーション
    this.scene.tweens.add({
      targets: container,
      alpha: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: this.FADE_DURATION,
      ease: "Back.easeIn",
      onComplete: () => {
        if (container && container.active) {
          container.destroy();
        }
      },
    });
  }

  /**
   * アニメーションなしでポップアップを作成する（内部用）
   */
  private createPopupWithoutAnimation(
    data: UnitInfoData,
    position: { x: number; y: number },
  ): UnitInfoPopup {
    // ポップアップの内容を生成
    const content = this.generatePopupContent(data);
    const popupHeight = this.calculatePopupHeight(content);

    // コンテナを作成
    const container = this.scene.add.container(0, 0);
    container.setDepth(1000); // 他のUI要素より前面に表示

    // 背景を作成
    const background = this.scene.add.rectangle(
      0,
      0,
      this.POPUP_WIDTH,
      popupHeight,
      0x000000,
      0.8,
    );
    background.setStrokeStyle(2, 0xffffff, 0.6);
    container.add(background);

    // タイトルテキストを作成
    const titleText = this.scene.add.text(
      -this.POPUP_WIDTH / 2 + this.POPUP_PADDING,
      -popupHeight / 2 + this.POPUP_PADDING,
      content.title,
      {
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold",
      },
    );
    container.add(titleText);

    // 情報テキストを作成
    const infoTexts: Phaser.GameObjects.Text[] = [];
    let yOffset = -popupHeight / 2 + this.POPUP_PADDING + this.TITLE_HEIGHT;

    for (const line of content.lines) {
      const infoText = this.scene.add.text(
        -this.POPUP_WIDTH / 2 + this.POPUP_PADDING,
        yOffset,
        line,
        {
          fontSize: "12px",
          color: "#cccccc",
        },
      );
      container.add(infoText);
      infoTexts.push(infoText);
      yOffset += this.LINE_HEIGHT;
    }

    // ポップアップの位置を調整
    const adjustedPosition = this.calculatePopupPosition(
      position,
      this.POPUP_WIDTH,
      popupHeight,
    );
    container.setPosition(adjustedPosition.x, adjustedPosition.y);

    // 初期状態を透明に設定（アニメーション用）
    container.setAlpha(0);
    container.setScale(0.8);

    const popup: UnitInfoPopup = {
      container,
      background,
      titleText,
      infoTexts,
      entityId: data.entityId,
    };

    return popup;
  }
}
