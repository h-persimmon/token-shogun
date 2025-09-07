// src/lib/game/entities/entity-manager.ts

import type { Component, ComponentMap } from "../components";
import { createEntity, deleteEntity, type Entity } from "./entity";
import { createObjectPool, type Poolable } from "./object-pool";

// Entity管理のための型定義
export type EntityQuery<
  R extends keyof ComponentMap = never,
  E extends keyof ComponentMap = never
> = {
  required?: R[];
  excluded?: E[];
};

export type EntityGroup = {
  entities: Entity[];
  query: EntityQuery;
};

// Poolable Entity wrapper
interface PoolableEntity extends Poolable {
  entity: Entity | null;
}

// Entity Manager の状態管理
type EntityManagerState = {
  entities: Map<string, Entity>;
  entityGroups: Map<string, EntityGroup>;
  entityPool: ReturnType<typeof createObjectPool<PoolableEntity>>;
  nextEntityId: number;
  scene: Phaser.Scene;
};

export type EntityManager = ReturnType<typeof createEntityManager>;
// Entity Manager の作成
export const createEntityManager = (
  scene: Phaser.Scene,
  maxPoolSize: number = 1000,
) => {
  const state: EntityManagerState = {
    entities: new Map(),
    entityGroups: new Map(),
    entityPool: createObjectPool<PoolableEntity>(
      () => ({
        entity: null,
        reset() {
          if (this.entity) {
            this.entity.components = {};
            this.entity = null;
          }
        },
        isInUse() {
          return this.entity !== null;
        },
        setInUse(inUse: boolean) {
          if (!inUse && this.entity) {
            this.entity = null;
          }
        },
      }),
      maxPoolSize,
    ),
    nextEntityId: 1,
    scene,
  };

  // Entity作成
  const createEntityWithSprite = (
    textureKey: string,
    x: number = 0,
    y: number = 0,
    ratio = 1,
  ): Entity => {
    const sprite = scene.add.sprite(x, y, textureKey, 0);
    sprite.setScale(ratio);
    const entityId = `entity_${state.nextEntityId++}`;
    const entity = createEntity(entityId, sprite);

    state.entities.set(entityId, entity);
    updateEntityGroups(entity);

    return entity;
  };

  // Entity削除
  const destroyEntity = (entityId: string): boolean => {
    const entity = state.entities.get(entityId);
    if (!entity) return false;

    // Entity Groupsから削除
    removeEntityFromGroups(entity);

    // Entityを削除
    deleteEntity(entity);
    state.entities.delete(entityId);

    return true;
  };

  // Component追加時のGroup更新
  const addComponentToEntity = <T extends Component>(
    entityId: string,
    component: T
  ): boolean => {
    const entity = state.entities.get(entityId);
    if (!entity) return false;

    entity.components = { ...entity.components, [component.type]: component };
    updateEntityGroups(entity);

    return true;
  };

  // Component削除時のGroup更新
  const removeComponentFromEntity = (
    entityId: string,
    componentType: keyof ComponentMap,
  ): boolean => {
    const entity = state.entities.get(entityId);
    if (!entity) return false;

    delete entity.components[componentType];
    updateEntityGroups(entity);

    return true;
  };

  // Entity Group作成・管理
  const createEntityGroup = (
    groupName: string,
    query: EntityQuery,
  ): EntityGroup => {
    const group: EntityGroup = {
      entities: [],
      query,
    };

    // 既存のEntityをチェックしてGroupに追加
    for (const entity of state.entities.values()) {
      if (matchesQuery(entity, query)) {
        group.entities.push(entity);
      }
    }

    state.entityGroups.set(groupName, group);
    return group;
  };

  // Entity Groupの取得
  const getEntityGroup = (groupName: string): EntityGroup | undefined => {
    return state.entityGroups.get(groupName);
  };

  // クエリに基づくEntity検索
  const queryEntities = <
    R extends keyof ComponentMap = never,
    E extends keyof ComponentMap = never
  >(query: EntityQuery<R, E>): Entity<Exclude<R, E>[]>[] => {
    const results: Entity<Exclude<R, E>[]>[] = [];

    for (const entity of state.entities.values()) {
      if (matchesQuery(entity, query)) {
        results.push(entity as unknown as Entity<Exclude<R, E>[]>);
      }
    }

    return results;
  };

  // Entity取得
  const getEntity = (entityId: string): Entity | undefined => {
    return state.entities.get(entityId);
  };

  // 全Entity取得
  const getAllEntities = (): Entity[] => {
    return Array.from(state.entities.values());
  };

  // Entity数取得
  const getEntityCount = (): number => {
    return state.entities.size;
  };

  // 統計情報取得
  const getStats = () => {
    const componentCounts = new Map<string, number>();

    for (const entity of state.entities.values()) {
      for (const componentType of Object.keys(entity.components)) {
        componentCounts.set(
          componentType,
          (componentCounts.get(componentType) || 0) + 1,
        );
      }
    }

    return {
      totalEntities: state.entities.size,
      entityGroups: state.entityGroups.size,
      componentCounts: Object.fromEntries(componentCounts),
      poolStats: state.entityPool.getStats(),
    };
  };

  // 全Entity削除
  const clear = (): void => {
    for (const entity of state.entities.values()) {
      deleteEntity(entity);
    }
    state.entities.clear();
    state.entityGroups.clear();
    state.entityPool.clear();
    state.nextEntityId = 1;
  };

  // ヘルパー関数: クエリマッチング
  const matchesQuery = <
    R extends (keyof ComponentMap),
    E extends (keyof ComponentMap)
  >(entity: Entity, query: EntityQuery<R, E>): boolean => {
    // 必須コンポーネントチェック
    if (query.required) {
      for (const componentType of query.required) {
        if (!(componentType in entity.components)) {
          return false;
        }
      }
    }

    // 除外コンポーネントチェック
    if (query.excluded) {
      for (const componentType of query.excluded) {
        if (componentType in entity.components) {
          return false;
        }
      }
    }

    return true;
  };

  // ヘルパー関数: Entity Groupsの更新
  const updateEntityGroups = (entity: Entity): void => {
    for (const [_groupName, group] of state.entityGroups) {
      const isInGroup = group.entities.includes(entity);
      const shouldBeInGroup = matchesQuery(entity, group.query);

      if (shouldBeInGroup && !isInGroup) {
        group.entities.push(entity);
      } else if (!shouldBeInGroup && isInGroup) {
        const index = group.entities.indexOf(entity);
        if (index > -1) {
          group.entities.splice(index, 1);
        }
      }
    }
  };

  // ヘルパー関数: Entity GroupsからEntity削除
  const removeEntityFromGroups = (entity: Entity): void => {
    for (const group of state.entityGroups.values()) {
      const index = group.entities.indexOf(entity);
      if (index > -1) {
        group.entities.splice(index, 1);
      }
    }
  };

  return {
    // Entity管理
    createEntity: createEntityWithSprite,
    destroyEntity,
    getEntity,
    getAllEntities,
    getEntityCount,

    // Component管理
    addComponent: addComponentToEntity,
    removeComponent: removeComponentFromEntity,

    // クエリ・グループ管理
    createEntityGroup,
    getEntityGroup,
    queryEntities,

    // ユーティリティ
    getStats,
    clear,

    // 内部状態へのアクセス（デバッグ用）
    _getState: () => state,
  };
};

// // 使用例のためのヘルパー関数
// export const createCommonEntityGroups = (
//   entityManager: ReturnType<typeof createEntityManager>,
// ) => {
//   // 移動可能なEntity群
//   entityManager.createEntityGroup("movable", {
//     required: ["position"],
//   });

//   // 戦闘可能なEntity群
//   entityManager.createEntityGroup("combatants", {
//     required: ["position", "health", "attack"],
//   });

//   // 構造物Entity群
//   entityManager.createEntityGroup("structures", {
//     required: ["position", "structure"],
//   });

//   // 敵Entity群（攻撃可能だが構造物ではない）
//   entityManager.createEntityGroup("enemies", {
//     required: ["position", "health", "attack"],
//     excluded: ["structure"],
//   });
// };
