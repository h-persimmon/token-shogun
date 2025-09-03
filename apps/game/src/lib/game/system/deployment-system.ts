import type { PositionComponent } from "../components/position-component";
import {
  canDeployUnit,
  deployUnitToStructure,
  getDeployedUnitId,
  hasDeployedUnit,
  type StructureComponent,
  undeployUnitFromStructure,
} from "../components/structure-component";
import {
  canDeployToStructure,
  deployUnit,
  isUnitDeployed,
  type UnitComponent,
  undeployUnit,
} from "../components/unit-component";
import type { createEntityManager } from "../entities/entity-manager";

export type DeploymentResult = {
  success: boolean;
  message: string;
};

export type DeploymentInfo = {
  structureId: string;
  unitId: string;
  canDeploy: boolean;
  reason?: string;
};

export class DeploymentSystem {
  constructor(private entityManager: ReturnType<typeof createEntityManager>) {}

  /**
   * 砲台にユニットを配備する
   */
  deployUnitToStructure(structureId: string, unitId: string): DeploymentResult {
    const structureEntity = this.entityManager.getEntity(structureId);
    const unitEntity = this.entityManager.getEntity(unitId);

    if (!structureEntity) {
      return { success: false, message: "Structure not found" };
    }

    if (!unitEntity) {
      return { success: false, message: "Unit not found" };
    }

    const structureComponent = structureEntity.components.get(
      "structure",
    ) as StructureComponent;
    const unitComponent = unitEntity.components.get("unit") as UnitComponent;

    if (!structureComponent) {
      return { success: false, message: "Structure component not found" };
    }

    if (!unitComponent) {
      return { success: false, message: "Unit component not found" };
    }

    // 配備可能性をチェック
    const deploymentCheck = this.canDeployUnit(structureId, unitId);
    if (!deploymentCheck.canDeploy) {
      return {
        success: false,
        message: deploymentCheck.reason || "Cannot deploy unit",
      };
    }

    // 配備実行
    const structureDeploySuccess = deployUnitToStructure(
      structureComponent,
      unitId,
    );
    if (!structureDeploySuccess) {
      return { success: false, message: "Failed to deploy unit to structure" };
    }

    deployUnit(unitComponent, structureId);

    // ユニットの位置を砲台の位置に移動
    this.moveUnitToStructure(unitId, structureId);

    return { success: true, message: "Unit deployed successfully" };
  }

  /**
   * 砲台からユニットを撤退させる
   */
  undeployUnitFromStructure(structureId: string): DeploymentResult {
    const structureEntity = this.entityManager.getEntity(structureId);

    if (!structureEntity) {
      return { success: false, message: "Structure not found" };
    }

    const structureComponent = structureEntity.components.get(
      "structure",
    ) as StructureComponent;
    if (!structureComponent) {
      return { success: false, message: "Structure component not found" };
    }

    const deployedUnitId = getDeployedUnitId(structureComponent);
    if (!deployedUnitId) {
      return { success: false, message: "No unit deployed to this structure" };
    }

    const unitEntity = this.entityManager.getEntity(deployedUnitId);
    if (!unitEntity) {
      return { success: false, message: "Deployed unit not found" };
    }

    const unitComponent = unitEntity.components.get("unit") as UnitComponent;
    if (!unitComponent) {
      return { success: false, message: "Unit component not found" };
    }

    // 撤退実行
    undeployUnitFromStructure(structureComponent);
    undeployUnit(unitComponent);

    return { success: true, message: "Unit undeployed successfully" };
  }

