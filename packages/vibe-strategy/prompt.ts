import { z } from 'zod';
import { GameState, LLMOutput, Order, AttackTargetOrder, DeploymentTargetOrder, DefenseCrystalOrder, ReviveAllyUnitOrder } from './interfaces';
import { OrderResponseSchema } from './types';
import { XMLParser, XMLValidator, XMLBuilder } from 'fast-xml-parser';
import * as fs from 'fs';
import * as path from 'path';

/**
 * LLM prompt utility for game strategy
 */
export class StrategyPrompt {
  private MAX_RETRIES = 3;
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      isArray: (name) => name === 'unit' || name === 'structure',
      parseAttributeValue: true
    });
  }
  
  /**
   * Create the system prompt for the LLM
   */
  private createSystemPrompt(): string {
    return "あなたはストラテジーゲームにおいて、ユーザープロンプトとして自然言語で入力された命令をXMLに変換するエージェントです。" +
      "現在のゲーム状況、ユーザプロンプトを示すので、それに基づいて適切な操作を表すXMLを出力してください。" + 
      "XML以外は出力しないでください。必ず提供されたXSDスキーマに準拠した有効なXMLを返してください。" + 
      "特に、llmOutputスキーマを使用して、複数のorder（attackTarget、deploymentTarget、defenseCrystal、reviveAllyUnitの4種類）を出力することを推奨します。";
  }

  /**
   * Read the XSD schema from file
   */
  private readXsdSchema(schemaFileName: string): string {
    try {
      const filePath = path.join(__dirname, schemaFileName);
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error(`Error reading XSD schema from ${schemaFileName}:`, error);
      return '';
    }
  }

  /**
   * Create the XML schema description for the LLM
   */
  private createSchemaDescription(): string {
    // Get the XSD schema content
    const llmOutputSchemaContent = this.readXsdSchema('llm-output-schema.xsd');
    
    return `
以下は出力XMLの形式を定義するXMLスキーマ(XSD)です。このスキーマに従ってXMLを生成してください。

命令(order)の形式：

\`\`\`xml
${llmOutputSchemaContent}
\`\`\`

このXMLでは:
\`llmOutput\`要素がルート要素で、\`orders\`要素内に複数の\`order\`要素を含みます
- 各\`order\`要素は\`attackTarget\`、\`deploymentTarget\`、\`defenseCrystal\`、\`reviveAllyUnit\`のいずれかの形式を持ちます
- \`attackTarget\`は敵ユニットを攻撃する命令で、\`entityId\`と\`targetEnemyTypeId\`が必要です
- \`deploymentTarget\`は建物への配置命令で、\`entityId\`と\`targetStructureId\`が必要です
- \`defenseCrystal\`はクリスタル防衛命令で、\`entityId\`が必要です
- \`reviveAllyUnit\`は味方ユニットの蘇生命令で、\`entityId\`が必要です

どちらかの形式で有効なXMLを生成してください。
`;
  }

  /**
   * Convert game state to a formatted string for the LLM
   */
  private formatGameState(gameState: GameState): string {
    let text = "";

    // 味方ユニット
    text += "## 味方ユニット\n";
    text += "### ユニット一覧\n";
    text += "```csv\n";
    text += "unitId(string), status(string)\n";

    for (const unit of gameState.allyUnits) {
      text += `"${unit.id}", "${unit.status}"\n`;
    }
    text += "```\n";

    // 敵ユニットタイプ
    text += "## 敵ユニットタイプ\n";
    text += "```csv\n";
    text += "unitTypeId(string), unitTypeName(string)\n";

    for (const unitType of gameState.enemyUnitTypes) {
      text += `"${unitType.id}", "${unitType.name}"\n`;
    }
    text += "```\n";

    // 建物（ある場合のみ）
    if (gameState.structures && gameState.structures.length > 0) {
      text += "## 建物\n";
      text += "```csv\n";
      text += "id(string)\n";
      
      for (const structure of gameState.structures) {
        text += `"${structure.id}"\n`;
      }
      text += "```";
    }

    return text;
  }

  /**
   * Create the full prompt to send to the LLM
   */
  public createPrompt(gameState: GameState, userPrompt: string): string {
    const systemPrompt = this.createSystemPrompt();
    const schemaDescription = this.createSchemaDescription();
    const formattedGameState = this.formatGameState(gameState);
    
    return `#システムプロンプト
${systemPrompt}

#出力フォーマット
${schemaDescription}

#現在のゲーム状況
${formattedGameState}

#ユーザプロンプト
${userPrompt}

#出力
以下のXML形式で命令を出力してください。スキーマの定義に従い、できるだけllmOutputルート要素を使用してください：

推奨する出力例：
\`\`\`xml
<llmOutput>
  <orders>
    <order>
      <attackTarget>
        <entityId>ally-1</entityId>
        <targetEnemyTypeId>enemy-type-1</targetEnemyTypeId>
      </attackTarget>
    </order>
    <order>
      <deploymentTarget>
        <entityId>ally-2</entityId>
        <targetStructureId>structure-1</targetStructureId>
      </deploymentTarget>
    </order>
  </orders>
</llmOutput>
\`\`\`
`;
  }

  /**
   * Transform old order format to new LLMOutput format
   */
  private transformOldOrderFormat(orderObj: any): Order[] {
    const orders: Order[] = [];
    
    // Process target orders
    if (orderObj.target) {
      if (orderObj.target.enemy && orderObj.target.enemy.id) {
        orders.push({
          entityId: orderObj.target.enemy.id,
          targetEnemyTypeId: orderObj.target.enemy.id
        } as AttackTargetOrder);
      }
      
      if (orderObj.target.structure && orderObj.target.structure.id) {
        orders.push({
          entityId: "ally-unit", // Placeholder, should be replaced
          targetStructureId: orderObj.target.structure.id
        } as DeploymentTargetOrder);
      }
    }
    
    // Process create orders (simplified)
    if (orderObj.create && orderObj.create.unit) {
      const units = Array.isArray(orderObj.create.unit) ? 
        orderObj.create.unit : [orderObj.create.unit];
      
      units.forEach(unit => {
        if (unit.unitTypeId) {
          // This is a simplification, in a real system you'd map
          // create operations to the appropriate order types
          orders.push({
            entityId: unit.unitTypeId
          } as DefenseCrystalOrder);
        }
      });
    }
    
    return orders;
  }
  
  /**
   * Parse the LLM response to get a valid LLMOutput
   * Implements retry logic and validation
   */
  public async parseResponse(responseText: string): Promise<LLMOutput> {
    // Try to extract XML content from the response
    const xmlMatch = responseText.match(/```xml\s*([\s\S]*?)\s*```/) || 
                     responseText.match(/```\s*([\s\S]*?)\s*```/) || 
                     [null, responseText.trim()];
    
    let xmlContent = xmlMatch[1] || responseText;
    
    // Remove any commentary before or after the actual XML
    xmlContent = xmlContent.replace(/^[^<]+/, '').replace(/[^>]+$/, '');
    
    try {
      // Validate the XML
      const isValid = XMLValidator.validate(xmlContent);
      if (isValid !== true) {
        console.error("XML validation failed:", isValid.err);
        // Return a minimal valid object as fallback
        return { orders: [] };
      }
      
      // Parse XML to object
      const parsedObject = this.xmlParser.parse(xmlContent);
      
      // Handle both new LLMOutput format and old order format
      if (parsedObject.llmOutput && parsedObject.llmOutput.orders) {
        // New format directly matches our interface
        return parsedObject.llmOutput;
      } 
      else if (parsedObject.order) {
        // Old format - transform to new format
        return {
          orders: this.transformOldOrderFormat(parsedObject.order)
        };
      } 
      else {
        console.error("XML structure doesn't match expected format");
        return { orders: [] };
      }
    } catch (error) {
      console.error("Failed to parse LLM response as XML:", error);
      // Return a minimal valid object as fallback
      return { orders: [] };
    }
  }
}
