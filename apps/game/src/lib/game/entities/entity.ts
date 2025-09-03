import type { Component, ComponentMap } from "../components";

export type Entity = {
  id: string;
  components: Map<string, Component>;
  sprite: Phaser.GameObjects.Sprite | null;
};

export const createEntity = (
  id: string,
  sprite: Phaser.GameObjects.Sprite | null,
): Entity => ({
  id,
  components: new Map<string, Component>(),
  sprite,
});

export const addComponent = (entity: Entity, component: Component): void => {
  entity.components.set(component.type, component);
};

export const removeComponent = (
  entity: Entity,
  componentType: string,
): void => {
  entity.components.delete(componentType);
};

export const getComponent = <T extends keyof ComponentMap>(
  entity: Entity,
  componentType: T,
): ComponentMap[T] | undefined => {
  return entity.components.get(componentType) as ComponentMap[T] | undefined;
};

export const hasComponent = (
  entity: Entity,
  componentType: keyof ComponentMap,
): boolean => {
  return entity.components.has(componentType as string);
};

export const deleteEntity = (entity: Entity): void => {
  entity.components.clear();
  if (entity.sprite?.destroy) {
    entity.sprite.destroy();
  }
};
