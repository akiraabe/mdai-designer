# E2Eテスト - 設計書エディタ

このディレクトリには、設計書エディタアプリケーションの End-to-End (E2E) テストが含まれています。

## 概要

PlaywrightとTypeScriptを使用して、実際のブラウザ環境でアプリケーションの主要機能を自動テストします。手動でのテストチェックリストを完全自動化し、リグレッション防止と品質確保を実現しています。

## セットアップ

### 初回セットアップ
```bash
cd e2e-tests
npm install
npx playwright install  # ブラウザのインストール
```

### 📋 重要：開発サーバーについて

**事前にアプリを起動する必要はありません！**

テスト実行時に以下が自動実行されます：
- ✅ メインアプリ（5173ポート）の自動起動
- ✅ 既に起動中の場合は既存サーバーを再利用
- ✅ テスト完了後の自動終了

手動でアプリを起動済みの場合でも問題ありません。

### ディレクトリ構造
```
e2e-tests/
├── README.md                    # このファイル
├── package.json                 # テスト専用の依存関係
├── playwright.config.ts         # Playwright設定
├── tests/
│   ├── spreadsheet-integration.spec.ts  # 統合テスト
│   └── utils/
│       └── test-helpers.ts      # テストヘルパークラス
├── screenshots/                 # スクリーンショット（git対象外）
├── downloads/                   # テストファイル（git対象外）
└── test-results/               # テスト結果（git対象外）
```

## テスト実行方法

### 基本的なテスト実行
```bash
# ヘッドレスモードで実行
npm run test

# ブラウザを表示して実行（推奨：開発時）
npm run test:headed

# デバッグモード（ステップ実行）
npm run test:debug

# テスト結果レポートを表示
npm run report
```

### 特定のテストのみ実行
```bash
# 統合テストのみ
npx playwright test -g "基本操作フロー"

# 編集モード切り替えテストのみ
npx playwright test -g "編集モード切り替え"
```

## テストシナリオ

### 1. 基本操作フロー：編集→保存→読み込み

**テスト対象操作：**
1. **初期表示確認** - アプリケーションの正常起動
2. **テストデータ読み込み** - 紫ボタンでサンプルデータ読み込み
3. **Markdown編集** - 補足説明エリアでのテキスト編集
4. **スプレッドシートエリア拡大** - ドラッグ&ドロップでリサイズ（拡大）
5. **スプレッドシートエリア縮小** - ドラッグ&ドロップでリサイズ（縮小）
6. **ファイル保存** - JSONファイルの自動ダウンロード
7. **画面リロード** - ブラウザリロードでの状態初期化
8. **ファイル読み込み** - 保存したJSONファイルの自動アップロード
9. **最終状態確認** - UI要素の表示確認

**実行時間：** 約16-18秒

### 2. 編集モード切り替えテスト

**テスト対象操作：**
1. **初期状態確認** - 表示モードでの起動
2. **編集モードに切り替え** - トグルスイッチ操作
3. **セル編集テスト** - Fortune-Sheetでのセル入力
4. **表示モードに戻す** - トグルスイッチで戻す

## テストで確認できること

### ✅ 機能的品質保証

**データ永続化**
- JSONファイルの保存・読み込みが正常に動作
- スプレッドシートデータの完全性が保持
- Markdownコンテンツの保存・復元が正常

**UI操作性**
- ドラッグ&ドロップによるリサイズ機能の動作
- モード切り替え（表示/編集）の正常動作
- ボタン操作とファイル処理の連携

**ブラウザ互換性**
- Chrome（Chromium）での動作確認
- ファイルダウンロード・アップロードのブラウザ処理
- JavaScriptエラーの検出

### ✅ 回帰テスト

**変更の影響範囲確認**
- コンポーネント修正による既存機能への影響検出
- ライブラリアップデート時の動作確認
- Fortune-Sheetの複雑な状態管理の安定性確認

**パフォーマンス監視**
- 各ステップの実行時間計測
- アプリケーション初期化時間の監視
- ファイル処理速度の確認

### ✅ ユーザビリティ検証

**実際のユーザー操作フロー**
- 典型的な作業パターンの自動実行
- 複数機能を組み合わせた実用的なシナリオ
- エラー状況の早期発見

## 出力とアーティファクト

### スクリーンショット
各テストステップで自動撮影される画面キャプチャ：
- `screenshots/01-initial-display-[timestamp].png`
- `screenshots/02-test-data-loaded-[timestamp].png`
- `screenshots/03-markdown-edited-[timestamp].png`
- `screenshots/04-resized-large-[timestamp].png`
- `screenshots/05-resized-small-[timestamp].png`
- `screenshots/06-after-save-[timestamp].png`
- `screenshots/07-after-reload-[timestamp].png`
- `screenshots/08-after-load-[timestamp].png`
- `screenshots/09-final-verification-[timestamp].png`

### テストファイル
- `downloads/playwright-test-[timestamp].json` - 保存・読み込みテスト用

### レポート
- HTMLレポート：`test-results/` ディレクトリ
- 失敗時の動画録画
- エラー発生時のトレース情報

## 開発者向け情報

### テスタビリティ向上施策

**data-testid属性の追加**
以下のコンポーネントにテスト用のID属性を追加済み：
- `[data-testid="spreadsheet-container"]` - SpreadsheetEditorコンテナ
- `[data-testid="edit-mode-toggle"]` - 編集モード切り替えスイッチ
- `[data-testid="resize-handle"]` - リサイズハンドル
- `[data-testid="save-button"]` - 保存ボタン
- `[data-testid="load-button"]` - 読み込みボタン
- `[data-testid="test-data-button"]` - テストデータボタン
- `[data-testid="markdown-editor-container"]` - Markdownエディタコンテナ

### テストヘルパー機能
`tests/utils/test-helpers.ts` に以下の共通機能を実装：
- フルページスクリーンショット撮影
- ファイル保存・読み込み処理
- リサイズ操作のドラッグ&ドロップ
- モード切り替え操作
- 複数要素選択戦略（フォールバック機能）

## トラブルシューティング

### よくある問題

**タイムアウトエラー**
```bash
# タイムアウト時間を延長
npx playwright test --timeout=60000
```

**要素が見つからない**
- data-testid属性が正しく設定されているか確認
- CSS セレクタの変更がないか確認

**ファイル操作エラー**
- downloadsディレクトリの権限確認
- ブラウザのダウンロード設定確認

### デバッグ方法

**ステップ実行**
```bash
npm run test:debug
```

**特定ステップでの停止**
```typescript
await page.pause(); // テストコードに追加
```

**詳細ログ確認**
```bash
DEBUG=pw:api npx playwright test
```

## CI/CD統合

このテストは将来的にCI/CDパイプラインに統合可能な構造で設計されています：

**GitHub Actions向け設定例：**
```yaml
- name: Run E2E tests
  run: |
    cd e2e-tests
    npm ci
    npx playwright install --with-deps
    npm run test
```

**Docker対応：**
Playwrightの公式Dockerイメージを使用可能：
```dockerfile
FROM mcr.microsoft.com/playwright:v1.53.0-focal
```

## 今後の拡張予定

- **クロスブラウザテスト** - Firefox、Safari対応
- **モバイルデバイステスト** - レスポンシブ対応確認
- **アクセシビリティテスト** - WCAG準拠確認
- **パフォーマンステスト** - Core Web Vitals計測
- **ビジュアルリグレッションテスト** - UI変更の自動検出