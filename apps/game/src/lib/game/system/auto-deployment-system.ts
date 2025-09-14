import { calculateDistance } from "../components/attack-component";
import type { MovementComponent } from "../components/movement-component";
import type { PositionComponent } from "../components/position-component";
import {
  deployUnitToStructure,
  getDeployedUnitId,
  hasDeployedUnit,
  type StructureComponent,
  undeployUnitFromStructure,
} from "../components/structure-component";
import {
  deployUnit,
  isUnitDeployed,
  type UnitComponent,
  undeployUnit,
} from "../components/unit-component";
import type { Entity } from "../entities/entity";
import type { createEntityManager } from "../entities/entity-manager";
import { TargetComponent } from '../components/target-component';

type EntityManager = ReturnType<typeof createEntityManager>;

export type AutoDeploymentCallbacks = {
  onAutoDeploymentSuccess?: (structureId: string, unitId: string) => void;
  onAutoDeploymentFailed?: (
    structureId: string,
    unitId: string,
    reason: string,
  ) => void;
  onAutoUndeploymentSuccess?: (structureId: string, unitId: string) => void;
};

export class AutoDeploymentSystem {
  private entityManager: EntityManager;
  private deploymentRange: number = 30; // 配備判定距離
  private undeploymentRange: number = 50; // 解除判定距離（配備距離より少し大きめに）
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
   * 配備済みユニットが砲台から離れたら自動解除する
   */
  public update(): void {
    // 未配備のユニットを取得して配備チェック
    const availableUnits = this.getAvailableUnits();
    for (const unit of availableUnits) {
      this.checkAutoDeployment(unit);
    }
    
    // 配備済みのユニットを取得して離脱チェック
    const deployedUnits = this.getDeployedUnits();
    for (const unit of deployedUnits) {
      this.checkAutoUndeployment(unit);
    }
  }

  /**
   * ユニットの自動配備をチェック
   * @param unitEntity ユニットエンティティ
   */
  private checkAutoDeployment(unitEntity: Entity): void {
    const unitComponent = unitEntity.components.unit as UnitComponent | undefined;
    if (!unitComponent) return;
    
    const targetComponent = unitEntity.components.target
    const targetId = targetComponent?.targetEntityId;
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
  private getAvailableUnits(): Entity[] {
    const availableUnits: Entity[] = [];

    for (const entity of this.entityManager.getAllEntities()) {
      const unitComponent = entity.components.unit as UnitComponent;
      if (unitComponent && !isUnitDeployed(unitComponent)) {
        availableUnits.push(entity);
      }
    }

    return availableUnits;
  }

  /**
   * 配備済みのユニットを取得
   * @returns 配備済みユニットエンティティ配列
   */
  private getDeployedUnits(): Entity[] {
    const deployedUnits: Entity[] = [];

    for (const entity of this.entityManager.getAllEntities()) {
      const unitComponent = entity.components.unit as UnitComponent;
      if (unitComponent && isUnitDeployed(unitComponent) && unitComponent.deployedStructureId) {
        deployedUnits.push(entity);
      }
    }

    return deployedUnits;
  }

  /**
   * 配備済みユニットが砲台から離れすぎた場合の自動解除をチェック
   * @param unitEntity 配備済みユニットエンティティ
   */
  private checkAutoUndeployment(unitEntity: Entity): void {
    const unitComponent = unitEntity.components.unit as UnitComponent;
    const unitPosition = unitEntity.components.position as PositionComponent;
    
    if (!unitComponent || !unitPosition || !unitComponent.deployedStructureId) {
      return;
    }
    
    const structureId = unitComponent.deployedStructureId;
    const structureEntity = this.entityManager.getEntity(structureId);
    
    if (!structureEntity) {
      // 砲台が見つからない場合は強制的に配備解除
      undeployUnit(unitComponent);
      return;
    }
    
    const structureComponent = structureEntity.components.structure as StructureComponent;
    const structurePosition = structureEntity.components.position as PositionComponent;
    
    if (!structureComponent || !structurePosition) {
      return;
    }
    
    // ユニットと砲台の距離を計算
    const distance = calculateDistance(unitPosition.point, structurePosition.point);
    
    // 距離が一定以上離れたら配備解除
    if (distance > this.undeploymentRange) {
      // 砲台とユニットの両方から配備情報を削除
      undeployUnitFromStructure(structureComponent);
      undeployUnit(unitComponent);
      
      console.log(
        `Auto-undeployed unit ${unitEntity.id} from structure ${structureId} (distance: ${distance})`,
      );
      
      // 解除成功コールバックを呼び出し
      this.callbacks?.onAutoUndeploymentSuccess?.(
        structureId,
        unitEntity.id,
      );
    }
  }
}
