import type { Component } from "./types";

export const healthComponentTag = "health";

export type HealthComponent = Component<
  typeof healthComponentTag,
  {
    maxHealth: number;
    currentHealth: number;
    lastDamageTime?: number;
    lastDamageFrom?: string; // ダメージを与えたエンティティID
    isDead: boolean;
  }
>;

export const createHealthComponent = (maxHealth: number): HealthComponent => ({
  type: "health",
  maxHealth,
  currentHealth: maxHealth,
  isDead: false,
});

export const isHealthComponent = (
  component: Component<any, any>,
): component is HealthComponent => {
  return component.type === healthComponentTag;
};
// Component utility functions

export const updateHealthComponent = (
  health: HealthComponent,
  damage: number,
): void => {
  health.currentHealth = Math.max(0, health.currentHealth - damage);
  health.isDead = health.currentHealth <= 0;
};

export const healHealthComponent = (
  health: HealthComponent,
  amount: number,
): void => {
  health.currentHealth = Math.min(
    health.maxHealth,
    health.currentHealth + amount,
  );
  health.isDead = false;
};

export const recordDamageSource = (
  health: HealthComponent,
  sourceEntityId: string,
  time: number,
): void => {
  health.lastDamageTime = time;
  health.lastDamageFrom = sourceEntityId;
}