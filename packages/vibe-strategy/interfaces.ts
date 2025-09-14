/**
 * Represents the current state of the game that will be sent to the LLM
 */
export interface GameState {
  allyUnits: Array<{
    id: string;
    status: "alive" | "defeated"
  }>;
  enemyUnitTypes: Array<{
    id: string;
    name: string;
  }>;
  // events: Record<string, Array<{ id: string; name: string }>>;
  structures?: Array<{
    id: string;
  }>;
}

export type AttackTargetOrder = {
  type: "attackTarget";
  entityId: string;
  targetEnemyTypeId: string;
}

export type DeploymentTargetOrder = {
  type: "deploymentTarget";
  entityId: string;
  targetStructureId: string;
}

export type DefenseCrystalOrder = {
  type: "defenseCrystal";
  entityId: string;
}

// ユニット蘇生
export type ReviveAllyUnitOrder = {
  type: "reviveAllyUnit";
  entityId: string;
}

export type Order = AttackTargetOrder | DeploymentTargetOrder | DefenseCrystalOrder | ReviveAllyUnitOrder;
/**
 * LLM output format with create, update, and target orders using XML structure
 */
export interface LLMOutput {
  orders: Order[];
}

export function isAttackTargetOrder(order: Order): order is AttackTargetOrder {
  return order.type === "attackTarget";
}

export function isDeploymentTargetOrder(order: Order): order is DeploymentTargetOrder {
  return order.type === "deploymentTarget";
}

export function isDefenseCrystalOrder(order: Order): order is DefenseCrystalOrder {
  return order.type === "defenseCrystal";
}

export function isReviveAllyUnitOrder(order: Order): order is ReviveAllyUnitOrder {
  return order.type === "reviveAllyUnit";
}