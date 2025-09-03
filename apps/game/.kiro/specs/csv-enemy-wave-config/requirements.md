# Requirements Document

## Introduction

現在のタワーディフェンスゲームでは、敵のwave出現設定がコード内にハードコーディングされています。この機能は、敵の種類、座標、タイミングをCSVファイルで外部設定できるようにし、ゲームデザイナーやプランナーがコードを変更することなく、敵のwave設定を調整できるようにします。

## Requirements

### Requirement 1

**User Story:** ゲームデザイナーとして、敵のwave設定をCSVファイルで管理したい。これにより、コードを変更することなく敵の出現パターンを調整できるようになる。

#### Acceptance Criteria

1. WHEN CSVファイルが指定されたフォーマットで作成される THEN システムはそのファイルを読み込んでwave設定を生成する SHALL
2. WHEN CSVファイルに敵の種類、出現数、出現間隔、遅延時間、スポーン座標が記載される THEN システムはその情報を正しく解析する SHALL
3. WHEN CSVファイルが存在しない場合 THEN システムはデフォルトのwave設定を使用する SHALL

### Requirement 2

**User Story:** ゲームプランナーとして、複数のwaveを一つのCSVファイルで管理したい。これにより、ゲーム全体の難易度カーブを一元管理できるようになる。

#### Acceptance Criteria

1. WHEN CSVファイルに複数のwave番号が記載される THEN システムは各waveを個別に管理する SHALL
2. WHEN 同じwave番号で複数の敵タイプが設定される THEN システムはそれらを同一wave内で順次出現させる SHALL
3. WHEN wave番号が連続していない場合 THEN システムは存在するwave番号のみを有効とする SHALL

### Requirement 3

**User Story:** 開発者として、CSVファイルの読み込みエラーを適切に処理したい。これにより、設定ファイルに問題があってもゲームがクラッシュしないようになる。

#### Acceptance Criteria

1. WHEN CSVファイルの形式が不正な場合 THEN システムはエラーログを出力してデフォルト設定を使用する SHALL
2. WHEN CSVファイルに存在しない敵タイプが記載される THEN システムはその行をスキップしてエラーログを出力する SHALL
3. WHEN CSVファイルに数値以外が数値フィールドに記載される THEN システムはその行をスキップしてエラーログを出力する SHALL

### Requirement 4

**User Story:** ゲームデザイナーとして、スポーン座標を柔軟に設定したい。これにより、マップに応じた最適な敵出現位置を設定できるようになる。

#### Acceptance Criteria

1. WHEN CSVファイルにスポーン座標（x, y）が記載される THEN システムはその座標を敵の出現位置として使用する SHALL
2. WHEN 複数のスポーン座標が同一wave内で設定される THEN システムはそれらを順番に使用する SHALL
3. WHEN スポーン座標が設定されていない場合 THEN システムはデフォルトのスポーン座標を使用する SHALL

### Requirement 5

**User Story:** 開発者として、CSVファイルの変更を実行時に反映したい。これにより、開発中にファイルを変更してすぐにテストできるようになる。

#### Acceptance Criteria

1. WHEN CSVファイルが変更される THEN システムは次回のwave開始時に新しい設定を読み込む SHALL
2. WHEN 実行中にCSVファイルが削除される THEN システムはデフォルト設定に切り替える SHALL
3. WHEN CSVファイルの再読み込みが要求される THEN システムは現在のwave設定をリセットして新しい設定を適用する SHALL