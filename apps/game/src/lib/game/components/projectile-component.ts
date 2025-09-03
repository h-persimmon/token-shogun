import { createObjectPool, type Poolable } from "../entities/object-pool";
import type { AttackType } from "./attack-component";
import type { Component } from "./types";

export const projectileComponentTag = "projectile";

export type ProjectileComponent = Component<
  typeof projectileComponentTag,
  {
    attackerId: string; // 攻撃者のID
    attackType: AttackType;
    damage: number;
    speed: number; // pixels/second

    // 砲台攻撃用
    targetPosition?: { x: number; y: number }; // 着弾予定位置
    explosionRadius?: number;
    flightTime: number; // 残り飛行時間 (seconds)

    // 弓矢攻撃用
    targetEntityId?: string; // 追跡対象のID

    // 視覚的要素
    sprite?: Phaser.GameObjects.Sprite;
    trail?: Phaser.GameObjects.Graphics;

    // エフェクト関連
    trajectoryEffect?: Phaser.GameObjects.Graphics; // 軌道エフェクト
    trailPoints?: Array<{ x: number; y: number; timestamp: number }>; // 軌跡ポイント
  }
>;

/**
 * 砲台攻撃用のProjectileComponentを作成
 */
export const createArtilleryProjectile = (
  attackerId: string,
  damage: number,
  speed: number,
  targetPosition: { x: number; y: number },
  explosionRadius: number,
  flightTime: number,
): ProjectileComponent => ({
  type: projectileComponentTag,
  attackerId,
  attackType: "artillery",
  damage,
  speed,
  targetPosition,
  explosionRadius,
  flightTime,
});

/**
 * 弓矢攻撃用のProjectileComponentを作成
 */
export const createHomingProjectile = (
  attackerId: string,
  damage: number,
  speed: number,
  targetEntityId: string,
): ProjectileComponent => ({
  type: projectileComponentTag,
  attackerId,
  attackType: "homing",
  damage,
  speed,
  targetEntityId,
  flightTime: 0, // 弓矢攻撃は時間制限なし
});

/**
 * Type guard to check if a component is a ProjectileComponent
 */
export const isProjectileComponent = (
  component: Component<any, any>,
): component is ProjectileComponent =>
  component.type === projectileComponentTag;

// Component utility functions

/**
 * 砲台弾丸かどうかを判定
 */
export const isArtilleryProjectile = (
  projectile: ProjectileComponent,
): boolean => projectile.attackType === "artillery";

/**
 * 弓矢弾丸かどうかを判定
 */
export const isHomingProjectile = (projectile: ProjectileComponent): boolean =>
  projectile.attackType === "homing";

/**
 * 砲台弾丸の飛行時間を更新
 */
export const updateFlightTime = (
  projectile: ProjectileComponent,
  deltaTime: number,
): void => {
  if (projectile.attackType === "artillery") {
    projectile.flightTime = Math.max(0, projectile.flightTime - deltaTime);
  }
};

/**
 * 砲台弾丸が着弾したかどうかを判定
 */
export const hasLanded = (projectile: ProjectileComponent): boolean =>
  projectile.attackType === "artillery" && projectile.flightTime <= 0;

/**
 * 弓矢弾丸の追跡対象を更新
 */
export const updateTarget = (
  projectile: ProjectileComponent,
  targetEntityId: string,
): void => {
  if (projectile.attackType === "homing") {
    projectile.targetEntityId = targetEntityId;
  }
};

/**
 * 弾丸の追跡対象が有効かどうかを判定
 */
export const hasValidTarget = (projectile: ProjectileComponent): boolean =>
  projectile.attackType === "homing" &&
  projectile.targetEntityId !== undefined &&
  projectile.targetEntityId !== "";

/**
 * 弾丸のスプライトを設定
 */
export const setProjectileSprite = (
  projectile: ProjectileComponent,
  sprite: Phaser.GameObjects.Sprite,
): void => {
  projectile.sprite = sprite;
};

