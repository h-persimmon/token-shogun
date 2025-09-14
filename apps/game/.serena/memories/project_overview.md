# プロジェクト概要

## プロジェクトの目的
ECSアーキテクチャで構成されたリアルタイムストラテジー（RTS）ゲームの開発。Phaser.jsを使用したブラウザベースのゲーム。

## 技術スタック
- **フロントエンド**: React 19.1.0, Next.js (Vite使用)
- **ゲームエンジン**: Phaser.js 3.90.0
- **ナビゲーション**: phaser-navmesh 2.3.1
- **言語**: TypeScript 5
- **ビルドツール**: Vite 7.1.4
- **テスト**: Vitest
- **リンター/フォーマッター**: Biome 2.2.0
- **スタイリング**: Tailwind CSS 4
- **CSV解析**: PapaParse 5.5.3

## アーキテクチャ
### ECS（Entity Component System）構成
- **Components**: TargetComponent, MovementComponent, StructureComponent, HealthComponent, AttackComponent, PositionComponent
- **Systems**: TargetingSystem, MovementSystem, AttackSystem, EnemySystem, GameStateSystem
- **その他**: ObjectPool（効率的なEntity/Component管理）

## プロジェクト構造
```
src/
├── app/                    # Next.js App Router
├── lib/game/              # ゲームロジック
│   ├── components/        # ECSコンポーネント
│   ├── system/           # ECSシステム
│   ├── entities/         # エンティティ管理
│   ├── csv/              # CSV設定ローダー
│   ├── scene/            # Phaserシーン
│   └── ui/               # UI関連
└── types/                # 型定義
```