# 推奨コマンド

## 開発コマンド
```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## コード品質
```bash
# リント実行
npm run lint

# リント修正
npm run lint:fix

# フォーマット
npm run format
```

## テスト
```bash
# テスト実行（ワンショット）
npm run test

# テスト実行（ウォッチモード）
npx vitest

# 特定のテストファイル実行
npx vitest src/lib/game/system/__tests__/attack-system.test.ts

# テスト実行（--run フラグ付き、終了可能）
npx vitest --run
```

## システムコマンド（macOS）
```bash
# ファイル一覧
ls -la

# ファイル削除
rm file.txt

# ディレクトリ削除
rm -rf dir

# ファイルコピー
cp source.txt destination.txt

# ディレクトリコピー
cp -r source destination

# ディレクトリ作成
mkdir -p dir

# ファイル内容表示
cat file.txt

# ファイル内検索
grep -r "search" *.txt
```