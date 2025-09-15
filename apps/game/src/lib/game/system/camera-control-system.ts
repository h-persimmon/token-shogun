import type {
  CameraControlConfig,
  CameraPosition,
  CameraState,
  DragState,
  MapBounds,
  ZoomState,
  PinchState,
  ZoomConfig,
} from "./camera-control-types";
import { DEFAULT_CAMERA_CONTROL_CONFIG, DEFAULT_ZOOM_CONFIG } from "./camera-control-types";

/**
 * カメラ制御システムのエラータイプ
 */
enum CameraControlError {
  INVALID_MAP_BOUNDS = "INVALID_MAP_BOUNDS",
  INVALID_CAMERA_POSITION = "INVALID_CAMERA_POSITION",
  INPUT_HANDLER_ERROR = "INPUT_HANDLER_ERROR",
  CAMERA_UPDATE_ERROR = "CAMERA_UPDATE_ERROR",
  INITIALIZATION_ERROR = "INITIALIZATION_ERROR",
}

/**
 * カメラ制御システム
 * マウスドラッグによるカメラ移動機能を提供
 */
export class CameraControlSystem {
  private scene!: Phaser.Scene;
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private mapBounds!: MapBounds;
  private cameraState!: CameraState;
  private dragState!: DragState;
  private config!: CameraControlConfig;
  private zoomState!: ZoomState;
  private pinchState!: PinchState;
  private zoomConfig!: ZoomConfig;
  private lastWheelTime: number = 0;
  private wheelThrottleDelay: number = 16; // 約60FPS制限

  /**
   * CameraControlSystemのコンストラクタ
   * @param scene Phaserシーン
   * @param mapBounds マップの境界情報
   * @param config カメラ制御の設定（オプション）
   */
  constructor(
    scene: Phaser.Scene,
    mapBounds: MapBounds,
    config?: Partial<CameraControlConfig & ZoomConfig>,
  ) {
    try {
      // 入力パラメータのバリデーション
      this.validateConstructorParams(scene, mapBounds);

      this.scene = scene;
      this.camera = scene.cameras.main;
      this.mapBounds = mapBounds;

      // 設定をデフォルト値とマージ
      this.config = {
        ...DEFAULT_CAMERA_CONTROL_CONFIG,
        ...config,
      };

      // ズーム設定をデフォルト値とマージ
      this.zoomConfig = {
        ...DEFAULT_ZOOM_CONFIG,
        ...config,
      };

      // カメラ状態を初期化
      this.cameraState = {
        x: this.camera.scrollX,
        y: this.camera.scrollY,
        isDragging: false,
        canMove: this.shouldEnableCameraMovement(),
      };

      // ドラッグ状態を初期化
      this.dragState = {
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        isActive: false,
      };

      // ズーム状態を初期化
      this.zoomState = {
        targetZoom: this.camera.zoom,
        minZoom: this.zoomConfig.minZoom,
        maxZoom: this.zoomConfig.maxZoom,
        isZooming: false,
        zoomCenter: { x: 0, y: 0 },
        activeZoomTween: undefined,
        activePanTween: undefined,
        onAnimationComplete: undefined,
      };

      // ピンチ状態を初期化
      this.pinchState = {
        isActive: false,
        initialDistance: 0,
        initialZoom: this.camera.zoom,
        centerPoint: { x: 0, y: 0 },
        touches: [],
      };

      // 入力ハンドラーを設定
      this.setupInputHandlers();

      // 初期カーソル状態を設定
      this.updateCursor();

      this.logInfo("CameraControlSystem initialized successfully");
    } catch (error) {
      this.logError(
        CameraControlError.INITIALIZATION_ERROR,
        "Failed to initialize CameraControlSystem",
        error,
      );
      // 初期化に失敗した場合、安全な状態で初期化を試行
      this.initializeSafeState(scene, mapBounds, config);
    }
  }

  /**
   * システムの更新処理
   * 毎フレーム呼び出される
   */
  public update(): void {
    try {
      if (!this.config.enabled || !this.cameraState.canMove) {
        return;
      }

      // ドラッグ中の場合、カメラ位置を更新
      if (this.cameraState.isDragging && this.dragState.isActive) {
        this.updateCameraFromDrag();
      }

      // カメラ位置を境界内に制限
      this.clampCameraPosition();

      // カーソル状態を更新
      this.updateCursor();
    } catch (error) {
      this.logError(
        CameraControlError.CAMERA_UPDATE_ERROR,
        "Failed to update camera control system",
        error,
      );
      this.resetCameraState();
    }
  }

  /**
   * マップ境界を設定
   * @param bounds 新しいマップ境界
   */
  public setMapBounds(bounds: MapBounds): void {
    try {
      // マップ境界のバリデーション
      if (!this.validateMapBounds(bounds)) {
        this.logError(
          CameraControlError.INVALID_MAP_BOUNDS,
          "Invalid map bounds provided",
          bounds,
        );
        return;
      }

      this.mapBounds = bounds;
      this.cameraState.canMove = this.shouldEnableCameraMovement(this.camera.zoom);

      // 境界が変更された場合、カメラ位置を再調整（ズーム考慮）
      this.clampCameraPosition();

      // カメラ移動可能性が変更された場合、カーソル状態も更新
      this.updateCursor();

      this.logInfo("Map bounds updated successfully", bounds);
    } catch (error) {
      this.logError(
        CameraControlError.INVALID_MAP_BOUNDS,
        "Failed to set map bounds",
        error,
      );
      // エラー時は現在の境界を維持
    }
  }

  /**
   * 現在のカメラ位置を取得
   * @returns カメラ位置
   */
  public getCameraPosition(): CameraPosition {
    return {
      x: this.camera.scrollX,
      y: this.camera.scrollY,
    };
  }

  /**
   * カメラ位置を設定
   * @param x X座標
   * @param y Y座標
   */
  public setCameraPosition(x: number, y: number): void {
    try {
      // カメラ位置のバリデーション
      if (!this.validateCameraPosition(x, y)) {
        this.logError(
          CameraControlError.INVALID_CAMERA_POSITION,
          "Invalid camera position provided",
          { x, y },
        );
        return;
      }

      this.camera.setScroll(x, y);
      this.cameraState.x = x;
      this.cameraState.y = y;

      // 設定後に境界チェック
      this.clampCameraPosition();

      this.logInfo("Camera position set successfully", { x, y });
    } catch (error) {
      this.logError(
        CameraControlError.INVALID_CAMERA_POSITION,
        "Failed to set camera position",
        error,
      );
      // エラー時は現在の位置を維持し、境界チェックのみ実行
      this.clampCameraPosition();
    }
  }

  /**
   * カメラ制御の有効/無効を設定
   * @param enabled 有効にする場合true
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;

    // 無効化時はドラッグ状態をリセット
    if (!enabled) {
      this.resetDragState();
    }

    // 有効/無効状態に応じてカーソル状態を更新
    this.updateCursor();
  }

  /**
   * 現在のズームレベルを取得
   * @returns 現在のズームレベル
   */
  public getZoomLevel(): number {
    return this.camera.zoom;
  }

  /**
   * ズームの最小値と最大値を設定
   * @param minZoom 最小ズームレベル
   * @param maxZoom 最大ズームレベル
   */
  public setZoomLimits(minZoom: number, maxZoom: number): void {
    try {
      // ズーム制限のバリデーション
      if (!this.validateZoomLimits(minZoom, maxZoom)) {
        this.logError(
          CameraControlError.INVALID_CAMERA_POSITION,
          "Invalid zoom limits provided",
          { minZoom, maxZoom },
        );
        return;
      }

      // ズーム制限を更新
      this.zoomConfig.minZoom = minZoom;
      this.zoomConfig.maxZoom = maxZoom;
      this.zoomState.minZoom = minZoom;
      this.zoomState.maxZoom = maxZoom;

      // 現在のズームレベルが新しい制限を超えている場合はクランプ
      const currentZoom = this.getZoomLevel();
      const clampedZoom = this.clampZoomLevel(currentZoom);
      
      if (clampedZoom !== currentZoom) {
        this.camera.setZoom(clampedZoom);
        this.zoomState.targetZoom = clampedZoom;
        this.logInfo("Current zoom level clamped to new limits", { 
          oldZoom: currentZoom, 
          newZoom: clampedZoom 
        });
      }

      this.logInfo("Zoom limits updated successfully", { minZoom, maxZoom });
    } catch (error) {
      this.logError(
        CameraControlError.INVALID_CAMERA_POSITION,
        "Failed to set zoom limits",
        error,
      );
    }
  }