/**
 * 弾丸の軌跡を設定
 */
export const setProjectileTrail = (
  projectile: ProjectileComponent,
  trail: Phaser.GameObjects.Graphics,
): void => {
  projectile.trail = trail;
};

/**
 * 弾丸の視覚要素をクリーンアップ
 */
export const cleanupProjectileVisuals = (
  projectile: ProjectileComponent,
): void => {
  if (projectile.sprite) {
    projectile.sprite.destroy();
    projectile.sprite = undefined;
  }
  if (projectile.trail) {
    projectile.trail.destroy();
    projectile.trail = undefined;
  }
  if (projectile.trajectoryEffect) {
    projectile.trajectoryEffect.destroy();
    projectile.trajectoryEffect = undefined;
  }
  if (projectile.trailPoints) {
    projectile.trailPoints = undefined;
  }
};

/**
 * 弾丸の軌道エフェクトを設定
 */
export const setProjectileTrajectoryEffect = (
  projectile: ProjectileComponent,
  trajectoryEffect: Phaser.GameObjects.Graphics,
): void => {
  projectile.trajectoryEffect = trajectoryEffect;
};

/**
 * 弾丸の軌跡ポイントを追加
 */
export const addTrailPoint = (
  projectile: ProjectileComponent,
  position: { x: number; y: number },
  maxTrailLength: number = 10,
): void => {
  if (!projectile.trailPoints) {
    projectile.trailPoints = [];
  }

  const timestamp = Date.now();
  projectile.trailPoints.push({ x: position.x, y: position.y, timestamp });

  // 古いポイントを削除
  if (projectile.trailPoints.length > maxTrailLength) {
    projectile.trailPoints.shift();
  }
};

/**
 * 古い軌跡ポイントをクリーンアップ
 */
export const cleanupOldTrailPoints = (
  projectile: ProjectileComponent,
  maxAge: number = 1000, // 1秒
): void => {
  if (!projectile.trailPoints) return;

  const currentTime = Date.now();
  projectile.trailPoints = projectile.trailPoints.filter(
    (point) => currentTime - point.timestamp <= maxAge,
  );
};

/**
 * 砲台弾丸の設定が有効かどうかを検証
 */
export const isValidArtilleryProjectile = (
  projectile: ProjectileComponent,
): boolean =>
  projectile.attackType === "artillery" &&
  projectile.targetPosition !== undefined &&
  projectile.explosionRadius !== undefined &&
  projectile.explosionRadius > 0 &&
  projectile.flightTime >= 0;

/**
 * 弓矢弾丸の設定が有効かどうかを検証
 */
export const isValidHomingProjectile = (
  projectile: ProjectileComponent,
): boolean =>
  projectile.attackType === "homing" &&
  projectile.targetEntityId !== undefined &&
  projectile.targetEntityId !== "" &&
  projectile.speed > 0;

/**
 * 弾丸の基本設定が有効かどうかを検証
 */
export const isValidProjectile = (projectile: ProjectileComponent): boolean =>
  projectile.attackerId !== "" &&
  projectile.damage > 0 &&
  projectile.speed > 0 &&
  (isValidArtilleryProjectile(projectile) ||
    isValidHomingProjectile(projectile));

/**
 * PoolableProjectileComponent - ObjectPoolで管理される弾丸コンポーネント
 */
export class PoolableProjectileComponent implements Poolable {
  private _inUse: boolean = false;
  public component: ProjectileComponent;

  constructor() {
    // デフォルト値で初期化
    this.component = {
      type: projectileComponentTag,
      attackerId: "",
      attackType: "direct",
      damage: 0,
      speed: 0,
      flightTime: 0,
    };
  }

