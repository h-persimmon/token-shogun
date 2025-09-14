import type { Component } from "./types";

export const unitComponentTag = "unit";

export type UnitType = "soldier" | "archer" | "mage";

export type UnitComponent = Component<
  typeof unitComponentTag,
  {
    unitType: UnitType;
    deployedStructureId?: string; // 配備先の砲台ID
    isDeployed: boolean;
  }
>;

// ユニットの種類別設定
export const UNIT_CONFIGS = {
  soldier: {
    health: 120,
    damage: 25,
    attackRange: 80,
    attackCooldown: 1000, // ミリ秒
    cost: 50,
  },
  archer: {
    health: 80,
    damage: 35,
    attackRange: 150,
    attackCooldown: 1200,
    cost: 75,
  },
  mage: {
    health: 60,
    damage: 50,
    attackRange: 120,
    attackCooldown: 1500,
    cost: 100,
  },
} as const;

export const createUnitComponent = (
  unitType: UnitType,
  isDeployed: boolean = false,
): UnitComponent => ({
  type: unitComponentTag,
  unitType,
  isDeployed,
  deployedStructureId: undefined,
});

export const isUnitComponent = (
  component: Component<any, any>,
): component is UnitComponent => {
  return component.type === unitComponentTag;
};

// Component utility functions

export const getUnitConfig = (unitType: UnitType) => {
  return UNIT_CONFIGS[unitType];
};

export const deployUnit = (unit: UnitComponent, structureId: string): void => {
  unit.deployedStructureId = structureId;
  unit.isDeployed = true;
};

export const undeployUnit = (unit: UnitComponent): void => {
  unit.deployedStructureId = undefined;
  unit.isDeployed = false;
};

export const isUnitDeployed = (unit: UnitComponent): boolean => {
  return unit.isDeployed && unit.deployedStructureId !== undefined;
};

export const isUnitType = (unit: UnitComponent, type: UnitType): boolean => {
  return unit.unitType === type;
};

export const getUnitCost = (unitType: UnitType): number => {
  return UNIT_CONFIGS[unitType].cost;
};

export const createUnitWithConfig = (
  unitType: UnitType,
  isDeployed?: boolean,
) => {
  const config = getUnitConfig(unitType);
  return {
    unit: createUnitComponent(unitType, isDeployed),
    config,
  };
};

export const canDeployToStructure = (
  unit: UnitComponent,
  _structureId: string,
): boolean => {
  // ユニットが既に配備されていない場合のみ配備可能
  return !unit.isDeployed && unit.deployedStructureId === undefined;
};
