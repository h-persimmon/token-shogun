import type { RangeVisualizerOptions } from "./types";

/**
 * RangeVisualizer - ユニットの射程を視覚的に表示するクラス
 * 射程円の描画、表示/非表示の切り替え、スタイルのカスタマイズを管理
 */
export class RangeVisualizer {
  private scene: Phaser.Scene;
  private currentRangeGraphics: Phaser.GameObjects.Graphics | null = null;
  private defaultColor: number = 0x00ff00; // デフォルトの緑色
  private defaultAlpha: number = 0.3;
  private defaultLineWidth: number = 2;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 射程円を表示
   * @param position - 中心位置
   * @param range - 射程距離
   * @param options - 表示オプション
   */
  showRange(
    position: { x: number; y: number },
    range: number,
    options?: RangeVisualizerOptions,
  ): void {
    // 既存の射程表示があれば削除
    this.hideRange();

    // 射程が0以下の場合は表示しない
    if (range <= 0) {
      return;
    }

    // オプションのデフォルト値設定
    const color = options?.color ?? this.defaultColor;
    const alpha = options?.alpha ?? this.defaultAlpha;
    const lineWidth = options?.lineWidth ?? this.defaultLineWidth;
    const fillAlpha = options?.fillAlpha ?? 0.1;

    // グラフィックスオブジェクトを作成
    this.currentRangeGraphics = this.scene.add.graphics();

    // 射程円のスタイルを設定
    this.currentRangeGraphics.lineStyle(lineWidth, color, alpha);
    this.currentRangeGraphics.fillStyle(color, fillAlpha);

    // 射程円を描画（塗りつぶしと輪郭）
    this.currentRangeGraphics.fillCircle(position.x, position.y, range);
    this.currentRangeGraphics.strokeCircle(position.x, position.y, range);

    // 適切なz-indexを設定（ユニットより下、背景より上）
    this.currentRangeGraphics.setDepth(5);
  }

  /**
   * 射程表示を非表示
   */
  hideRange(): void {
    if (this.currentRangeGraphics) {
      this.currentRangeGraphics.destroy();
      this.currentRangeGraphics = null;
    }
  }

  /**
   * 射程表示を更新（位置や射程が変更された場合）
   * @param position - 新しい中心位置
   * @param range - 新しい射程距離
   * @param options - 表示オプション
   */
  updateRange(
    position: { x: number; y: number },
    range: number,
    options?: RangeVisualizerOptions,
  ): void {
    // 現在の表示を削除して新しく表示
    this.hideRange();
    this.showRange(position, range, options);
  }

  /**
   * デフォルトの色を設定
   * @param color - 新しいデフォルト色
   */
  setDefaultColor(color: number): void {
    this.defaultColor = color;
  }

  /**
   * デフォルトの透明度を設定
   * @param alpha - 新しいデフォルト透明度 (0-1)
   */
  setDefaultAlpha(alpha: number): void {
    this.defaultAlpha = Math.max(0, Math.min(1, alpha));
  }

  /**
   * デフォルトの線幅を設定
   * @param lineWidth - 新しいデフォルト線幅
   */
  setDefaultLineWidth(lineWidth: number): void {
    this.defaultLineWidth = Math.max(1, lineWidth);
  }

  /**
   * 現在射程表示が表示されているかどうか
   * @returns 表示中の場合true
   */
  isVisible(): boolean {
    return this.currentRangeGraphics !== null;
  }

  /**
   * 現在の射程表示の位置を取得
   * @returns 射程表示の中心位置、表示されていない場合はnull
   */
  getCurrentPosition(): { x: number; y: number } | null {
    if (!this.currentRangeGraphics) {
      return null;
    }
    return {
      x: this.currentRangeGraphics.x,
      y: this.currentRangeGraphics.y,
    };
  }

  /**
   * リソースのクリーンアップ
   */
  destroy(): void {
    this.hideRange();
  }
}