  /**
   * ズームレベルを設定
   * @param zoom 設定するズームレベル
   * @param centerX ズーム中心のX座標（オプション、スクリーン座標）
   * @param centerY ズーム中心のY座標（オプション、スクリーン座標）
   * @param onComplete アニメーション完了時のコールバック（オプション）
   */
  public setZoomLevel(
    zoom: number, 
    centerX?: number, 
    centerY?: number, 
    onComplete?: () => void
  ): void {
    try {
      if (!this.zoomConfig.enabled) {
        this.logInfo("Zoom is disabled, ignoring setZoomLevel request");
        return;
      }

      // ズームレベルをバリデーションしてクランプ
      const clampedZoom = this.clampZoomLevel(zoom);
      
      if (clampedZoom !== zoom) {
        this.logInfo("Zoom level clamped", { requested: zoom, actual: clampedZoom });
      }

      // ズーム中心が指定されている場合、その点を中心にズーム
      if (centerX !== undefined && centerY !== undefined) {
        if (this.zoomConfig.smoothZoom) {
          // スムーズズームを使用
          this.smoothZoomToPoint(clampedZoom, centerX, centerY, onComplete);
        } else {
          // 即座にズーム
          this.zoomToPoint(clampedZoom, centerX, centerY);
          if (onComplete) {
            onComplete();
          }
        }
      } else {
        // 中心が指定されていない場合
        if (this.zoomConfig.smoothZoom) {
          // 画面中央を中心にスムーズズーム
          const centerScreenX = this.camera.width / 2;
          const centerScreenY = this.camera.height / 2;
          this.smoothZoomToPoint(clampedZoom, centerScreenX, centerScreenY, onComplete);
        } else {
          // 即座にズーム
          this.camera.setZoom(clampedZoom);
          if (onComplete) {
            onComplete();
          }
        }
      }

      // ズーム状態を更新（スムーズズームでない場合のみ）
      if (!this.zoomConfig.smoothZoom) {
        this.zoomState.targetZoom = clampedZoom;
        this.zoomState.isZooming = false;
      }

      // ズームレベル変更後にカメラ移動可否を再評価
      // 要件5.3: ズームレベル変更時の境界システム統合
      this.cameraState.canMove = this.shouldEnableCameraMovement(clampedZoom);

      this.logInfo("Zoom level set successfully", { 
        zoom: clampedZoom, 
        centerX, 
        centerY, 
        smoothZoom: this.zoomConfig.smoothZoom 
      });
    } catch (error) {
      this.logError(
        CameraControlError.INVALID_CAMERA_POSITION,
        "Failed to set zoom level",
        error,
      );
      // エラー時はアニメーションをクリーンアップして安全なズームレベルに戻す
      this.cleanupZoomAnimations();
      this.camera.setZoom(1.0);
      this.zoomState.targetZoom = 1.0;
    }
  }

  /**
   * ズームイン
   * @param factor ズーム係数（デフォルト: 1.2）
   * @param centerX ズーム中心のX座標（オプション、スクリーン座標）
   * @param centerY ズーム中心のY座標（オプション、スクリーン座標）
   * @param onComplete アニメーション完了時のコールバック（オプション）
   */
  public zoomIn(
    factor: number = 1.2, 
    centerX?: number, 
    centerY?: number, 
    onComplete?: () => void
  ): void {
    try {
      if (!this.zoomConfig.enabled) {
        this.logInfo("Zoom is disabled, ignoring zoomIn request");
        return;
      }

      // 係数のバリデーション
      if (!Number.isFinite(factor) || factor <= 1.0) {
        this.logError(
          CameraControlError.INVALID_CAMERA_POSITION,
          "Invalid zoom factor for zoomIn",
          { factor },
        );
        return;
      }

      const currentZoom = this.getZoomLevel();
      const newZoom = currentZoom * factor;
      
      this.setZoomLevel(newZoom, centerX, centerY, onComplete);
      
      this.logInfo("Zoom in executed", { 
        oldZoom: currentZoom, 
        targetZoom: newZoom, 
        factor,
        smoothZoom: this.zoomConfig.smoothZoom
      });
    } catch (error) {
      this.logError(
        CameraControlError.INVALID_CAMERA_POSITION,
        "Failed to zoom in",
        error,
      );
    }
  }

  /**
   * ズームアウト
   * @param factor ズーム係数（デフォルト: 0.8）
   * @param centerX ズーム中心のX座標（オプション、スクリーン座標）
   * @param centerY ズーム中心のY座標（オプション、スクリーン座標）
   * @param onComplete アニメーション完了時のコールバック（オプション）
   */
  public zoomOut(
    factor: number = 0.8, 
    centerX?: number, 
    centerY?: number, 
    onComplete?: () => void
  ): void {
    try {
      if (!this.zoomConfig.enabled) {
        this.logInfo("Zoom is disabled, ignoring zoomOut request");
        return;
      }

      // 係数のバリデーション
      if (!Number.isFinite(factor) || factor <= 0 || factor >= 1.0) {
        this.logError(
          CameraControlError.INVALID_CAMERA_POSITION,
          "Invalid zoom factor for zoomOut",
          { factor },
        );
        return;
      }

      const currentZoom = this.getZoomLevel();
      const newZoom = currentZoom * factor;
      
      this.setZoomLevel(newZoom, centerX, centerY, onComplete);
      
      this.logInfo("Zoom out executed", { 
        oldZoom: currentZoom, 
        targetZoom: newZoom, 
        factor,
        smoothZoom: this.zoomConfig.smoothZoom
      });
    } catch (error) {
      this.logError(
        CameraControlError.INVALID_CAMERA_POSITION,
        "Failed to zoom out",
        error,
      );
    }
  }

  /**
   * ズームレベルをデフォルト（1.0）にリセット
   * @param onComplete アニメーション完了時のコールバック（オプション）
   */
  public resetZoom(onComplete?: () => void): void {
    try {
      if (!this.zoomConfig.enabled) {
        this.logInfo("Zoom is disabled, ignoring resetZoom request");
        return;
      }

      const currentZoom = this.getZoomLevel();
      this.setZoomLevel(1.0, undefined, undefined, onComplete);
      
      this.logInfo("Zoom reset to default", { 
        oldZoom: currentZoom, 
        targetZoom: 1.0,
        smoothZoom: this.zoomConfig.smoothZoom
      });
    } catch (error) {
      this.logError(
        CameraControlError.INVALID_CAMERA_POSITION,
        "Failed to reset zoom",
        error,
      );
      // エラー時はアニメーションをクリーンアップして強制的にデフォルトズームに設定
      this.cleanupZoomAnimations();
      this.camera.setZoom(1.0);
      this.zoomState.targetZoom = 1.0;
    }
  }

  /**
   * システムを破棄
   * イベントリスナーをクリーンアップ
   */
  public destroy(): void {
    try {
      // 入力イベントリスナーを削除
      if (this.scene?.input) {
        this.scene.input.off("pointerdown", this.handlePointerDown, this);
        this.scene.input.off("pointermove", this.handlePointerMove, this);
        this.scene.input.off("pointerup", this.handlePointerUp, this);
      }

      // グローバルイベントリスナーを削除
      if (this.scene?.game?.canvas) {
        this.scene.game.canvas.removeEventListener(
          "mousemove",
          this.handleGlobalMouseMove,
        );
        this.scene.game.canvas.removeEventListener(
          "mouseup",
          this.handleGlobalMouseUp,
        );
        this.scene.game.canvas.removeEventListener(
          "mouseleave",
          this.handleMouseLeave,
        );
        // ホイールイベントリスナーを削除
        this.scene.game.canvas.removeEventListener(
          "wheel",
          this.handleWheelEvent,
        );
        // タッチイベントリスナーを削除
        this.scene.game.canvas.removeEventListener(
          "touchstart",
          this.handleTouchStart,
        );
        this.scene.game.canvas.removeEventListener(
          "touchmove",
          this.handleTouchMove,
        );
        this.scene.game.canvas.removeEventListener(
          "touchend",
          this.handleTouchEnd,
        );
        this.scene.game.canvas.removeEventListener(
          "touchcancel",
          this.handleTouchEnd,
        );
      }

      // ドラッグ状態をリセット
      this.resetDragState();

      // ピンチ状態をリセット
      this.resetPinchState();

      // アクティブなズームアニメーションをクリーンアップ
      this.cleanupZoomAnimations();

      // カーソルをデフォルト状態に戻す
      this.setCursorState("default");

      this.logInfo("CameraControlSystem destroyed successfully");
    } catch (error) {
      this.logError(
        CameraControlError.INITIALIZATION_ERROR,
        "Error during system destruction",
        error,
      );
    }
  }

