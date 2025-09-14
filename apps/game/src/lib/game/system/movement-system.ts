import type PhaserNavMeshPlugin from "phaser-navmesh";
import type { NavMesh } from "phaser-navmesh";
import type { AttackComponent } from "../components/attack-component";
import { calculateDistance } from "../components/attack-component";
import type { HealthComponent } from "../components/health-component";
import {
  advancePathIndex,
  applyStun,
  clearMovementTarget,
  getNextPathPoint,
  isStunned,
  type MovementComponent,
  resumeFromCombat,
  setMovementTarget,
  stopForCombat,
  updateAnimationFrame,
  updateMovementDirection,
} from "../components/movement-component";
import type {
  Point,
  PositionComponent,
} from "../components/position-component";
import type { TargetComponent } from "../components/target-component";
import { DEFAULT_COMBAT_RANGE_CONFIG, DEFAULT_STUN_CONFIG } from "../constants";
import type { Entity } from "../entities/entity";
import type { createEntityManager } from "../entities/entity-manager";
import type { CombatRangeConfig, StunConfig } from "../types/combat-config";

type EntityManager = ReturnType<typeof createEntityManager>;

export class MovementSystem {
  private entityManager: EntityManager;
  private navMesh: NavMesh;
  private combatRangeConfig: CombatRangeConfig;
  private stunConfig: StunConfig;
  private lastCombatRangeCheck: number = 0;
  private lastStunCheck: number = 0;

  constructor(
    entityManager: EntityManager,
    navMeshPlugin: PhaserNavMeshPlugin,
    navMesh: NavMesh,
    combatRangeConfig: CombatRangeConfig = DEFAULT_COMBAT_RANGE_CONFIG,
    stunConfig: StunConfig = DEFAULT_STUN_CONFIG,
  ) {
    this.entityManager = entityManager;
    this.navMesh = navMesh;
    this.combatRangeConfig = combatRangeConfig;
    this.stunConfig = stunConfig;
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

    const positionComponent = entity.components.position;
    const movementComponent = entity.components.movement;

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
    const currentTime = Date.now();
    const entities = this.entityManager.getAllEntities();

    // スタン効果チェックを定期的に実行
    if (currentTime - this.lastStunCheck >= 50) {
      // 50ms間隔でチェック
      this.updateStunStates(currentTime);
      this.lastStunCheck = currentTime;
    }

    // 戦闘範囲チェックを定期的に実行
    if (
      currentTime - this.lastCombatRangeCheck >=
      this.combatRangeConfig.checkInterval
    ) {
      this.updateCombatRangeStates(currentTime);
      this.lastCombatRangeCheck = currentTime;
    }

    for (const entity of entities) {
      if (entity.components?.health?.isDead) {
        // 死亡している場合は移動しない
        continue;
      }
      this.updateEntityMovement(entity, delta, currentTime);
      // アニメーションフレームも更新
      const movementComponent = entity.components.movement;
      if (movementComponent) {
        updateAnimationFrame(movementComponent, delta);
      }
    }
  }

