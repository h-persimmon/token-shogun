import { Order } from "@kiro-rts/vibe-strategy";
import type { Entity } from "../entities/entity";
import type { createEntityManager } from "../entities/entity-manager";

/**
 * ゲームの状態情報の型定義
 */
export type GameStatusInfo = {
  aliveUnitIds: string[];
  deadUnitIds: string[];
  deployableStructureIds: string[];
  aliveEnemyTypes: string[];
};

export class OrderListener {
  private stackedOrders: Order[] = [];
  private entityManager?: ReturnType<typeof createEntityManager>;
  private gameStatusInfo: GameStatusInfo = {
    aliveUnitIds: [],
    deadUnitIds: [],
    deployableStructureIds: [],
    aliveEnemyTypes: [],
  };

  constructor(entityManager?: ReturnType<typeof createEntityManager>) {
    this.entityManager = entityManager;
  }

  /**
   * EntityManagerを設定する
   * @param entityManager エンティティマネージャー
   */
  public setEntityManager(entityManager: ReturnType<typeof createEntityManager>): void {
    this.entityManager = entityManager;
  }

  /**
   * 命令を追加する
   * @param order 追加する命令
   */
  public addOrder(order: Order): void {
    this.stackedOrders.push(order);
  }

  /**
   * 蓄積された命令を取得し、クリアする
   * @returns 蓄積された命令の配列
   */
  public getOrders(): Order[] {
    const orders = this.stackedOrders;
    this.clearOrders();
    return orders;
  }

  /**
   * ゲームの状態情報を更新する
   */
  public updateGameStatusInfo(): void {
    if (!this.entityManager) return;

    // ユニット情報を取得
    const units = this.entityManager.queryEntities({
      required: ["unit", "health"],
    });

    // 生きているユニットと死んでいるユニットに分ける
    this.gameStatusInfo.aliveUnitIds = units
      .filter(entity => !entity.components.health.isDead)
      .map(entity => entity.id);
    
    this.gameStatusInfo.deadUnitIds = units
      .filter(entity => entity.components.health.isDead)
      .map(entity => entity.id);

    // 配置可能な構造物を取得
    const structures = this.entityManager.queryEntities({
      required: ["structure"],
    });
    
    this.gameStatusInfo.deployableStructureIds = structures
      .filter(entity => {
        const structure = entity.components.structure;
        return structure.attackableType === "with-unit" && !structure.deployedUnitId;
      })
      .map(entity => entity.id);

    // 生きている敵タイプを取得
    const enemies = this.entityManager.queryEntities({
      required: ["enemy", "health"],
    });
    
    this.gameStatusInfo.aliveEnemyTypes = enemies
      .filter(entity => !entity.components.health.isDead)
      .map(entity => entity.components.enemy.enemyType)
      // 重複を削除
      .filter((value, index, self) => self.indexOf(value) === index);
  }

  /**
   * ゲームの状態情報を取得する
   * @returns ゲームの状態情報
   */
  public getGameStatusInfo(): GameStatusInfo {
    // 情報を取得する前に最新の状態に更新
    this.updateGameStatusInfo();
    return { ...this.gameStatusInfo };
  }

  /**
   * 蓄積された命令をクリアする
   */
  private clearOrders(): void {
    this.stackedOrders = [];
  }
}
