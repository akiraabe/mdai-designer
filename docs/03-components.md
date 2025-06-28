# コンポーネント設計・実装詳細

## 画面設計・データモデル設計の完全分離実装（2025年6月実装） 🎯

### 実装概要
**ビッグスイッチパターン**を採用し、画面設計書とデータモデル設計書の機能を完全に分離。散在していた条件分岐を一箇所に集約し、それぞれ専用のViewコンポーネントに完全委譲する革新的なアーキテクチャを実現。

### 実装済み機能

#### 1. ビッグスイッチ・ルーターパターン

**DocumentEditView.tsx（完全リファクタリング）**
```typescript
// 🎯 ビッグスイッチ: ドキュメントタイプによる完全分離
export const DocumentEditView: React.FC<DocumentEditViewProps> = ({
  document, project, onUpdateDocument, onGoBack
}) => {
  switch (document.type) {
    case 'screen':
      return <ScreenDocumentView {...props} />;
    case 'model':
      return <ModelDocumentView {...props} />;
    case 'api':
      return <ScreenDocumentView {...props} />; // 代替
    case 'database':
      return <ModelDocumentView {...props} />; // 代替
    default:
      return <ScreenDocumentView {...props} />; // フォールバック
  }
};
```

**革新点:**
- **単一責任**: ルーティングのみに特化（145行→91行に削減）
- **完全委譲**: 各専用Viewに100%処理を移譲
- **拡張性**: 新しいドキュメントタイプの追加が容易
- **保守性**: 条件分岐が散在せず一箇所に集約

#### 2. 画面設計書専用View（ScreenDocumentView）

**専用機能:**
- **表示条件**: Markdown編集（conditionsMarkdown）
- **画面イメージ**: モックアップアップロード（mockupImage）
- **項目定義**: スプレッドシート編集（spreadsheetData）
- **補足説明**: Markdown編集（supplementMarkdown）

**特徴:**
- **青系統UI**: 画面設計に特化したカラーテーマ
- **4タブ構成**: all/conditions/mockup/definitions
- **画面設計専用フック**: useDocumentStateの画面設計フィールドのみ使用

```typescript
// 画面設計書専用データ管理
const {
  conditionsMarkdown, supplementMarkdown, 
  spreadsheetData, mockupImage,
  setConditionsMarkdown, setSupplementMarkdown,
  setSpreadsheetData, setMockupImage
} = useDocumentState();
```

#### 3. データモデル設計書専用View（ModelDocumentView）

**専用機能:**
- **データモデル**: Mermaid ER図編集（mermaidCode）
- **補足説明**: Markdown編集（supplementMarkdown）

**特徴:**
- **オレンジ系統UI**: データモデル設計に特化したカラーテーマ
- **2タブ構成**: all/models（modelsタブでER図編集）
- **データモデル専用フック**: useDocumentStateのモデル設計フィールドのみ使用

```typescript
// データモデル設計書専用データ管理
const {
  supplementMarkdown, mermaidCode,
  setSupplementMarkdown, setMermaidCode
} = useDocumentState();
```

### 技術的革新点

#### 1. 責任分離の徹底

**Before（問題状況）**
```typescript
// 散在した条件分岐
if (document.type === 'screen') {
  // 画面設計処理がここに...
} else if (document.type === 'model') {
  // モデル設計処理がここに...
}
// 各所にif文が散在し、保守性が悪化
```

**After（解決後）**
```typescript
// ビッグスイッチによる完全分離
switch (document.type) {
  case 'screen': return <ScreenDocumentView />;
  case 'model': return <ModelDocumentView />;
}
// 一箇所でルーティング、各専用Viewで独立処理
```

#### 2. データフロー設計の最適化

**画面設計書データフロー:**
```
conditionsMarkdown → ConditionsSection
spreadsheetData → DefinitionsSection  
mockupImage → MockupSection
supplementMarkdown → SupplementSection
```

**データモデル設計書データフロー:**
```
mermaidCode → ModelsSection
supplementMarkdown → SupplementSection
```

#### 3. UI/UXの専門化

**視覚的区別:**
- **画面設計書**: 青系統カラー、画面アイコン、4セクション構成
- **データモデル設計書**: オレンジ系統カラー、データベースアイコン、2セクション構成

**機能特化:**
- **画面設計書**: スプレッドシート、画像アップロード、条件記述
- **データモデル設計書**: ER図エディタ、リレーション定義

### 実装ファイル構成

#### ルーター
- `DocumentEditView.tsx`: ビッグスイッチによる完全分離ルーター

