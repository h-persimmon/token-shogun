import type { Component, ComponentMap } from "../components";

export type Entity<K extends (keyof ComponentMap)[] = []> = {
  id: string;
  components: Partial<ComponentMap> & Pick<ComponentMap, K[number]>;
  sprite: Phaser.GameObjects.Sprite | null;
};

export const createEntity = (
  id: string,
  sprite: Phaser.GameObjects.Sprite | null,
): Entity => ({
  id,
  components: {},
  sprite,
});

export const addComponent = <T extends Component>(entity: Entity, component: T): void => {
  entity.components = { ...entity.components, [component.type]: component };
};

export const removeComponent = (
  entity: Entity,
  componentType: Component["type"],
): void => {
  delete entity.components[componentType];
};

export const deleteEntity = (entity: Entity): void => {
  entity.components = {};
  if (entity.sprite?.destroy) {
    entity.sprite.destroy();
  }
};
