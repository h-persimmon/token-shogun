import { StrategyModule } from '@kiro-rts/vibe-strategy';
import { UnitModule } from '../unit/module';
import { TokenModule } from '../token/module';

/**
 * 命令に関するモジュール - vibe-strategy パッケージを利用した実装
 */
export class OrderModule {
  private readonly strategyModule: StrategyModule;

  /**
   * コンストラクタ
   */
  public constructor(
    /**
     * ユニットに関するモジュール
     */
    private readonly unitModule: UnitModule,

    /**
     * トークンに関するモジュール
     */
    private readonly tokenModule: TokenModule,
  ) {
    this.strategyModule = new StrategyModule();
  }

  /**
   * AIに命令してゲーム状況を更新する関数
   * @param userPrompt ユーザプロンプト
   */
  public async order(userPrompt: string): Promise<void> {
    // vibe-strategy パッケージを使用してゲーム状態を構築
    const gameState = StrategyModule.createGameStateFromLegacy(
      this.unitModule.allyUnitList,
      this.unitModule.enemyUnitList
    );

    // LLMに戦略を生成させる
    const strategy = await this.strategyModule.generateStrategy(
      gameState,
      userPrompt,
      "/api/order"
    );

    console.log("Generated strategy:", JSON.stringify(strategy, null, 2));
    
    // 戦略に基づいてゲーム状況を更新
    this.updateGameStatus(strategy);
    
    // トークンを消費
    await this.tokenModule.consumeToken(userPrompt);
  }

  /**
   * 戦略に基づいてゲーム状況を更新する関数
   * @param strategy 戦略オブジェクト
   */
  private updateGameStatus(strategy: any): void {
    try {
      // ユニット作成処理
      if (strategy.order.create?.unit) {
        const units = Array.isArray(strategy.order.create.unit)
          ? strategy.order.create.unit
          : [strategy.order.create.unit];
        
        for (const unit of units) {
          if (!unit.unitTypeId) {
            console.error("unitTypeId が見つかりません");
            continue;
          }

          // 仮実装：適当な座標でユニットを作成
          const position = {
            x: Math.floor(Math.random() * 10),
            y: Math.floor(Math.random() * 10),
          };

          try {
            this.unitModule.createAllyUnit(unit.unitTypeId, position);
            console.log(
              `味方ユニット ${unit.unitTypeId} を座標 (${position.x}, ${position.y}) に作成しました`,
            );
          } catch (error) {
            console.error(`ユニット作成エラー (${unit.unitTypeId}):`, error);
          }
        }
      }

      // target 処理
      if (strategy.order.target) {
        // 敵ユニットを目標とする場合
        if (strategy.order.target.enemy?.id) {
          const enemyId = strategy.order.target.enemy.id;
          console.log(`敵ユニット ${enemyId} を目標に設定しました`);
          // ここで実際の目標設定処理を行う
          // 例: this.unitModule.setTargetEnemy(enemyId);
        }
        
        // 建物を目標とする場合
        if (strategy.order.target.structure?.id) {
          const structureId = strategy.order.target.structure.id;
          console.log(`建物 ${structureId} を目標に設定しました`);
          // ここで実際の目標設定処理を行う
          // 例: this.unitModule.setTargetStructure(structureId);
        }
      }

      // 将来的な update 処理はここに追加
      if (strategy.order.update) {
        console.log("update 要素が見つかりましたが、現在は未実装です");
      }
    } catch (error) {
      console.error("戦略処理中にエラーが発生しました:", error);
    }
  }
}
