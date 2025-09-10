import { AttackTargetOrder } from "@kiro-rts/vibe-strategy";
import { ComponentMap } from "../components";
import {
  type AttackComponent,
  calculateDistance,
} from "../components/attack-component";
import {
  type EnemyComponent,
  getStructureTargetPriority,
  StructureTargetPriority,
} from "../components/enemy-component";
import type { HealthComponent } from "../components/health-component";
import type {
  Point,
  PositionComponent,
} from "../components/position-component";
import {
  canDeployUnit,
  getStructurePriority,
  isDefenseStructure,
  isGateStructure,
  type StructureComponent,
} from "../components/structure-component";
import {
  clearTarget,
  setEntityTarget,
  setPriorityAttackTarget,
  type TargetComponent,
} from "../components/target-component";
import type { Entity } from "../entities/entity";
import type { createEntityManager } from "../entities/entity-manager";
import { MovementSystem } from "./movement-system";

const WEIGHT_OF_ENEMY_TYPE_ORDER = 100
type EntityManager = ReturnType<typeof createEntityManager>;

export class TargetingSystem {
  private entityManager: EntityManager;
  private movementSystem: MovementSystem;

  constructor(entityManager: EntityManager, movementSystem: MovementSystem) {
    this.entityManager = entityManager;
    this.movementSystem = movementSystem;
  }

  /**
   * システムの更新処理
   * 攻撃可能なエンティティの目標選択を行う
   */
  public update(orders: AttackTargetOrder[]): void {
    // 攻撃可能なエンティティ（AttackComponentとTargetComponentを持つ）を取得
    const attackers = this.entityManager.queryEntities({
      required: ["target", "attack"],
    });

    const attackerIdTargetMap: Record<string, string> = orders.reduce((map, order) => {
      map[order.entityId] = order.targetEnemyTypeId;
      return map;
    }, {} as Record<string, string>);

    for (const attacker of attackers) {
      // orderがあればデバッグ用の🔥を出力
      if (attackerIdTargetMap[attacker.id]) {
        console.log(`🔥 Attacker: ${attacker.id}, Target: ${attackerIdTargetMap[attacker.id]}`);
      }
      this.updateEntityTarget(attacker, attackerIdTargetMap[attacker.id]);
    }
  }

  /**
   * 指定されたエンティティの攻撃範囲内にある敵を検索
   * @param attackerEntity 攻撃者エンティティ
   * @returns 攻撃範囲内の敵エンティティ配列
   */
  public findEnemiesInRange(attackerEntity: Entity, range: number): Entity[] {
  const attackerPos = attackerEntity.components["position"] as PositionComponent;
  const attackComponent = attackerEntity.components["attack"] as AttackComponent;

    if (!attackerPos || !attackComponent) {
      return [];
    }

    // 全エンティティから攻撃対象を検索
    const allEntities = this.entityManager.getAllEntities();
    const enemiesInRange: Entity[] = [];

    for (const entity of allEntities) {
      // 攻撃可能な目標かチェック
      if (!this.canAttackTarget(attackerEntity, entity)) {
        continue;
      }

  const targetPos = entity.components["position"] as PositionComponent;
      if (!targetPos) continue;

      // 攻撃範囲内かチェック
      const distance = calculateDistance(attackerPos.point, targetPos.point);
      if (distance <= range) {
        enemiesInRange.push(entity);
      }
    }

    return enemiesInRange;
  }

  /**
   * 距離に基づいて最適な攻撃目標を選択
   * @param attackerEntity 攻撃者エンティティ
   * @param candidates 候補エンティティ配列
   * @returns 最適な攻撃目標エンティティ（見つからない場合はnull）
   */
  public selectBestTarget(
    attackerEntity: Entity,
    candidates: Entity[],
  ): Entity | null {
    if (candidates.length === 0) {
      return null;
    }

  const attackerPos = attackerEntity.components["position"];
  const targetComponent = attackerEntity.components["target"];
  if (!attackerPos) {
    return null;
  }
    let bestTarget: Entity | null = null;
    let bestDistance = Infinity;

    for (const candidate of candidates) {
      const candidatePos = candidate.components["position"]
      if (!candidatePos) continue;

      
      // Prioritize candidates matching the desired enemyType if specified
      const desiredEnemyType = targetComponent?.enemyTypeByOrder;
      const candidateEnemyType = candidate.components["enemy"]?.enemyType;
      const isTypeMatch = desiredEnemyType && candidateEnemyType === desiredEnemyType;
      
      const distance = calculateDistance(attackerPos.point, candidatePos.point);
      const weightedDistance = distance / (isTypeMatch ? WEIGHT_OF_ENEMY_TYPE_ORDER : 1); // 基本距離スコア

      // If type matches, prefer this candidate even if distance is slightly worse
      if (
        weightedDistance < bestDistance
      ) {
        bestDistance = weightedDistance;
        bestTarget = candidate;
      }
    }

    return bestTarget;
  }

