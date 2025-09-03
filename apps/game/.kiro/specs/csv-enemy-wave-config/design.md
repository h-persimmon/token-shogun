# Design Document

## Overview

CSV Enemy Wave Configuration機能は、既存のEnemySpawnSystemを拡張し、CSVファイルから敵のwave設定を読み込む機能を追加します。この機能により、ゲームデザイナーはコードを変更することなく、敵の出現パターンを調整できるようになります。

## Architecture

### 既存システムとの統合

現在のEnemySpawnSystemは`EnemyWaveConfig`型を使用してwave設定を管理しています。新しいCSV設定機能は、CSVファイルを読み込んで`EnemyWaveConfig`配列に変換するレイヤーを追加します。

```
CSVファイル → CSVWaveConfigLoader → EnemyWaveConfig[] → EnemySpawnSystem
```

### CSVファイル形式

CSVファイルは以下の形式で定義されます：

```csv
waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY
1,basic,5,2000,0,3,8
1,basic,3,2000,0,3,9
2,basic,8,1500,0,3,8
2,fast,3,3000,5000,3,9
3,basic,10,1000,0,3,8
3,fast,5,2000,3000,3,9
3,heavy,2,5000,10000,3,8
```

### ファイル配置

CSVファイルは`public/config/enemy-waves.csv`に配置され、ブラウザから直接アクセス可能にします。

## Components and Interfaces

### 1. CSVWaveConfigLoader

CSVファイルの読み込みと解析を担当するクラスです。

```typescript
export class CSVWaveConfigLoader {
  private csvFilePath: string;
  private cachedConfigs: EnemyWaveConfig[] | null;
  private lastModified: number;

  constructor(csvFilePath: string = '/config/enemy-waves.csv');
  
  public async loadWaveConfigs(): Promise<EnemyWaveConfig[]>;
  public async reloadIfChanged(): Promise<EnemyWaveConfig[] | null>;
  private parseCSVContent(csvContent: string): EnemyWaveConfig[];
  private validateCSVRow(row: CSVRow): boolean;
  private convertToWaveConfig(csvRows: CSVRow[]): EnemyWaveConfig[];
}
```

### 2. CSVRow型定義

CSVの各行を表現する型です。

```typescript
export type CSVRow = {
  waveNumber: number;
  enemyType: EnemyType;
  count: number;
  spawnInterval: number;
  spawnDelay: number;
  spawnX: number;
  spawnY: number;
};
```

### 3. EnemySpawnSystem拡張

既存のEnemySpawnSystemにCSV設定読み込み機能を追加します。

```typescript
export class EnemySpawnSystem {
  private csvLoader: CSVWaveConfigLoader | null;
  
  // 新しいメソッド
  public async loadWaveConfigsFromCSV(csvFilePath?: string): Promise<boolean>;
  public async reloadCSVConfigsIfChanged(): Promise<boolean>;
  public setCSVConfigPath(csvFilePath: string): void;
}
```

### 4. CSVパーサーユーティリティ

軽量なCSVパース機能を提供します。

```typescript
export class SimpleCSVParser {
  public static parse(csvContent: string): string[][];
  public static parseWithHeaders(csvContent: string): Record<string, string>[];
  private static parseLine(line: string): string[];
  private static handleQuotedFields(line: string): string[];
}
```

## Data Models

### CSVファイルスキーマ

| フィールド名 | 型 | 必須 | 説明 |
|-------------|----|----|------|
| waveNumber | number | Yes | ウェーブ番号（1から開始） |
| enemyType | string | Yes | 敵タイプ（basic, fast, heavy） |
| count | number | Yes | 出現数 |
| spawnInterval | number | Yes | 出現間隔（ミリ秒） |
| spawnDelay | number | Yes | 出現遅延（ミリ秒） |
| spawnX | number | Yes | スポーン座標X |
| spawnY | number | Yes | スポーン座標Y |

### 設定ファイル構造

```
public/
  config/
    enemy-waves.csv          # メインの敵wave設定
    enemy-waves-test.csv     # テスト用設定
    enemy-waves-hard.csv     # 高難易度設定
```

