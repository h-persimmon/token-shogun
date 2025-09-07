import type PhaserNavMeshPlugin from "phaser-navmesh";
import type { NavMesh } from "phaser-navmesh";
import {
  advancePathIndex,
  clearMovementTarget,
  getNextPathPoint,
  type MovementComponent,
  setMovementTarget,
  updateAnimationFrame,
  updateMovementDirection,
} from "../components/movement-component";
import type {
  Point,
  PositionComponent,
} from "../components/position-component";
import type { Entity } from "../entities/entity";
import type { createEntityManager } from "../entities/entity-manager";

type EntityManager = ReturnType<typeof createEntityManager>;

export class MovementSystem {
  private entityManager: EntityManager;
  private navMesh: NavMesh;

  constructor(
    entityManager: EntityManager,
    navMeshPlugin: PhaserNavMeshPlugin,
    navMesh: NavMesh,
  ) {
    this.entityManager = entityManager;
    this.navMeshPlugin = navMeshPlugin;
    this.navMesh = navMesh;
  }

  /**
   * エンティティを指定された位置に移動させる
   * @param entityId 移動させるエンティティのID
   * @param targetPosition 目標位置
   */
  public moveEntityTo(
    entityId: string,
    targetPosition: Point,
    targetEntityId?: string,
  ): boolean {
    const entity = this.entityManager.getEntity(entityId);
    if (!entity) return false;

    const positionComponent = entity.components.position
    const movementComponent = entity.components.movement

    if (!positionComponent || !movementComponent) {
      console.warn(
        `Entity ${entityId} doesn't have required components for movement`,
      );
      return false;
    }

    // NavMeshを使用してパスを計算
    const startPoint = {
      x: positionComponent.point.x,
      y: positionComponent.point.y,
    };
    const endPoint = { x: targetPosition.x, y: targetPosition.y };

    const path = this.navMesh.findPath(startPoint, endPoint);

    if (!path || path.length === 0) {
      console.warn(
        `No valid path found from ${JSON.stringify(startPoint)} to ${JSON.stringify(endPoint)}`,
      );
      return false;
    }

    // MovementComponentにパスを設定
    setMovementTarget(movementComponent, targetPosition, path, targetEntityId);

    console.log(`Movement path set for entity ${entityId}:`, path);
    return true;
  }

  /**
   * エンティティの移動を停止
   * @param entityId 停止させるエンティティのID
   */
  public stopEntity(entityId: string): void {
    const entity = this.entityManager.getEntity(entityId);
    if (!entity) return;

    const movementComponent = entity.components.movement;
    if (movementComponent) {
      clearMovementTarget(movementComponent);
    }
  }

  /**
   * 移動システムの更新処理
   * @param delta デルタタイム（ミリ秒）
   */
  public update(delta: number): void {
    const entities = this.entityManager.getAllEntities();

    for (const entity of entities) {
      this.updateEntityMovement(entity, delta);
      // アニメーションフレームも更新
      const movementComponent = entity.components.movement;
      if (movementComponent) {
        updateAnimationFrame(movementComponent, delta);
      }
    }
  }

  private updateEntityMovement(entity: Entity, delta: number): void {
    const positionComponent = entity.components.position as
      | PositionComponent
      | undefined;
    const movementComponent = entity.components.movement as
      | MovementComponent
      | undefined;

    if (
      !positionComponent ||
      !movementComponent ||
      !movementComponent.isMoving
    ) {
      return;
    }

    const currentTarget = getNextPathPoint(movementComponent);
    if (!currentTarget) {
      // パスの終端に到達
      clearMovementTarget(movementComponent);
      return;
    }

    // 現在位置から次の目標点への方向と距離を計算
    const currentPos = positionComponent.point;
    const dx = currentTarget.x - currentPos.x;
    const dy = currentTarget.y - currentPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // 目標点に十分近い場合、次のパス点に進む
    if (distance < 5) {
      console.log(`🔥Entity ${entity.id} reached target (${currentTarget.x}, ${currentTarget.y})`);
      // 5ピクセル以内なら到達とみなす
      advancePathIndex(movementComponent);
      return;
    }

    // 移動量を計算（デルタ時間を考慮）
    const speed = movementComponent.speed;
    const moveDistance = (speed * delta) / 1000; // delta は ms なので秒に変換
    console.log("🔥", moveDistance, distance);
    if (moveDistance >= distance) {
      // 今回の更新で目標点に到達する
      positionComponent.point.x = currentTarget.x;
      positionComponent.point.y = currentTarget.y;
      advancePathIndex(movementComponent);
    } else {
      // 正規化された方向ベクトルに移動距離を掛けて移動
      const normalizedDx = dx / distance;
      const normalizedDy = dy / distance;

      const moveDx = normalizedDx * moveDistance;
      const moveDy = normalizedDy * moveDistance;

      positionComponent.point.x += moveDx;
      positionComponent.point.y += moveDy;

      // 移動方向を更新
      updateMovementDirection(movementComponent, moveDx, moveDy);
    }
  }

  /**
   * 移動中のエンティティ一覧を取得
   */
  public getMovingEntities(): Entity[] {
    return this.entityManager.getAllEntities().filter((entity: Entity) => {
      const movementComponent = entity.components.movement as
        | MovementComponent
        | undefined;
      return movementComponent?.isMoving || false;
    });
  }

  /**
   * 指定された点が移動可能かチェック
   * @param point チェックする座標
   */
  public isPointWalkable(point: Point): boolean {
    return this.navMesh.isPointInMesh(point);
  }

  /**
   * 2点間のパスを取得（移動実行はしない）
   * @param from 開始点
   * @param to 終了点
   */
  public getPath(from: Point, to: Point): Point[] | null {
    const path = this.navMesh.findPath(from, to);
    return path || null;
  }

  public clearMoveTarget(entity: Entity): void {
    const movementComponent = entity.components.movement as
      | MovementComponent
      | undefined;
    if (movementComponent) {
      clearMovementTarget(movementComponent);
    }
  }
}
