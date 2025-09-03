# リファクタリングタスク

## 特定された改善点

- [ ] AttackSystemの複雑な弾丸処理ロジックを分離
  - AttackSystemから弾丸関連の処理を独立したProjectileSystemに抽出
  - 弾丸の更新、衝突判定、エフェクト処理を専用システムに移動
  - AttackSystemは攻撃判定と弾丸生成のみに責任を限定し、単一責任原則を適用

- [ ] コンポーネント間の重複したユーティリティ関数を統合
  - attack-component.ts、targeting-system.ts、movement-system.tsで重複している距離計算ロジックを統合
  - 共通のMathUtilsモジュールを作成してcalculateDistance、normalizeVector等の関数を集約
  - 各コンポーネントとシステムで統一されたユーティリティ関数を使用するよう更新

- [ ] テストファイルの未使用インポートとモック設定を整理
  - frame-test-system.test.ts、targeting-system.test.ts等で未使用のインポートを削除
  - 重複するモックScene設定を共通のテストユーティリティに抽出
  - Biomeの警告を解消し、テストコードの可読性と保守性を向上