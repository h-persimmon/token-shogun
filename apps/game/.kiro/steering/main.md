# エージェントとしての大原則
 * チャットの会話は日本語で行うようにしてください
 * `npm i`などの環境構築を自身で実施しないようにしてくだい（他の方法を考えるようにしてください）

# アーキテクチャ構成
このレポジトリは、ECSアーキテクチャで構成されたreal-time strategy ゲームです。

 * 構成Component
   * TargetComponent: Entityが向かう先（Target）を指定します。
   * MovementComponent: phaser-navmeshを利用した移動先の解決を行います。
   * StructureComponent: 味方の城や大砲等の施設を管理します。
   * HealthComponent: 体力を管理します
   * AttackComponent: 攻撃動作を管理します
   * PositionComponent: ユニットの位置を管理します
 * 構成System
   * TargetingSystem: Entityの目標を管理します
   * MovementSystem: 移動を実行します
   * AttackSystem: 攻撃を実行します
   * EnemySystem: 敵の登場を管理します
   * GameStateSystem: ゲームの開始・終了判定を行います 
 * その他のモジュール
   * ObjectPool: 計算効率良くEntityやComponentを管理します

# 使用フレームワーク

 * next.js: 15.5.0
 * phaser.js: ^3.90.0
