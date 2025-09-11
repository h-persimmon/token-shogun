import {
  canAttack,
  executeAttack,
  isArtilleryAttack,
  isHomingAttack,
  isInAttackRange,
  isProjectileAttack,
} from "../components/attack-component";
import type { EnemyComponent } from "../components/enemy-component";
import {
  recordDamageSource,
  updateHealthComponent,
} from "../components/health-component";
import type { MovementComponent } from "../components/movement-component";
import type { PositionComponent } from "../components/position-component";
import {
  acquireArtilleryProjectileFromPool,
  acquireHomingProjectileFromPool,
  createProjectilePool,
  type PoolableProjectileComponent,
  type ProjectileComponent,
  releaseProjectileToPool,
} from "../components/projectile-component";
import type { StructureComponent } from "../components/structure-component";
import {
  hasValidTarget,
} from "../components/target-component";
import type { UnitComponent } from "../components/unit-component";
import type { Entity } from "../entities/entity";
import type { EntityManager } from "../entities/entity-manager";
import { GameStateSystem } from "./game-state-system";

/**
 * 攻撃結果の情報
 */
export type AttackResult = {
  success: boolean;
  damageDealt: number;
  targetDestroyed: boolean;
  targetId: string;
};

/**
 * 攻撃エフェクトの種類
 */
export type AttackEffectType = "melee" | "ranged" | "magic" | "explosion";

/**
 * 攻撃エフェクトの設定
 */
export type AttackEffectConfig = {
  type: AttackEffectType;
  duration: number; // ミリ秒
  color?: number;
  scale?: number;
  particles?: boolean;
};

export class AttackSystem {
  private entityManager: EntityManager;
  private gameStateSystem?: any; // GameStateSystemの参照
  private entitiesToRemove: Set<string> = new Set();
  private projectiles: Map<string, Entity> = new Map(); // 弾丸エンティティの管理
  private projectilePool: ReturnType<typeof createProjectilePool>; // 弾丸のオブジェクトプール
  private projectilePoolables: Map<string, PoolableProjectileComponent> =
    new Map(); // エンティティIDとPoolableの対応
  private lastUpdateTime?: number; // 前回の更新時刻

  constructor(entityManager: EntityManager, projectilePoolSize: number = 100) {
    this.entityManager = entityManager;
    this.projectilePool = createProjectilePool(projectilePoolSize);
  }

  /**
   * GameStateSystemの参照を設定
   * @param gameStateSystem GameStateSystemのインスタンス
   */
  public setGameStateSystem(gameStateSystem: GameStateSystem): void {
    this.gameStateSystem = gameStateSystem;
  }

  /**
   * システムの更新処理
   * 攻撃可能なエンティティの攻撃処理を実行する
   * @param currentTime 現在時刻（ミリ秒）
   */
  public update(currentTime: number): void {
    // 攻撃可能なエンティティ（AttackComponent、TargetComponent、PositionComponentを持つ）を取得
    const attackers = this.entityManager.queryEntities({
      required: ["position", "attack", "target"],
    });

    for (const attacker of attackers) {
      if(attacker.components?.health?.isDead) {
        // 死亡している場合は移動しない
        continue;
      }
      this.processAttackerEntity(attacker, currentTime);
    }

    // 弾丸の更新処理
    this.updateProjectiles(currentTime);

    // 削除予定のエンティティをクリーンアップ
    this.cleanupDeadEntities();
  }

  /**
   * 指定されたエンティティの攻撃処理を実行
   * @param attackerEntity 攻撃者エンティティ
   * @param currentTime 現在時刻（ミリ秒）
   */
  public processAttackerEntity(
    attackerEntity: Entity<["attack" | "target" | "position"]>,
    currentTime: number,
  ): void {
    const attackComponent = attackerEntity.components["attack"]
    const targetComponent = attackerEntity.components["target"]
    const positionComponent = attackerEntity.components["position"]

    // 砲台の場合、ユニットが配備されているかチェック
    if (!this.canStructureAttack(attackerEntity)) {
      return;
    }
    if (!this.canUnitAttack(attackerEntity)) {
      return;
    }
    // 攻撃クールダウンチェック
    if (attackComponent && !canAttack(attackComponent, currentTime)) {
      return;
    }

    // entityが削除されていないかをチェック
    if (this.entitiesToRemove.has(attackerEntity.id)) {
      return;
    }
    // 有効な目標があるかチェック
    if (!hasValidTarget(targetComponent)) {
      return;
    }

    // 目標エンティティを取得
    const targetEntity = this.entityManager.getEntity(
      targetComponent.targetEntityId!,
    ) as Entity<["health", "position"]>;
    if (!targetEntity) {
      return;
    }

    // 目標が攻撃可能かチェック
    if (!this.canAttackTarget(targetEntity)) {
      return;
    }


    // 攻撃範囲内かチェック
  const targetPosition = targetEntity.components["position"];
    if (
      !targetPosition ||
      !isInAttackRange(positionComponent, targetPosition, attackComponent.range)
    ) {
      return;
    }

    // 攻撃を実行
    this.executeAttack(attackerEntity, targetEntity, currentTime);
  }

  /**
   * 砲台が攻撃可能かチェック（ユニットが配備されているか）
   * @param entity 攻撃者エンティティ
   * @returns 攻撃可能な場合true
   */
  private canStructureAttack(entity: Entity<["attack" | "position" | "target"]>): boolean {
    const structureComponent = entity.components.structure

    // 砲台でない場合は攻撃可能
    if (!structureComponent) {
      return true;
    }

    // 砲台の場合、攻撃タイプをチェック
    if (structureComponent.attackableType === "none") {
      return false; // 攻撃不可
    }

    if (structureComponent.attackableType === "auto") {
      return true; // 自動攻撃可能
    }

    if (structureComponent.attackableType === "with-unit") {
      // ユニット配備が必要な場合、配備されているかチェック
      return structureComponent.deployedUnitId !== undefined;
    }

    return false;
  }

  /** UnitがStructureに乗っている場合、攻撃できない
   *
   */
  private canUnitAttack(unitEntity: Entity<["attack" | "position" | "target"]>): boolean {
    const unitComponent = unitEntity.components.unit;
    const targetComponent = unitEntity.components.target;
    if(targetComponent?.specialMission != undefined) {
      // 拠点防衛のための移動時は攻撃不可
      return false;
    }
    return !unitComponent || !unitComponent.deployedStructureId;
  }

