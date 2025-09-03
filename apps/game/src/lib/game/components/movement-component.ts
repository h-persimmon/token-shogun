import type { Point } from "./position-component";
import type { Component } from "./types";

export const movementComponentTag = "movement";

// 移動方向の列挙型（8方向対応）
export enum Direction {
  DOWN = 0, // 下
  DOWN_LEFT = 1, // 左下
  LEFT = 2, // 左
  UP_LEFT = 3, // 左上
  UP = 4, // 上
  UP_RIGHT = 5, // 右上
  RIGHT = 6, // 右
  DOWN_RIGHT = 7, // 右下
}

export type MovementComponent = Component<
  typeof movementComponentTag,
  {
    targetPosition: Point | null;
    currentPath: Point[];
    speed: number;
    isMoving: boolean;
    pathIndex: number;
    currentDirection: Direction;
    targetEntityId?: string;
    animationFrame: number; // 現在のアニメーションフレーム（0-2の循環）
    animationTimer: number; // アニメーションタイマー
  }
>;

export const createMovementComponent = (
  speed: number = 50,
): MovementComponent => ({
  type: movementComponentTag,
  targetPosition: null,
  currentPath: [],
  speed,
  isMoving: false,
  pathIndex: 0,
  currentDirection: Direction.DOWN,
  animationFrame: 1, // 静止時のデフォルトフレーム（中央）
  animationTimer: 0, // アニメーションタイマー
});

export const isMovementComponent = (
  component: Component<any, any>,
): component is MovementComponent => {
  return component.type === movementComponentTag;
};

// Component utility functions
export const setMovementTarget = (
  movement: MovementComponent,
  target: Point,
  path: Point[],
  targetEntityId?: string,
): void => {
  movement.targetPosition = target;
  movement.currentPath = path;
  movement.isMoving = true;
  movement.pathIndex = 0;
  movement.targetEntityId = targetEntityId;
};

export const clearMovementTarget = (movement: MovementComponent): void => {
  movement.targetPosition = null;
  movement.currentPath = [];
  movement.isMoving = false;
  movement.pathIndex = 0;
  movement.targetEntityId = undefined;
  // 方向は保持（停止時も最後の方向を維持）
};

export const getNextPathPoint = (movement: MovementComponent): Point | null => {
  if (movement.pathIndex >= movement.currentPath.length) {
    return null;
  }
  return movement.currentPath[movement.pathIndex];
};

export const advancePathIndex = (movement: MovementComponent): void => {
  movement.pathIndex++;
};

// 方向計算のユーティリティ関数（8方向対応）
export const calculateDirection = (dx: number, dy: number): Direction => {
  // 角度に基づいて8方向を判定
  const angle = Math.atan2(dy, dx);
  const degrees = ((angle * 180) / Math.PI + 360) % 360;

  if (degrees >= 337.5 || degrees < 22.5) {
    return Direction.RIGHT;
  } else if (degrees >= 22.5 && degrees < 67.5) {
    return Direction.DOWN_RIGHT;
  } else if (degrees >= 67.5 && degrees < 112.5) {
    return Direction.DOWN;
  } else if (degrees >= 112.5 && degrees < 157.5) {
    return Direction.DOWN_LEFT;
  } else if (degrees >= 157.5 && degrees < 202.5) {
    return Direction.LEFT;
  } else if (degrees >= 202.5 && degrees < 247.5) {
    return Direction.UP_LEFT;
  } else if (degrees >= 247.5 && degrees < 292.5) {
    return Direction.UP;
  } else {
    return Direction.UP_RIGHT;
  }
};

// 移動方向を更新する関数
export const updateMovementDirection = (
  movement: MovementComponent,
  dx: number,
  dy: number,
): void => {
  // 移動量が十分小さい場合は方向を変更しない
  if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
    return;
  }

  movement.currentDirection = calculateDirection(dx, dy);
};

// アニメーションフレームを更新する関数
export const updateAnimationFrame = (
  movement: MovementComponent,
  deltaTime: number,
): void => {
  const animationSpeed = 300; // ミリ秒（フレーム切り替え間隔）

  if (movement.isMoving) {
    movement.animationTimer += deltaTime;

    if (movement.animationTimer >= animationSpeed) {
      movement.animationTimer = 0;
      // 移動時のアニメーション: 1→2→0→1→...
      switch (movement.animationFrame) {
        case 1:
          movement.animationFrame = 2;
          break;
        case 2:
          movement.animationFrame = 0;
          break;
        case 0:
          movement.animationFrame = 1;
          break;
        default:
          movement.animationFrame = 1;
      }
    }
  } else {
    // 静止時は中央フレーム（1）を維持
    movement.animationFrame = 1;
    movement.animationTimer = 0;
  }
};