  /**
   * 距離に基づくスコアを計算
   * @param distance 距離
   * @returns 距離スコア（近いほど高い）
   */
  private calculateDistanceScore(distance: number): number {
    if (distance <= 0) return 100;

    // 距離が近いほど高スコア（最大100点）
    const maxDistance = 300; // 最大考慮距離
    const normalizedDistance = Math.min(distance, maxDistance) / maxDistance;
    return (1 - normalizedDistance) * 100;
  }

  /**
   * 体力に基づくスコアを計算
   * @param healthComponent 体力コンポーネント
   * @returns 体力スコア（体力が少ないほど高い）
   */
  private calculateHealthScore(healthComponent: HealthComponent): number {
    if (healthComponent.maxHealth <= 0) return 0;

    // 体力が少ないほど高スコア（最大100点）
    const healthRatio =
      healthComponent.currentHealth / healthComponent.maxHealth;
    return (1 - healthRatio) * 100;
  }

  /**
   * エンティティの種類に基づくスコアを計算
   * @param targetEntity 目標エンティティ
   * @returns 種類スコア
   */
  private calculateTypeScore(targetEntity: Entity): number {
  const enemyComponent = targetEntity.components["enemy"] as EnemyComponent;
  const structureComponent = targetEntity.components["structure"] as StructureComponent;

    // 構造物は高優先度
    if (structureComponent) {
      // 構造物の基本優先度を使用
      const basePriority = getStructurePriority(structureComponent);

      // 重要な構造物（勝利条件に関わる）はさらに高優先度
      if (structureComponent.isCriticalForLose) {
        return Math.min(basePriority + 20, 100);
      }

      return basePriority;
    }

    // 敵の種類による優先度
    if (enemyComponent) {
      switch (enemyComponent.enemyType) {
        case "fast":
          return 80; // 高速敵は高優先度
        case "heavy":
          return 40; // 重装敵は低優先度
        default:
          return 60; // 基本敵は中優先度
      }
    }

    return 50; // デフォルト
  }

  /**
   * 脅威度に基づくスコアを計算
   * @param targetEntity 目標エンティティ
   * @param attackerEntity 攻撃者エンティティ
   * @returns 脅威度スコア
   */
  private calculateThreatScore(
    targetEntity: Entity,
    attackerEntity: Entity,
  ): number {
  const targetAttack = targetEntity.components["attack"] as AttackComponent;
  const attackerHealth = attackerEntity.components["health"] as HealthComponent;

    if (!targetAttack || !attackerHealth) {
      return 0;
    }

    // 攻撃力が高い敵ほど脅威度が高い
    const damageRatio =
      targetAttack.damage / Math.max(attackerHealth.currentHealth, 1);
    return Math.min(damageRatio * 100, 100);
  }

  /**
   * エンティティが敵かどうかを判定
   * @param entity 判定対象エンティティ
   * @returns 敵の場合true
   */
  public isEnemyEntity<T extends (keyof ComponentMap)[]>(entity: Entity<T>): entity is Entity<(T[number] | "enemy")[]> {
    return "enemy" in entity.components;
  }

  public isMovementEntity<T extends (keyof ComponentMap)[]>(entity: Entity<T>): entity is Entity<(T[number] | "movement")[]> {
    return "movement" in entity.components;
  }

  /**
   * エンティティが味方かどうかを判定
   * @param entity 判定対象エンティティ
   * @returns 味方の場合true
   */
  public isFriendlyEntity(entity: Entity): boolean {
  return "unit" in entity.components || "structure" in entity.components;
  }

