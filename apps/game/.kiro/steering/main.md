# Agent's Core Principles
* Please conduct chat conversations in English
* Please avoid implementing environment setup like `pnpm i` yourself (please consider alternative methods)

# Architecture Configuration
This repository is a real-time strategy game built with ECS (Entity-Component-System) architecture.

* Component Configuration
  * TargetComponent: Specifies the destination (Target) for an Entity
  * MovementComponent: Resolves movement destinations using phaser-navmesh
  * StructureComponent: Manages allied structures such as castles and cannons
  * HealthComponent: Manages health points
  * AttackComponent: Manages attack actions
  * PositionComponent: Manages unit positions

* System Configuration
  * TargetingSystem: Manages Entity objectives
  * MovementSystem: Executes movement
  * AttackSystem: Executes attacks
  * EnemySystem: Manages enemy appearances
  * GameStateSystem: Handles game start/end conditions

* Other Modules
  * ObjectPool: Efficiently manages Entities and Components for computational performance

# Used Frameworks
* next.js: 15.5.0
* phaser.js: ^3.90.0

# GitHub Repository Name
h-persimmon/kiro-sample-004