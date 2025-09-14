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
  // 鬼火（青）
  {
    id: "enemy_onibi_blue",
    charachip: "onibi_blue.png",
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
  // 鬼火（黄）
  {
    id: "enemy_onibi_yellow",
    charachip: "onibi_yellow.png",
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
    speed: 32,
    attackDamage: 5,
    attackRange: 20,
    "structureTargetPriority": "any"
  },
  {
    id: "enemy_blue_oni",
    charachip: "blue_oni.png",
      charachipConfig: {
      frameWidth: 20,
      frameHeight: 28,
      displayWidth: 52
    },
    maxHealth: 200,
    speed: 32,
    attackDamage: 5,
    attackRange: 20,
    "structureTargetPriority": "any"
  },
  {
    id: "enemy_yellow_oni",
    charachip: "yellow_oni.png",
      charachipConfig: {
      frameWidth: 20,
      frameHeight: 28,
      displayWidth: 52
    },
    maxHealth: 200,
    speed: 32,
    attackDamage: 5,
    attackRange: 20,
    "structureTargetPriority": "any"
  } 
]