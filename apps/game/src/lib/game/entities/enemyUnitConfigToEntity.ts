import { enemyUnitConfigs } from '@kiro-rts/characters';
import { createEntity, addComponent } from './entity';
import { createEnemyComponent } from '../components/enemy-component';
import { createHealthComponent } from '../components/health-component';
import { createAttackComponent } from '../components/attack-component';
import { createPositionComponent, createPositionComponentFromPoint } from '../components/position-component';
import { EntityManager } from './entity-manager';
import { createMovementComponent } from '../components/movement-component';
import { createTargetComponent } from '../components/target-component';

/**
 * EnemyUnitConfig を RTS Entity+Component に変換する
 */
export function enemyUnitConfigToEntity(enemyId: string, entityManager: EntityManager, x: number, y: number) {
  // TODO: enemy.idごとに連番になるような機構が必要
  const config = enemyUnitConfigs.find(c => c.id === enemyId);
  if(!config) {
    throw new Error(`Invalid enemyId: ${enemyId}`);
  }

  const ratio = (config.charachipConfig?.displayWidth || 32) / (config.charachipConfig?.frameWidth || 32);
  const entity = entityManager.createEntity(config?.charachip || "", x, y, ratio);

  // 位置
  addComponent(entity, createPositionComponent(x, y));

  // ヘルス
  addComponent(entity, createHealthComponent(config.maxHealth));

  // 攻撃
  addComponent(entity, createAttackComponent(
    config.attackDamage ?? 1,
    config.attackRange ?? 50,
    1.0,
    'direct',
    config.speed ?? 50
  ));

  // 敵ユニット情報
  addComponent(entity, createEnemyComponent(
    config.id as any,
    0,
    config.structureTargetPriority as any,
    config.rewardValue || 0
  ));

  addComponent(entity, createMovementComponent(config.speed));

  // targetを設定してあげる
  addComponent(entity, createTargetComponent("entity"));


  return entity;
}
