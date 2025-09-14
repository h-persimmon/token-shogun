# Design Document

## Overview

この機能は、ユニットの戦闘時の移動動作を改善し、より戦略的で直感的なゲームプレイ体験を提供します。主な改善点は以下の通りです：

1. **攻撃範囲停止機能**: ユニットが攻撃範囲の端に到達したら自動的に移動を停止
2. **攻撃時スタン機能**: ユニットが攻撃を受けた時に一定時間移動をキャンセル
3. **視覚的フィードバック**: ユニットの状態変化を視覚的に表示

## Architecture

### 既存システムとの統合

この機能は既存のECSアーキテクチャに統合され、以下のシステムと連携します：

- **MovementSystem**: 移動の停止・再開制御
- **AttackSystem**: 攻撃範囲の判定とスタン効果の適用
- **TargetingSystem**: 攻撃範囲内での目標選択

### 既存コンポーネントの活用

この機能では新規コンポーネントを作成せず、既存のコンポーネントを拡張・活用します。

## Components and Interfaces

### 既存コンポーネントの拡張

#### MovementComponent の拡張
```typescript
// 既存のMovementComponentに以下のフィールドを追加
export type MovementComponent = Component<
  typeof movementComponentTag,
  {
    // ... 既存のフィールド
    isStoppedForCombat: boolean; // 戦闘のために停止中かどうか
    originalTarget?: Point; // 戦闘前の元の目標位置
    stunEndTime?: number; // スタン終了時刻
  }
>;
```

#### HealthComponent の活用
既存のHealthComponentから攻撃履歴を取得し、スタン効果の判定に使用します。HealthComponentには攻撃を受けた履歴が記録されているため、この情報を基にスタン効果を適用します。

#### AttackComponent の利用
既存のAttackComponentの`range`フィールドを使用して攻撃範囲を判定します。

### システム間のインターフェース

#### 既存システムの拡張
新しいシステムは作成せず、既存のMovementSystemとAttackSystemを拡張して戦闘時の移動制御を実装します：

- **MovementSystem**: 戦闘範囲での停止とスタン効果による移動制限を処理
- **AttackSystem**: HealthComponentから攻撃履歴を取得してスタン効果を適用

## Data Models

### スタン設定データ
```typescript
export interface StunConfig {
  defaultDuration: number; // デフォルト1秒
  unitTypeModifiers: Record<string, number>; // ユニットタイプ別の修正値
  visualEffectDuration: number; // 視覚効果の表示時間
}
```

### 攻撃履歴の活用
HealthComponentから取得する攻撃履歴の構造：
```typescript
// HealthComponentから取得される攻撃履歴情報
interface AttackHistory {
  lastDamageTime: number;
  lastAttackerId?: string;
  damageAmount: number;
}
```

### 戦闘範囲判定データ
```typescript
export interface CombatRangeConfig {
  stopThreshold: number; // 停止する距離の閾値（攻撃範囲の何%で停止するか）
  resumeThreshold: number; // 移動を再開する距離の閾値
  checkInterval: number; // 範囲チェックの間隔（ミリ秒）
}
```

## Error Handling

### エラーケースと対処法

1. **コンポーネント不足エラー**
   - 必要なコンポーネントが存在しない場合は警告ログを出力し、処理をスキップ
   - システムの安定性を保つため、エラーで停止しない

2. **無効なエンティティ参照**
   - 削除されたエンティティへの参照は自動的にクリア
   - 定期的なクリーンアップ処理を実装

3. **スタン状態の重複**
   - 既にスタン中のユニットに再度スタンが適用された場合、より長い時間を採用
   - スタン効果の重複による不具合を防止

4. **移動システムとの競合**
   - 戦闘による停止と通常の移動コマンドが競合した場合、戦闘状態を優先
   - 明確な優先順位を設定

## Implementation Details

### システム更新順序
1. AttackSystem (攻撃処理とHealthComponentへの履歴記録)
2. MovementSystem (HealthComponentから攻撃履歴を取得し、戦闘状態を更新して移動処理)
3. TargetingSystem (目標選択)


### 設定の管理
- ゲーム定数として設定値を管理