  /**
   * ユニットが砲台に配備可能かチェック
   */
  canDeployUnit(structureId: string, unitId: string): DeploymentInfo {
    const structureEntity = this.entityManager.getEntity(structureId);
    const unitEntity = this.entityManager.getEntity(unitId);

    if (!structureEntity) {
      return {
        structureId,
        unitId,
        canDeploy: false,
        reason: "Structure not found",
      };
    }

    if (!unitEntity) {
      return {
        structureId,
        unitId,
        canDeploy: false,
        reason: "Unit not found",
      };
    }

    const structureComponent = structureEntity.components.get(
      "structure",
    ) as StructureComponent;
    const unitComponent = unitEntity.components.get("unit") as UnitComponent;

    if (!structureComponent) {
      return {
        structureId,
        unitId,
        canDeploy: false,
        reason: "Structure component not found",
      };
    }

    if (!unitComponent) {
      return {
        structureId,
        unitId,
        canDeploy: false,
        reason: "Unit component not found",
      };
    }

    // 砲台が配備可能かチェック
    if (!canDeployUnit(structureComponent)) {
      if (structureComponent.attackableType !== "with-unit") {
        return {
          structureId,
          unitId,
          canDeploy: false,
          reason: "Structure does not support unit deployment",
        };
      }

      if (hasDeployedUnit(structureComponent)) {
        return {
          structureId,
          unitId,
          canDeploy: false,
          reason: "Structure already has a deployed unit",
        };
      }
    }

    // ユニットが配備可能かチェック
    if (!canDeployToStructure(unitComponent, structureId)) {
      if (isUnitDeployed(unitComponent)) {
        return {
          structureId,
          unitId,
          canDeploy: false,
          reason: "Unit is already deployed",
        };
      }
    }

    return {
      structureId,
      unitId,
      canDeploy: true,
    };
  }

  /**
   * 利用可能なユニット一覧を取得
   */
  getAvailableUnits(): string[] {
    const availableUnits: string[] = [];

    for (const entity of this.entityManager.getAllEntities()) {
      const unitComponent = entity.components.get("unit") as UnitComponent;
      if (unitComponent && !isUnitDeployed(unitComponent)) {
        availableUnits.push(entity.id);
      }
    }

    return availableUnits;
  }

  /**
   * 配備可能な砲台一覧を取得
   */
  getDeployableStructures(): string[] {
    const deployableStructures: string[] = [];

    for (const entity of this.entityManager.getAllEntities()) {
      const structureComponent = entity.components.get(
        "structure",
      ) as StructureComponent;
      if (structureComponent && canDeployUnit(structureComponent)) {
        deployableStructures.push(entity.id);
      }
    }

    return deployableStructures;
  }

  /**
   * 砲台の配備状態を取得
   */
  getStructureDeploymentStatus(structureId: string): {
    hasUnit: boolean;
    deployedUnitId?: string;
    canDeploy: boolean;
  } {
    const structureEntity = this.entityManager.getEntity(structureId);

    if (!structureEntity) {
      return { hasUnit: false, canDeploy: false };
    }

    const structureComponent = structureEntity.components.get(
      "structure",
    ) as StructureComponent;
    if (!structureComponent) {
      return { hasUnit: false, canDeploy: false };
    }

    const hasUnit = hasDeployedUnit(structureComponent);
    const deployedUnitId = getDeployedUnitId(structureComponent);
    const canDeploy = canDeployUnit(structureComponent);

    return {
      hasUnit,
      deployedUnitId,
      canDeploy,
    };
  }

  /**
   * ユニットを砲台の位置に移動
   */
  private moveUnitToStructure(unitId: string, structureId: string): void {
    const unitEntity = this.entityManager.getEntity(unitId);
    const structureEntity = this.entityManager.getEntity(structureId);

    if (!unitEntity || !structureEntity) {
      return;
    }

    const unitPosition = unitEntity.components.get(
      "position",
    ) as PositionComponent;
    const structurePosition = structureEntity.components.get(
      "position",
    ) as PositionComponent;

    if (unitPosition && structurePosition) {
      unitPosition.point.x = structurePosition.point.x;
      unitPosition.point.y = structurePosition.point.y;
    }
  }

  /**
   * 全ての配備情報を取得
   */
  getAllDeploymentInfo(): Array<{
    structureId: string;
    deployedUnitId?: string;
    canDeploy: boolean;
  }> {
    const deploymentInfo: Array<{
      structureId: string;
      deployedUnitId?: string;
      canDeploy: boolean;
    }> = [];

    for (const entity of this.entityManager.getAllEntities()) {
      const structureComponent = entity.components.get(
        "structure",
      ) as StructureComponent;
      if (structureComponent) {
        const status = this.getStructureDeploymentStatus(entity.id);
        deploymentInfo.push({
          structureId: entity.id,
          deployedUnitId: status.deployedUnitId,
          canDeploy: status.canDeploy,
        });
      }
    }

    return deploymentInfo;
  }
}