  /**
   * 2つのエンティティが敵対関係にあるかを判定
   * @param entity1 エンティティ1
   * @param entity2 エンティティ2
   * @returns 敵対関係にある場合true
   */
  public areEntitiesHostile(entity1: Entity, entity2: Entity): boolean {
    const isEntity1Enemy = this.isEnemyEntity(entity1);
    const isEntity1Friendly = this.isFriendlyEntity(entity1);
    const isEntity2Enemy = this.isEnemyEntity(entity2);
    const isEntity2Friendly = this.isFriendlyEntity(entity2);

    // 敵と味方は敵対関係
    if (
      (isEntity1Enemy && isEntity2Friendly) ||
      (isEntity1Friendly && isEntity2Enemy)
    ) {
      return true;
    }

    return false;
  }

  /**
   * エンティティが攻撃可能な目標かを判定
   * @param attackerEntity 攻撃者エンティティ
   * @param targetEntity 目標エンティティ
   * @returns 攻撃可能な場合true
   */
  public canAttackTarget(
    attackerEntity: Entity,
    targetEntity: Entity,
  ): boolean {
    // 自分自身は攻撃できない
    if (attackerEntity.id === targetEntity.id) {
      return false;
    }

    // 目標が有効でない場合は攻撃できない
    if (!this.isValidTarget(targetEntity)) {
      return false;
    }

    // 敵対関係にない場合は攻撃できない
    if (!this.areEntitiesHostile(attackerEntity, targetEntity)) {
      return false;
    }

    return true;
  }

  /**
   * 目標の有効性をチェック
   * @param targetEntity 目標エンティティ
   * @returns 有効な目標の場合true
   */
  public isValidTarget(targetEntity: Entity): boolean {
    // 搭乗可能なStructureの場合
  const structureComponent = targetEntity.components["structure"] as StructureComponent;
    if (structureComponent && canDeployUnit(structureComponent)) {
      return true;
    }

  const healthComponent = targetEntity.components["health"] as HealthComponent;
  const positionComponent = targetEntity.components["position"] as PositionComponent;

    // 体力があり、位置情報がある場合のみ有効
    return (
      healthComponent?.currentHealth > 0 && positionComponent !== undefined
    );
  }

  /**
   * 指定されたエンティティの目標を更新
   * @param attackerEntity 攻撃者エンティティ
   */
  private updateEntityTarget(attackerEntity: Entity<["attack" | "target"]>, targetEnemyTypeByOrder: string | undefined): void {
    const targetComponent = attackerEntity.components.target

    if (this.isEnemyEntity(attackerEntity) && this.isMovementEntity(attackerEntity)) {
      this.updateEnemyTarget(attackerEntity, targetComponent);
      return;
    } else {
      // 命令発行時に強制的に目標更新
      const shouldUpdateForce = attackerEntity.components.target.enemyTypeByOrder !== targetEnemyTypeByOrder;
      if(shouldUpdateForce){
        setPriorityAttackTarget(targetComponent, targetEnemyTypeByOrder);
      }
      this.updateFriendlyTarget(attackerEntity, targetComponent, shouldUpdateForce);
    }
  }

  /**
   * 敵エンティティの目標を更新（構造物優先度に基づく）
   * @param enemyEntity 敵エンティティ
   * @param targetComponent 目標コンポーネント
   */
  private updateEnemyTarget(
    enemyEntity: Entity<["enemy" | "movement" | "target"]>,
    targetComponent: TargetComponent,
  ): void {
    // 現在の目標が有効かチェック
    if (targetComponent.targetEntityId) {
      const currentTarget = this.entityManager.getEntity(
        targetComponent.targetEntityId,
      );
      if (!currentTarget || !this.isValidTarget(currentTarget)) {
        // 現在の目標が無効になった場合はクリア
        clearTarget(targetComponent);
      }
    }

    // 目標がない場合は新しい目標を探す
    if (!targetComponent.targetEntityId) {
      const enemyComponent = enemyEntity.components["enemy"]

      // 敵の構造物優先度に基づいて目標を選択
      const priority = getStructureTargetPriority(enemyComponent);

      // すべてのstructureを取得
      const allStructures = this.entityManager.queryEntities({
        required: ["structure", "position", "health"],
      });
      const allAllyUnits = this.entityManager.queryEntities({
        required: ["unit", "position", "health"],
      });
      const target = this.selectBestEnemyTargetByPriority(
        enemyEntity,
        allStructures,
        allAllyUnits,
        priority,
      );

      if (target) {
        // target変更
        setEntityTarget(targetComponent, target.id);
        // 移動目標も更新
        this.movementSystem.moveEntityTo(
          enemyEntity.id,
          (target.components["position"] as PositionComponent).point
        );
      }
    } else {
      //  目標が移動している場合、目標位置を更新
      const currentTarget = this.entityManager.getEntity(
        targetComponent.targetEntityId,
      );
      if (currentTarget && "movement" in currentTarget.components) {
        const targetPos = currentTarget.components["position"]
        if (targetPos) {
          // 移動目標を更新
          this.movementSystem.moveEntityTo(enemyEntity.id, targetPos.point);
          enemyEntity.components.movement.pathIndex = 1;
        }
      }
    }
  }