## Error Handling

### CSVファイル読み込みエラー

1. **ファイルが存在しない場合**
   - デフォルトのwave設定を使用
   - コンソールに警告メッセージを出力

2. **ネットワークエラー**
   - 3回まで再試行
   - 失敗時はデフォルト設定を使用

3. **CSVパースエラー**
   - 不正な行をスキップ
   - エラー詳細をコンソールに出力
   - 有効な行のみで設定を構築

### データ検証エラー

1. **不正な敵タイプ**
   - 該当行をスキップ
   - サポートされている敵タイプをログに出力

2. **不正な数値**
   - 該当行をスキップ
   - 期待される数値範囲をログに出力

3. **重複するwave設定**
   - 後から読み込まれた設定で上書き
   - 警告メッセージを出力

## Testing Strategy

### 1. 単体テスト

- **CSVWaveConfigLoader**
  - 正常なCSVファイルの読み込み
  - 不正なCSVファイルの処理
  - ファイル変更検知機能

- **SimpleCSVParser**
  - 基本的なCSVパース
  - クォート付きフィールドの処理
  - 特殊文字の処理

### 2. 統合テスト

- **EnemySpawnSystem + CSV設定**
  - CSV設定からのwave生成
  - 実行時設定変更
  - エラー時のフォールバック

### 3. エンドツーエンドテスト

- **ゲームシーン統合**
  - CSV設定を使用したゲーム実行
  - 複数wave設定の動作確認
  - パフォーマンス測定

### テストデータ

```csv
# test-waves-basic.csv
waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY
1,basic,3,1000,0,3,8

# test-waves-invalid.csv
waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY
1,invalid_type,3,1000,0,3,8
2,basic,invalid_count,1000,0,3,8

# test-waves-complex.csv
waveNumber,enemyType,count,spawnInterval,spawnDelay,spawnX,spawnY
1,basic,5,2000,0,3,8
1,basic,3,2000,0,3,9
2,basic,8,1500,0,3,8
2,fast,3,3000,5000,3,9
```

## Implementation Phases

### Phase 1: Core CSV Loading
- SimpleCSVParserの実装
- CSVWaveConfigLoaderの基本機能
- 基本的なエラーハンドリング

### Phase 2: EnemySpawnSystem Integration
- EnemySpawnSystemへのCSV機能統合
- 設定ファイルの動的読み込み
- デフォルト設定のフォールバック

### Phase 3: Advanced Features
- ファイル変更検知
- 複数設定ファイルサポート
- パフォーマンス最適化

### Phase 4: Testing and Polish
- 包括的なテストスイート
- エラーメッセージの改善
- ドキュメント整備

## Performance Considerations

### ファイル読み込み最適化

1. **キャッシュ機能**
   - 一度読み込んだ設定をメモリにキャッシュ
   - ファイル変更時のみ再読み込み

2. **非同期読み込み**
   - ゲーム開始時の非同期読み込み
   - 読み込み中はデフォルト設定を使用

3. **パース最適化**
   - 軽量なCSVパーサーの使用
   - 不要な文字列操作の削減

### メモリ使用量

- CSVデータは解析後に破棄
- EnemyWaveConfig配列のみをメモリに保持
- 大量のwave設定でもメモリ使用量を最小限に抑制

## Security Considerations

### ファイルアクセス制限

- publicディレクトリ内のファイルのみアクセス可能
- 相対パス攻撃の防止
- ファイル拡張子の検証

### データ検証

- 全ての数値フィールドの範囲チェック
- 敵タイプの厳密な検証
- 座標値の妥当性確認

## Future Enhancements

### 1. 設定ファイル形式の拡張

- JSON形式のサポート
- YAML形式のサポート
- より複雑な設定項目の追加

### 2. 動的設定変更

- ゲーム実行中の設定リロード
- ホットリロード機能
- 設定変更のプレビュー機能

### 3. 設定エディタ

- ブラウザベースの設定エディタ
- ビジュアルなwave設計ツール
- 設定の妥当性チェック機能