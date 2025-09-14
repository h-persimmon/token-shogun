import type {
  CameraControlConfig,
  CameraPosition,
  CameraState,
  DragState,
  MapBounds,
} from "./camera-control-types";
import { DEFAULT_CAMERA_CONTROL_CONFIG } from "./camera-control-types";

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

  /**
   * CameraControlSystemのコンストラクタ
   * @param scene Phaserシーン
   * @param mapBounds マップの境界情報
   * @param config カメラ制御の設定（オプション）
   */
  constructor(
    scene: Phaser.Scene,
    mapBounds: MapBounds,
    config?: Partial<CameraControlConfig>,
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
      this.cameraState.canMove = this.shouldEnableCameraMovement();

      // 境界が変更された場合、カメラ位置を再調整
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
      }

      // ドラッグ状態をリセット
      this.resetDragState();

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

      // 境界内にクランプ（要件3.1, 3.2, 3.3, 3.4対応）
      const clampedPosition = this.clampToBounds(newX, newY);

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
   * 指定された座標を境界内にクランプ
   * 要件3.1, 3.2, 3.3, 3.4に対応
   * @param x X座標
   * @param y Y座標
   * @returns クランプされた座標
   * @private
   */
  private clampToBounds(x: number, y: number): { x: number; y: number } {
    if (!this.cameraState.canMove) {
      return { x: this.camera.scrollX, y: this.camera.scrollY };
    }

    const viewportWidth = this.camera.width;
    const viewportHeight = this.camera.height;
    const padding = this.config.boundaryPadding;

    // 境界を計算
    // 要件3.1: 左端の境界制限
    const minX = -padding;
    // 要件3.2: 右端の境界制限
    const maxX = Math.max(minX, this.mapBounds.width - viewportWidth + padding);
    // 要件3.3: 上端の境界制限
    const minY = -padding;
    // 要件3.4: 下端の境界制限
    const maxY = Math.max(
      minY,
      this.mapBounds.height - viewportHeight + padding,
    );

    // 座標を境界内にクランプ
    const clampedX = Math.max(minX, Math.min(maxX, x));
    const clampedY = Math.max(minY, Math.min(maxY, y));

    return { x: clampedX, y: clampedY };
  }

  /**
   * カメラ位置を境界内に制限
   * @private
   */
  private clampCameraPosition(): void {
    try {
      if (!this.cameraState.canMove) {
        return;
      }

      // 現在の位置をクランプ
      const clampedPosition = this.clampToBounds(
        this.camera.scrollX,
        this.camera.scrollY,
      );

      // 位置が変更された場合のみ更新
      if (
        clampedPosition.x !== this.camera.scrollX ||
        clampedPosition.y !== this.camera.scrollY
      ) {
        this.camera.setScroll(clampedPosition.x, clampedPosition.y);
        this.cameraState.x = clampedPosition.x;
        this.cameraState.y = clampedPosition.y;
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
   * カメラ移動を有効にするかどうかを判定
   * @returns カメラ移動を有効にする場合true
   * @private
   */
  private shouldEnableCameraMovement(): boolean {
    const viewportWidth = this.camera.width;
    const viewportHeight = this.camera.height;

    // マップサイズが画面サイズより大きい場合のみ移動を有効化
    return (
      this.mapBounds.width > viewportWidth ||
      this.mapBounds.height > viewportHeight
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
}
