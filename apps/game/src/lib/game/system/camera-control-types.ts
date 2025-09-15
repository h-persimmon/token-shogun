/**
 * カメラ制御システムの型定義
 */

/**
 * マップの境界情報を定義するインターフェース
 */
export interface MapBounds {
  /** マップの幅（ピクセル） */
  width: number;
  /** マップの高さ（ピクセル） */
  height: number;
  /** タイルの幅 */
  tileWidth: number;
  /** タイルの高さ */
  tileHeight: number;
}

/**
 * カメラの状態を管理するインターフェース
 */
export interface CameraState {
  /** カメラのX座標 */
  x: number;
  /** カメラのY座標 */
  y: number;
  /** ドラッグ中かどうか */
  isDragging: boolean;
  /** 移動可能かどうか */
  canMove: boolean;
}

/**
 * ドラッグ操作の状態を管理するインターフェース
 */
export interface DragState {
  /** ドラッグ開始X座標 */
  startX: number;
  /** ドラッグ開始Y座標 */
  startY: number;
  /** 前回のX座標 */
  lastX: number;
  /** 前回のY座標 */
  lastY: number;
  /** ドラッグがアクティブか */
  isActive: boolean;
}

/**
 * ズーム状態を管理するインターフェース
 */
export interface ZoomState {
  /** スムーズトランジション用のターゲットズームレベル */
  targetZoom: number;
  /** 最小許可ズームレベル */
  minZoom: number;
  /** 最大許可ズームレベル */
  maxZoom: number;
  /** ズーム操作が現在アクティブかどうか */
  isZooming: boolean;
  /** ワールド座標でのズーム操作の中心点 */
  zoomCenter: { x: number; y: number };
  /** 現在実行中のズームアニメーション */
  activeZoomTween?: Phaser.Tweens.Tween;
  /** 現在実行中のパンアニメーション */
  activePanTween?: Phaser.Tweens.Tween;
  /** アニメーション完了時のコールバック */
  onAnimationComplete?: () => void;
}

/**
 * ピンチジェスチャーの状態を管理するインターフェース
 */
export interface PinchState {
  /** ピンチジェスチャーが現在アクティブかどうか */
  isActive: boolean;
  /** ピンチ開始時のタッチポイント間の距離 */
  initialDistance: number;
  /** ピンチジェスチャー開始時のズームレベル */
  initialZoom: number;
  /** 2つのタッチポイント間の中心点 */
  centerPoint: { x: number; y: number };
  /** アクティブなタッチポイントの配列 */
  touches: Array<{
    id: number;
    x: number;
    y: number;
  }>;
}

/**
 * ズーム機能の設定を定義するインターフェース
 */
export interface ZoomConfig {
  /** ズーム機能の有効/無効 */
  enabled: boolean;
  /** 最小ズームレベル（デフォルト: 0.5） */
  minZoom: number;
  /** 最大ズームレベル（デフォルト: 3.0） */
  maxZoom: number;
  /** マウスホイール感度（デフォルト: 0.1） */
  wheelSensitivity: number;
  /** ピンチジェスチャー感度（デフォルト: 1.0） */
  pinchSensitivity: number;
  /** スムーズズームトランジションの有効/無効 */
  smoothZoom: boolean;
  /** スムーズズーム補間係数（デフォルト: 0.15） */
  smoothZoomFactor: number;
  /** スムーズズームアニメーション時間（ミリ秒、デフォルト: 200） */
  smoothZoomDuration: number;
  /** スムーズズームイージング関数（デフォルト: 'Power2'） */
  smoothZoomEase: string;
  /** 同時実行可能なズームアニメーション数の制限（デフォルト: 1） */
  maxConcurrentAnimations: number;
}

/**
 * カメラ制御システムの設定を定義するインターフェース
 */
export interface CameraControlConfig {
  /** カメラ制御の有効/無効 */
  enabled: boolean;
  /** ドラッグ感度（デフォルト: 1.0） */
  dragSensitivity: number;
  /** 境界からのパディング（デフォルト: 0） */
  boundaryPadding: number;
  /** スムージングの有効/無効 */
  smoothing: boolean;
  /** スムージング係数（デフォルト: 0.1） */
  smoothingFactor: number;
}

/**
 * ズーム設定のデフォルト値
 */
export const DEFAULT_ZOOM_CONFIG: ZoomConfig = {
  enabled: true,
  minZoom: 0.5,
  maxZoom: 3.0,
  wheelSensitivity: 0.1,
  pinchSensitivity: 1.0,
  smoothZoom: true,
  smoothZoomFactor: 0.15,
  smoothZoomDuration: 200,
  smoothZoomEase: 'Power2',
  maxConcurrentAnimations: 1,
};

/**
 * カメラ制御システムの設定のデフォルト値
 */
export const DEFAULT_CAMERA_CONTROL_CONFIG: CameraControlConfig = {
  enabled: true,
  dragSensitivity: 1.0,
  boundaryPadding: 0,
  smoothing: false,
  smoothingFactor: 0.1,
};

/**
 * カメラ位置を表す型
 */
export type CameraPosition = {
  x: number;
  y: number;
};

/**
 * ビューポートの境界を表す型
 */
export type ViewportBounds = {
  width: number;
  height: number;
};