  private updateEntityMovement(
    entity: Entity,
    delta: number,
    currentTime: number,
  ): void {
    const positionComponent = entity.components.position as
      | PositionComponent
      | undefined;
    const movementComponent = entity.components.movement as
      | MovementComponent
      | undefined;

    if (!positionComponent || !movementComponent) {
      return;
    }

    // スタン状態チェック
    if (isStunned(movementComponent, currentTime)) {
      return;
    }

    // スタン時間が経過した場合の復帰処理
    if (
      movementComponent.stunEndTime &&
      currentTime >= movementComponent.stunEndTime
    ) {
      this.handleStunRecovery(movementComponent);
    }

    // 戦闘のために停止中の場合は移動しない
    if (movementComponent.isStoppedForCombat) {
      return;
    }

    if (!movementComponent.isMoving) {
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

    // 移動量を計算（デルタ時間を考慮）
    const speed = movementComponent.speed;
    const moveDistance = (speed * delta) / 1000; // delta は ms なので秒に変換
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

  /**
   * 戦闘範囲状態を更新する
   * @param currentTime 現在時刻
   */
  private updateCombatRangeStates(currentTime: number): void {
    const entities = this.entityManager.getAllEntities();

    for (const entity of entities) {
      this.updateEntityCombatRangeState(entity, currentTime);
    }
  }

  /**
   * 個別エンティティの戦闘範囲状態を更新する
   * @param entity 対象エンティティ
   * @param currentTime 現在時刻
   */
  private updateEntityCombatRangeState(
    entity: Entity,
    currentTime: number,
  ): void {
    const positionComponent = entity.components.position as
      | PositionComponent
      | undefined;
    const movementComponent = entity.components.movement as
      | MovementComponent
      | undefined;
    const attackComponent = entity.components.attack as
      | AttackComponent
      | undefined;
    const targetComponent = entity.components.target as
      | TargetComponent
      | undefined;

    if (
      !positionComponent ||
      !movementComponent ||
      !attackComponent ||
      !targetComponent
    ) {
      return;
    }

    // 死亡している場合は処理しない
    if (entity.components?.health?.isDead) {
      return;
    }

    // スタン中は戦闘範囲チェックをスキップ
    if (isStunned(movementComponent, currentTime)) {
      return;
    }

    // ターゲットエンティティを取得
    const targetEntity = targetComponent.targetEntityId
      ? this.entityManager.getEntity(targetComponent.targetEntityId)
      : null;

    if (!targetEntity || !targetEntity.components.position) {
      // ターゲットがない場合は戦闘停止状態を解除
      if (movementComponent.isStoppedForCombat) {
        resumeFromCombat(movementComponent);
      }
      return;
    }

    const targetPosition = targetEntity.components
      .position as PositionComponent;
    const distance = calculateDistance(
      positionComponent.point,
      targetPosition.point,
    );
    const attackRange = attackComponent.range;

    // 味方ユニットがStructureに近づく場合は攻撃範囲で停止しない
    const isTargetStructure = !!targetEntity.components.structure;
    const isEntityFriendly = !!entity.components.unit; // unitコンポーネントがあれば味方

    if (isEntityFriendly && isTargetStructure) {
      // 味方ユニットがStructureに向かう場合は戦闘停止状態を解除
      if (movementComponent.isStoppedForCombat) {
        resumeFromCombat(movementComponent);
      }
      return;
    }

    // 攻撃範囲内での停止判定
    const stopDistance = attackRange * this.combatRangeConfig.stopThreshold;
    const resumeDistance = attackRange * this.combatRangeConfig.resumeThreshold;

    if (!movementComponent.isStoppedForCombat && distance <= stopDistance) {
      // 攻撃範囲内に入ったので停止
      stopForCombat(movementComponent, true);
    } else if (
      movementComponent.isStoppedForCombat &&
      distance > resumeDistance
    ) {
      // 攻撃範囲から外れたので移動再開
      resumeFromCombat(movementComponent);
    }
  }

  /**
   * 戦闘範囲設定を更新する
   * @param config 新しい設定
   */
  public updateCombatRangeConfig(config: CombatRangeConfig): void {
    this.combatRangeConfig = config;
  }

  /**
   * 現在の戦闘範囲設定を取得する
   */
  public getCombatRangeConfig(): CombatRangeConfig {
    return { ...this.combatRangeConfig };
  }

  /**
   * スタン状態を更新する
   * @param currentTime 現在時刻
   */
  private updateStunStates(currentTime: number): void {
    const entities = this.entityManager.getAllEntities();

    for (const entity of entities) {
      this.updateEntityStunState(entity, currentTime);
    }
  }

  /**
   * 個別エンティティのスタン状態を更新する
   * @param entity 対象エンティティ
   * @param currentTime 現在時刻
   */
  private updateEntityStunState(entity: Entity, currentTime: number): void {
    const healthComponent = entity.components.health as
      | HealthComponent
      | undefined;
    const movementComponent = entity.components.movement as
      | MovementComponent
      | undefined;

    if (!healthComponent || !movementComponent) {
      return;
    }

    // 死亡している場合は処理しない
    if (healthComponent.isDead) {
      return;
    }

    // HealthComponentから攻撃履歴を取得
    const lastDamageTime = healthComponent.lastDamageTime;
    const lastDamageFrom = healthComponent.lastDamageFrom;

    if (!lastDamageTime || !lastDamageFrom) {
      return;
    }

    // 既にスタン中の場合はスキップ
    if (isStunned(movementComponent, currentTime)) {
      return;
    }

    // スタン効果を適用すべきかチェック
    const timeSinceLastDamage = currentTime - lastDamageTime;
    const stunThreshold = 100; // 100ms以内の攻撃に対してスタン効果を適用

    if (timeSinceLastDamage <= stunThreshold) {
      // スタン効果を適用
      const stunDuration = this.calculateStunDuration(entity);
      applyStun(movementComponent, stunDuration, currentTime);

      console.log(
        `Applied stun effect to entity ${entity.id} for ${stunDuration}ms (attacked by ${lastDamageFrom})`,
      );

      // 攻撃履歴をクリア（同じ攻撃で複数回スタンしないように）
      healthComponent.lastDamageTime = undefined;
      healthComponent.lastDamageFrom = undefined;
    }
  }

  /**
   * エンティティのスタン時間を計算する
   * @param entity 対象エンティティ
   * @returns スタン時間（ミリ秒）
   */
  private calculateStunDuration(entity: Entity): number {
    const unitComponent = entity.components.unit;
    const enemyComponent = entity.components.enemy;

    let unitType = "default";

    // ユニットタイプを判定
    if (unitComponent) {
      switch (unitComponent.unitType) {
        case "soldier":
          unitType = "heavy";
          break;
        case "archer":
          unitType = "light";
          break;
        case "mage":
          unitType = "light";
          break;
        default:
          unitType = "default";
      }
    } else if (enemyComponent) {
      switch (enemyComponent.enemyType) {
        case "basic":
          unitType = "default";
          break;
        case "fast":
          unitType = "fast";
          break;
        case "heavy":
          unitType = "tank";
          break;
        default:
          unitType = "default";
      }
    }

    // 基本スタン時間を取得
    const baseDuration = this.stunConfig.defaultDuration;

    // ユニットタイプ修正値を適用
    const modifier = this.stunConfig.unitTypeModifiers[unitType] || 1.0;

    return Math.round(baseDuration * modifier);
  }

  /**
   * スタン設定を更新する
   * @param config 新しい設定
   */
  public updateStunConfig(config: StunConfig): void {
    this.stunConfig = config;
  }

  /**
   * 現在のスタン設定を取得する
   */
  public getStunConfig(): StunConfig {
    return { ...this.stunConfig };
  }

  /**
   * スタン時間経過後の復帰処理
   * @param movementComponent 移動コンポーネント
   */
  private handleStunRecovery(movementComponent: MovementComponent): void {
    // スタン効果をクリア
    movementComponent.stunEndTime = undefined;

    // 戦闘停止状態も解除（元の目標への移動を再開）
    if (
      movementComponent.isStoppedForCombat &&
      movementComponent.originalTarget
    ) {
      resumeFromCombat(movementComponent);
      console.log("Stun recovery: Resumed movement to original target");
    } else {
      // 戦闘停止状態のみ解除
      movementComponent.isStoppedForCombat = false;
      console.log("Stun recovery: Cleared combat stop state");
    }
  }
}
