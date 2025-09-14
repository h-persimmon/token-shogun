# Design Document

## Overview

ユニット情報ポップアップ機能は、プレイヤーがゲーム内のユニット（味方ユニット、味方ストラクチャー、敵）をクリックした際に、そのユニットの詳細情報を視覚的に表示する機能です。この機能は既存のECSアーキテクチャとPhaserフレームワークを活用し、GameSceneとInteractionSystemを拡張して実装します。

## Architecture

### システム構成

```
GameScene
├── UnitInfoPopupSystem (新規)
│   ├── PopupRenderer (ポップアップ表示管理)
│   ├── RangeVisualizer (射程表示管理)
│   └── ClickHandler (クリック処理)
├── InteractionSystem (拡張)
│   └── ユニットクリック処理の追加
└── 既存システム群
```

### データフロー

1. **クリック検出**: InteractionSystemがユニットクリックを検出
2. **情報収集**: UnitInfoPopupSystemがエンティティの各コンポーネントから情報を収集
3. **ポップアップ表示**: PopupRendererがUI要素を生成・配置
4. **射程表示**: RangeVisualizerが攻撃可能ユニットの射程円を描画
5. **状態管理**: 現在表示中のポップアップ状態を管理

## Components and Interfaces

### UnitInfoPopupSystem

```typescript
export class UnitInfoPopupSystem {
  private scene: Phaser.Scene;
  private entityManager: ReturnType<typeof createEntityManager>;
  private currentPopup: UnitInfoPopup | null = null;
  private rangeIndicator: Phaser.GameObjects.Graphics | null = null;
  
  constructor(scene: Phaser.Scene, entityManager: EntityManager);
  
  // ユニット情報ポップアップを表示
  showUnitInfo(entityId: string): void;
  
  // ポップアップを非表示
  hideUnitInfo(): void;
  
  // 射程表示を更新
  updateRangeDisplay(entityId: string): void;
  
  // システム更新処理
  update(): void;
  
  // システム破棄処理
  destroy(): void;
}
```

### UnitInfoPopup

```typescript
export interface UnitInfoPopup {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  titleText: Phaser.GameObjects.Text;
  infoTexts: Phaser.GameObjects.Text[];
  entityId: string;
}
```

### UnitInfoData

```typescript
export interface UnitInfoData {
  entityId: string;
  unitType: 'ally' | 'enemy' | 'structure';
  name?: string;
  health: {
    current: number;
    max: number;
  };
  attack?: {
    damage: number;
    range: number;
    attackType: string;
  };
  enemyType?: string; // 敵の場合の種別
}
```

### PopupRenderer

```typescript
export class PopupRenderer {
  private scene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene);
  
  // ポップアップUIを作成
  createPopup(data: UnitInfoData, position: { x: number; y: number }): UnitInfoPopup;
  
  // ポップアップ位置を調整（画面外回避）
  adjustPopupPosition(popup: UnitInfoPopup, targetPosition: { x: number; y: number }): void;
  
  // ポップアップを破棄
  destroyPopup(popup: UnitInfoPopup): void;
}
```

### RangeVisualizer

```typescript
export class RangeVisualizer {
  private scene: Phaser.Scene;
  private currentRangeGraphics: Phaser.GameObjects.Graphics | null = null;
  
  constructor(scene: Phaser.Scene);
  
  // 射程円を表示
  showRange(position: { x: number; y: number }, range: number, color?: number): void;
  
  // 射程表示を非表示
  hideRange(): void;
  
  // 射程表示を更新
  updateRange(position: { x: number; y: number }, range: number): void;
}
```

## Data Models

### ユニット情報の取得ロジック

```typescript
// エンティティからユニット情報を抽出
function extractUnitInfo(entity: Entity): UnitInfoData {
  const healthComponent = entity.components.health as HealthComponent;
  const attackComponent = entity.components.attack as AttackComponent;
  const structureComponent = entity.components.structure as StructureComponent;
  const enemyComponent = entity.components.enemy as EnemyComponent;
  
  return {
    entityId: entity.id,
    unitType: determineUnitType(entity),
    health: {
      current: healthComponent?.currentHealth || 0,
      max: healthComponent?.maxHealth || 0
    },
    attack: attackComponent ? {
      damage: attackComponent.damage,
      range: attackComponent.range,
      attackType: attackComponent.attackType
    } : undefined,
    enemyType: enemyComponent?.type || undefined
  };
}
```

