# Implementation Plan

- [x] 1. MovementComponentに戦闘関連フィールドを追加
  - MovementComponentに`isStoppedForCombat`、`originalTarget`、`stunEndTime`フィールドを追加
  - 既存のMovementComponentの型定義を拡張
  - _Requirements: 1.1, 1.4, 2.1, 2.2_

- [x] 2. スタン設定データ構造を実装
  - `StunConfig`インターフェースを定義
  - `CombatRangeConfig`インターフェースを定義
  - デフォルト設定値をconstants.tsに追加
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. MovementSystemに攻撃範囲停止機能を実装
  - 攻撃範囲内での自動停止ロジックを追加
  - 攻撃範囲から外れた際の移動再開ロジックを追加
  - 戦闘状態フラグの管理機能を実装
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. MovementSystemにスタン効果機能を実装
  - HealthComponentから攻撃履歴を取得する機能を追加
  - スタン状態の判定と適用ロジックを実装
  - スタン中の移動制限機能を実装
  - スタン時間経過後の復帰処理を実装
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 5. AttackSystemでスタン効果を適用
  - 攻撃時にHealthComponentに攻撃履歴を記録する機能を拡張
  - ダメージ適用時のタイムスタンプ記録を確実にする
  - _Requirements: 2.1, 3.3_