  /**
   * 攻撃を実行する
   * @param attackerEntity 攻撃者エンティティ
   * @param targetEntity 目標エンティティ
   * @param currentTime 現在時刻（ミリ秒）
   * @returns 攻撃結果の情報
   */
  public executeAttack(
    attackerEntity: Entity<["attack" | "position" | "target"]>,
    targetEntity: Entity<["health", "position"]>,
    currentTime: number,
  ): AttackResult {
  const attackComponent = attackerEntity.components["attack"];
  const targetHealth = targetEntity.components["health"];

    if (!attackComponent || !targetHealth) {
      return {
        success: false,
        damageDealt: 0,
        targetDestroyed: false,
        targetId: targetEntity.id,
      };
    }

    // 攻撃コンポーネントを更新（クールダウン開始）
    executeAttack(attackComponent, currentTime, targetEntity.id);

    // 攻撃タイプに応じて処理を分岐
    if (isProjectileAttack(attackComponent)) {
      // 弾丸を使用する攻撃（砲台攻撃・弓矢攻撃）
      const projectileEntity = this.createProjectile(
        attackerEntity,
        targetEntity,
      );
      if (projectileEntity) {
        this.projectiles.set(projectileEntity.id, projectileEntity);
        return {
          success: true,
          damageDealt: 0, // 弾丸攻撃では着弾時にダメージ
          targetDestroyed: false,
          targetId: targetEntity.id,
        };
      }
    } else {
      // 直接攻撃
      const damageDealt = this.calculateAndApplyDamage(
        attackerEntity,
        targetEntity,
        currentTime
      );

      // 攻撃エフェクトを表示
      this.showAttackEffect(attackerEntity, targetEntity, damageDealt);

      // 目標が撃破されたかチェック
      const targetDestroyed = targetHealth.isDead;
      if (targetDestroyed && !targetEntity.components.unit) {
        this.handleTargetDestroyed(targetEntity);
      }

      return {
        success: true,
        damageDealt,
        targetDestroyed,
        targetId: targetEntity.id,
      };
    }

    return {
      success: false,
      damageDealt: 0,
      targetDestroyed: false,
      targetId: targetEntity.id,
    };
  }

  /**
   * ダメージを計算して適用する
   * @param attackerEntity 攻撃者エンティティ
   * @param targetEntity 目標エンティティ
   * @returns 実際に与えたダメージ量
   */
  public calculateAndApplyDamage(
    attackerEntity: Entity<["attack" | "target"]>,
    targetEntity: Entity<["health"]>,
    time: number
  ): number {
    const attackComponent = attackerEntity.components.attack
    const targetHealth = targetEntity.components.health

    if (!attackComponent || !targetHealth) {
      return 0;
    }

    // 基本ダメージを取得
    let damage = attackComponent.damage;

    recordDamageSource(targetHealth, attackerEntity.id, time);

    // 実際に与えるダメージを計算（現在の体力を超えないように）
    const actualDamage = Math.min(damage, targetHealth.currentHealth);

    // ダメージを適用
    this.applyDamage(targetEntity, actualDamage);

    return actualDamage;
  }

  /**
   * ダメージを適用する
   * @param targetEntity 目標エンティティ
   * @param damage ダメージ量
   */
  public applyDamage(targetEntity: Entity<["health"]>, damage: number): void {
    const healthComponent = targetEntity.components.health

    const wasAlive = healthComponent.currentHealth > 0;

    // ダメージを適用
    updateHealthComponent(healthComponent, damage);

    // 敵が撃破された場合の処理
    if (wasAlive && healthComponent.isDead) {
      const enemyComponent = targetEntity.components.enemy;
      const unitComponent = targetEntity.components.unit;
      if (enemyComponent && this.gameStateSystem) {
        // GameStateSystemに敵撃破を通知
        this.gameStateSystem.notifyEnemyDefeated(targetEntity.id, 10);

        // 敵エンティティを削除
        this.scheduleEntityRemoval(targetEntity);
      }
    }

    // ゲートの場合はGameStateSystemに通知
    const structureComponent = targetEntity.components.structure
    if (
      structureComponent &&
      (structureComponent as any).structureType === "gate" &&
      this.gameStateSystem
    ) {
      this.gameStateSystem.notifyStructureDamaged(targetEntity.id, damage);
      // 搭乗者を取得
      if (structureComponent.deployedUnitId) {
        const deployedUnit = this.entityManager.getEntity(structureComponent.deployedUnitId);
        if (deployedUnit) {
          // 搭乗者の搭乗を解除
          deployedUnit.components.unit!.deployedStructureId = undefined;
        }
      }
    }
  }

  /**
   * 目標が攻撃可能かチェック
   * @param targetEntity 目標エンティティ
   * @returns 攻撃可能な場合true
   */
  public canAttackTarget(targetEntity: Entity): boolean {
  const healthComponent = targetEntity.components["health"];

    // 体力がある場合のみ攻撃可能
    return typeof healthComponent?.currentHealth === "number" && healthComponent.currentHealth > 0 && !healthComponent.isDead;
  }

  /**
   * 撃破されたエンティティの処理
   * @param destroyedEntity 撃破されたエンティティ
   */
  public handleTargetDestroyed(destroyedEntity: Entity): void {
    // エンティティを削除
    this.entityManager.destroyEntity(destroyedEntity.id);
  }

  /**
   * 攻撃エフェクトを表示
   * @param attackerEntity 攻撃者エンティティ
   * @param targetEntity 目標エンティティ
   * @param damageDealt 与えたダメージ量
   */
  private showAttackEffect(
    attackerEntity: Entity<["position"]>,
    targetEntity: Entity<["position"]>,
    damageDealt: number,
  ): void {
  const attackerPos = attackerEntity.components["position"];
  const targetPos = targetEntity.components["position"];

    if (!attackerPos || !targetPos) {
      return;
    }

    // 攻撃エフェクトの種類を決定
    const effectType = "melee"; // デフォルト

    // エフェクト設定を取得
    const effectConfig = this.getAttackEffectConfig(effectType, damageDealt);

    // エフェクトを表示
    this.displayAttackEffect(attackerPos, targetPos, effectConfig);
  }

