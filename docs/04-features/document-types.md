# 設計書タイプシステム（2025年1月実装） 📚

## 実装概要
複数種類の設計書を統合管理するための**ドキュメントタイプシステム**を実装。画面設計書、データモデル設計書、API設計書、データベース設計書の4タイプを定義し、タイプ別の機能制御とUI表示を実現。

## 実装済み機能

### 1. ドキュメントタイプ定義
```typescript
export type DocumentType = 'screen' | 'model' | 'api' | 'database';

export interface DocumentTypeInfo {
  type: DocumentType;
  label: string;
  description: string;
  icon: string;
  defaultTabs: string[];
  status?: 'available' | 'development' | 'disabled';
  visible?: boolean;
}
```

### 2. タイプ別設定（2025年1月現在）
- **🖥️ 画面設計書** (`screen`): 完全利用可能
  - タブ: 表示条件、画面イメージ、項目定義、補足説明
  - 状態: `available` - 本番稼働中

- **🗄️ データモデル設計書（開発中）** (`model`): 部分利用可能
  - タブ: データモデル、補足説明
  - 状態: `development` - 基本機能実装済み、改良継続中
  - 機能: テキスト/ビジュアルER図編集、エンティティ管理

- **🔌 API設計書** (`api`): 非活性化
  - 状態: `disabled` - UI表示のみ、機能未実装
  - 表示: 「準備中」バッジ付きで選択不可

- **🗃️ データベース設計書** (`database`): 非表示
  - 状態: `visible: false` - 一時的に非表示

### 3. タイプ選択UI（DocumentTypeSelector）
- **カード形式選択**: アイコン、名前、説明付きの視覚的選択UI
- **状態表示バッジ**:
  - 🟡 「開発中」: 黄色バッジ（model）
  - 🔒 「準備中」: グレーバッジ（api）
- **非活性化制御**: disabled状態では選択不可＋視覚的フィードバック
- **詳細情報表示**: 選択時のタイプ別特徴説明

### 4. タブフィルタリングシステム
```typescript
// タイプに応じた表示タブの制御
export const shouldShowTab = (documentType: DocumentType, tabId: string): boolean => {
  const typeInfo = DOCUMENT_TYPES[documentType];
  return typeInfo?.defaultTabs.includes(tabId) ?? false;
};
```

**タブ表示例:**
- 画面設計書: 全体表示、表示条件、画面イメージ、項目定義、補足説明
- モデル設計書: 全体表示、データモデル、補足説明（表示条件を除外）

### 5. データモデル編集機能
**テキストエディタ（ModelTextEditor）**
- Markdownライクな記法でモデル定義
- エンティティ、フィールド、関係の構造化記述

**ビジュアルエディタ（ERDiagramEditor）**
- React Flow基盤のドラッグ&ドロップ式ER図編集
- エンティティノード、関係線、フィールド表示
- 追加/編集/削除機能

**統合管理（ModelsSection）**
- テキスト⇔ビジュアル モード切り替えトグル
- 統計表示（エンティティ数、リレーション数、総フィールド数）
- リアルタイム双方向同期

## 技術的実装

### データ永続化拡張
```typescript
export interface Document {
  // 既存フィールド
  id: string;
  name: string;
  type: DocumentType;  // 新規追加
  conditions: string;
  supplement: string;
  spreadsheet: any;
  mockup: string | null;
  // 新規フィールド
  domainModels?: DomainModel[];       // ドメインモデル定義
  modelRelationships?: ModelRelationship[];  // モデル関係定義
}
```

### 状態管理拡張
```typescript
// useDocumentState フック拡張
const {
  // 既存状態
  conditionsMarkdown, supplementMarkdown, spreadsheetData, mockupImage,
  // 新規状態
  domainModels, modelRelationships,
  setDomainModels, setModelRelationships
} = useDocumentState();
```

### コンポーネント構造
```
src/components/
├── Document/
│   ├── DocumentTypeSelector.tsx    # タイプ選択UI
│   └── DocumentEditView.tsx        # タイプ別表示制御
├── Model/
│   ├── ModelsSection.tsx          # モデル編集統合UI
│   ├── ModelTextEditor.tsx        # テキスト形式編集
│   ├── ERDiagramEditor.tsx        # ビジュアル形式編集
│   └── EntityNode.tsx             # エンティティノードコンポーネント
└── Navigation/
    └── TabNavigation.tsx          # タイプ別タブフィルタリング
```

## 開発進捗管理

### 完了済み（✅）
1. DocumentType型システム構築
2. DocumentTypeSelector UI実装
3. タブフィルタリング機能
4. データモデル編集（テキスト/ビジュアル）
5. Document型拡張（domainModels、modelRelationships）
6. ビジュアルエディタのエンティティ表示問題修正
7. 状態管理の完全統合

### 開発中（🟡）
- モデル設計書機能の改良・安定化
- ER図編集の高度機能（関係編集、検証等）

### 準備中（🔒）
- API設計書の機能実装
- データベース設計書の機能検討

### 非表示（非対応）
- データベース設計書（一時的に対象外）

## 今後の開発方針

### 短期目標（1-2週間）
1. モデル駆動AI生成機能の実装
2. ER図編集機能の高度化
3. モデル設計書の安定化

### 中期目標（1-2ヶ月）
1. API設計書機能の本格実装
2. 設計書間の参照・連携機能
3. エクスポート機能の拡充

### 長期目標（3-6ヶ月）
1. データベース設計書の機能実装
2. チーム協業機能
3. 設計書品質管理・レビュー機能