  /**
   * 最も近い味方目標を検索
   * @param enemyEntity 敵エンティティ
   * @returns 最も近い味方エンティティ（見つからない場合はnull）
   */
  private findNearestFriendlyTarget(enemyEntity: Entity): Entity | null {
  const enemyPos = enemyEntity.components["position"] as PositionComponent;
    if (!enemyPos) return null;

    const allEntities = this.entityManager.getAllEntities();
    let nearestTarget: Entity | null = null;
    let nearestDistance = Infinity;

    for (const entity of allEntities) {
      if (!this.isFriendlyEntity(entity) || !this.isValidTarget(entity)) {
        continue;
      }

  const targetPos = entity.components["position"] as PositionComponent;
      if (!targetPos) continue;

      const distance = calculateDistance(enemyPos.point, targetPos.point);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestTarget = entity;
      }
    }

    return nearestTarget;
  }

  /**
   * 味方エンティティの目標を更新
   * @param friendlyEntity 味方エンティティ
   * @param targetComponent 目標コンポーネント
   */
  private updateFriendlyTarget(
    friendlyEntity: Entity,
    targetComponent: TargetComponent,
    forceUpdateTarget: boolean = false
  ): void {
    // 現在の目標が有効かチェック
    let currentTarget: Entity | null = null;
    let currentTargetScore = -1;

    currentTarget =
      (targetComponent.targetEntityId ? (this.entityManager.getEntity(targetComponent.targetEntityId) || null) : null);

      // 敵が移動しているなら追尾する
    if (currentTarget && "movement" in currentTarget.components) {
      const targetPos = currentTarget.components["position"]
      if (targetPos) {
        // 移動目標を更新
        this.movementSystem.moveEntityTo(friendlyEntity.id, targetPos.point);
        if (friendlyEntity.components.movement) {
          friendlyEntity.components.movement.pathIndex = 1;
        }
      }
    }
    // 現在の敵が有効なら敵を判定する必要はない
    if (!forceUpdateTarget && currentTarget && this.isValidTarget(currentTarget)) {
      return;
    }

    const range = forceUpdateTarget ? Infinity : (friendlyEntity.components["attack"]?.range || 0);
    // 敵のアップデートが必要
    // 攻撃範囲内の敵を検索
    const enemiesInRange = this.findEnemiesInRange(friendlyEntity, range);

    // 新しい最適な目標を選択
    const bestTarget = this.selectBestTarget(friendlyEntity, enemiesInRange);
    if (bestTarget) {
      setEntityTarget(targetComponent, bestTarget.id);
      this.movementSystem.moveEntityTo(
        friendlyEntity.id,
        (bestTarget.components["position"] as PositionComponent).point
      );
    } 
  }

  /**
   * 構造物優先度に基づいて最適な目標を選択
   * @param attackerEntity 攻撃者エンティティ
   * @param candidates 候補エンティティ配列
   * @param priority 構造物優先度
   * @returns 最適な攻撃目標エンティティ（見つからない場合はnull）
   */
  private selectBestEnemyTargetByPriority(
    attackerEntity: Entity,
    structures: Entity<["structure"]>[],
    allyUnits: Entity<["unit"]>[],
    priority: StructureTargetPriority,
  ): Entity | null {
    // 優先度に基づいて候補をフィルタリング
    if (structures.length === 0 && allyUnits.length === 0) return null;

    // 優先度に基づいて候補をフィルタリング
    const candidates = priority === "any" ? [
      ...structures,
      ...allyUnits
    ] : priority === "defense" ? [
      ...structures.filter(s => isDefenseStructure(s.components["structure"] as StructureComponent)),
      ...allyUnits
    ] : priority === "gate" ? [
      ...structures.filter(s => isGateStructure(s.components["structure"] as StructureComponent))
    ] : [];

    if (candidates.length > 0) {
      // 優先度の高い候補から最適な目標を選択
      return this.selectBestTarget(attackerEntity, candidates);
    }

    // 優先度の高い候補がない場合は、通常の選択を行う
    return this.selectBestTarget(attackerEntity, [
      ...structures,
      ...allyUnits
    ]);
  }

  /**
   * 構造物優先度に基づいて候補をフィルタリング
   * @param candidates 候補エンティティ配列
   * @param priority 構造物優先度
   * @returns フィルタリングされた候補配列
   */
  private filterCandidatesByPriority(
    candidates: Entity[],
    priority: string,
  ): Entity[] {
    const filtered: Entity[] = [];

    for (const candidate of candidates) {
      const structureComponent = candidate.components["structure"] as StructureComponent;

      if (structureComponent) {
        // 構造物の場合は優先度に基づいてフィルタリング
        if (this.matchesStructurePriority(structureComponent, priority)) {
          filtered.push(candidate);
        }
      } else if (priority === "any") {
        // "any"の場合はユニットも含める
        filtered.push(candidate);
      }
    }

    return filtered;
  }

  /**
   * 構造物が指定された優先度にマッチするかチェック
   * @param structure 構造物コンポーネント
   * @param priority 優先度
   * @returns マッチする場合true
   */
  private matchesStructurePriority(
    structure: StructureComponent,
    priority: string,
  ): boolean {
    switch (priority) {
      case "gate":
        return isGateStructure(structure);
      case "defense":
        return isDefenseStructure(structure);
      case "any":
        return true;
      default:
        return false;
    }
  }

  /**
   * 構造物優先度に基づいて最も近い目標を検索
   * @param enemyEntity 敵エンティティ
   * @param priority 構造物優先度
   * @returns 最も近い目標エンティティ（見つからない場合はnull）
   */
  private findNearestTargetByPriority(
    enemyEntity: Entity,
    priority: string,
  ): Entity | null {
  const enemyPos = enemyEntity.components["position"] as PositionComponent;
    if (!enemyPos) return null;

    const allEntities = this.entityManager.getAllEntities();
    let nearestTarget: Entity | null = null;
    let nearestDistance = Infinity;

    // まず優先度の高い構造物を探す
    for (const entity of allEntities) {
      if (!this.isFriendlyEntity(entity) || !this.isValidTarget(entity)) {
        continue;
      }

  const structureComponent = entity.components["structure"] as StructureComponent;

      // 構造物の場合は優先度をチェック
      if (
        structureComponent &&
        !this.matchesStructurePriority(structureComponent, priority)
      ) {
        continue;
      }

      // ユニットの場合は"any"優先度の時のみ対象
      if (!structureComponent && priority !== "any") {
        continue;
      }

  const targetPos = entity.components["position"] as PositionComponent;
      if (!targetPos) continue;

      const distance = calculateDistance(enemyPos.point, targetPos.point);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestTarget = entity;
      }
    }

    // 優先度の高い目標が見つからない場合は、任意の味方目標を探す
    if (!nearestTarget && priority !== "any") {
      return this.findNearestFriendlyTarget(enemyEntity);
    }

    return nearestTarget;
  }

  /**
   * 敵の攻撃範囲内にある味方目標を検索
   * @param enemyEntity 敵エンティティ
   * @returns 攻撃範囲内の味方エンティティ配列
   */
  private findFriendlyTargetsInRange(enemyEntity: Entity): Entity[] {
  const enemyPos = enemyEntity.components["position"] as PositionComponent;
  const attackComponent = enemyEntity.components["attack"] as AttackComponent;

    if (!enemyPos || !attackComponent) {
      return [];
    }

    const allEntities = this.entityManager.getAllEntities();
    const targetsInRange: Entity[] = [];

    for (const entity of allEntities) {
      // 味方エンティティかチェック
      if (!this.isFriendlyEntity(entity)) {
        continue;
      }

      // 攻撃可能な目標かチェック
      if (!this.isValidTarget(entity)) {
        continue;
      }

  const targetPos = entity.components["position"] as PositionComponent;
      if (!targetPos) continue;

      // 攻撃範囲内かチェック
      const distance = calculateDistance(enemyPos.point, targetPos.point);
      if (distance <= attackComponent.range) {
        targetsInRange.push(entity);
      }
    }

    return targetsInRange;
  }

  /**
   * 目標を変更すべきかどうかを判定
   * @param currentTarget 現在の目標
   * @param currentScore 現在の目標のスコア
   * @param newTarget 新しい候補目標
   * @param newScore 新しい候補目標のスコア
   * @returns 目標を変更すべき場合true
   */
  private shouldChangeTarget(
    currentTarget: Entity | null,
    currentScore: number,
    newTarget: Entity | null,
    newScore: number,
  ): boolean {
    // 現在の目標がない場合は新しい目標に変更
    if (!currentTarget) {
      return newTarget !== null;
    }

    // 新しい候補がない場合は現在の目標を維持
    if (!newTarget) {
      return false;
    }

    // 同じ目標の場合は変更しない
    if (currentTarget.id === newTarget.id) {
      return false;
    }

    // スコア差による目標変更判定
    const SCORE_THRESHOLD = 20; // 目標変更に必要な最小スコア差
    return newScore > currentScore + SCORE_THRESHOLD;
  }

  /**
   * 強制的に目標を設定（手動制御用）
   * @param attackerEntityId 攻撃者エンティティID
   * @param targetEntityId 目標エンティティID
   * @returns 設定に成功した場合true
   */
  public forceSetTarget(
    attackerEntityId: string,
    targetEntityId: string,
  ): boolean {
    const attackerEntity = this.entityManager.getEntity(attackerEntityId);
    const targetEntity = this.entityManager.getEntity(targetEntityId);

    if (!attackerEntity || !targetEntity) {
      return false;
    }

  const targetComponent = attackerEntity.components["target"] as TargetComponent;
    if (!targetComponent) {
      return false;
    }

    // 目標の有効性をチェック
    if (!this.isValidTarget(targetEntity)) {
      return false;
    }

    // 敵味方の判定
    const isAttackerEnemy = this.isEnemyEntity(attackerEntity);
    const isTargetEnemy = this.isEnemyEntity(targetEntity);
    const isTargetFriendly = this.isFriendlyEntity(targetEntity);

    // 攻撃者が敵の場合は味方を、攻撃者が味方の場合は敵を攻撃
    if (isAttackerEnemy && !isTargetFriendly) return false;
    if (!isAttackerEnemy && !isTargetEnemy) return false;

    setEntityTarget(targetComponent, targetEntityId);
    return true;
  }

  /**
   * 目標をクリア（手動制御用）
   * @param attackerEntityId 攻撃者エンティティID
   * @returns クリアに成功した場合true
   */
  public forceClearTarget(attackerEntityId: string): boolean {
    const attackerEntity = this.entityManager.getEntity(attackerEntityId);
    if (!attackerEntity) {
      return false;
    }

  const targetComponent = attackerEntity.components["target"] as TargetComponent;
    if (!targetComponent) {
      return false;
    }

    clearTarget(targetComponent);
    return true;
  }

  /**
   * 指定された位置から指定された範囲内のエンティティを検索
   * @param center 中心座標
   * @param range 検索範囲
   * @param filter フィルター関数（オプション）
   * @returns 範囲内のエンティティ配列
   */
  public findEntitiesInRange(
    center: Point,
    range: number,
    filter?: (entity: Entity) => boolean,
  ): Entity[] {
    const entitiesInRange: Entity[] = [];
    const allEntities = this.entityManager.getAllEntities();

    for (const entity of allEntities) {
  const positionComponent = entity.components["position"] as PositionComponent;
      if (!positionComponent) continue;

      const distance = calculateDistance(center, positionComponent.point);
      if (distance <= range) {
        if (!filter || filter(entity)) {
          entitiesInRange.push(entity);
        }
      }
    }

    return entitiesInRange;
  }

  /**
   * デバッグ用：攻撃者とその目標の情報を取得
   */
  public getTargetingDebugInfo(): Array<{
    attackerId: string;
    targetId?: string;
    enemiesInRange: number;
    isValidTarget: boolean;
  }> {
    const attackers = this.entityManager.queryEntities({
      required: ["position", "attack", "target"],
    });

    return attackers.map((attacker) => {
      const targetComponent = attacker.components["target"] as TargetComponent;
      const enemiesInRange = this.findEnemiesInRange(attacker, attacker.components["attack"].range);


      let isValidTarget = false;
      if (targetComponent.targetEntityId) {
        const target = this.entityManager.getEntity(
          targetComponent.targetEntityId,
        );
        isValidTarget = target ? this.isValidTarget(target) : false;
      }

      return {
        attackerId: attacker.id,
        targetId: targetComponent.targetEntityId,
        enemiesInRange: enemiesInRange.length,
        isValidTarget,
      };
    });
  }
}
