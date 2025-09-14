# Design Document

## Overview

大きいサイズのマップでのカメラ操作機能を実装します。プレイヤーはマウスドラッグでカメラを移動でき、マップの境界内に制限されます。既存のPhaserベースのECSアーキテクチャと統合し、パフォーマンスを考慮した実装を行います。

## Architecture

### コンポーネント構成

```
CameraControlSystem
├── MapBounds (interface)
├── CameraState (interface)  
├── DragState (interface)
└── CameraControlConfig (interface)
```

### システム統合

既存のECSアーキテクチャに新しいシステムとして統合：
- `CameraControlSystem` を `src/lib/game/system/` に追加
- `GameScene` クラスでシステムを初期化・更新
- 他のシステムとの競合を避けるため、カメラ操作の優先度を管理

## Components and Interfaces

### MapBounds Interface

```typescript
interface MapBounds {
  width: number;    // マップの幅（ピクセル）
  height: number;   // マップの高さ（ピクセル）
  tileWidth: number;  // タイルの幅
  tileHeight: number; // タイルの高さ
}
```

### CameraState Interface

```typescript
interface CameraState {
  x: number;        // カメラのX座標
  y: number;        // カメラのY座標
  isDragging: boolean; // ドラッグ中かどうか
  canMove: boolean;    // 移動可能かどうか
}
```

### DragState Interface

```typescript
interface DragState {
  startX: number;      // ドラッグ開始X座標
  startY: number;      // ドラッグ開始Y座標
  lastX: number;       // 前回のX座標
  lastY: number;       // 前回のY座標
  isActive: boolean;   // ドラッグがアクティブか
}
```

### CameraControlConfig Interface

```typescript
interface CameraControlConfig {
  enabled: boolean;           // カメラ制御の有効/無効
  dragSensitivity: number;    // ドラッグ感度（デフォルト: 1.0）
  boundaryPadding: number;    // 境界からのパディング（デフォルト: 0）
  smoothing: boolean;         // スムージングの有効/無効
  smoothingFactor: number;    // スムージング係数（デフォルト: 0.1）
}
```

## Data Models

### CameraControlSystem Class

```typescript
class CameraControlSystem {
  private scene: Phaser.Scene;
  private camera: Phaser.Cameras.Scene2D.Camera;
  private mapBounds: MapBounds;
  private cameraState: CameraState;
  private dragState: DragState;
  private config: CameraControlConfig;
  
  constructor(scene: Phaser.Scene, mapBounds: MapBounds, config?: Partial<CameraControlConfig>);
  
  // 公開メソッド
  public update(): void;
  public setMapBounds(bounds: MapBounds): void;
  public getCameraPosition(): { x: number; y: number };
  public setCameraPosition(x: number, y: number): void;
  public setEnabled(enabled: boolean): void;
  public destroy(): void;
  
  // プライベートメソッド
  private setupInputHandlers(): void;
  private handlePointerDown(pointer: Phaser.Input.Pointer): void;
  private handlePointerMove(pointer: Phaser.Input.Pointer): void;
  private handlePointerUp(pointer: Phaser.Input.Pointer): void;
  private updateCameraPosition(deltaX: number, deltaY: number): void;
  private clampCameraPosition(): void;
  private updateCursor(): void;
}
```

### MapBoundsCalculator Utility

```typescript
class MapBoundsCalculator {
  static fromTilemap(tilemap: Phaser.Tilemaps.Tilemap): MapBounds;
  static fromDimensions(width: number, height: number, tileWidth: number, tileHeight: number): MapBounds;
  static getViewportBounds(camera: Phaser.Cameras.Scene2D.Camera): { width: number; height: number };
}
```

## Error Handling

### エラーケースと対応

1. **無効なマップサイズ**
   - マップサイズが画面サイズより小さい場合、カメラ制御を無効化
   - ログ出力で開発者に通知

2. **境界計算エラー**
   - 境界計算が失敗した場合、デフォルト値を使用
   - エラーログを出力し、機能を安全に無効化

3. **入力イベントエラー**
   - ポインターイベントの処理中にエラーが発生した場合、ドラッグ状態をリセット
   - カメラ位置を安全な状態に復元

4. **パフォーマンス問題**
   - 更新頻度が高すぎる場合、スロットリングを適用
   - メモリリークを防ぐため、適切なクリーンアップを実装

### エラーハンドリング戦略

```typescript
// エラー境界の実装例
private safeUpdateCamera(deltaX: number, deltaY: number): void {
  try {
    this.updateCameraPosition(deltaX, deltaY);
  } catch (error) {
    console.error('Camera update failed:', error);
    this.resetCameraState();
  }
}

private resetCameraState(): void {
  this.dragState.isActive = false;
  this.cameraState.isDragging = false;
  this.updateCursor();
}
```

## Implementation Notes

### Phaserカメラシステムとの統合

- `scene.cameras.main` を使用してメインカメラを制御
- `camera.scrollX` と `camera.scrollY` でカメラ位置を管理
- `camera.setBounds()` は使用せず、独自の境界制限ロジックを実装

### パフォーマンス最適化

- ドラッグ中のみ更新処理を実行
- デバウンシングによる過度な更新を防止
- メモリプールを使用したオブジェクト再利用

### 既存システムとの互換性

- `InteractionSystem` との競合を避けるため、ドラッグ判定の優先度を管理
- `GameStateSystem` の一時停止状態を考慮
- 他のカメラ制御（ズーム等）との共存を考慮した設計