  /**
   * 入力イベントハンドラーを設定
   * @private
   */
  private setupInputHandlers(): void {
    console.log("🔥", "setupInputHandler", this.scene)
    try {
      // ポインターダウンイベント
      this.scene.input.on("pointerdown", this.handlePointerDown, this);

      // ポインタームーブイベント（シーン内）
      this.scene.input.on("pointermove", this.handlePointerMove, this);

      // ポインターアップイベント
      this.scene.input.on("pointerup", this.handlePointerUp, this);

      // マウスホイールイベント（ズーム機能用）
      // 要件2.1, 2.2, 2.3, 2.4: マウスホイールによるズーム制御
      if (this.scene.game.canvas && this.zoomConfig.enabled) {
        this.scene.game.canvas.addEventListener(
          "wheel",
          this.handleWheelEvent,
          { passive: false }
        );
      }

      // タッチイベント（ピンチズーム機能用）
      // 要件1.1, 1.2, 1.3, 1.4, 4.1: ピンチジェスチャーによるズーム制御
      if (this.scene.game.canvas && this.zoomConfig.enabled) {
        this.scene.game.canvas.addEventListener(
          "touchstart",
          this.handleTouchStart,
          { passive: false }
        );
        this.scene.game.canvas.addEventListener(
          "touchmove",
          this.handleTouchMove,
          { passive: false }
        );
        this.scene.game.canvas.addEventListener(
          "touchend",
          this.handleTouchEnd,
          { passive: false }
        );
        this.scene.game.canvas.addEventListener(
          "touchcancel",
          this.handleTouchEnd,
          { passive: false }
        );
      }

      // グローバルなマウスイベント（画面外でのドラッグ継続のため）
      // 要件1.4: ドラッグ操作中にマウスカーソルがゲーム画面外に出てもカメラの移動は継続される
      if (this.scene.game.canvas) {
        this.scene.game.canvas.addEventListener(
          "mousemove",
          this.handleGlobalMouseMove,
        );
        this.scene.game.canvas.addEventListener(
          "mouseup",
          this.handleGlobalMouseUp,
        );
        this.scene.game.canvas.addEventListener(
          "mouseleave",
          this.handleMouseLeave,
        );
      }

      this.logInfo("Input handlers setup successfully");
    } catch (error) {
      this.logError(
        CameraControlError.INPUT_HANDLER_ERROR,
        "Failed to setup input handlers",
        error,
      );
      // 入力ハンドラーの設定に失敗した場合、カメラ制御を無効化
      this.config.enabled = false;
    }
  }

  /**
   * ポインターダウンイベントハンドラー
   * 要件4.1, 4.2に対応
   * @param pointer ポインター情報
   * @private
   */
  private handlePointerDown = (pointer: Phaser.Input.Pointer): void => {
    console.log("🔥", "handlePointerDown", this.config.enabled);
    console.log("🔥", "handlePointerDown", this.cameraState);
    try {
      if (!this.config.enabled || !this.cameraState.canMove) {
        return;
      }
      console.log("🔥", "handlePointerDown", pointer)

      // ピンチジェスチャーがアクティブな場合はドラッグを無効化（ジェスチャー競合回避）
      if (this.pinchState.isActive) {
        return;
      }

      // ポインター情報のバリデーション
      if (!this.validatePointer(pointer)) {
        this.logError(
          CameraControlError.INPUT_HANDLER_ERROR,
          "Invalid pointer data in pointer down",
          pointer,
        );
        return;
      }

      // ドラッグ開始
      this.dragState = {
        startX: pointer.x,
        startY: pointer.y,
        lastX: pointer.x,
        lastY: pointer.y,
        isActive: true,
      };

      this.cameraState.isDragging = true;

      // 要件4.2: ドラッグ開始時にカーソルをgrabbing状態に変更
      this.updateCursor();
    } catch (error) {
      this.logError(
        CameraControlError.INPUT_HANDLER_ERROR,
        "Camera control pointer down error",
        error,
      );
      this.resetDragState();
    }
  };

  /**
   * ポインタームーブイベントハンドラー
   * 要件1.2, 3.5に対応
   * @param pointer ポインター情報
   * @private
   */
  private handlePointerMove = (pointer: Phaser.Input.Pointer): void => {
    try {
      if (
        !this.config.enabled ||
        !this.cameraState.canMove ||
        !this.dragState.isActive
      ) {
        return;
      }

      // ピンチジェスチャーがアクティブな場合はドラッグを無効化（ジェスチャー競合回避）
      if (this.pinchState.isActive) {
        return;
      }

      // ポインター情報のバリデーション
      if (!this.validatePointer(pointer)) {
        this.logError(
          CameraControlError.INPUT_HANDLER_ERROR,
          "Invalid pointer data in pointer move",
          pointer,
        );
        return;
      }

      // マウスの移動量を計算
      const deltaX = pointer.x - this.dragState.lastX;
      const deltaY = pointer.y - this.dragState.lastY;

      // カメラ位置を更新（マウス移動と逆方向）
      // 要件3.5: 境界に達した状態でも境界内での移動は可能
      this.updateCameraPosition(-deltaX, -deltaY);

      // 前回の位置を更新（境界に関係なく常に更新）
      // これにより境界での移動継続が可能になる
      this.dragState.lastX = pointer.x;
      this.dragState.lastY = pointer.y;
    } catch (error) {
      this.logError(
        CameraControlError.INPUT_HANDLER_ERROR,
        "Camera control pointer move error",
        error,
      );
      this.resetCameraState();
    }
  };

  /**
   * ポインターアップイベントハンドラー
   * 要件4.3に対応
   * @param _pointer ポインター情報（未使用）
   * @private
   */
  private handlePointerUp = (_pointer: Phaser.Input.Pointer): void => {
    // ドラッグ終了
    this.resetDragState();

    // 要件4.3: ドラッグ終了時にカーソルを通常状態に戻す
    this.updateCursor();
  };

  /**
   * グローバルマウス移動イベントハンドラー
   * 画面外でのドラッグ継続のため（要件1.4）
   * 境界での移動継続にも対応（要件3.5）
   * @param event マウスイベント
   * @private
   */
  private handleGlobalMouseMove = (event: MouseEvent): void => {
    try {
      if (
        !this.config.enabled ||
        !this.cameraState.canMove ||
        !this.dragState.isActive
      ) {
        return;
      }

      // キャンバスの境界を取得
      const canvas = this.scene.game.canvas;
      if (!canvas) {
        this.logError(
          CameraControlError.INPUT_HANDLER_ERROR,
          "Canvas not available for global mouse move",
        );
        return;
      }

      const rect = canvas.getBoundingClientRect();

      // マウスイベントのバリデーション
      if (!this.validateMouseEvent(event)) {
        this.logError(
          CameraControlError.INPUT_HANDLER_ERROR,
          "Invalid mouse event data",
          event,
        );
        return;
      }

      // キャンバス座標系に変換
      const canvasX = event.clientX - rect.left;
      const canvasY = event.clientY - rect.top;

      // マウスの移動量を計算
      const deltaX = canvasX - this.dragState.lastX;
      const deltaY = canvasY - this.dragState.lastY;

      // カメラ位置を更新（マウス移動と逆方向）
      // 要件3.5: 境界に達した状態でも境界内での移動は可能
      this.updateCameraPosition(-deltaX, -deltaY);

      // 前回の位置を更新（境界に関係なく常に更新）
      this.dragState.lastX = canvasX;
      this.dragState.lastY = canvasY;
    } catch (error) {
      this.logError(
        CameraControlError.INPUT_HANDLER_ERROR,
        "Camera control global mouse move error",
        error,
      );
      this.resetCameraState();
    }
  };

  /**
   * グローバルマウスアップイベントハンドラー
   * 要件4.3に対応
   * @param _event マウスイベント（未使用）
   * @private
   */
  private handleGlobalMouseUp = (_event: MouseEvent): void => {
    // ドラッグ終了
    this.resetDragState();

    // 要件4.3: ドラッグ終了時にカーソルを通常状態に戻す
    this.updateCursor();
  };

  /**
   * マウスがキャンバスから離れた時のイベントハンドラー
   * @param _event マウスイベント（未使用）
   * @private
   */
  private handleMouseLeave = (_event: MouseEvent): void => {
    // マウスがキャンバス外に出た場合もドラッグは継続
    // 特別な処理は不要（要件1.4により継続される）
  };

