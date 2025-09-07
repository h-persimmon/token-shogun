import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VibeStrategyModule } from './index';
import { StrategyPrompt } from './prompt';
import { OrderResponseSchema } from './types';

// Mock fetch
global.fetch = vi.fn();

describe('StrategyPrompt', () => {
  let prompt: StrategyPrompt;

  beforeEach(() => {
    prompt = new StrategyPrompt();
  });

  it('should parse a valid XML response', async () => {
    const validXml = `<order>
      <create>
        <unit>
          <unitTypeId>warrior</unitTypeId>
        </unit>
      </create>
    </order>`;

    const result = await prompt.parseResponse(validXml);
    expect(result.order.create).toBeDefined();
    
    if (result.order.create?.unit) {
      const units = Array.isArray(result.order.create.unit) 
        ? result.order.create.unit 
        : [result.order.create.unit];
      
      expect(units).toHaveLength(1);
      expect(units[0]?.unitTypeId).toBe('warrior');
    }
  });

  it('should handle XML wrapped in code blocks', async () => {
    const xmlInCodeBlock = '```xml\n<order><create><unit><unitTypeId>archer</unitTypeId></unit></create></order>\n```';
    
    const result = await prompt.parseResponse(xmlInCodeBlock);
    expect(result.order.create).toBeDefined();
    
    if (result.order.create?.unit) {
      const units = Array.isArray(result.order.create.unit) 
        ? result.order.create.unit 
        : [result.order.create.unit];
      
      expect(units).toHaveLength(1);
      expect(units[0]?.unitTypeId).toBe('archer');
    }
  });

  it('should return a fallback object for invalid XML', async () => {
    const invalidXml = 'This is not XML at all';
    
    const result = await prompt.parseResponse(invalidXml);
    expect(result).toEqual(expect.objectContaining({
      order: expect.any(Object)
    }));
  });
});

describe('StrategyModule', () => {
  let module: VibeStrategyModule;
  
  beforeEach(() => {
    module = new VibeStrategyModule();
    vi.resetAllMocks();
  });

  it('should convert legacy game data to GameState format', () => {
    const legacyAllyUnitList = [
      {
        id: 'ally1',
        unitType: {
          id: 'warrior',
          name: 'Warrior',
          maxHp: 100,
          defaultSpeed: 3,
          availableEventList: [
            { id: 'idle', name: 'Idle' }
          ]
        },
        position: { x: 1, y: 1 },
        currentHp: 100,
        currentSpeed: 3,
        currentEvent: { id: 'idle' }
      }
    ];

    const legacyEnemyUnitList = [
      {
        id: 'enemy1',
        unitType: {
          id: 'slime',
          name: 'Slime',
          maxHp: 50,
          defaultSpeed: 2,
          availableEventList: [
            { id: 'idle', name: 'Idle' }
          ]
        },
        position: { x: 10, y: 10 },
        currentHp: 50,
        currentSpeed: 2,
        currentEvent: { id: 'idle' }
      }
    ];

    const result = VibeStrategyModule.createGameStateFromLegacy(legacyAllyUnitList, legacyEnemyUnitList);
    
    expect(result.allyUnits).toHaveLength(1);
    expect(result.enemyUnits).toHaveLength(1);
    expect(result.allyUnitTypes).toHaveLength(1);
    expect(result.enemyUnitTypes).toHaveLength(1);
  });

  it('should generate a strategy based on game state and user prompt', async () => {
    const mockResponse = {
      output: {
        message: {
          content: [{ 
            text: '<order><create><unit><unitTypeId>warrior</unitTypeId></unit></create></order>' 
          }]
        }
      }
    };

    // Mock successful fetch response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const gameState = {
      allyUnits: [],
      allyUnitTypes: [],
      enemyUnits: [],
      enemyUnitTypes: [],
    };

    const result = await module.generateStrategy(gameState, 'Create a warrior');
    
    expect(result.order.create).toBeDefined();
    
    if (result.order.create?.unit) {
      const units = Array.isArray(result.order.create.unit) 
        ? result.order.create.unit 
        : [result.order.create.unit];
      
      expect(units).toHaveLength(1);
      expect(units[0]?.unitTypeId).toBe('warrior');
    }
  });
  
  it('should parse target enemy commands', async () => {
    const mockResponse = {
      output: {
        message: {
          content: [{ 
            text: '<order><target><enemy><id>enemy-1</id></enemy></target></order>' 
          }]
        }
      }
    };

    // Mock successful fetch response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const gameState = {
      allyUnits: [],
      allyUnitTypes: [],
      enemyUnits: [{ id: 'enemy-1', unitTypeId: 'goblin', position: { x: 10, y: 10 }, currentHp: 100, currentSpeed: 2 }],
      enemyUnitTypes: [],
    };

    const result = await module.generateStrategy(gameState, 'Attack enemy-1');
    
    expect(result.order.target).toBeDefined();
    expect(result.order.target?.enemy?.id).toBe('enemy-1');
  });
  
  it('should parse target structure commands', async () => {
    const mockResponse = {
      output: {
        message: {
          content: [{ 
            text: '<order><target><structure><id>structure-1</id></structure></target></order>' 
          }]
        }
      }
    };

    // Mock successful fetch response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const gameState = {
      allyUnits: [],
      allyUnitTypes: [],
      enemyUnits: [],
      enemyUnitTypes: [],
      structures: [{ id: 'structure-1', structureTypeId: 'tower', position: { x: 20, y: 20 }, currentHp: 200 }],
    };

    const result = await module.generateStrategy(gameState, 'Attack tower');
    
    expect(result.order.target).toBeDefined();
    expect(result.order.target?.structure?.id).toBe('structure-1');
  });
  
  it('should handle combined create and target commands', async () => {
    const mockResponse = {
      output: {
        message: {
          content: [{ 
            text: `<order>
              <create>
                <unit>
                  <unitTypeId>warrior</unitTypeId>
                </unit>
              </create>
              <target>
                <enemy>
                  <id>enemy-1</id>
                </enemy>
              </target>
            </order>` 
          }]
        }
      }
    };

    // Mock successful fetch response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const gameState = {
      allyUnits: [],
      allyUnitTypes: [{ id: 'warrior', name: 'Warrior', maxHp: 100, defaultSpeed: 3 }],
      enemyUnits: [{ id: 'enemy-1', unitTypeId: 'goblin', position: { x: 10, y: 10 }, currentHp: 100, currentSpeed: 2 }],
      enemyUnitTypes: [],
    };

    const result = await module.generateStrategy(gameState, 'Create a warrior and attack enemy-1');
    
    expect(result.order.create).toBeDefined();
    if (result.order.create?.unit) {
      const units = Array.isArray(result.order.create.unit) 
        ? result.order.create.unit 
        : [result.order.create.unit];
      
      expect(units).toHaveLength(1);
      expect(units[0]?.unitTypeId).toBe('warrior');
    }
    
    expect(result.order.target).toBeDefined();
    expect(result.order.target?.enemy?.id).toBe('enemy-1');
  });
});
