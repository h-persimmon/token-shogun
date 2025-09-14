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
