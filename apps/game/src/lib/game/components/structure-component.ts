import type { Component } from "./types";

export const structureComponentTag = "structure";

export type StructureType = "gate" | "cannon" | "tower" | "wall" | "barracks";

export type StructureComponent = Component<
  typeof structureComponentTag,
  {
    // 勝利条件に関わるかどうか
    readonly isCriticalForLose: boolean;
    // 攻撃に使用されない / unitが操作して攻撃できる / 自動で攻撃できる
    readonly attackableType: "none" | "with-unit" | "auto";
    // 構造物の種類
    readonly structureType: StructureType;
    usingUnitId?: string;
    // 新規追加: ユニット配備機能
    deployedUnitId?: string; // 配備されたユニットのID
    maxUnits: number; // 配備可能な最大ユニット数
  }
>;

/**
 * Creates a new StructureComponent with the specified parameters
 */
export const createStructureComponent = (
  isCriticalForLose: boolean,
  attackableType: StructureComponent["attackableType"],
  structureType: StructureType,
  maxUnits: number = 1,
): StructureComponent => ({
  type: structureComponentTag,
  isCriticalForLose,
  attackableType,
  structureType,
  maxUnits,
});

/**
 * Type guard to check if a component is an StructureComponent
 */
export const isStructureComponent = (
  component: Component<any, any>,
): component is StructureComponent => component.type === structureComponentTag;

export const useStructure = (
  structureComponent: StructureComponent,
  unitId: string,
) => {
  structureComponent.usingUnitId = unitId;
};

export const unuseStructure = (structureComponent: StructureComponent) => {
  structureComponent.usingUnitId = void 0;
};

// 新規追加: ユニット配備機能

export const deployUnitToStructure = (
  structure: StructureComponent,
  unitId: string,
): boolean => {
  if (structure.deployedUnitId !== undefined) {
    return false; // 既にユニットが配備されている
  }

  structure.deployedUnitId = unitId;
  return true;
};

export const undeployUnitFromStructure = (
  structure: StructureComponent,
): void => {
  structure.deployedUnitId = undefined;
};

export const hasDeployedUnit = (structure: StructureComponent): boolean => {
  return structure.deployedUnitId !== undefined;
};

export const canDeployUnit = (structure: StructureComponent): boolean => {
  return (
    structure.attackableType === "with-unit" && !hasDeployedUnit(structure)
  );
};

export const getDeployedUnitId = (
  structure: StructureComponent,
): string | undefined => {
  return structure.deployedUnitId;
};

export const getMaxUnits = (structure: StructureComponent): number => {
  return structure.maxUnits;
};
// 構造物の種類に関するユーティリティ関数
export const getStructureType = (
  structure: StructureComponent,
): StructureType => {
  return structure.structureType;
};

export const isGateStructure = (structure: StructureComponent): boolean => {
  return structure.structureType === "gate";
};

export const isDefenseStructure = (structure: StructureComponent): boolean => {
  return (
    structure.attackableType === "auto" || structure.attackableType === "with-unit"
  );
};

export const isWallStructure = (structure: StructureComponent): boolean => {
  return structure.structureType === "wall";
};

export const isBarracksStructure = (structure: StructureComponent): boolean => {
  return structure.structureType === "barracks";
};

export const getStructurePriority = (structure: StructureComponent): number => {
  // 構造物の基本優先度（高いほど優先される）
  switch (structure.structureType) {
    case "gate":
      return 100; // 最高優先度
    case "cannon":
      return 80;
    case "tower":
      return 75;
    case "barracks":
      return 60;
    case "wall":
      return 40;
    default:
      return 50;
  }
};