  /**
   * 砲台攻撃用に設定
   */
  public setupAsArtillery(
    attackerId: string,
    damage: number,
    speed: number,
    targetPosition: { x: number; y: number },
    explosionRadius: number,
    flightTime: number,
  ): void {
    this.component.attackerId = attackerId;
    this.component.attackType = "artillery";
    this.component.damage = damage;
    this.component.speed = speed;
    this.component.targetPosition = targetPosition;
    this.component.explosionRadius = explosionRadius;
    this.component.flightTime = flightTime;
    this.component.targetEntityId = undefined;
  }

  /**
   * 弓矢攻撃用に設定
   */
  public setupAsHoming(
    attackerId: string,
    damage: number,
    speed: number,
    targetEntityId: string,
  ): void {
    this.component.attackerId = attackerId;
    this.component.attackType = "homing";
    this.component.damage = damage;
    this.component.speed = speed;
    this.component.targetEntityId = targetEntityId;
    this.component.flightTime = 0;
    this.component.targetPosition = undefined;
    this.component.explosionRadius = undefined;
  }

  /**
   * Poolableインターフェースの実装
   */
  public reset(): void {
    // 視覚要素をクリーンアップ
    if (this.component.sprite) {
      this.component.sprite.setVisible(false);
      this.component.sprite.setPosition(0, 0);
      this.component.sprite.setRotation(0);
      this.component.sprite.setScale(1, 1);
      this.component.sprite.setAlpha(1);
    }

    if (this.component.trail) {
      this.component.trail.clear();
      this.component.trail.setVisible(false);
    }

    if (this.component.trajectoryEffect) {
      this.component.trajectoryEffect.clear();
      this.component.trajectoryEffect.setVisible(false);
    }

    // コンポーネントの値をリセット
    this.component.attackerId = "";
    this.component.attackType = "direct";
    this.component.damage = 0;
    this.component.speed = 0;
    this.component.flightTime = 0;
    this.component.targetPosition = undefined;
    this.component.explosionRadius = undefined;
    this.component.targetEntityId = undefined;
    this.component.sprite = undefined;
    this.component.trail = undefined;
    this.component.trajectoryEffect = undefined;
    this.component.trailPoints = undefined;

    this._inUse = false;
  }

  public isInUse(): boolean {
    return this._inUse;
  }

  public setInUse(inUse: boolean): void {
    this._inUse = inUse;
  }
}

/**
 * ProjectileComponentのオブジェクトプールを作成
 */
export const createProjectilePool = (maxSize: number = 100) => {
  const createFn = () => new PoolableProjectileComponent();

  const resetFn = (_poolable: PoolableProjectileComponent) => {
    // 追加のリセット処理が必要な場合はここに記述
  };

  return createObjectPool(createFn, maxSize, resetFn);
};

/**
 * プールから砲台攻撃用の弾丸を取得
 */
export const acquireArtilleryProjectileFromPool = (
  pool: ReturnType<typeof createProjectilePool>,
  attackerId: string,
  damage: number,
  speed: number,
  targetPosition: { x: number; y: number },
  explosionRadius: number,
  flightTime: number,
): PoolableProjectileComponent => {
  const poolable = pool.acquire();
  poolable.setupAsArtillery(
    attackerId,
    damage,
    speed,
    targetPosition,
    explosionRadius,
    flightTime,
  );
  return poolable;
};

/**
 * プールから弓矢攻撃用の弾丸を取得
 */
export const acquireHomingProjectileFromPool = (
  pool: ReturnType<typeof createProjectilePool>,
  attackerId: string,
  damage: number,
  speed: number,
  targetEntityId: string,
): PoolableProjectileComponent => {
  const poolable = pool.acquire();
  poolable.setupAsHoming(attackerId, damage, speed, targetEntityId);
  return poolable;
};

/**
 * 弾丸をプールに返却
 */
export const releaseProjectileToPool = (
  pool: ReturnType<typeof createProjectilePool>,
  poolable: PoolableProjectileComponent,
): void => {
  pool.release(poolable);
};
