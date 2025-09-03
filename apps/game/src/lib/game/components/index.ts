import { type AttackComponent, attackComponentTag } from "./attack-component";
import { type EnemyComponent, enemyComponentTag } from "./enemy-component";
import { type HealthComponent, healthComponentTag } from "./health-component";
import {
  type MovementComponent,
  movementComponentTag,
} from "./movement-component";
import {
  type PositionComponent,
  positionComponentTag,
} from "./position-component";
import {
  type ProjectileComponent,
  projectileComponentTag,
} from "./projectile-component";
import {
  type StructureComponent,
  structureComponentTag,
} from "./structure-component";
import { type TargetComponent, targetComponentTag } from "./target-component";
import { type UnitComponent, unitComponentTag } from "./unit-component";

export type ComponentMap = {
  [attackComponentTag]: AttackComponent;
  [enemyComponentTag]: EnemyComponent;
  [healthComponentTag]: HealthComponent;
  [movementComponentTag]: MovementComponent;
  [positionComponentTag]: PositionComponent;
  [projectileComponentTag]: ProjectileComponent;
  [structureComponentTag]: StructureComponent;
  [targetComponentTag]: TargetComponent;
  [unitComponentTag]: UnitComponent;
};

export type Component = ComponentMap[keyof ComponentMap];

export { isAttackComponent } from "./attack-component";
export { isEnemyComponent } from "./enemy-component";
export { isHealthComponent } from "./health-component";
export { isMovementComponent } from "./movement-component";
export { isPositionComponent } from "./position-component";
export { isProjectileComponent } from "./projectile-component";
export { isStructureComponent } from "./structure-component";
export { isTargetComponent } from "./target-component";
export { isUnitComponent } from "./unit-component";