  /**
   * 攻撃エフェクトの種類を決定
   * @param attackerEntity 攻撃者エンティティ
   * @returns エフェクトの種類
   */
  private determineAttackEffectType(attackerEntity: Entity<["unit", "enemy"]>): AttackEffectType {
  const unitComponent = attackerEntity.components["unit"]
  const enemyComponent = attackerEntity.components["enemy"]

    if (unitComponent) {
      switch (unitComponent.unitType) {
        case "soldier":
          return "melee";
        case "archer":
          return "ranged";
        case "mage":
          return "magic";
        default:
          return "melee";
      }
    } else if (enemyComponent) {
      switch (enemyComponent.enemyType) {
        case "basic":
          return "melee";
        case "fast":
          return "melee";
        case "heavy":
          return "explosion";
        default:
          return "melee";
      }
    }

    return "melee";
  }

  /**
   * 攻撃エフェクトの設定を取得
   * @param effectType エフェクトの種類
   * @param damageDealt 与えたダメージ量
   * @returns エフェクト設定
   */
  private getAttackEffectConfig(
    effectType: AttackEffectType,
    _damageDealt: number,
  ): AttackEffectConfig {
    const baseConfig: AttackEffectConfig = {
      type: effectType,
      duration: 300,
      scale: 1.0,
      particles: false,
    };

    switch (effectType) {
      case "melee":
        return {
          ...baseConfig,
          color: 0xffffff,
          duration: 200,
          scale: 0.8,
        };
      case "ranged":
        return {
          ...baseConfig,
          color: 0xffff00,
          duration: 400,
          scale: 0.6,
        };
      case "magic":
        return {
          ...baseConfig,
          color: 0xff00ff,
          duration: 500,
          scale: 1.2,
          particles: true,
        };
      case "explosion":
        return {
          ...baseConfig,
          color: 0xff4400,
          duration: 600,
          scale: 1.5,
          particles: true,
        };
      default:
        return baseConfig;
    }
  }

  /**
   * 攻撃エフェクトを実際に表示
   * @param attackerPos 攻撃者の位置
   * @param targetPos 目標の位置
   * @param config エフェクト設定
   */
  private displayAttackEffect(
    attackerPos: PositionComponent,
    targetPos: PositionComponent,
    config: AttackEffectConfig,
  ): void {
    // 攻撃エフェクトを作成（Phaserシーンが必要）
    this.createAttackLine(attackerPos, targetPos, config);
    this.createImpactEffect(targetPos, config);

    console.log(
      `Attack effect: ${config.type} from (${attackerPos.point.x}, ${attackerPos.point.y}) to (${targetPos.point.x}, ${targetPos.point.y})`,
    );
  }

