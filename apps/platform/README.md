# README

## 実行手順

- AWS Bedrock APIキーを発行
  - 短期キー推奨
- `.env.sample`を参考に`.env`を作成
  - BEDROCK_API_KEYだけ変えれば他はデフォルトでOK
- `npm install`
- `npm run db:migrate`
  - DB作成・初期値挿入
- `npm run dev`

## ゲーム画面

- 開発者モードを開く（デバッグ用にプロンプトをみるため）
- プロンプトを入力
  - 例
    - 「侍と忍者を配置して」
    - 「侍2」
    - 「samurai and ninja」
  - 備考
    - 現在は配置のみ
    - 侍、忍者、銃使いがある

## その他

- `npm run lint`
  - CLIでESLintが動く
  - 一部カスタム設定あり（eslint.config.mjs）
  - `npm run build`か何かで自動で走る
- `npm run format`
  - CLIでPrettierが動く
  - 設定は全部デフォルト（prettier.config.mjs）
  - 自動では走らない
