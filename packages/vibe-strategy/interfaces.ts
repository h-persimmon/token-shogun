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
  entityId: string;
  targetEnemyTypeId: string;
}

export type DeploymentTargetOrder = {
  entityId: string;
  targetStructureId: string;
}

export type DefenseCrystalOrder = {
  entityId: string;
}

// ユニット蘇生
export type ReviveAllyUnitOrder = {
  entityId: string;
}

export type Order = AttackTargetOrder | DeploymentTargetOrder | DefenseCrystalOrder | ReviveAllyUnitOrder;
/**
 * LLM output format with create, update, and target orders using XML structure
 */
export interface LLMOutput {
  orders: Order[];
}
