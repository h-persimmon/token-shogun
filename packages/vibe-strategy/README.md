# Vibe Strategy

A TypeScript package for LLM-powered game strategy generation.

## Features

- Convert natural language user prompts to structured XML commands
- Robust XML parsing with Zod schema validation using fast-xml-parser
- Error handling and retry logic for LLM responses
- Set targets for enemies and structures
- Easy migration from the platform's order system

## Installation

This package is part of the monorepo and can be used directly by other packages.

## Usage

```typescript
import { StrategyModule } from '@kiro-rts/vibe-strategy';

// Create a new strategy module
const strategyModule = new StrategyModule();

// Define your game state
const gameState = {
  allyUnits: [...],
  allyUnitTypes: [...],
  enemyUnits: [...],
  enemyUnitTypes: [...],
};

// Generate a strategy based on user prompt
const strategy = await strategyModule.generateStrategy(
  gameState,
  "Create 3 warriors and attack the enemy base",
  "/api/order" // Optional API endpoint
);

// Process the strategy
if (strategy.order.create?.unit) {
  // Handle both single unit and array of units
  const units = Array.isArray(strategy.order.create.unit)
    ? strategy.order.create.unit
    : [strategy.order.create.unit];
    
  for (const unit of units) {
    // Create units in your game
    console.log(`Creating unit: ${unit.unitTypeId}`);
  }
}

// Handle target orders
if (strategy.order.target?.enemy) {
  // Set enemy as target
  console.log(`Setting enemy ${strategy.order.target.enemy.id} as target`);
  // yourGame.setTargetEnemy(strategy.order.target.enemy.id);
}

if (strategy.order.target?.structure) {
  // Set structure as target
  console.log(`Setting structure ${strategy.order.target.structure.id} as target`);
  // yourGame.setTargetStructure(strategy.order.target.structure.id);
}
```

## Migrating from the Legacy System

If you're migrating from the legacy XML-based system, you can use the static helper method:

```typescript
import { StrategyModule } from '@kiro-rts/vibe-strategy';

// Convert legacy data to new format
const gameState = StrategyModule.createGameStateFromLegacy(
  legacyAllyUnitList,
  legacyEnemyUnitList
);

// Use the converted game state
const strategyModule = new StrategyModule();
const strategy = await strategyModule.generateStrategy(gameState, userPrompt);
```

## API Documentation

### `StrategyModule`

Main class for generating game strategies.

#### Methods:

- `generateStrategy(gameState, userPrompt, apiEndpoint?)`: Generate a game strategy based on user prompt
- `static createGameStateFromLegacy(allyUnitList, enemyUnitList)`: Convert legacy game data to new format

### `StrategyOrder`

Interface representing the structured output from the LLM:

```typescript
interface StrategyOrder {
  order: {
    create?: {
      unit: Array<{
        unitTypeId: string;
      }> | {
        unitTypeId: string;
      };
    };
    update?: {
      // For future implementation
    };
    target?: {
      enemy?: {
        id: string;
      };
      structure?: {
        id: string;
      };
    };
  };
}
```

## Example Prompt Types

Here are some examples of natural language prompts the system can handle:

### Unit Creation
```
ワーリアーを3体作成して
```

### Enemy Targeting
```
敵ユニットのスライム(enemy-1)を攻撃目標として設定
```

### Structure Targeting
```
タワー（structure-1）を目標として設定
```

### Combined Commands
```
ワーリアーを2体作成して、ゴブリン(enemy-2)を攻撃目標に設定して
```

## Development

Run tests:

```bash
pnpm test
```