## Error Handling

### エラーケースと対応

1. **無効なエンティティID**: エラーログ出力後、処理を中断
2. **コンポーネント不足**: デフォルト値で表示、警告ログ出力
3. **画面外配置**: 自動位置調整機能で画面内に配置
4. **重複表示**: 既存ポップアップを自動的に閉じてから新規表示
5. **メモリリーク**: 適切なクリーンアップ処理でリソース解放

### エラーハンドリング実装

```typescript
// エラー処理付きの情報表示
showUnitInfo(entityId: string): void {
  try {
    const entity = this.entityManager.getEntity(entityId);
    if (!entity) {
      console.warn(`UnitInfoPopupSystem: Entity not found: ${entityId}`);
      return;
    }
    
    // 既存ポップアップをクリーンアップ
    this.hideUnitInfo();
    
    // 新しいポップアップを表示
    this.displayPopup(entity);
  } catch (error) {
    console.error('UnitInfoPopupSystem: Error showing unit info:', error);
    this.hideUnitInfo(); // エラー時はクリーンアップ
  }
}
```

## Testing Strategy

### 単体テスト

1. **UnitInfoPopupSystem**
   - ポップアップ表示/非表示の動作確認
   - 無効なエンティティIDでのエラーハンドリング
   - 射程表示の正確性確認

2. **PopupRenderer**
   - UI要素の正確な生成確認
   - 位置調整ロジックの動作確認
   - メモリリークの検証

3. **RangeVisualizer**
   - 射程円の描画精度確認
   - 色とサイズの設定確認
   - 表示/非表示の切り替え確認

### 統合テスト

1. **クリック→ポップアップ表示フロー**
   - 各種ユニットタイプでの表示確認
   - 連続クリック時の動作確認
   - 別箇所クリック時の非表示確認

2. **射程表示との連携**
   - 攻撃可能ユニットでの射程表示確認
   - 攻撃不可ユニットでの非表示確認
   - ポップアップ閉じ時の射程非表示確認

3. **パフォーマンステスト**
   - 大量ユニット存在時の動作確認
   - 連続クリック時のメモリ使用量確認
   - フレームレート影響の測定

### テストケース例

```typescript
describe('UnitInfoPopupSystem', () => {
  test('味方ユニットクリック時にポップアップが表示される', () => {
    // テスト実装
  });
  
  test('敵ユニットクリック時に敵種別が表示される', () => {
    // テスト実装
  });
  
  test('攻撃可能ユニットクリック時に射程円が表示される', () => {
    // テスト実装
  });
  
  test('別箇所クリック時にポップアップが非表示になる', () => {
    // テスト実装
  });
});
```

## Implementation Notes

### 既存システムとの統合

1. **InteractionSystemの拡張**
   - 既存の構造物クリック処理を維持
   - ユニットクリック処理を追加
   - クリック優先度の管理

2. **GameSceneへの統合**
   - UnitInfoPopupSystemの初期化
   - 更新ループへの組み込み
   - クリーンアップ処理の追加

3. **パフォーマンス考慮**
   - ポップアップのオブジェクトプール利用
   - 不要な再描画の回避
   - メモリリークの防止

### UI/UXの考慮事項

1. **視覚的な配慮**
   - 適切なz-index設定でUI重複回避
   - 読みやすいフォントサイズと色
   - 背景の半透明化で下の情報も確認可能

2. **操作性の向上**
   - クリック範囲の適切な設定
   - ホバー効果による視覚的フィードバック
   - アニメーション効果による滑らかな表示

3. **アクセシビリティ**
   - 十分なコントラスト比の確保
   - 適切な文字サイズの設定
   - 色だけに依存しない情報表示