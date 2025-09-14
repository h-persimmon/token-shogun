"use client";
import React, { useState, useEffect } from 'react';
import { Order, AttackTargetOrder, DeploymentTargetOrder, DefenseCrystalOrder, ReviveAllyUnitOrder } from '@kiro-rts/vibe-strategy';
import type { GameStatusInfo } from '../../../../game/src/lib/game/order-listner/index';
import styles from './order-button.module.css';
import { enemyUnitConfigs } from '../../../../../packages/characters'; 
import { useChannelMessagingSender } from '@/hooks/use-channel-messaging-sender';


export const OrderButtonComponent = ({ sendOrder, getGameStatusInfo }: Pick<ReturnType<typeof useChannelMessagingSender>, 'sendOrder' | 'getGameStatusInfo'>) => {
  const [entityId, setEntityId] = useState<string>('');
  const [entityToReviveId, setEntityToReviveId] = useState<string>('');
  const [targetEnemyTypeId, setTargetEnemyTypeId] = useState<string>('');
  const [targetStructureId, setTargetStructureId] = useState<string>('');
  const [selectedOrderType, setSelectedOrderType] = useState<'attack' | 'deploy' | 'defense' | 'revive'>('attack');
  const [gameStatus, setGameStatus] = useState<GameStatusInfo | null>(null);
  const [showGameStatus, setShowGameStatus] = useState(false);

  // 定期的にゲーム状態を更新する
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const newStatus = await getGameStatusInfo();
      setGameStatus(newStatus);
      
      // 選択中のエンティティが死んだ場合、新しい生きているエンティティを選択
      if (newStatus.deadUnitIds.includes(entityId) && newStatus.aliveUnitIds.length > 0) {
        setEntityId(newStatus.aliveUnitIds[0]);
      }
      
      // 選択中の敵タイプがもういない場合、新しい敵タイプを選択
      if (!newStatus.aliveEnemyTypes.includes(targetEnemyTypeId) && newStatus.aliveEnemyTypes.length > 0) {
        setTargetEnemyTypeId(newStatus.aliveEnemyTypes[0]);
      }
      
      // 選択中の構造物が使用不能になった場合、新しい構造物を選択
      if (!newStatus.deployableStructureIds.includes(targetStructureId) && newStatus.deployableStructureIds.length > 0) {
        setTargetStructureId(newStatus.deployableStructureIds[0]);
      }
    }, 500); // 500ミリ秒ごとに更新
    
    return () => clearInterval(intervalId);
  }, [getGameStatusInfo, entityId, targetEnemyTypeId, targetStructureId]);

  const handleCreateOrder = () => {
    // 必要な値が選択されていない場合は実行しない
    if (!entityId) {
      alert("Please select a unit");
      return;
    }

    if (selectedOrderType === 'attack' && !targetEnemyTypeId) {
      alert("Please select an enemy type");
      return;
    }

    if (selectedOrderType === 'deploy' && !targetStructureId) {
      alert("Please select a structure");
      return;
    }

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
          entityId: entityToReviveId
        } as ReviveAllyUnitOrder;
        break;
      default:
        return;
    }

    sendOrder([order]);
    console.log(`Order sent: ${JSON.stringify(order)}`);
  };
  
  const handleToggleGameStatus = async () => {
    setShowGameStatus(prev => !prev);
    // 状態表示が切り替わるたびに最新の情報を取得
    const status = await getGameStatusInfo();
    setGameStatus(status);
  };
  
  // オーダータイプに応じた選択肢の有効性
  const isOrderValid = (): boolean => {
    if (!gameStatus) {
      return false;
    }
    
    switch (selectedOrderType) {
      case 'attack':
        return gameStatus.aliveUnitIds.length > 0 && gameStatus.aliveEnemyTypes.length > 0;
      case 'deploy':
        return gameStatus.aliveUnitIds.length > 0 && gameStatus.deployableStructureIds.length > 0;
      case 'defense':
        return gameStatus.aliveUnitIds.length > 0;
      case 'revive':
        return gameStatus.deadUnitIds.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className={styles.orderButtonContainer}>
      <h3>Order Mock Controls</h3>
      
      <div className={styles.orderTypeSelector}>
        <label className={!gameStatus?.aliveUnitIds?.length || !gameStatus?.aliveEnemyTypes?.length ? styles.disabledOption : ''}>
          <input 
            type="radio" 
            value="attack" 
            checked={selectedOrderType === 'attack'} 
            onChange={() => setSelectedOrderType('attack')}
            disabled={!gameStatus?.aliveUnitIds.length || !gameStatus?.aliveEnemyTypes.length}
          />
          Attack Target {!gameStatus?.aliveEnemyTypes.length && <span>(No enemies)</span>}
        </label>
        <label className={!gameStatus?.aliveUnitIds.length || !gameStatus?.deployableStructureIds.length ? styles.disabledOption : ''}>
          <input 
            type="radio" 
            value="deploy" 
            checked={selectedOrderType === 'deploy'} 
            onChange={() => setSelectedOrderType('deploy')}
            disabled={!gameStatus?.aliveUnitIds.length || !gameStatus?.deployableStructureIds.length}
          />
          Deployment Target {!gameStatus?.deployableStructureIds.length && <span>(No structures)</span>}
        </label>
        <label className={!gameStatus?.aliveUnitIds.length ? styles.disabledOption : ''}>
          <input 
            type="radio" 
            value="defense" 
            checked={selectedOrderType === 'defense'} 
            onChange={() => setSelectedOrderType('defense')}
            disabled={!gameStatus?.aliveUnitIds.length}
          />
          Defense Crystal
        </label>
        <label className={!gameStatus?.deadUnitIds.length ? styles.disabledOption : ''}>
          <input 
            type="radio" 
            value="revive" 
            checked={selectedOrderType === 'revive'} 
            onChange={() => setSelectedOrderType('revive')}
            disabled={!gameStatus?.deadUnitIds.length}
          />
          Revive Ally Unit {!gameStatus?.deadUnitIds.length && <span>(No dead units)</span>}
        </label>
      </div>

      {
        selectedOrderType !== 'revive' && (
          <div className={styles.inputGroup}>
            <label>Entity ID (Alive Units):</label>
            <select 
              value={entityId} 
              onChange={(e) => setEntityId(e.target.value)}
              disabled={!gameStatus?.aliveUnitIds.length}
            >
              {!gameStatus?.aliveUnitIds.length && (
                <option value="">No alive units</option>
              )}
              {gameStatus?.aliveUnitIds.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
            {!gameStatus?.aliveUnitIds.length && (
              <p className={styles.noOptionsWarning}>No alive units available</p>
            )}
          </div>
        )
      }

      {selectedOrderType === 'attack' && (
        <div className={styles.inputGroup}>
          <label>Target Enemy Type:</label>
          <select 
            value={targetEnemyTypeId} 
            onChange={(e) => setTargetEnemyTypeId(e.target.value)}
            disabled={!gameStatus?.aliveEnemyTypes.length}
          >
            {!gameStatus?.aliveEnemyTypes.length && (
              <option value="">No enemies</option>
            )}
            {gameStatus?.aliveEnemyTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
            {/* Fallback to config data if no live enemies */}
            {(!gameStatus?.aliveEnemyTypes.length) && enemyUnitConfigs.map(enemy => (
              <option key={enemy.id} value={enemy.id}>{enemy.id}</option>
            ))}
          </select>
          {!gameStatus?.aliveEnemyTypes.length && (
            <p className={styles.noOptionsWarning}>No alive enemies available</p>
          )}
        </div>
      )}

      {selectedOrderType === 'deploy' && (
        <div className={styles.inputGroup}>
          <label>Target Structure ID:</label>
          <select 
            value={targetStructureId} 
            onChange={(e) => setTargetStructureId(e.target.value)}
            disabled={!gameStatus?.deployableStructureIds.length}
          >
            {!gameStatus?.deployableStructureIds.length && (
              <option value="">No structures</option>
            )}
            {gameStatus?.deployableStructureIds.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
          {!gameStatus?.deployableStructureIds.length && (
            <p className={styles.noOptionsWarning}>No deployable structures available</p>
          )}
        </div>
      )}
      
      {selectedOrderType === 'revive' && (
        <div className={styles.inputGroup}>
          <label>Entity ID (Dead Units):</label>
          <select 
            value={entityToReviveId} 
            onChange={(e) => setEntityToReviveId(e.target.value)}
            disabled={!gameStatus?.deadUnitIds.length}
          >
            {!gameStatus?.deadUnitIds.length && (
              <option value="">No dead units</option>
            )}
            {gameStatus?.deadUnitIds.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
          {!gameStatus?.deadUnitIds.length && (
            <p className={styles.noOptionsWarning}>No dead units available to revive</p>
          )}
        </div>
      )}

      <button 
        className={styles.sendOrderButton} 
        onClick={handleCreateOrder}
        disabled={
          (entityId === '') || 
          (selectedOrderType === 'attack' && targetEnemyTypeId === '') ||
          (selectedOrderType === 'deploy' && targetStructureId === '')
        }
      >
        Send Order
      </button>

      <div className={styles.debugSection}>
        <button 
          className={`${styles.debugButton} ${showGameStatus ? styles.active : ''}`}
          onClick={handleToggleGameStatus}
        >
          {showGameStatus ? 'Hide Game Status' : 'Show Game Status'}
        </button>
        
        {showGameStatus && gameStatus && (
          <div className={styles.gameStatusDisplay}>
            <h4>Game Status Information</h4>
            <div className={styles.statusSection}>
              <h5>Alive Units ({gameStatus.aliveUnitIds.length})</h5>
              <ul>
                {gameStatus.aliveUnitIds.map(id => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
            <div className={styles.statusSection}>
              <h5>Dead Units ({gameStatus.deadUnitIds.length})</h5>
              <ul>
                {gameStatus.deadUnitIds.map(id => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
            <div className={styles.statusSection}>
              <h5>Deployable Structures ({gameStatus.deployableStructureIds.length})</h5>
              <ul>
                {gameStatus.deployableStructureIds.map(id => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
            <div className={styles.statusSection}>
              <h5>Alive Enemy Types ({gameStatus.aliveEnemyTypes.length})</h5>
              <ul>
                {gameStatus.aliveEnemyTypes.map(type => (
                  <li key={type}>{type}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default function TestPage() {
  const { iframeRef, sendOrder, getGameStatusInfo } = useChannelMessagingSender();

  return (
    <div>
      <iframe
        ref={iframeRef}
        style={{ width: '800px', height: '600px', border: '1px solid #ccc' }}
        src={process.env.NEXT_PUBLIC_GAME_URL || "http://localhost:4000"}
        sandbox="allow-scripts allow-same-origin"
      />
      <OrderButtonComponent sendOrder={sendOrder} getGameStatusInfo={getGameStatusInfo} />
    </div>
  );
}