#### 専用View
- `ScreenDocumentView.tsx`: 画面設計書専用View（青系統、4セクション）
- `ModelDocumentView.tsx`: データモデル設計書専用View（オレンジ系統、2セクション）

#### 共通コンポーネント（両Viewで使用）
- `SupplementSection.tsx`: 補足説明セクション
- `MarkdownEditor.tsx`: Markdown編集コンポーネント

#### 専用コンポーネント
- `ConditionsSection.tsx`: 画面設計書専用（表示条件）
- `MockupSection.tsx`: 画面設計書専用（画面イメージ）
- `DefinitionsSection.tsx`: 画面設計書専用（項目定義）
- `ModelsSection.tsx`: データモデル設計書専用（ER図）

### 技術仕様詳細

```typescript
// ビッグスイッチパターンの実装
export const DocumentEditView: React.FC<DocumentEditViewProps> = (props) => {
  const { document } = props;
  
  switch (document.type) {
    case 'screen':
      console.log('🖥️ 画面設計書専用Viewにルーティング');
      return <ScreenDocumentView {...props} />;
      
    case 'model':
      console.log('🗄️ データモデル設計書専用Viewにルーティング');
      return <ModelDocumentView {...props} />;
      
    default:
      console.warn('⚠️ 不明なドキュメントタイプ、画面設計書Viewで代替');
      return <ScreenDocumentView {...props} />;
  }
};

// 画面設計書専用データ管理
interface ScreenDocumentData {
  conditionsMarkdown: string;
  supplementMarkdown: string;
  spreadsheetData: any[];
  mockupImage: string | null;
}

// データモデル設計書専用データ管理
interface ModelDocumentData {
  supplementMarkdown: string;
  mermaidCode: string;
}
```

## CopilotKit統合による次世代AI設計アシスタント機能 🚀

### 実装概要
統合設計書システムにCopilotKitを統合し、**完全双方向のAIアシスタント機能**を実装。WebUIデータの読み取りからMarkdownへの書き込みまで、本格的なAI設計支援の基盤を構築。

### 実装済み機能

#### 1. 基本チャット機能
- **技術スタック**: `@copilotkit/react-core`, `@copilotkit/react-ui`
- **UI仕様**: 右下フローティング（525×1000px）、スムーズアニメーション
- **UX最適化**: 4行入力エリア、自動スクロール、ホバー効果

#### 2. WebUIデータアクセス機能（CopilotKitの核心価値）
```typescript
// 実装済みデータソース
interface DataAccess {
  conditionsMarkdown: string;     // 表示条件Markdown
  supplementMarkdown: string;     // 補足説明Markdown  
  spreadsheetData: any[];         // Fortune-Sheet全データ
  mockupImage: string | null;     // 画面モックアップ
}
```

**対応クエリ例:**
- 「現在のデータは？」→ 全体状況の詳細レポート
- 「スプレッドシートの中身」→ セルデータの表形式表示
- 「項目定義の詳細」→ A1形式でのセル内容表示

#### 3. コマンドシステム
```bash
/help    # ヘルプ表示
/status  # データ状況と完成度（％）表示
/data    # スプレッドシート全データ詳細
/write   # チャット履歴をMarkdownに書き込み
```

#### 4. 双方向データ連携（画期的な実装）
**📊 WebUI → Chat（データ読み取り）**
- リアルタイムでページ内容を解析
- セル数、文字数、データ有無等の状況分析
- スプレッドシートの行列構造解析

**📝 Chat → WebUI（データ書き込み）**
```markdown
### CopilotKitからの書き込み

**2024/12/14 14:30:25 のチャット履歴:**
- **👤 ユーザー**: 現在のデータは？
- **🤖 アシスタント**: 現在の設計書の状況をお伝えします...
- **👤 ユーザー**: /write
- **🤖 アシスタント**: ✅ チャット履歴を表示条件に書き込みました！

---
```

#### 5. フォローアップクエスチョン機能
- **定型質問ボタン**: ワンクリックで頻用質問を送信
- **ホバー効果**: 青いハイライトで視覚的フィードバック
- **レスポンシブ配置**: 入力エリア上部に最適配置

### 技術的革新点

#### データフロー設計
```
App.tsx ←→ ChatPanel.tsx
├── 📖 Read:  conditionsMarkdown, spreadsheetData, etc.
└── 📝 Write: onConditionsMarkdownUpdate()
```

#### 実装ファイル構成
- `src/App.tsx`: CopilotKitProvider設定、データ受け渡し
- `src/components/Common/ChatPanel.tsx`: AI機能の中核実装