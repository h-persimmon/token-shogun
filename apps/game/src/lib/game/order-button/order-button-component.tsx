"use client";
import React, { useState } from 'react';
import { Order, AttackTargetOrder, DeploymentTargetOrder, DefenseCrystalOrder, ReviveAllyUnitOrder } from '@kiro-rts/vibe-strategy';
import { OrderListener } from '../order-listner';
import styles from './order-button.module.css';
import { enemyUnitConfigs } from '../../../../../../packages/characters/enemies';

interface OrderButtonProps {
  orderListener: OrderListener;
}

export const OrderButtonComponent: React.FC<OrderButtonProps> = ({ orderListener }) => {
  const [entityId, setEntityId] = useState('unit_1');
  const [targetEnemyTypeId, setTargetEnemyTypeId] = useState('oni');
  const [targetStructureId, setTargetStructureId] = useState('structure_1');
  const [selectedOrderType, setSelectedOrderType] = useState<'attack' | 'deploy' | 'defense' | 'revive'>('attack');

  const handleCreateOrder = () => {
    let order: Order;

    switch (selectedOrderType) {
      case 'attack':
        order = {
          type: "attackTarget",
          entityId,
          targetEnemyTypeId
        } as AttackTargetOrder;
        break;
      case 'deploy':
        order = {
          type: "deploymentTarget",
          entityId,
          targetStructureId
        } as DeploymentTargetOrder;
        break;
      case 'defense':
        order = {
          type: "defenseCrystal",
          entityId
        } as DefenseCrystalOrder;
        break;
      case 'revive':
        order = {
          type: "reviveAllyUnit",
          entityId
        } as ReviveAllyUnitOrder;
        break;
      default:
        return;
    }

    orderListener.addOrder(order);
    console.log(`Order sent: ${JSON.stringify(order)}`);
  };

  return (
    <div className={styles.orderButtonContainer}>
      <h3>Order Mock Controls</h3>
      
      <div className={styles.orderTypeSelector}>
        <label>
          <input 
            type="radio" 
            value="attack" 
            checked={selectedOrderType === 'attack'} 
            onChange={() => setSelectedOrderType('attack')} 
          />
          Attack Target
        </label>
        <label>
          <input 
            type="radio" 
            value="deploy" 
            checked={selectedOrderType === 'deploy'} 
            onChange={() => setSelectedOrderType('deploy')} 
          />
          Deployment Target
        </label>
        <label>
          <input 
            type="radio" 
            value="defense" 
            checked={selectedOrderType === 'defense'} 
            onChange={() => setSelectedOrderType('defense')} 
          />
          Defense Crystal
        </label>
        <label>
          <input 
            type="radio" 
            value="revive" 
            checked={selectedOrderType === 'revive'} 
            onChange={() => setSelectedOrderType('revive')} 
          />
          Revive Ally Unit
        </label>
      </div>

      <div className={styles.inputGroup}>
        <label>Entity ID:</label>
        <input 
          type="text" 
          value={entityId} 
          onChange={(e) => setEntityId(e.target.value)} 
          placeholder="Entity ID"
        />
      </div>

      {selectedOrderType === 'attack' && (
        <div className={styles.inputGroup}>
          <label>Target Enemy Type:</label>
          <select 
            value={targetEnemyTypeId} 
            onChange={(e) => setTargetEnemyTypeId(e.target.value)}
          >
            {enemyUnitConfigs.map(enemy => (
              <option key={enemy.id} value={enemy.id}>{enemy.id}</option>
            ))}
          </select>
        </div>
      )}

      {selectedOrderType === 'deploy' && (
        <div className={styles.inputGroup}>
          <label>Target Structure ID:</label>
          <input 
            type="text" 
            value={targetStructureId} 
            onChange={(e) => setTargetStructureId(e.target.value)} 
            placeholder="Structure ID"
          />
        </div>
      )}

      <button 
        className={styles.sendOrderButton} 
        onClick={handleCreateOrder}
      >
        Send Order
      </button>
    </div>
  );
};