  /**
   * マウスホイールイベントハンドラー
   * 要件2.1, 2.2, 2.3, 2.4, 4.2, 4.3に対応
   * @param event ホイールイベント
   * @private
   */
  private handleWheelEvent = (event: WheelEvent): void => {
    try {
      // ズーム機能が無効の場合は処理しない
      if (!this.zoomConfig.enabled || !this.config.enabled) {
        return;
      }

      // ドラッグ中またはピンチジェスチャー中はズーム操作を無効化（ジェスチャー競合回避）
      if (this.cameraState.isDragging || this.dragState.isActive || this.pinchState.isActive) {
        return;
      }

      // デフォルトのスクロール動作を防止
      event.preventDefault();

      // ホイールイベントのバリデーション
      if (!this.validateWheelEvent(event)) {
        this.logError(
          CameraControlError.INPUT_HANDLER_ERROR,
          "Invalid wheel event data",
          event,
        );
        return;
      }

      // キャンバスの境界を取得してマウス座標を計算
      const canvas = this.scene.game.canvas;
      if (!canvas) {
        this.logError(
          CameraControlError.INPUT_HANDLER_ERROR,
          "Canvas not available for wheel event",
        );
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // マウス座標がキャンバス内にあることを確認
      // 要件2.4: マウスカーソルがゲーム領域上にある時のみホイールイベントを処理
      if (mouseX < 0 || mouseX > canvas.width || mouseY < 0 || mouseY > canvas.height) {
        return;
      }

      // ホイールの方向を判定してズーム方向を決定
      // 要件2.1: マウスホイールを上にスクロール → ズームイン
      // 要件2.2: マウスホイールを下にスクロール → ズームアウト
      const wheelDelta = -event.deltaY; // deltaYは下方向が正なので反転
      const zoomDirection = wheelDelta > 0 ? 1 : -1;

      // 現在のズームレベルを取得
      const currentZoom = this.getZoomLevel();

      // ズーム係数を計算（感度設定を適用）
      const zoomFactor = 1 + (this.zoomConfig.wheelSensitivity * zoomDirection);
      const newZoom = currentZoom * zoomFactor;

      // ズームレベルをバリデーションしてクランプ
      const clampedZoom = this.clampZoomLevel(newZoom);

      // ズームレベルが変更される場合のみ処理を実行
      if (Math.abs(clampedZoom - currentZoom) > 0.001) {
        // マウスカーソル位置を中心にズーム実行
        // 要件4.2: マウスホイールでズームする際はマウスカーソル位置を中心にズーム
        if (this.zoomConfig.smoothZoom) {
          // スムーズズームの場合（アニメーション状態は内部で管理）
          this.smoothZoomToPoint(clampedZoom, mouseX, mouseY);
        } else {
          // 即座にズーム
          this.zoomState.isZooming = true;
          this.zoomState.zoomCenter = { x: mouseX, y: mouseY };
          this.zoomToPoint(clampedZoom, mouseX, mouseY);
          this.zoomState.isZooming = false;
        }

        this.logInfo("Mouse wheel zoom executed", {
          wheelDelta,
          zoomDirection,
          oldZoom: currentZoom,
          newZoom: clampedZoom,
          mousePos: { x: mouseX, y: mouseY }
        });
      }

      // 要件2.3: 連続したホイール操作でもスムーズに動作
      // （各イベントを個別に処理することで自然な累積効果を実現）

    } catch (error) {
      this.logError(
        CameraControlError.INPUT_HANDLER_ERROR,
        "Mouse wheel zoom error",
        error,
      );
      // エラー時はズーム状態をリセット
      this.zoomState.isZooming = false;
    }
  };

  /**
   * タッチ開始イベントハンドラー
   * 要件1.1, 1.2, 1.3, 1.4, 4.1: ピンチジェスチャーの検出と開始
   * @param event タッチイベント
   * @private
   */
  private handleTouchStart = (event: TouchEvent): void => {
    try {
      // ズーム機能が無効の場合は処理しない
      if (!this.zoomConfig.enabled || !this.config.enabled) {
        return;
      }

      // タッチイベントのバリデーション
      if (!this.validateTouchEvent(event)) {
        this.logError(
          CameraControlError.INPUT_HANDLER_ERROR,
          "Invalid touch event data in touch start",
          event,
        );
        return;
      }

      const touches = Array.from(event.touches);
      
      // 2本指のタッチでピンチジェスチャーを開始
      if (touches.length === 2) {
        // ドラッグ操作を無効化（ジェスチャー競合回避）
        if (this.cameraState.isDragging || this.dragState.isActive) {
          this.resetDragState();
        }

        // デフォルトのタッチ動作を防止
        event.preventDefault();

        // キャンバスの境界を取得
        const canvas = this.scene.game.canvas;
        if (!canvas) {
          this.logError(
            CameraControlError.INPUT_HANDLER_ERROR,
            "Canvas not available for touch start",
          );
          return;
        }

        const rect = canvas.getBoundingClientRect();

        // タッチポイントをキャンバス座標系に変換
        const touch1 = {
          id: touches[0].identifier,
          x: touches[0].clientX - rect.left,
          y: touches[0].clientY - rect.top,
        };
        const touch2 = {
          id: touches[1].identifier,
          x: touches[1].clientX - rect.left,
          y: touches[1].clientY - rect.top,
        };

        // ピンチ状態を初期化
        const initialDistance = this.calculatePinchDistance(touch1, touch2);
        const centerPoint = this.calculatePinchCenter(touch1, touch2);

        this.pinchState = {
          isActive: true,
          initialDistance: initialDistance,
          initialZoom: this.getZoomLevel(),
          centerPoint: centerPoint,
          touches: [touch1, touch2],
        };

        this.logInfo("Pinch gesture started", {
          initialDistance,
          initialZoom: this.pinchState.initialZoom,
          centerPoint,
          touches: [touch1, touch2],
        });
      } else if (touches.length > 2) {
        // 3本指以上の場合はピンチジェスチャーを無効化
        this.resetPinchState();
      }
      // 1本指の場合は通常のドラッグ操作として処理（既存の処理に委ねる）

    } catch (error) {
      this.logError(
        CameraControlError.INPUT_HANDLER_ERROR,
        "Touch start error",
        error,
      );
      this.resetPinchState();
    }
  };

  /**
   * タッチ移動イベントハンドラー
   * 要件1.1, 1.2, 1.3, 1.4, 4.1: ピンチジェスチャーの更新処理
   * @param event タッチイベント
   * @private
   */
  private handleTouchMove = (event: TouchEvent): void => {
    try {
      // ズーム機能が無効またはピンチジェスチャーが非アクティブの場合は処理しない
      if (!this.zoomConfig.enabled || !this.config.enabled || !this.pinchState.isActive) {
        return;
      }

      // タッチイベントのバリデーション
      if (!this.validateTouchEvent(event)) {
        this.logError(
          CameraControlError.INPUT_HANDLER_ERROR,
          "Invalid touch event data in touch move",
          event,
        );
        return;
      }

      const touches = Array.from(event.touches);

      // 2本指のタッチが継続している場合のみ処理
      if (touches.length === 2) {
        // デフォルトのタッチ動作を防止
        event.preventDefault();

        // キャンバスの境界を取得
        const canvas = this.scene.game.canvas;
        if (!canvas) {
          this.logError(
            CameraControlError.INPUT_HANDLER_ERROR,
            "Canvas not available for touch move",
          );
          return;
        }

        const rect = canvas.getBoundingClientRect();

        // タッチポイントをキャンバス座標系に変換
        const touch1 = {
          id: touches[0].identifier,
          x: touches[0].clientX - rect.left,
          y: touches[0].clientY - rect.top,
        };
        const touch2 = {
          id: touches[1].identifier,
          x: touches[1].clientX - rect.left,
          y: touches[1].clientY - rect.top,
        };

        // ピンチジェスチャーを更新
        this.updatePinchGesture([touch1, touch2]);

      } else {
        // タッチポイント数が変わった場合はピンチジェスチャーを終了
        this.resetPinchState();
      }

    } catch (error) {
      this.logError(
        CameraControlError.INPUT_HANDLER_ERROR,
        "Touch move error",
        error,
      );
      this.resetPinchState();
    }
  };

  /**
   * タッチ終了イベントハンドラー
   * 要件1.4: ピンチジェスチャーの終了処理
   * @param event タッチイベント
   * @private
   */
  private handleTouchEnd = (event: TouchEvent): void => {
    try {
      // ピンチジェスチャーがアクティブでない場合は処理不要
      if (!this.pinchState.isActive) {
        return;
      }

      // タッチイベントのバリデーション
      if (!this.validateTouchEvent(event)) {
        this.logError(
          CameraControlError.INPUT_HANDLER_ERROR,
          "Invalid touch event data in touch end",
          event,
        );
        return;
      }

      const touches = Array.from(event.touches);

      // タッチポイントが2本未満になった場合はピンチジェスチャーを終了
      if (touches.length < 2) {
        this.logInfo("Pinch gesture ended", {
          finalZoom: this.getZoomLevel(),
          initialZoom: this.pinchState.initialZoom,
          zoomChange: this.getZoomLevel() - this.pinchState.initialZoom,
        });

        this.resetPinchState();
      }

    } catch (error) {
      this.logError(
        CameraControlError.INPUT_HANDLER_ERROR,
        "Touch end error",
        error,
      );
      this.resetPinchState();
    }
  };

  /**
   * ピンチジェスチャーの更新処理
   * 要件1.1, 1.2, 1.3, 4.1: ピンチ距離の変化に基づくズーム調整
   * @param touches 現在のタッチポイント配列
   * @private
   */
  private updatePinchGesture(touches: Array<{ id: number; x: number; y: number }>): void {
    try {
      if (!this.pinchState.isActive || touches.length !== 2) {
        return;
      }

      // 現在のピンチ距離と中心点を計算
      const currentDistance = this.calculatePinchDistance(touches[0], touches[1]);
      const currentCenter = this.calculatePinchCenter(touches[0], touches[1]);

      // ピンチ距離の変化率を計算
      const distanceRatio = currentDistance / this.pinchState.initialDistance;
      
      // 新しいズームレベルを計算（感度を適用、より滑らかな変化）
      const baseZoomChange = (distanceRatio - 1.0) * this.zoomConfig.pinchSensitivity;
      // 変化量を制限してより滑らかなズームを実現
      const clampedZoomChange = Math.max(-0.5, Math.min(0.5, baseZoomChange));
      const newZoom = this.pinchState.initialZoom * (1.0 + clampedZoomChange);

      // ズームレベルをバリデーションしてクランプ
      const clampedZoom = this.clampZoomLevel(newZoom);

      // ズームレベルが変更される場合のみ処理を実行
      const currentZoom = this.getZoomLevel();
      if (Math.abs(clampedZoom - currentZoom) > 0.001) {
        // ピンチ中心点を基準にズーム実行
        // 要件4.1: ピンチジェスチャーでズームする際は2つのタッチポイントの中心を基準にズーム
        if (this.zoomConfig.smoothZoom) {
          // スムーズズームの場合
          this.smoothZoomToPoint(clampedZoom, currentCenter.x, currentCenter.y);
        } else {
          // 即座にズーム
          this.zoomState.isZooming = true;
          this.zoomState.zoomCenter = currentCenter;
          this.zoomToPoint(clampedZoom, currentCenter.x, currentCenter.y);
          this.zoomState.isZooming = false;
        }

        this.logInfo("Pinch zoom updated", {
          distanceRatio,
          baseZoomChange,
          oldZoom: currentZoom,
          newZoom: clampedZoom,
          centerPoint: currentCenter,
          currentDistance,
          initialDistance: this.pinchState.initialDistance,
        });
      }

      // ピンチ状態を更新
      this.pinchState.touches = touches;
      this.pinchState.centerPoint = currentCenter;

    } catch (error) {
      this.logError(
        CameraControlError.INPUT_HANDLER_ERROR,
        "Pinch gesture update error",
        error,
      );
      this.resetPinchState();
    }
  }

  /**
   * 2つのタッチポイント間の距離を計算
   * @param touch1 最初のタッチポイント
   * @param touch2 2番目のタッチポイント
   * @returns タッチポイント間の距離
   * @private
   */
  private calculatePinchDistance(
    touch1: { x: number; y: number },
    touch2: { x: number; y: number }
  ): number {
    try {
      const deltaX = touch2.x - touch1.x;
      const deltaY = touch2.y - touch1.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // 最小距離を設定（ゼロ除算防止）
      return Math.max(distance, 1.0);
    } catch (error) {
      this.logError(
        CameraControlError.INPUT_HANDLER_ERROR,
        "Failed to calculate pinch distance",
        error,
      );
      return 1.0; // エラー時はデフォルト距離を返す
    }
  }

  /**
   * 2つのタッチポイントの中心点を計算
   * @param touch1 最初のタッチポイント
   * @param touch2 2番目のタッチポイント
   * @returns タッチポイントの中心点
   * @private
   */
  private calculatePinchCenter(
    touch1: { x: number; y: number },
    touch2: { x: number; y: number }
  ): { x: number; y: number } {
    try {
      return {
        x: (touch1.x + touch2.x) / 2,
        y: (touch1.y + touch2.y) / 2,
      };
    } catch (error) {
      this.logError(
        CameraControlError.INPUT_HANDLER_ERROR,
        "Failed to calculate pinch center",
        error,
      );
      return { x: 0, y: 0 }; // エラー時はデフォルト中心点を返す
    }
  }

  /**
   * ピンチ状態をリセット
   * @private
   */
  private resetPinchState(): void {
    try {
      this.pinchState = {
        isActive: false,
        initialDistance: 0,
        initialZoom: this.camera.zoom,
        centerPoint: { x: 0, y: 0 },
        touches: [],
      };

      this.logInfo("Pinch state reset");
    } catch (error) {
      this.logError(
        CameraControlError.INPUT_HANDLER_ERROR,
        "Failed to reset pinch state",
        error,
      );
      // 強制的にピンチ状態をリセット
      this.pinchState.isActive = false;
      this.pinchState.touches = [];
    }
  }

  /**
   * カメラ位置を更新（デルタ計算付き）
   * 要件1.2, 3.1, 3.2, 3.3, 3.4, 3.5に対応
   * @param deltaX X方向の移動量
   * @param deltaY Y方向の移動量
   * @private
   */
  private updateCameraPosition(deltaX: number, deltaY: number): void {
    try {
      if (!this.config.enabled || !this.cameraState.canMove) {
        return;
      }

      // 感度を適用したデルタ計算
      const adjustedDeltaX = deltaX * this.config.dragSensitivity;
      const adjustedDeltaY = deltaY * this.config.dragSensitivity;

      // 現在のカメラ位置を取得
      const currentX = this.camera.scrollX;
      const currentY = this.camera.scrollY;

      // 新しいカメラ位置を計算
      let newX = currentX + adjustedDeltaX;
      let newY = currentY + adjustedDeltaY;

      // スムージングが有効な場合、段階的に移動
      if (this.config.smoothing) {
        const targetX = newX;
        const targetY = newY;

        // スムージング係数を適用して段階的に移動
        newX = currentX + (targetX - currentX) * this.config.smoothingFactor;
        newY = currentY + (targetY - currentY) * this.config.smoothingFactor;
      }

      // 境界内にクランプ（要件3.1, 3.2, 3.3, 3.4対応、ズーム考慮）
      const clampedPosition = this.clampToBounds(newX, newY, this.camera.zoom);

      // カメラ位置を設定
      this.camera.setScroll(clampedPosition.x, clampedPosition.y);
      this.cameraState.x = clampedPosition.x;
      this.cameraState.y = clampedPosition.y;
    } catch (error) {
      console.error("Camera position update failed:", error);
      this.resetCameraState();
    }
  }

  /**
   * ドラッグ状態からカメラ位置を更新
   * スムージング機能付きの更新処理
   * @private
   */
  private updateCameraFromDrag(): void {
    if (!this.config.smoothing || !this.dragState.isActive) {
      return;
    }

    // 現在の実装では handlePointerMove で直接更新しているため、
    // ここでは追加のスムージング処理は不要
    // 将来的にはここで独立したスムージング処理を実装可能
  }

  /**
   * 指定された座標を境界内にクランプ（ズームレベル対応）
   * 要件3.1, 3.2, 3.3, 3.4, 4.3, 4.4, 5.3, 5.4に対応
   * @param x X座標
   * @param y Y座標
   * @param zoomLevel 使用するズームレベル（オプション、未指定時は現在のズームレベル）
   * @returns クランプされた座標
   * @private
   */
  private clampToBounds(x: number, y: number, zoomLevel?: number): { x: number; y: number } {
    if (!this.cameraState.canMove) {
      return { x: this.camera.scrollX, y: this.camera.scrollY };
    }

    // ズームレベルを取得（指定されていない場合は現在のズームレベル）
    const currentZoom = zoomLevel !== undefined ? zoomLevel : this.camera.zoom;
    
    // ズームレベルに応じたビューポートサイズを計算
    // 要件4.3, 4.4: ズームレベルに応じた境界計算
    const effectiveViewportWidth = this.camera.width / currentZoom;
    const effectiveViewportHeight = this.camera.height / currentZoom;
    const padding = this.config.boundaryPadding;

    // ズーム対応境界を計算
    // 要件3.1: 左端の境界制限（ズーム考慮）
    const minX = -padding;
    // 要件3.2: 右端の境界制限（ズーム考慮）
    const maxX = Math.max(minX, this.mapBounds.width - effectiveViewportWidth + padding);
    // 要件3.3: 上端の境界制限（ズーム考慮）
    const minY = -padding;
    // 要件3.4: 下端の境界制限（ズーム考慮）
    const maxY = Math.max(
      minY,
      this.mapBounds.height - effectiveViewportHeight + padding,
    );

    // 座標を境界内にクランプ
    const clampedX = Math.max(minX, Math.min(maxX, x));
    const clampedY = Math.max(minY, Math.min(maxY, y));

    return { x: clampedX, y: clampedY };
  }

  /**
   * カメラ位置を境界内に制限（ズームレベル対応）
   * 要件5.3, 5.4: ズーム操作時の境界制限
   * @private
   */
  private clampCameraPosition(): void {
    try {
      if (!this.cameraState.canMove) {
        return;
      }

      // 現在のズームレベルを考慮して位置をクランプ
      // 要件5.3: ズーム操作がマップ境界を尊重する
      const clampedPosition = this.clampToBounds(
        this.camera.scrollX,
        this.camera.scrollY,
        this.camera.zoom
      );

      // 位置が変更された場合のみ更新
      if (
        clampedPosition.x !== this.camera.scrollX ||
        clampedPosition.y !== this.camera.scrollY
      ) {
        this.camera.setScroll(clampedPosition.x, clampedPosition.y);
        this.cameraState.x = clampedPosition.x;
        this.cameraState.y = clampedPosition.y;

        this.logInfo("Camera position clamped for zoom level", {
          originalPos: { x: this.camera.scrollX, y: this.camera.scrollY },
          clampedPos: clampedPosition,
          zoomLevel: this.camera.zoom
        });
      }
    } catch (error) {
      this.logError(
        CameraControlError.CAMERA_UPDATE_ERROR,
        "Failed to clamp camera position",
        error,
      );
      // エラー時は現在の状態を維持
    }
  }

  /**
   * カーソル状態を更新
   * 要件4.1, 4.2, 4.3に対応した視覚的フィードバック
   * @private
   */
  private updateCursor(): void {
    try {
      // カメラ制御が無効または移動不可の場合は通常カーソル
      if (!this.config.enabled || !this.cameraState.canMove) {
        this.setCursorState("default");
        return;
      }

      // ドラッグ状態に応じてカーソルを変更
      if (this.cameraState.isDragging && this.dragState.isActive) {
        // 要件4.2: ドラッグ操作中はgrabbing状態
        this.setCursorState("grabbing");
      } else {
        // 要件4.1: ドラッグ可能な状態ではgrab状態
        this.setCursorState("grab");
      }
    } catch (error) {
      console.error("Failed to update cursor state:", error);
      // エラー時は安全にデフォルトカーソルに戻す
      this.setCursorState("default");
    }
  }

  /**
   * カーソル状態を安全に設定
   * @param cursorType カーソルタイプ
   * @private
   */
  private setCursorState(cursorType: "default" | "grab" | "grabbing"): void {
    try {
      // Phaserのカーソル設定
      this.scene.input.setDefaultCursor(cursorType);

      // HTMLキャンバス要素のカーソルも直接設定（より確実な制御のため）
      if (this.scene.game.canvas) {
        this.scene.game.canvas.style.cursor = cursorType;
      }
    } catch (error) {
      console.error("Failed to set cursor state:", error);
    }
  }

  /**
   * ドラッグ状態をリセット
   * 要件4.3に対応
   * @private
   */
  private resetDragState(): void {
    this.dragState.isActive = false;
    this.cameraState.isDragging = false;

    // ドラッグ状態リセット時にカーソル状態も更新
    this.updateCursor();
  }

  /**
   * カメラ状態を安全な状態にリセット
   * エラー発生時の復旧用
   * @private
   */
  private resetCameraState(): void {
    try {
      // ドラッグ状態をリセット（カーソル更新も含む）
      this.resetDragState();

      // 安全のため、カーソルを明示的にデフォルト状態に設定
      this.setCursorState("default");

      // カメラ位置を境界内に強制的に調整
      this.clampCameraPosition();
    } catch (error) {
      console.error("Failed to reset camera state:", error);
    }
  }

  /**
   * カメラ移動を有効にするかどうかを判定（ズームレベル考慮）
   * 要件5.3: ズームレベルに応じたカメラ移動可否の判定
   * @param zoomLevel 判定に使用するズームレベル（オプション、未指定時は現在のズームレベル）
   * @returns カメラ移動を有効にする場合true
   * @private
   */
  private shouldEnableCameraMovement(zoomLevel?: number): boolean {
    const currentZoom = zoomLevel !== undefined ? zoomLevel : this.camera.zoom;
    
    // ズームレベルに応じた効果的なビューポートサイズを計算
    const effectiveViewportWidth = this.camera.width / currentZoom;
    const effectiveViewportHeight = this.camera.height / currentZoom;

    // マップサイズが効果的な画面サイズより大きい場合のみ移動を有効化
    return (
      this.mapBounds.width > effectiveViewportWidth ||
      this.mapBounds.height > effectiveViewportHeight
    );
  }

  /**
   * コンストラクタパラメータのバリデーション
   * @param scene Phaserシーン
   * @param mapBounds マップ境界
   * @private
   */
  private validateConstructorParams(
    scene: Phaser.Scene,
    mapBounds: MapBounds,
  ): void {
    if (!scene) {
      throw new Error("Scene is required for CameraControlSystem");
    }

    if (!scene.cameras || !scene.cameras.main) {
      throw new Error("Scene must have a main camera");
    }

    if (!scene.input) {
      throw new Error("Scene must have input system");
    }

    if (!this.validateMapBounds(mapBounds)) {
      throw new Error("Invalid map bounds provided");
    }
  }

  /**
   * マップ境界のバリデーション
   * @param bounds マップ境界
   * @returns バリデーション結果
   * @private
   */
  private validateMapBounds(bounds: MapBounds): boolean {
    if (!bounds) {
      return false;
    }

    return (
      typeof bounds.width === "number" &&
      typeof bounds.height === "number" &&
      typeof bounds.tileWidth === "number" &&
      typeof bounds.tileHeight === "number" &&
      bounds.width > 0 &&
      bounds.height > 0 &&
      bounds.tileWidth > 0 &&
      bounds.tileHeight > 0 &&
      Number.isFinite(bounds.width) &&
      Number.isFinite(bounds.height) &&
      Number.isFinite(bounds.tileWidth) &&
      Number.isFinite(bounds.tileHeight)
    );
  }

  /**
   * カメラ位置のバリデーション
   * @param x X座標
   * @param y Y座標
   * @returns バリデーション結果
   * @private
   */
  private validateCameraPosition(x: number, y: number): boolean {
    return (
      typeof x === "number" &&
      typeof y === "number" &&
      Number.isFinite(x) &&
      Number.isFinite(y)
    );
  }

  /**
   * ポインター情報のバリデーション
   * @param pointer ポインター情報
   * @returns バリデーション結果
   * @private
   */
  private validatePointer(pointer: Phaser.Input.Pointer): boolean {
    if (!pointer) {
      return false;
    }

    return (
      typeof pointer.x === "number" &&
      typeof pointer.y === "number" &&
      Number.isFinite(pointer.x) &&
      Number.isFinite(pointer.y)
    );
  }

  /**
   * マウスイベントのバリデーション
   * @param event マウスイベント
   * @returns バリデーション結果
   * @private
   */
  private validateMouseEvent(event: MouseEvent): boolean {
    if (!event) {
      return false;
    }

    return (
      typeof event.clientX === "number" &&
      typeof event.clientY === "number" &&
      Number.isFinite(event.clientX) &&
      Number.isFinite(event.clientY)
    );
  }

  /**
   * ホイールイベントのバリデーション
   * @param event ホイールイベント
   * @returns バリデーション結果
   * @private
   */
  private validateWheelEvent(event: WheelEvent): boolean {
    if (!event) {
      return false;
    }

    return (
      typeof event.clientX === "number" &&
      typeof event.clientY === "number" &&
      typeof event.deltaY === "number" &&
      Number.isFinite(event.clientX) &&
      Number.isFinite(event.clientY) &&
      Number.isFinite(event.deltaY)
    );
  }

  /**
   * タッチイベントのバリデーション
   * @param event タッチイベント
   * @returns バリデーション結果
   * @private
   */
  private validateTouchEvent(event: TouchEvent): boolean {
    try {
      if (!event || !event.touches) {
        return false;
      }

      // 各タッチポイントの基本的なバリデーション
      for (let i = 0; i < event.touches.length; i++) {
        const touch = event.touches[i];
        if (!touch ||
            typeof touch.identifier !== "number" ||
            typeof touch.clientX !== "number" ||
            typeof touch.clientY !== "number" ||
            !Number.isFinite(touch.clientX) ||
            !Number.isFinite(touch.clientY)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logError(
        CameraControlError.INPUT_HANDLER_ERROR,
        "Touch event validation error",
        error,
      );
      return false;
    }
  }

  /**
   * 安全な状態での初期化
   * 通常の初期化に失敗した場合の復旧処理
   * @param scene Phaserシーン
   * @param mapBounds マップ境界
   * @param config 設定
   * @private
   */
  private initializeSafeState(
    scene: Phaser.Scene,
    mapBounds: MapBounds,
    config?: Partial<CameraControlConfig>,
  ): void {
    try {
      // 最小限の安全な状態で初期化
      this.scene = scene;
      this.camera = scene.cameras?.main || scene.cameras?.cameras[0];

      // 安全なデフォルト境界を設定
      this.mapBounds = this.validateMapBounds(mapBounds)
        ? mapBounds
        : {
            width: 800,
            height: 600,
            tileWidth: 32,
            tileHeight: 32,
          };

      // 安全なデフォルト設定
      this.config = {
        ...DEFAULT_CAMERA_CONTROL_CONFIG,
        enabled: false, // 安全のため無効化
        ...config,
      };

      // 安全な状態で初期化
      this.cameraState = {
        x: this.camera?.scrollX || 0,
        y: this.camera?.scrollY || 0,
        isDragging: false,
        canMove: false, // 安全のため無効化
      };

      this.dragState = {
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        isActive: false,
      };

      // 安全なズーム設定で初期化
      this.zoomConfig = {
        ...DEFAULT_ZOOM_CONFIG,
        enabled: false, // 安全のため無効化
        ...config,
      };

      // 安全なズーム状態で初期化
      this.zoomState = {
        targetZoom: this.camera?.zoom || 1.0,
        minZoom: this.zoomConfig.minZoom,
        maxZoom: this.zoomConfig.maxZoom,
        isZooming: false,
        zoomCenter: { x: 0, y: 0 },
        activeZoomTween: undefined,
        activePanTween: undefined,
        onAnimationComplete: undefined,
      };

      // 安全なピンチ状態で初期化
      this.pinchState = {
        isActive: false,
        initialDistance: 0,
        initialZoom: this.camera?.zoom || 1.0,
        centerPoint: { x: 0, y: 0 },
        touches: [],
      };

      this.logError(
        CameraControlError.INITIALIZATION_ERROR,
        "Initialized in safe mode due to errors",
      );
    } catch (error) {
      this.logError(
        CameraControlError.INITIALIZATION_ERROR,
        "Failed to initialize even in safe mode",
        error,
      );
    }
  }

  /**
   * エラーログを出力
   * @param errorType エラータイプ
   * @param message エラーメッセージ
   * @param details 詳細情報
   * @private
   */
  private logError(
    errorType: CameraControlError,
    message: string,
    details?: any,
  ): void {
    const errorInfo = {
      type: errorType,
      message,
      details,
      timestamp: new Date().toISOString(),
      cameraState: this.cameraState,
      dragState: this.dragState,
      config: this.config,
    };

    console.error(`[CameraControlSystem] ${errorType}: ${message}`, errorInfo);
  }

  /**
   * 情報ログを出力
   * @param message メッセージ
   * @param details 詳細情報
   * @private
   */
  private logInfo(message: string, details?: any): void {
    if (this.config?.enabled && process.env.NODE_ENV === "development") {
      console.info(`[CameraControlSystem] ${message}`, details);
    }
  }

  /**
   * ズーム制限のバリデーション
   * @param minZoom 最小ズームレベル
   * @param maxZoom 最大ズームレベル
   * @returns バリデーション結果
   * @private
   */
  private validateZoomLimits(minZoom: number, maxZoom: number): boolean {
    return (
      typeof minZoom === "number" &&
      typeof maxZoom === "number" &&
      Number.isFinite(minZoom) &&
      Number.isFinite(maxZoom) &&
      minZoom > 0 &&
      maxZoom > 0 &&
      minZoom <= maxZoom
    );
  }

  /**
   * ズームレベルを制限内にクランプ
   * @param zoom ズームレベル
   * @returns クランプされたズームレベル
   * @private
   */
  private clampZoomLevel(zoom: number): number {
    if (!Number.isFinite(zoom) || zoom <= 0) {
      return 1.0; // デフォルトズームレベル
    }
    
    return Math.max(this.zoomState.minZoom, Math.min(this.zoomState.maxZoom, zoom));
  }

  /**
   * 指定した点を中心にズーム（境界制限対応）
   * 要件4.3, 4.4, 5.4: ズーム中心点が境界近くでも適切に動作
   * @param zoom ズームレベル
   * @param screenX スクリーン座標のX
   * @param screenY スクリーン座標のY
   * @private
   */
  private zoomToPoint(zoom: number, screenX: number, screenY: number): void {
    try {
      // スクリーン座標をワールド座標に変換（ズーム前の状態で）
      const worldPoint = this.camera.getWorldPoint(screenX, screenY);
      
      // 現在のカメラ位置とズームレベルを保存
      const oldZoom = this.camera.zoom;
      const oldScrollX = this.camera.scrollX;
      const oldScrollY = this.camera.scrollY;
      
      // 新しいズームレベルを設定
      this.camera.setZoom(zoom);
      
      // ズーム後の同じワールド座標がスクリーン上の同じ位置に来るようにカメラを調整
      const newWorldPoint = this.camera.getWorldPoint(screenX, screenY);
      const deltaX = worldPoint.x - newWorldPoint.x;
      const deltaY = worldPoint.y - newWorldPoint.y;
      
      // カメラ位置を調整
      const newScrollX = oldScrollX + deltaX;
      const newScrollY = oldScrollY + deltaY;
      
      // 新しいズームレベルを考慮した境界チェックを行う
      // 要件4.4: 境界制約を考慮したズーム操作
      const clampedPosition = this.clampToBounds(newScrollX, newScrollY, zoom);
      
      // 境界制限により理想的な位置に配置できない場合の調整
      // 要件4.3: ズーム中心点が境界近くでも機能する
      if (clampedPosition.x !== newScrollX || clampedPosition.y !== newScrollY) {
        this.logInfo("Zoom position adjusted due to boundary constraints", {
          idealPos: { x: newScrollX, y: newScrollY },
          clampedPos: clampedPosition,
          zoomLevel: zoom
        });
      }
      
      this.camera.setScroll(clampedPosition.x, clampedPosition.y);
      
      // カメラ状態を更新
      this.cameraState.x = clampedPosition.x;
      this.cameraState.y = clampedPosition.y;
      
      this.logInfo("Zoom to point completed", {
        zoom,
        screenX,
        screenY,
        worldPoint: { x: worldPoint.x, y: worldPoint.y },
        finalCameraPos: { x: clampedPosition.x, y: clampedPosition.y },
        boundaryAdjusted: clampedPosition.x !== newScrollX || clampedPosition.y !== newScrollY
      });
    } catch (error) {
      this.logError(
        CameraControlError.CAMERA_UPDATE_ERROR,
        "Failed to zoom to point",
        error,
      );
      // エラー時は単純なズーム設定にフォールバック
      this.camera.setZoom(zoom);
      // エラー時も境界チェックを実行
      this.clampCameraPosition();
    }
  }

  /**
   * 指定した点を中心にスムーズズームを実行
   * 要件6.1, 6.2, 6.3, 6.4に対応
   * @param zoom 設定するズームレベル
   * @param screenX スクリーン座標のX位置
   * @param screenY スクリーン座標のY位置
   * @param onComplete アニメーション完了時のコールバック（オプション）
   * @private
   */
  private smoothZoomToPoint(
    zoom: number, 
    screenX: number, 
    screenY: number, 
    onComplete?: () => void
  ): void {
    try {
      // 既存のアニメーションをクリーンアップ（要件6.4: アニメーション状態管理）
      this.cleanupZoomAnimations();

      // 同時実行制限チェック
      if (this.zoomState.isZooming && this.zoomConfig.maxConcurrentAnimations <= 1) {
        this.logInfo("Zoom animation already in progress, skipping new request");
        return;
      }

      // スクリーン座標をワールド座標に変換（ズーム前の状態で）
      const worldPoint = this.camera.getWorldPoint(screenX, screenY);
      
      // アニメーション状態を設定
      this.zoomState.isZooming = true;
      this.zoomState.targetZoom = zoom;
      this.zoomState.zoomCenter = { x: screenX, y: screenY };
      this.zoomState.onAnimationComplete = onComplete;

      // 現在のカメラ状態を保存
      const startZoom = this.camera.zoom;
      const startScrollX = this.camera.scrollX;
      const startScrollY = this.camera.scrollY;

      // アニメーション設定
      const duration = this.zoomConfig.smoothZoomDuration;
      const ease = this.zoomConfig.smoothZoomEase;

      // ズーム完了後の目標カメラ位置を計算
      const zoomRatio = zoom / startZoom;
      const targetScrollX = worldPoint.x - (screenX / zoom);
      const targetScrollY = worldPoint.y - (screenY / zoom);

      // 新しいズームレベルを考慮した境界チェックを適用した最終位置
      // 要件5.4: ズーム操作中の境界競合処理
      const clampedPosition = this.clampToBounds(targetScrollX, targetScrollY, zoom);
      
      // 境界制限により理想的な位置に配置できない場合のログ
      if (clampedPosition.x !== targetScrollX || clampedPosition.y !== targetScrollY) {
        this.logInfo("Smooth zoom position adjusted due to boundary constraints", {
          idealPos: { x: targetScrollX, y: targetScrollY },
          clampedPos: clampedPosition,
          zoomLevel: zoom
        });
      }

      // 単一の最適化されたアニメーションを作成（要件6.1, 6.2: スムーズなズームとパン）
      this.zoomState.activeZoomTween = this.scene.tweens.add({
        targets: this.camera,
        zoom: zoom,
        scrollX: clampedPosition.x,
        scrollY: clampedPosition.y,
        duration: duration,
        ease: ease,
        onUpdate: () => {
          // カメラ状態を効率的に更新
          this.cameraState.x = this.camera.scrollX;
          this.cameraState.y = this.camera.scrollY;
        
        },
        onComplete: () => {
          this.zoomState.activeZoomTween = undefined;
          this.zoomState.activePanTween = undefined;
          this.checkAnimationCompletion();
        },
        onStop: () => {
          this.zoomState.activeZoomTween = undefined;
          this.zoomState.activePanTween = undefined;
          this.handleAnimationInterruption();
        }
      });

      this.logInfo("Smooth zoom to point initiated", {
        zoom,
        screenX,
        screenY,
        worldPoint: { x: worldPoint.x, y: worldPoint.y },
        targetPosition: clampedPosition,
        duration,
        ease
      });

    } catch (error) {
      this.logError(
        CameraControlError.CAMERA_UPDATE_ERROR,
        "Failed to smooth zoom to point",
        error,
      );
      // エラー時はアニメーション状態をクリーンアップして即座のズームにフォールバック
      this.cleanupZoomAnimations();
      this.zoomToPoint(zoom, screenX, screenY);
    }
  }

  /**
   * アクティブなズームアニメーションをクリーンアップ
   * 要件6.4: アニメーション状態管理とクリーンアップ
   * @private
   */
  private cleanupZoomAnimations(): void {
    try {
      // ズームアニメーションを停止
      if (this.zoomState.activeZoomTween) {
        this.zoomState.activeZoomTween.stop();
        this.zoomState.activeZoomTween = undefined;
      }

      // パンアニメーションを停止
      if (this.zoomState.activePanTween) {
        this.zoomState.activePanTween.stop();
        this.zoomState.activePanTween = undefined;
      }

      // アニメーション状態をリセット
      this.zoomState.isZooming = false;
      this.zoomState.onAnimationComplete = undefined;

      this.logInfo("Zoom animations cleaned up");
    } catch (error) {
      this.logError(
        CameraControlError.CAMERA_UPDATE_ERROR,
        "Failed to cleanup zoom animations",
        error,
      );
      // 強制的にアニメーション状態をリセット
      this.zoomState.isZooming = false;
      this.zoomState.activeZoomTween = undefined;
      this.zoomState.activePanTween = undefined;
      this.zoomState.onAnimationComplete = undefined;
    }
  }

  /**
   * アニメーション完了をチェックしてコールバックを実行
   * 要件6.3: アニメーション完了の正確な検出
   * @private
   */
  private checkAnimationCompletion(): void {
    try {
      // 両方のアニメーションが完了した場合
      if (!this.zoomState.activeZoomTween && !this.zoomState.activePanTween) {
        this.zoomState.isZooming = false;

        // 最終的な境界チェック
        this.clampCameraPosition();

        // ズームレベル変更後にカメラ移動可否を再評価
        // 要件5.3: ズームアニメーション完了時の境界システム統合
        this.cameraState.canMove = this.shouldEnableCameraMovement(this.camera.zoom);

        // 完了コールバックを実行
        if (this.zoomState.onAnimationComplete) {
          const callback = this.zoomState.onAnimationComplete;
          this.zoomState.onAnimationComplete = undefined;
          callback();
        }

        this.logInfo("Smooth zoom animation completed", {
          finalZoom: this.camera.zoom,
          finalPosition: { x: this.camera.scrollX, y: this.camera.scrollY }
        });
      }
    } catch (error) {
      this.logError(
        CameraControlError.CAMERA_UPDATE_ERROR,
        "Failed to check animation completion",
        error,
      );
      // エラー時は強制的に完了状態にする
      this.zoomState.isZooming = false;
      this.zoomState.onAnimationComplete = undefined;
    }
  }

  /**
   * アニメーション中断時の処理
   * 要件6.4: アニメーション中断時の適切な状態管理
   * @private
   */
  private handleAnimationInterruption(): void {
    try {
      // 中断されたアニメーションの状態をクリーンアップ
      this.zoomState.isZooming = false;
      this.zoomState.onAnimationComplete = undefined;

      // カメラ位置を境界内に調整
      this.clampCameraPosition();

      this.logInfo("Zoom animation interrupted and cleaned up");
    } catch (error) {
      this.logError(
        CameraControlError.CAMERA_UPDATE_ERROR,
        "Failed to handle animation interruption",
        error,
      );
    }
  }

  /**
   * ズームレベル変更時のカメラ境界更新（ズーム対応）
   * 要件5.3, 5.4, 6.4: ズーム中の境界管理と競合処理
   * @private
   */
  private updateCameraBoundsForZoom(): void {
    try {
      // ズーム中は境界チェックを軽量化（パフォーマンス考慮）
      if (this.zoomState.isZooming) {
        // 現在のカメラ位置とズームレベルを取得
        const currentX = this.camera.scrollX;
        const currentY = this.camera.scrollY;
        const currentZoom = this.camera.zoom;
        
        // ズームレベルに応じた効果的なビューポートサイズを計算
        const effectiveViewportWidth = this.camera.width / currentZoom;
        const effectiveViewportHeight = this.camera.height / currentZoom;
        const padding = this.config.boundaryPadding;
        
        // 簡易境界チェック（ズーム考慮）
        const minX = -padding;
        const maxX = this.mapBounds.width - effectiveViewportWidth + padding;
        const minY = -padding;
        const maxY = this.mapBounds.height - effectiveViewportHeight + padding;
        
        if (currentX < minX || currentX > maxX || currentY < minY || currentY > maxY) {
          // 境界外の場合のみ詳細なクランプを実行
          // 要件5.4: ズーム操作中の境界競合を適切に処理
          const clampedPosition = this.clampToBounds(currentX, currentY, currentZoom);
          this.camera.setScroll(clampedPosition.x, clampedPosition.y);
          this.cameraState.x = clampedPosition.x;
          this.cameraState.y = clampedPosition.y;
          
          this.logInfo("Camera bounds updated during zoom", {
            originalPos: { x: currentX, y: currentY },
            clampedPos: clampedPosition,
            zoomLevel: currentZoom,
            effectiveViewport: { width: effectiveViewportWidth, height: effectiveViewportHeight }
          });
        }
      }
    } catch (error) {
      this.logError(
        CameraControlError.CAMERA_UPDATE_ERROR,
        "Failed to update camera bounds during zoom",
        error,
      );
    }
  }
}