  /**
   * 攻撃線エフェクトを作成
   * @param attackerPos 攻撃者の位置
   * @param targetPos 目標の位置
   * @param config エフェクト設定
   */
  private createAttackLine(
    attackerPos: PositionComponent,
    targetPos: PositionComponent,
    config: AttackEffectConfig,
  ): void {
    // 攻撃エフェクト情報をイベントとして発行
    // GameSceneで受け取って実際のエフェクトを描画
    const effectData = {
      type: "attack_line",
      from: { x: attackerPos.point.x, y: attackerPos.point.y },
      to: { x: targetPos.point.x, y: targetPos.point.y },
      color: config.color || 0xffffff,
      duration: config.duration,
    };

    // カスタムイベントを発行（GameSceneで受け取る）
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("attackEffect", { detail: effectData }),
      );
    }
  }

  /**
   * 着弾エフェクトを作成
   * @param targetPos 目標の位置
   * @param config エフェクト設定
   */
  private createImpactEffect(
    targetPos: PositionComponent,
    config: AttackEffectConfig,
  ): void {
    const effectData = {
      type: "impact",
      position: { x: targetPos.point.x, y: targetPos.point.y },
      color: config.color || 0xffffff,
      scale: config.scale || 1.0,
      duration: config.duration,
    };

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("attackEffect", { detail: effectData }),
      );
    }
  }


  /**
   * 指定されたエンティティの攻撃を強制停止
   * @param entityId エンティティID
   * @returns 停止に成功した場合true
   */
  public stopAttack(entityId: string): boolean {
    const entity = this.entityManager.getEntity(entityId);
    if (!entity) {
      return false;
    }

  const attackComponent = entity.components["attack"];
    if (!attackComponent) {
      return false;
    }

    // 攻撃目標をクリア
    attackComponent.target = undefined;
    return true;
  }

  /**
   * 弾丸エンティティを作成する（ObjectPool使用版）
   * @param attackerEntity 攻撃者エンティティ
   * @param targetEntity 目標エンティティ
   * @returns 作成された弾丸エンティティ、失敗時はnull
   */
  private createProjectile(
    attackerEntity: Entity,
    targetEntity: Entity,
  ): Entity | null {
  const attackComponent = attackerEntity.components["attack"];
  const attackerPosition = attackerEntity.components["position"];
  const targetPosition = targetEntity.components["position"];

    if (!attackComponent || !attackerPosition || !targetPosition) {
      return null;
    }

    let poolableProjectile: PoolableProjectileComponent;

    if (isArtilleryAttack(attackComponent)) {
      // 砲台攻撃：着弾位置を予測
      const predictedPosition = this.calculateInterceptPosition(
        targetEntity,
        attackComponent.flightTime || 1.0,
      );

      // プールから砲台攻撃用弾丸を取得
      poolableProjectile = acquireArtilleryProjectileFromPool(
        this.projectilePool,
        attackerEntity.id,
        attackComponent.damage,
        attackComponent.projectileSpeed,
        predictedPosition,
        attackComponent.explosionRadius || 50,
        attackComponent.flightTime || 1.0,
      );
    } else if (isHomingAttack(attackComponent)) {
      // 弓矢攻撃：対象を追跡
      // プールから弓矢攻撃用弾丸を取得
      poolableProjectile = acquireHomingProjectileFromPool(
        this.projectilePool,
        attackerEntity.id,
        attackComponent.damage,
        attackComponent.projectileSpeed,
        targetEntity.id,
      );
    } else {
      return null;
    }

    // 弾丸エンティティを作成
    const projectileEntity = this.entityManager.createEntity(
      attackComponent.projectileSprite || "projectile",
      attackerPosition.point.x,
      attackerPosition.point.y,
      0.5, // スケール
    );

    // ProjectileComponentを追加
    this.entityManager.addComponent(
      projectileEntity.id,
      poolableProjectile.component,
    );

    // PositionComponentを追加
    const projectilePosition: PositionComponent = {
      type: "position",
      point: { x: attackerPosition.point.x, y: attackerPosition.point.y },
    };
    this.entityManager.addComponent(projectileEntity.id, projectilePosition);

    // PoolableProjectileComponentとエンティティIDの対応を記録
    this.projectilePoolables.set(projectileEntity.id, poolableProjectile);

    // スプライトをPoolableProjectileComponentに設定
    if (projectileEntity.sprite) {
      poolableProjectile.component.sprite = projectileEntity.sprite;
    }

    console.log(
      `Created projectile ${projectileEntity.id} using ObjectPool (type: ${poolableProjectile.component.attackType})`,
    );

    return projectileEntity;
  }

  /**
   * 砲台攻撃の着弾位置を予測する
   * @param targetEntity 目標エンティティ
   * @param flightTime 飛行時間（秒）
   * @returns 予測着弾位置
   */
  private calculateInterceptPosition(
    targetEntity: Entity,
    flightTime: number,
  ): { x: number; y: number } {
  const targetPosition = targetEntity.components["position"];
  const targetMovement = targetEntity.components["movement"];

    if (!targetPosition) {
      return { x: 0, y: 0 };
    }

    // 目標が移動していない場合は現在位置を返す
    if (!targetMovement || !targetMovement.isMoving) {
      return {
        x: targetPosition.point.x,
        y: targetPosition.point.y,
      };
    }

    // 移動速度と方向から予測位置を計算
    const velocity = this.calculateTargetVelocity(targetMovement);

    return {
      x: targetPosition.point.x + velocity.x * flightTime,
      y: targetPosition.point.y + velocity.y * flightTime,
    };
  }

  /**
   * 目標の移動速度ベクトルを計算する
   * @param movement MovementComponent
   * @returns 速度ベクトル
   */
  private calculateTargetVelocity(movement: MovementComponent): {
    x: number;
    y: number;
  } {
    if (!movement.isMoving) {
      return { x: 0, y: 0 };
    }

    // 8方向の移動方向を速度ベクトルに変換
    // Direction enum: DOWN=0, DOWN_LEFT=1, LEFT=2, UP_LEFT=3, UP=4, UP_RIGHT=5, RIGHT=6, DOWN_RIGHT=7
    const speed = movement.speed;

    switch (movement.currentDirection) {
      case 0: // DOWN
        return { x: 0, y: speed };
      case 1: // DOWN_LEFT
        return { x: -speed * Math.SQRT1_2, y: speed * Math.SQRT1_2 };
      case 2: // LEFT
        return { x: -speed, y: 0 };
      case 3: // UP_LEFT
        return { x: -speed * Math.SQRT1_2, y: -speed * Math.SQRT1_2 };
      case 4: // UP
        return { x: 0, y: -speed };
      case 5: // UP_RIGHT
        return { x: speed * Math.SQRT1_2, y: -speed * Math.SQRT1_2 };
      case 6: // RIGHT
        return { x: speed, y: 0 };
      case 7: // DOWN_RIGHT
        return { x: speed * Math.SQRT1_2, y: speed * Math.SQRT1_2 };
      default:
        return { x: 0, y: 0 };
    }
  }

  /**
   * 弾丸の更新処理
   * @param currentTime 現在時刻（ミリ秒）
   */
  private updateProjectiles(currentTime: number): void {
    const deltaTime = this.calculateDeltaTime(currentTime);
    const projectilesToRemove: string[] = [];

    for (const [projectileId, projectile] of this.projectiles) {
      const projectileComponent = projectile.components.projectile
      const projectilePosition = projectile.components.position

      if (!projectileComponent || !projectilePosition) {
        projectilesToRemove.push(projectileId);
        continue;
      }

      // 攻撃タイプに応じて弾丸を更新
      if (projectileComponent.attackType === "artillery") {
        const shouldRemove = this.handleArtilleryProjectile(
          projectile,
          projectileComponent,
          projectilePosition,
          deltaTime,
        );
        if (shouldRemove) {
          projectilesToRemove.push(projectileId);
        }
      } else if (projectileComponent.attackType === "homing") {
        const shouldRemove = this.handleHomingProjectile(
          projectile,
          projectileComponent,
          projectilePosition,
          deltaTime,
        );
        if (shouldRemove) {
          projectilesToRemove.push(projectileId);
        }
      }
    }

    // 削除対象の弾丸を処理
    for (const projectileId of projectilesToRemove) {
      this.removeProjectile(projectileId);
    }
  }

  /**
   * デルタタイムを計算する
   * @param currentTime 現在時刻（ミリ秒）
   * @returns デルタタイム（秒）
   */
  private calculateDeltaTime(currentTime: number): number {
    if (!this.lastUpdateTime) {
      this.lastUpdateTime = currentTime;
      return 0.016; // 初回は約60FPSのデルタタイムを返す
    }

    const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // 秒に変換
    this.lastUpdateTime = currentTime;
    return Math.min(Math.max(deltaTime, 0.001), 0.1); // 最小0.001秒、最大0.1秒に制限
  }

  /**
   * 砲台弾丸の処理
   * @param projectile 弾丸エンティティ
   * @param projectileComponent 弾丸コンポーネント
   * @param projectilePosition 弾丸位置コンポーネント
   * @param deltaTime デルタタイム（秒）
   * @returns 弾丸を削除すべき場合true
   */
  private handleArtilleryProjectile(
    projectile: Entity,
    projectileComponent: ProjectileComponent,
    projectilePosition: PositionComponent,
    deltaTime: number,
  ): boolean {
    // 初期飛行時間を保存（初回のみ）
    if (!(projectileComponent as any).originalFlightTime) {
      (projectileComponent as any).originalFlightTime =
        projectileComponent.flightTime;
      (projectileComponent as any).startPosition = {
        x: projectilePosition.point.x,
        y: projectilePosition.point.y,
      };

      // 砲台攻撃の弾丸軌道表示を開始（要件5.1対応）
      this.showArtilleryTrajectory(projectile, projectileComponent);
    }

    const originalFlightTime = (projectileComponent as any).originalFlightTime;
    const startPos = (projectileComponent as any).startPosition;

    // 飛行時間を更新
    projectileComponent.flightTime = Math.max(
      0,
      projectileComponent.flightTime - deltaTime,
    );

    // 着弾位置に向けて弾丸を移動（放物線軌道）
    if (projectileComponent.targetPosition && originalFlightTime > 0) {
      const progress = 1 - projectileComponent.flightTime / originalFlightTime;

      // 放物線軌道の計算（高度を考慮）
      const linearX =
        startPos.x +
        (projectileComponent.targetPosition.x - startPos.x) * progress;
      const linearY =
        startPos.y +
        (projectileComponent.targetPosition.y - startPos.y) * progress;

      // 放物線の高度計算（最大高度は距離の20%）
      const distance = Math.sqrt(
        (projectileComponent.targetPosition.x - startPos.x) ** 2 +
          (projectileComponent.targetPosition.y - startPos.y) ** 2,
      );
      const maxHeight = distance * 0.2;
      const height = Math.sin(progress * Math.PI) * maxHeight;

      projectilePosition.point.x = linearX;
      projectilePosition.point.y = linearY - height; // 高度を減算（上方向）

      // スプライトの位置と回転を更新
      if (projectile.sprite) {
        projectile.sprite.setPosition(
          projectilePosition.point.x,
          projectilePosition.point.y,
        );

        // 弾丸の向きを軌道に合わせて回転
        const angle = this.calculateArtilleryRotation(
          progress,
          startPos,
          projectileComponent.targetPosition,
          maxHeight,
        );
        projectile.sprite.setRotation(angle);
      }

      // 軌道エフェクトを更新
      this.updateArtilleryTrajectoryEffect(
        projectile,
        projectileComponent,
        progress,
      );
    }

    // 着弾判定
    if (projectileComponent.flightTime <= 0) {
      this.explodeProjectile(
        projectile,
        projectileComponent,
        projectilePosition,
      );
      return true; // 弾丸を削除
    }

    return false;
  }

  /**
   * 弓矢弾丸の処理
   * @param projectile 弾丸エンティティ
   * @param projectileComponent 弾丸コンポーネント
   * @param projectilePosition 弾丸位置コンポーネント
   * @param deltaTime デルタタイム（秒）
   * @returns 弾丸を削除すべき場合true
   */
  private handleHomingProjectile(
    projectile: Entity,
    projectileComponent: ProjectileComponent,
    projectilePosition: PositionComponent,
    deltaTime: number,
  ): boolean {
    // 追跡対象を取得
    const targetEntity = projectileComponent.targetEntityId
      ? this.entityManager.getEntity(projectileComponent.targetEntityId) as Entity<["position" | "health"]>
      : null;

    if (!targetEntity) return false;

    // 対象が有効でない場合は弾丸を削除（要件2.4対応）
    if (!this.isHomingTargetValid(targetEntity)) {
      const reason = !targetEntity
        ? "Target entity not found"
        : "Target is dead or invalid";
      console.log(
        `Homing projectile ${projectile.id}: ${reason}, removing projectile`,
      );

      // 軌道エフェクトをクリーンアップ
      this.cleanupHomingTrajectoryEffect(projectile);

      return true;
    }

  const targetPosition = targetEntity?.components["position"];
  
    // 対象エンティティの追跡ロジック（要件2.2対応）
    const dx = targetPosition.point.x - projectilePosition.point.x;
    const dy = targetPosition.point.y - projectilePosition.point.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 到達判定（距離が十分近い場合）- 必中処理（要件2.3対応）
    const hitDistance = 8; // より確実な命中判定のため距離を調整
    if (distance <= hitDistance) {
      // 必中ダメージを適用（要件2.3対応）
      console.log(
        `Homing projectile ${projectile.id}: Hit target ${targetEntity.id} for ${projectileComponent.damage} damage`,
      );
      this.applyHomingProjectileHit(targetEntity, projectileComponent);

      // 命中エフェクトを表示
      this.showProjectileHitEffect(projectilePosition, projectileComponent);

      // 軌道エフェクトをクリーンアップ
      this.cleanupHomingTrajectoryEffect(projectile);

      return true; // 弾丸を削除
    }

    // 弾丸を対象に向けて移動（追跡ロジック）
    if (distance > 0) {
      // 追跡速度の調整 - より確実に追跡するため速度を上げる
      const trackingSpeedMultiplier = 1.2; // 追跡時は通常より20%速く
      const adjustedSpeed = projectileComponent.speed * trackingSpeedMultiplier;

      // 予測追跡: 対象の移動を考慮した追跡
      const predictedTarget = this.calculateHomingPredictedPosition(
        targetEntity!,
        deltaTime,
      );
      const predictedDx = predictedTarget.x - projectilePosition.point.x;
      const predictedDy = predictedTarget.y - projectilePosition.point.y;
      const predictedDistance = Math.sqrt(
        predictedDx * predictedDx + predictedDy * predictedDy,
      );

      // 予測位置への移動距離を計算
      const moveDistance = Math.min(
        adjustedSpeed * deltaTime,
        predictedDistance,
      );

      if (predictedDistance > 0) {
        const normalizedDx = predictedDx / predictedDistance;
        const normalizedDy = predictedDy / predictedDistance;

        // 前の位置を記録（軌道エフェクト用）
        const previousPosition = {
          x: projectilePosition.point.x,
          y: projectilePosition.point.y,
        };

        projectilePosition.point.x += normalizedDx * moveDistance;
        projectilePosition.point.y += normalizedDy * moveDistance;

        // スプライトの位置も更新
        if (projectile.sprite) {
          projectile.sprite.setPosition(
            projectilePosition.point.x,
            projectilePosition.point.y,
          );

          // 弾丸の向きを対象に向ける（視覚的改善）
          const angle = Math.atan2(predictedDy, predictedDx);
          projectile.sprite.setRotation(angle);
        }

        // 弓矢攻撃の追跡軌道表示を更新（要件5.3対応）
        this.updateHomingTrajectoryEffect(
          projectile,
          previousPosition,
          projectilePosition.point,
          targetPosition.point,
        );
      }
    }

    return false;
  }

  /**
   * 弓矢弾丸の必中処理
   * @param targetEntity 対象エンティティ
   * @param projectileComponent 弾丸コンポーネント
   */
  private applyHomingProjectileHit(
    targetEntity: Entity<["health"]>,
    projectileComponent: ProjectileComponent,
  ): void {
  const targetHealth = targetEntity.components["health"];

    if (
      !targetHealth ||
      targetHealth.isDead ||
      targetHealth.currentHealth <= 0
    ) {
      console.log(
        `Homing projectile hit: Target ${targetEntity.id} is already dead, no damage applied`,
      );
      return;
    }

    // 必中ダメージを適用（要件2.3: 必ずダメージを与える）
    const damage = projectileComponent.damage;
    console.log(
      `Applying guaranteed hit damage: ${damage} to target ${targetEntity.id}`,
    );

    // ダメージを適用（必中なので修正なし）
    this.applyDamage(targetEntity, damage);

    // 攻撃者の情報をログに記録
    const attackerId = projectileComponent.attackerId;
    console.log(
      `Homing attack from ${attackerId} hit ${targetEntity.id} for ${damage} damage`,
    );
  }

  /**
   * 弓矢弾丸の対象が有効かチェック
   * @param targetEntity 対象エンティティ
   * @returns 対象が有効な場合true
   */
  private isHomingTargetValid(targetEntity: Entity | null): boolean {
    if (!targetEntity) {
      return false;
    }

  const targetPosition = targetEntity.components["position"];
  const targetHealth = targetEntity.components["health"];

    // 位置コンポーネントが存在し、体力コンポーネントが存在し、生きている場合のみ有効
    return !!(
      targetPosition &&
      targetHealth &&
      !targetHealth.isDead &&
      targetHealth.currentHealth > 0
    );
  }

  /**
   * 弓矢弾丸の予測追跡位置を計算
   * @param targetEntity 対象エンティティ
   * @param deltaTime デルタタイム（秒）
   * @returns 予測位置
   */
  private calculateHomingPredictedPosition(
    targetEntity: Entity,
    deltaTime: number,
  ): { x: number; y: number } {
  const targetPosition = targetEntity.components["position"];
  const targetMovement = targetEntity.components["movement"];

    if (!targetPosition) {
      return { x: 0, y: 0 };
    }

    // 対象が移動していない場合は現在位置を返す
    if (!targetMovement || !targetMovement.isMoving) {
      return {
        x: targetPosition.point.x,
        y: targetPosition.point.y,
      };
    }

    // 短期間の予測（弓矢は追跡するので長期予測は不要）
    const predictionTime = deltaTime * 1; // 2フレーム先を予測
    const velocity = this.calculateTargetVelocity(targetMovement);

    return {
      x: targetPosition.point.x + velocity.x * predictionTime,
      y: targetPosition.point.y + velocity.y * predictionTime,
    };
  }

  /**
   * 砲台弾丸の爆発処理
   * @param projectile 弾丸エンティティ
   * @param projectileComponent 弾丸コンポーネント
   * @param projectilePosition 弾丸位置コンポーネント
   */
  private explodeProjectile(
    _projectile: Entity,
    projectileComponent: ProjectileComponent,
    projectilePosition: PositionComponent,
  ): void {
    const explosionCenter = {
      x: projectileComponent.targetPosition?.x || projectilePosition.point.x,
      y: projectileComponent.targetPosition?.y || projectilePosition.point.y,
    };

    const explosionRadius = projectileComponent.explosionRadius || 50;

    // 爆発範囲内の敵を検索（改善版）
    const enemiesInRange = this.findEnemiesInRadius(
      explosionCenter,
      explosionRadius,
    );

    // 範囲内の敵にダメージを適用（改善版）
    this.applyExplosionDamage(
      explosionCenter,
      explosionRadius,
      projectileComponent.damage,
      projectileComponent.attackerId,
    );

    // 砲台攻撃の爆発エフェクトを表示（要件5.2対応）
    this.showExplosionEffect(
      explosionCenter,
      explosionRadius,
      projectileComponent.damage,
    );

    console.log(
      `Artillery explosion at (${explosionCenter.x}, ${explosionCenter.y}) with radius ${explosionRadius}, affected ${enemiesInRange.length} enemies`,
    );
  }

  /**
   * 指定された範囲内の敵エンティティを検索（改善版）
   * @param center 中心座標
   * @param radius 検索半径
   * @returns 範囲内の敵エンティティの配列
   */
  private findEnemiesInRadius(
    center: { x: number; y: number },
    radius: number,
  ): Entity<["position" | "health", "enemy"]>[] {
    // 敵エンティティを取得（position、health、enemyコンポーネントを持つ）
    const enemies = this.entityManager.queryEntities({
      required: ["position", "health", "enemy"],
    });

    const enemiesInRange: Entity<["position" | "health", "enemy"]>[] = [];

    for (const enemy of enemies) {
      const position = enemy.components["position"];
      // 距離を計算
      const distance = this.calculateDistance(center, position.point);

      // 範囲内かチェック
      if (distance <= radius) {
        enemiesInRange.push(enemy);
      }
    }
    return enemiesInRange;
  }

  /**
   * 2点間の距離を計算
   * @param point1 座標1
   * @param point2 座標2
   * @returns 距離
   */
  private calculateDistance(
    point1: { x: number; y: number },
    point2: { x: number; y: number },
  ): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 爆発による範囲ダメージを適用（改善版）
   * @param center 爆発中心座標
   * @param radius 爆発半径
   * @param baseDamage 基本ダメージ
   * @param attackerId 攻撃者のID
   */
  private applyExplosionDamage(
    center: { x: number; y: number },
    radius: number,
    baseDamage: number,
    _attackerId: string,
  ): void {
    // 範囲内の敵を検索
    const enemiesInRange = this.findEnemiesInRadius(center, radius);

    if (enemiesInRange.length === 0) {
      console.log(
        `No enemies found in explosion radius ${radius} at (${center.x}, ${center.y})`,
      );
      return;
    }

    console.log(`Found ${enemiesInRange.length} enemies in explosion range`);

    // 各敵にダメージを適用
    for (const enemy of enemiesInRange) {
  const enemyPosition = enemy.components["position"];
      if (!enemyPosition) continue;

      // 距離に応じたダメージ減衰を計算
      const distance = this.calculateDistance(center, enemyPosition.point);
      const finalDamage = this.calculateExplosionDamage(
        baseDamage,
        distance,
        radius,
      );

      // ダメージを適用
      this.applyDamage(enemy, finalDamage);

      console.log(
        `Applied ${finalDamage} explosion damage to enemy ${enemy.id} at distance ${distance.toFixed(1)}`,
      );
    }
  }

  /**
   * 距離に応じた爆発ダメージを計算
   * @param baseDamage 基本ダメージ
   * @param distance 爆発中心からの距離
   * @param radius 爆発半径
   * @returns 最終ダメージ
   */
  private calculateExplosionDamage(
    baseDamage: number,
    distance: number,
    radius: number,
  ): number {
    // 距離が0の場合は最大ダメージ
    if (distance <= 0) {
      return baseDamage;
    }

    // 距離が半径を超える場合はダメージなし
    if (distance >= radius) {
      return 0;
    }

    // 線形減衰：中心で100%、端で30%のダメージ
    const damageRatio = Math.max(0.3, 1.0 - distance / radius);
    const finalDamage = Math.floor(baseDamage * damageRatio);

    // 最小ダメージは1
    return Math.max(1, finalDamage);
  }

  /**
   * 弾丸を削除する（ObjectPool返却版）
   * @param projectileId 弾丸ID
   */
  private removeProjectile(projectileId: string): void {
    const projectile = this.projectiles.get(projectileId);
    const poolableProjectile = this.projectilePoolables.get(projectileId);

    if (projectile && poolableProjectile) {
      console.log(
        `Removing projectile ${projectileId} and returning to ObjectPool`,
      );

      // PoolableProjectileComponentをプールに返却
      releaseProjectileToPool(this.projectilePool, poolableProjectile);

      // 対応関係を削除
      this.projectilePoolables.delete(projectileId);

      // エンティティを削除（スプライトはPoolableProjectileComponentのreset()で処理される）
      this.entityManager.destroyEntity(projectileId);

      // 弾丸マップから削除
      this.projectiles.delete(projectileId);
    } else if (projectile) {
      // フォールバック：プールを使用していない古い弾丸の場合
      console.warn(
        `Projectile ${projectileId} not found in pool, using fallback removal`,
      );

      if (projectile.sprite) {
        projectile.sprite.destroy();
      }

      this.entityManager.destroyEntity(projectileId);
      this.projectiles.delete(projectileId);
    }
  }

  /**
   * デバッグ用：攻撃システムの状態情報を取得
   */
  public getAttackDebugInfo(): {
    attackers: Array<{
      attackerId: string;
      targetId?: string;
      canAttackNow: boolean;
      lastAttackTime: number;
      cooldownRemaining: number;
    }>;
    projectiles: Array<{
      projectileId: string;
      attackerId: string;
      attackType: string;
      targetId?: string;
      flightTime?: number;
    }>;
  } {
    const attackers = this.entityManager.queryEntities({
      required: ["position", "attack", "target"],
    });

    const currentTime = Date.now();

    const attackerInfo = attackers.map((attacker) => {
      const attackComponent = attacker.components["attack"];
      const targetComponent = attacker.components["target"];

      const cooldownRemaining = Math.max(
        0,
        attackComponent.lastAttackTime +
          attackComponent.cooldown * 1000 -
          currentTime,
      );

      return {
        attackerId: attacker.id,
        targetId: targetComponent.targetEntityId,
        canAttackNow: attackComponent && canAttack(attackComponent, currentTime),
        lastAttackTime: attackComponent.lastAttackTime,
        cooldownRemaining,
      };
    });

    const projectileInfo = Array.from(this.projectiles.values()).map(
      (projectile) => {
        const projectileComponent = projectile.components["projectile"];

        return {
          projectileId: projectile.id,
          attackerId: projectileComponent?.attackerId || "unknown",
          attackType: projectileComponent?.attackType || "unknown",
          targetId: projectileComponent?.targetEntityId || undefined,
          flightTime: projectileComponent?.flightTime || undefined,
        };
      },
    );

    return {
      attackers: attackerInfo,
      projectiles: projectileInfo,
    };
  }

  /**
   * 現在飛行中の弾丸エンティティを取得
   * @returns 弾丸エンティティの配列
   */
  public getProjectiles(): Entity[] {
    return Array.from(this.projectiles.values());
  }

  /**
   * 指定された攻撃者の弾丸を取得
   * @param attackerId 攻撃者のID
   * @returns 攻撃者の弾丸エンティティの配列
   */
  public getProjectilesByAttacker(attackerId: string): Entity[] {
    return Array.from(this.projectiles.values()).filter((projectile) => {
  const projectileComponent = projectile.components["projectile"];
      return projectileComponent?.attackerId === attackerId;
    });
  }

  /**
   * ProjectilePoolの統計情報を取得
   * @returns プールの統計情報
   */
  public getProjectilePoolStats(): {
    poolSize: number;
    maxSize: number;
    inUseCount: number;
    availableCount: number;
    totalCreated: number;
    totalReused: number;
    reuseRatio: number;
  } {
  return this.projectilePool.getStats();
  }

  /**
   * ProjectilePoolをクリアする（デバッグ用）
   */
  public clearProjectilePool(): void {
    // 現在使用中の弾丸をすべて削除
    const projectileIds = Array.from(this.projectiles.keys());
    for (const projectileId of projectileIds) {
      this.removeProjectile(projectileId);
    }

    // プールをクリア
    this.projectilePool.clear();
    this.projectilePoolables.clear();

    console.log("ProjectilePool cleared");
  }

  /**
   * ProjectilePoolのサイズを変更する
   * @param newMaxSize 新しい最大サイズ
   */
  public resizeProjectilePool(newMaxSize: number): void {
    this.projectilePool.resize(newMaxSize);
    console.log(`ProjectilePool resized to ${newMaxSize}`);
  }

  /**
   * 砲台攻撃の弾丸軌道表示を開始（要件5.1対応）
   * @param projectile 弾丸エンティティ
   * @param projectileComponent 弾丸コンポーネント
   */
  private showArtilleryTrajectory(
    projectile: Entity,
    projectileComponent: ProjectileComponent,
  ): void {
    if (!projectileComponent.targetPosition) return;

    const effectData = {
      type: "artillery_trajectory",
      projectileId: projectile.id,
      startPosition: {
        x: projectile.sprite?.x || 0,
        y: projectile.sprite?.y || 0,
      },
      targetPosition: projectileComponent.targetPosition,
      flightTime: projectileComponent.flightTime,
      color: 0xff8800, // オレンジ色の軌道
      alpha: 0.6,
    };

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("projectileEffect", { detail: effectData }),
      );
    }
  }

  /**
   * 砲台攻撃の軌道エフェクトを更新
   * @param projectile 弾丸エンティティ
   * @param projectileComponent 弾丸コンポーネント
   * @param progress 飛行進捗（0-1）
   */
  private updateArtilleryTrajectoryEffect(
    projectile: Entity,
    _projectileComponent: ProjectileComponent,
    progress: number,
  ): void {
    const effectData = {
      type: "artillery_trajectory_update",
      projectileId: projectile.id,
      progress: progress,
      currentPosition: {
        x: projectile.sprite?.x || 0,
        y: projectile.sprite?.y || 0,
      },
    };

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("projectileEffect", { detail: effectData }),
      );
    }
  }

  /**
   * 砲台弾丸の回転角度を計算
   * @param progress 飛行進捗（0-1）
   * @param startPos 開始位置
   * @param targetPos 目標位置
   * @param maxHeight 最大高度
   * @returns 回転角度（ラジアン）
   */
  private calculateArtilleryRotation(
    progress: number,
    startPos: { x: number; y: number },
    targetPos: { x: number; y: number },
    maxHeight: number,
  ): number {
    // 軌道の接線ベクトルを計算
    const dx = targetPos.x - startPos.x;
    const dy = targetPos.y - startPos.y;

    // 放物線の微分（接線の傾き）
    const heightDerivative = Math.cos(progress * Math.PI) * Math.PI * maxHeight;
    const tangentY = dy - heightDerivative;

    return Math.atan2(tangentY, dx);
  }

  /**
   * 弓矢攻撃の追跡軌道表示を更新（要件5.3対応）
   * @param projectile 弾丸エンティティ
   * @param previousPos 前の位置
   * @param currentPos 現在の位置
   * @param targetPos 目標位置
   */
  private updateHomingTrajectoryEffect(
    projectile: Entity,
    previousPos: { x: number; y: number },
    currentPos: { x: number; y: number },
    targetPos: { x: number; y: number },
  ): void {
    const effectData = {
      type: "homing_trajectory",
      projectileId: projectile.id,
      previousPosition: previousPos,
      currentPosition: currentPos,
      targetPosition: targetPos,
      color: 0x00ff88, // 緑色の軌道
      alpha: 0.8,
      trailLength: 5, // 軌跡の長さ（フレーム数）
    };

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("projectileEffect", { detail: effectData }),
      );
    }
  }

  /**
   * 弓矢攻撃の軌道エフェクトをクリーンアップ
   * @param projectile 弾丸エンティティ
   */
  private cleanupHomingTrajectoryEffect(projectile: Entity): void {
    const effectData = {
      type: "homing_trajectory_cleanup",
      projectileId: projectile.id,
    };

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("projectileEffect", { detail: effectData }),
      );
    }
  }

  /**
   * 砲台攻撃の爆発エフェクトを表示（要件5.2対応）
   * @param position 爆発位置
   * @param explosionRadius 爆発範囲
   * @param damage ダメージ量
   */
  private showExplosionEffect(
    position: { x: number; y: number },
    explosionRadius: number,
    damage: number,
  ): void {
    const effectData = {
      type: "explosion",
      position: position,
      radius: explosionRadius,
      damage: damage,
      color: 0xff4400, // 赤オレンジ色の爆発
      duration: 800, // 0.8秒間の爆発エフェクト
      particles: true,
      shockwave: true,
      scale: Math.min(2.0, 0.5 + explosionRadius / 100), // 範囲に応じてスケール調整
    };

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("projectileEffect", { detail: effectData }),
      );
    }
  }

  /**
   * 弾丸命中エフェクトを表示（要件5.4対応）
   * @param position 命中位置
   * @param projectileComponent 弾丸コンポーネント
   */
  private showProjectileHitEffect(
    position: PositionComponent,
    projectileComponent: ProjectileComponent,
  ): void {
    const effectData = {
      type: "projectile_hit",
      position: { x: position.point.x, y: position.point.y },
      attackType: projectileComponent.attackType,
      damage: projectileComponent.damage,
      color: projectileComponent.attackType === "homing" ? 0x00ff88 : 0xff8800,
      duration: 400,
      particles: true,
      scale: 0.8,
    };

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("projectileEffect", { detail: effectData }),
      );
    }
  }

  /**
   * エンティティの削除をスケジュールする
   * @param entity 削除するエンティティ
   */
  private scheduleEntityRemoval(entity: Entity): void {
    this.entitiesToRemove.add(entity.id);
    console.log("🔥 Entity scheduled for removal:", entity.id);
    // スプライトを非表示にする
    if (entity.sprite) {
      entity.sprite.setVisible(false);
    }
  }

  /**
   * 死亡したエンティティをクリーンアップする
   */
  private cleanupDeadEntities(): void {
    for (const entityId of this.entitiesToRemove) {
      const entity = this.entityManager.getEntity(entityId);
      if (entity) {
        // スプライトを削除
        if (entity.sprite?.active) {
          entity.sprite.destroy();
        }

        // エンティティを削除
        this.entityManager.destroyEntity(entityId);
        console.log(`AttackSystem: Removed dead entity ${entityId}`);
      }
    }

    // 削除リストをクリア
    this.entitiesToRemove.clear();
  }
}
