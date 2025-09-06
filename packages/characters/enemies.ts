import { EnemyUnitConfig } from "./types";

export const enemyUnitConfigs: EnemyUnitConfig[] = [
  {
    // ねずみ男
    id: "enemy_mouseman",
    charachip: "mouseman.png",
    charachipConfig: {
      frameWidth: 20,
      frameHeight: 28,
      displayWidth: 32
    },
    unitType: "basic",
    maxHealth: 20,
    speed: 48,
    attackDamage: 5,
    attackRange: 1,
  },
  // 鬼火（赤）
  {
    id: "enemy_onibi_red",
    charachip: "onibi_red.png",
    charachipConfig: {
      frameWidth: 20,
      frameHeight: 28,
      displayWidth: 32
    },
    unitType: "fast",
    maxHealth: 15,
    speed: 32,
    attackDamage: 10,
    attackRange: 64,
  },
    // 赤鬼
  {
    id: "enemy_red_oni",
    charachip: "red_oni.png",
    unitType: "heavy",
    maxHealth: 50,
    speed: 30,
    attackDamage: 20,
    attackRange: 1,
  } 
]