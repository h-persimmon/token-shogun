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
    maxHealth: 15,
    speed: 32,
    attackDamage: 1,
    attackRange: 64,
    structureTargetPriority: "gate"
  },
    // 赤鬼
  {
    id: "enemy_red_oni",
    charachip: "red_oni.png",
      charachipConfig: {
      frameWidth: 20,
      frameHeight: 28,
      displayWidth: 52
    },
    maxHealth: 200,
    speed: 10,
    attackDamage: 2000,
    attackRange: 20,
    "structureTargetPriority": "any"
  } 
]