import { VibeStrategyModule } from './index';
import { GameState } from './interfaces';
import { XMLBuilder } from 'fast-xml-parser';

/**
 * Example usage of the StrategyModule
 */

// Example game state
const exampleGameState: GameState = {
  allyUnits: [
    {
      id: "ally-1",
      unitTypeId: "warrior",
      position: { x: 5, y: 5 },
      currentHp: 100,
      currentSpeed: 3,
    }
  ],
  allyUnitTypes: [
    {
      id: "warrior",
      name: "Warrior",
      maxHp: 100,
      defaultSpeed: 3,
    }
  ],
  enemyUnits: [
    {
      id: "enemy-1",
      unitTypeId: "slime",
      position: { x: 10, y: 10 },
      currentHp: 50,
      currentSpeed: 2,
    },
    {
      id: "enemy-2",
      unitTypeId: "goblin",
      position: { x: 15, y: 12 },
      currentHp: 75,
      currentSpeed: 3,
    }
  ],
  enemyUnitTypes: [
    {
      id: "slime",
      name: "Slime",
      maxHp: 50,
      defaultSpeed: 2,
      availableEventList: [
        { id: "idle", name: "Idle" },
        { id: "attack", name: "Attack" }
      ]
    },
    {
      id: "goblin",
      name: "Goblin",
      maxHp: 75,
      defaultSpeed: 3,
      availableEventList: [
        { id: "idle", name: "Idle" },
        { id: "attack", name: "Attack" }
      ]
    }
  ],
  structures: [
    {
      id: "structure-1",
      structureTypeId: "tower",
      position: { x: 20, y: 20 },
      currentHp: 200
    },
    {
      id: "structure-2",
      structureTypeId: "barracks",
      position: { x: 5, y: 15 },
      currentHp: 300
    }
  ]
};

/**
 * Example function showing how to use the StrategyModule
 */
async function exampleUsage() {
  // Create a new strategy module
  const strategyModule = new VibeStrategyModule();
  
  // Example user prompt
  const userPrompt = "ワーリアーを3体作成して、ゴブリン(enemy-2)を攻撃目標に設定して";
  
  try {
    // Generate a strategy
    const strategy = await strategyModule.generateStrategy(
      exampleGameState,
      userPrompt,
      "/api/order"  // API endpoint
    );
    
    console.log("Generated Strategy:", JSON.stringify(strategy, null, 2));
    
    // Here you would process the strategy and update your game state
    // ユニット作成処理
    if (strategy.order.create?.unit) {
      // Handle single unit or array of units
      const units = Array.isArray(strategy.order.create.unit)
        ? strategy.order.create.unit
        : [strategy.order.create.unit];
      
      for (const unit of units) {
        console.log(`Creating unit of type: ${unit.unitTypeId}`);
        // Call your game's unit creation function here
      }
    }

    // 目標設定処理
    if (strategy.order.target) {
      // 敵ユニットを目標とする場合
      if (strategy.order.target.enemy?.id) {
        const enemyId = strategy.order.target.enemy.id;
        console.log(`Setting enemy ${enemyId} as target`);
        // Example: yourGameEngine.setEnemyTarget(enemyId);
      }
      
      // 建物を目標とする場合
      if (strategy.order.target.structure?.id) {
        const structureId = strategy.order.target.structure.id;
        console.log(`Setting structure ${structureId} as target`);
        // Example: yourGameEngine.setStructureTarget(structureId);
      }
    }
  } catch (error) {
    console.error("Error generating strategy:", error);
  }
}

// Example of migrating from legacy system
function exampleMigration(legacyAllyUnitList: any[], legacyEnemyUnitList: any[]) {
  // Convert legacy data to new GameState format
  const gameState = VibeStrategyModule.createGameStateFromLegacy(
    legacyAllyUnitList,
    legacyEnemyUnitList
  );
  
  // Now you can use the gameState with the StrategyModule
  const strategyModule = new VibeStrategyModule();
  // Continue with strategyModule.generateStrategy(gameState, userPrompt)...
}

/**
 * Example demonstrating target-setting functionality
 */
async function targetExamples() {
  const strategyModule = new VibeStrategyModule();
  
  // Example 1: Target an enemy
  let targetEnemyPrompt = "敵ユニットのslime (enemy-1)を攻撃目標として設定";
  try {
    const targetEnemyStrategy = await strategyModule.generateStrategy(
      exampleGameState, 
      targetEnemyPrompt,
      "/api/order"
    );
    
    console.log("Target Enemy Strategy:", JSON.stringify(targetEnemyStrategy, null, 2));
    
    if (targetEnemyStrategy.order.target?.enemy?.id) {
      console.log(`Set enemy ${targetEnemyStrategy.order.target.enemy.id} as target`);
    }
  } catch (error) {
    console.error("Error with enemy targeting:", error);
  }
  
  // Example 2: Target a structure
  let targetStructurePrompt = "タワー（structure-1）を目標として設定";
  try {
    const targetStructureStrategy = await strategyModule.generateStrategy(
      exampleGameState, 
      targetStructurePrompt,
      "/api/order"
    );
    
    console.log("Target Structure Strategy:", JSON.stringify(targetStructureStrategy, null, 2));
    
    if (targetStructureStrategy.order.target?.structure?.id) {
      console.log(`Set structure ${targetStructureStrategy.order.target.structure.id} as target`);
    }
  } catch (error) {
    console.error("Error with structure targeting:", error);
  }
}

export { exampleUsage, exampleMigration, targetExamples };
