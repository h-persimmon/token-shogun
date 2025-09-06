# 動かし方

## UI + gameで動かす


1. 全パッケージの依存関係をインストールする。
```
pnpm i
```

2. プロジェクトルートで以下のコマンドを実行する。
```
pnpm dev
```

3. /stages以下で、ゲームが遊べる

# monorepo構成について

<!-- taskによる/publicのコピー -->

このリポジトリは、monorepo構成になっています。
- apps/platform: UI部分/Next.js
- apps/game: ゲームエンジン部分/vite

apps/game/public以下に、ゲームの設定ファイルやアセットが配置されています。これらのファイルは、apps/platform/public以下にコピーされ、Next.jsでも動作するようになっています。