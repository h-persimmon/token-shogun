import { calculateDistance } from "../components/attack-component";
import type { MovementComponent } from "../components/movement-component";
import type { PositionComponent } from "../components/position-component";
import {
  deployUnitToStructure,
  type StructureComponent,
} from "../components/structure-component";
import {
  deployUnit,
  isUnitDeployed,
  type UnitComponent,
} from "../components/unit-component";
import type { Entity } from "../entities/entity";
import type { createEntityManager } from "../entities/entity-manager";

type EntityManager = ReturnType<typeof createEntityManager>;

export type AutoDeploymentCallbacks = {
  onAutoDeploymentSuccess?: (structureId: string, unitId: string) => void;
  onAutoDeploymentFailed?: (
    structureId: string,
    unitId: string,
    reason: string,
  ) => void;
};

export class AutoDeploymentSystem {
  private entityManager: EntityManager;
  private deploymentRange: number = 30; // 配備判定距離
  private callbacks?: AutoDeploymentCallbacks;

  constructor(
    entityManager: EntityManager,
    callbacks?: AutoDeploymentCallbacks,
  ) {
    this.entityManager = entityManager;
    this.callbacks = callbacks;
  }

  /**
   * システムの更新処理
   * ユニットが砲台に近づいたら自動配備する
   */
  public update(): void {
    // 未配備のユニットを取得
    const availableUnits = this.getAvailableUnits();

    // 各ユニットについて近くの砲台への配備をチェック
    for (const unit of availableUnits) {
      this.checkAutoDeployment(unit);
    }
  }

  /**
   * ユニットの自動配備をチェック
   * @param unitEntity ユニットエンティティ
   * @param structures 配備可能な砲台リスト
   */
  private checkAutoDeployment(unitEntity: Entity<["unit" | "movement"]>): void {
    const unitComponent = unitEntity.components.unit
    const movementComponent = unitEntity.components.movement
    const targetId = movementComponent?.targetEntityId;
    if (!targetId) return;

    const structureOrSomething = this.entityManager.getEntity(targetId);
    const structureComponent = structureOrSomething?.components.structure;
    if (!structureComponent) return;

    const unitPosition = unitEntity.components.position;
    const structurePosition =
      structureOrSomething &&
      (structureOrSomething.components.position as PositionComponent);

    if (!unitPosition || !structurePosition || isUnitDeployed(unitComponent)) {
      return;
    }

    const distance = calculateDistance(
      unitPosition.point,
      structurePosition.point,
    );
    if (distance <= this.deploymentRange) {
      this.executeAutoDeployment(unitEntity, structureOrSomething);
    }
  }

  /**
   * 自動配備を実行
   * @param unitEntity ユニットエンティティ
   * @param structureEntity 砲台エンティティ
   */
  private executeAutoDeployment(unitEntity: Entity, structureEntity: Entity): void {
    const structureComponent = structureEntity.components.structure as StructureComponent;
    const unitComponent = unitEntity.components.unit as UnitComponent;

    if (!structureComponent || !unitComponent) {
      this.callbacks?.onAutoDeploymentFailed?.(
        structureEntity.id,
        unitEntity.id,
        "Missing components",
      );
      return;
    }

    // 配備実行
    const deploySuccess = deployUnitToStructure(
      structureComponent,
      unitEntity.id,
    );
    if (deploySuccess) {
      deployUnit(unitComponent, structureEntity.id);

      // ユニットの位置を砲台の位置に移動
      this.moveUnitToStructure(unitEntity, structureEntity);

      console.log(
        `Auto-deployed unit ${unitEntity.id} to structure ${structureEntity.id}`,
      );

      // 成功コールバックを呼び出し
      this.callbacks?.onAutoDeploymentSuccess?.(
        structureEntity.id,
        unitEntity.id,
      );
    } else {
      this.callbacks?.onAutoDeploymentFailed?.(
        structureEntity.id,
        unitEntity.id,
        "Deployment failed",
      );
    }
  }

  /**
   * ユニットを砲台の位置に移動
   * @param unitEntity ユニットエンティティ
   * @param structureEntity 砲台エンティティ
   */
  private moveUnitToStructure(unitEntity: Entity, structureEntity: Entity): void {
    const unitPos = unitEntity.components.position as PositionComponent;
    const structurePos = structureEntity.components.position as PositionComponent;

    if (unitPos && structurePos) {
      unitPos.point.x = structurePos.point.x;
      unitPos.point.y = structurePos.point.y;
    }
  }

  /**
   * 配備可能なユニットを取得
   * @returns 配備可能なユニットエンティティ配列
   */
  private getAvailableUnits(): any[] {
    const availableUnits: any[] = [];

    for (const entity of this.entityManager.getAllEntities()) {
      const unitComponent = entity.components.unit as UnitComponent;
      if (unitComponent && !isUnitDeployed(unitComponent)) {
        availableUnits.push(entity);
      }
    }

    return availableUnits;
  }
}
