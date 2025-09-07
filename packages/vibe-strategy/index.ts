import { GameState, LLMOutput } from './interfaces';
import { StrategyPrompt } from './prompt';
import { OrderResponseSchema, ApiResponseSchema } from './types';
import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';

/**
 * Strategy module for handling LLM-based game commands
 */
export class StrategyModule {
  private readonly prompt: StrategyPrompt;
  private readonly MAX_RETRIES = 3;
  private readonly anthropic: AnthropicBedrock;
  private readonly model: string = 'anthropic.claude-3-sonnet-20240229-v1:0';

  constructor(options?: { 
    region?: string; 
    model?: string;
    awsCredentials?: { 
      accessKeyId?: string; 
      secretAccessKey?: string; 
    }; 
  }) {
    this.prompt = new StrategyPrompt();
    
    // Initialize Anthropic Bedrock client - no constructor options needed for default setup
    // Using AWS SDK credentials provider chain by default
    this.anthropic = new AnthropicBedrock();
    
    if (options?.model) {
      this.model = options.model;
    }
  }

  /**
   * Generate a game strategy based on current game state and user prompt
   * 
   * @param gameState Current game state
   * @param userPrompt User's natural language command
   * @param options Optional configuration for the LLM call
   * @returns Strategy order with game commands
   */
  public async generateStrategy(
    gameState: GameState,
    userPrompt: string,
    options?: {
      apiEndpoint?: string;  // Kept for backward compatibility
      temperature?: number;  // Control randomness (0.0 to 1.0)
      maxRetries?: number;   // Override default retry count
    }
  ): Promise<LLMOutput> {
    // Create the prompt for the LLM
    const fullPrompt = this.prompt.createPrompt(gameState, userPrompt);
    
    const maxRetries = options?.maxRetries || this.MAX_RETRIES;
    
    // Send to API with retry logic
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.sendToLLM(
          fullPrompt, 
          options?.apiEndpoint,
          { temperature: options?.temperature }
        );
        const apiResponse = ApiResponseSchema.parse(response);
        
        // Get the text content from the response
        const textContent = apiResponse.output.message.content[0].text;
        
        if (!textContent) {
          throw new Error("Empty response from LLM");
        }
        
        // Parse and validate the XML response
        const strategyOrder = await this.prompt.parseResponse(textContent);
        return strategyOrder;
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        
        // On the last retry, return a fallback empty strategy
        if (attempt === maxRetries - 1) {
          console.error("All retry attempts failed, returning fallback strategy");
          return { orders: [] };
        }
        
        // Exponential backoff for retries
        const backoffTime = Math.pow(2, attempt) * 500; // 0.5s, 1s, 2s, 4s, etc.
        console.log(`Retrying in ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
    
    // Should never reach here due to the return in the last retry attempt
    return { orders: [] };
  }

  /**
   * Send the prompt to the LLM service using Anthropic Claude on AWS Bedrock
   */
  private async sendToLLM(
    prompt: string,
    apiEndpoint?: string, // Kept for backward compatibility, but not used with Bedrock SDK
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<any> {
    try {
      console.log(`Sending prompt to Anthropic Claude model: ${this.model}`);
      
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens || 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options?.temperature ?? 0.2, // Lower temperature for more deterministic outputs
        system: "You are a strategy game assistant that generates precise XML responses according to the provided schema."
      });
      
      // Check the content type and extract text
      let responseText = '';
      if (response.content[0].type === 'text') {
        responseText = response.content[0].text;
      }
      
      // Transform Bedrock response format to match our expected ApiResponse format
      return {
        output: {
          message: {
            content: [
              {
                text: responseText
              }
            ]
          }
        }
      };
    } catch (error) {
      console.error("Error calling Anthropic Claude on Bedrock:", error);
      throw error;
    }
  }

  /**
   * Convert existing game data to the GameState interface
   * This helps with migrating from the old system
   */
  public static createGameStateFromLegacy(
    allyUnitList: any[],
    enemyUnitList: any[]
  ): GameState {
    // Extract ally unit types (removing duplicates)
    const allyUnitTypesMap = new Map();
    for (const unit of allyUnitList) {
      if (!allyUnitTypesMap.has(unit.unitType.id)) {
        allyUnitTypesMap.set(unit.unitType.id, unit.unitType);
      }
    }
    
    // Extract enemy unit types (removing duplicates)
    const enemyUnitTypesMap = new Map();
    for (const unit of enemyUnitList) {
      if (!enemyUnitTypesMap.has(unit.unitType.id)) {
        enemyUnitTypesMap.set(unit.unitType.id, unit.unitType);
      }
    }
    
    // Format ally units based on updated GameState interface
    const allyUnits = allyUnitList.map(unit => ({
      id: unit.id,
      status: unit.currentHp > 0 ? "alive" as const : "defeated" as const
    }));
    
    // Format enemy unit types based on updated GameState interface
    const enemyUnitTypes = Array.from(enemyUnitTypesMap.values()).map(unitType => ({
      id: unitType.id,
      name: unitType.name
    }));
    
    // Create structures if available
    const structures = [];
    
    return {
      allyUnits,
      enemyUnitTypes,
      structures
    };
  }
}

/**
 * Create a new StrategyModule with AWS credentials
 * This is a convenience function to create a new instance with credentials
 */
export function createStrategyModule(options?: {
  region?: string;
  model?: string;
  awsCredentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}): StrategyModule {
  return new StrategyModule(options);
}
