# Implementation Plan

- [ ] 1. 基本的なユニット情報データ構造とユーティリティ関数を実装
  - UnitInfoData インターフェースとユニット情報抽出関数を作成
  - エンティティからユニット情報を取得するヘルパー関数を実装
  - ユニットタイプ判定ロジックを実装
  - _Requirements: 2.1, 2.2_

- [x] 2. RangeVisualizerクラスを実装
  - 射程円の描画機能を実装
  - 射程表示の表示/非表示切り替え機能を実装
  - 射程円の色とスタイルのカスタマイズ機能を実装
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. PopupRendererクラスを実装
  - ポップアップUIコンテナの作成機能を実装
  - ユニット情報の表示レイアウト機能を実装
  - ポップアップの位置調整機能（画面外回避）を実装
  - _Requirements: 2.1, 2.2, 4.1, 4.2_

- [x] 4. UnitInfoPopupSystemクラスを実装
  - システムの基本構造とコンストラクタを実装
  - ポップアップ表示機能（showUnitInfo）を実装
  - ポップアップ非表示機能（hideUnitInfo）を実装
  - エラーハンドリングとリソース管理を実装
  - _Requirements: 1.1, 1.2, 1.3, 4.3_

- [x] 5. InteractionSystemを拡張してユニットクリック処理を追加
  - 既存のInteractionSystemにユニットクリック検出機能を追加
  - ユニットスプライトのインタラクティブ設定を実装
  - クリック時のUnitInfoPopupSystem呼び出し処理を実装
  - _Requirements: 1.1_

- [x] 6. GameSceneにUnitInfoPopupSystemを統合
  - GameSceneのinitializeSystemsメソッドにUnitInfoPopupSystemを追加
  - システムの更新ループ（updateSystems）に組み込み
  - クリーンアップ処理（cleanupSystems）に追加
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 7. 背景クリック時のポップアップ非表示機能を実装
  - GameSceneに背景クリック検出機能を追加
  - 背景クリック時のUnitInfoPopupSystem.hideUnitInfo呼び出しを実装
  - ユニットクリックと背景クリックの優先度管理を実装
  - _Requirements: 1.2, 1.3_

- [] 8. アニメーション効果を実装
  - ポップアップ表示時のフェードイン効果を実装
  - ポップアップ非表示時のフェードアウト効果を実装
  - ポップアップ切り替え時のスムーズな遷移効果を実装
  - _Requirements: 5.1, 5.2, 5.3_
