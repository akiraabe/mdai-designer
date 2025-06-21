# 現代版 E2E テストスイート (2025年6月版)

統合設計書システムの**現在のアーキテクチャ**に完全対応したE2Eテストスイートです。

## 🎯 **テスト対象システム**

### アーキテクチャ対応
- **3階層構造**: App → ProjectListView → DocumentListView → DocumentEditView
- **設計書タイプシステム**: screen/model/api/database の4タイプ対応
- **ビッグスイッチパターン**: DocumentEditViewによる完全分離ルーティング

### 対応機能
- ✅ **プロジェクト管理**: 作成・削除・選択・ナビゲーション
- ✅ **設計書ライフサイクル**: 作成・編集・保存・削除
- ✅ **設計書タイプシステム**: タイプ別UI・機能・タブフィルタリング
- ✅ **データ永続化**: 自動保存・データ復元
- ✅ **レスポンシブUI**: 画面サイズ対応・ユーザビリティ

### 非対応機能（意図的除外）
- ❌ **AI機能**: @メンション、修正提案システム（コスト・CI制約のため後回し）
- ❌ **ChatPanel**: AI統合機能（手動テスト対象）
- ❌ **バックアップマネージャー**: 高度機能（Phase 2対象）

## 📁 **テストファイル構成**

```
current/
├── shared/
│   └── test-helpers.ts          # 現代版テストヘルパークラス
├── project-management.spec.ts   # プロジェクト管理機能テスト
├── document-lifecycle.spec.ts   # 設計書ライフサイクルテスト
├── document-types.spec.ts       # 設計書タイプシステムテスト
└── README.md                    # このファイル
```

## 🚀 **実行方法**

### 前提条件
```bash
# メインアプリケーションの開発サーバー起動
cd ..
npm run dev  # http://localhost:5173
```

### テスト実行
```bash
# ディレクトリへ移動
cd e2e-tests

# 全テスト実行
npm test

# 特定テストファイル実行
npx playwright test project-management.spec.ts
npx playwright test document-lifecycle.spec.ts
npx playwright test document-types.spec.ts

# デバッグモード実行
npx playwright test --debug

# ヘッドフルモード実行（ブラウザ表示）
npx playwright test --headed
```

### レポート確認
```bash
# HTMLレポート表示
npx playwright show-report

# 生成されるファイル
# - test-results/index.html
# - screenshots/*.png
```

## 🎬 **テスト内容詳細**

### 1. プロジェクト管理機能 (project-management.spec.ts)
- プロジェクト作成と基本ナビゲーション
- プロジェクト選択と再ナビゲーション
- 複数プロジェクト管理
- プロジェクト削除機能
- プロジェクト作成フォームバリデーション

### 2. 設計書ライフサイクル (document-lifecycle.spec.ts)
- 画面設計書の完全ライフサイクル
- データモデル設計書の完全ライフサイクル
- 複数設計書の管理と選択
- 設計書削除機能
- 設計書データ永続化テスト
- 設計書作成フォームバリデーション

### 3. 設計書タイプシステム (document-types.spec.ts)
- 設計書タイプ選択UIの動作確認
- 画面設計書タイプの専用機能確認
- データモデル設計書タイプの専用機能確認
- API設計書タイプの状態確認
- データベース設計書タイプの状態確認
- タイプ間の機能分離確認
- ビッグスイッチパターンによる完全分離の動作確認

## 🔧 **技術的特徴**

### ModernTestHelpers クラス
```typescript
// 現代版アーキテクチャに完全対応
class ModernTestHelpers {
  // 3階層ナビゲーション対応
  async createProject(name: string, description?: string)
  async createDocument(name: string, type: 'screen' | 'model' | 'api' | 'database')
  
  // 設計書タイプシステム対応
  async selectDocumentType(type: DocumentType)
  async verifyScreenDocumentView()
  async verifyModelDocumentView()
  
  // 改良されたデータ永続化テスト
  async editMarkdown(content: string, sectionType: 'conditions' | 'supplement')
  async saveDocument()
}
```

### data-testid戦略
CLAUDE.mdの実装仕様に基づく適切なセレクター使用:
- `[data-testid="spreadsheet-container"]`: スプレッドシートコンポーネント
- `[data-testid="conditions-markdown-editor"]`: 表示条件エディタ
- `[data-testid="supplement-markdown-editor"]`: 補足説明エディタ

### スクリーンショット戦略
- **フルページ**: 全画面の状態を記録
- **段階的記録**: 各操作後の状態を詳細記録
- **デバッグ支援**: 失敗時の状況把握

## ⚠️ **注意事項**

### AI機能の除外理由
- **コスト制約**: LLMトークン使用による実行コスト
- **CI/CD制約**: 外部API依存による不安定性
- **手動テスト推奨**: AI機能は手動でのUXテストが重要

### レガシーテストとの違い
- **完全非互換**: legacy/テストは実行禁止
- **アーキテクチャ前提**: 現在の3階層構造専用
- **機能特化**: 各設計書タイプの専門機能に対応

## 📊 **テスト品質保証**

### カバレッジ
- ✅ **基本フロー**: プロジェクト作成→設計書作成→編集→保存
- ✅ **例外処理**: バリデーションエラー・削除確認
- ✅ **ナビゲーション**: 階層間移動・戻る操作
- ✅ **永続化**: データ保存・復元・整合性

### 安定性確保
- **適切な待機**: `waitForTimeout`, `waitForLoadState`
- **要素存在確認**: `expect().toBeVisible()`
- **エラーハンドリング**: `.catch(() => false)`
- **リトライ機能**: Playwright設定でリトライ有効

## 🎉 **実行後の期待結果**

このテストスイートにより以下が保証されます：

1. **基本機能の完全動作**: プロジェクト・設計書管理の全機能
2. **設計書タイプシステムの正常動作**: 各タイプの専用機能分離
3. **データ整合性**: 保存・読み込み・編集の正確性
4. **ユーザビリティ**: 直感的なナビゲーション・フォームバリデーション

**結果**: 統合設計書システムの品質と信頼性が実証され、企業レベルでの安心利用が可能になります。
