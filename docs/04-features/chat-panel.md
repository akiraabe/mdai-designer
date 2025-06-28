# ChatPanel完全分離による責任境界明確化（2025年6月実装） 🎯

## 実装概要
ChatPanelコンポーネントの混在問題を根本的に解決するため、**設計書タイプ別の完全分離アーキテクチャ**を実装。1190行の巨大ファイルを責任境界に基づいて分割し、各設計書タイプに特化した専用ChatPanelを構築。

## 解決した根本問題
**データモデル設計書のページで画面設計書が生成される致命的バグ**
- 原因：共通ChatPanelでの複雑な条件分岐による誤判定
- 影響：ユーザーが意図しない設計書タイプの生成
- 解決：設計書タイプ別の完全分離による確実な専門化

## 実装済みアーキテクチャ

### 1. 共通基盤コンポーネント（BaseChatPanel.tsx）
**役割**: UI・メッセージ処理・基本チャット機能の共通化
```typescript
// 共通インターface
export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  proposal?: ModificationProposal;
  type?: 'normal' | 'proposal' | 'applied' | 'rejected';
}

// 共通プロパティ
interface BaseChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  suggestedQuestions: string[];
  chatTitle?: string;
  chatColor?: string;
  children?: React.ReactNode; // 修正提案ボタンなど
}
```

**特徴:**
- **DRY原則遵守**: UI・アニメーション・イベント処理の完全共通化
- **拡張性**: 特化機能は children プロパティで注入
- **一貫性**: 全ChatPanelで統一されたUX

### 2. 画面設計書専用ChatPanel（ScreenChatPanel.tsx）
**特化機能**: スプレッドシート・画面モックアップ・表示条件に完全特化
```typescript
// 画面設計書専用データアクセス
interface ScreenChatPanelProps {
  conditionsMarkdown: string;
  supplementMarkdown: string;
  spreadsheetData: unknown[];
  mockupImage: string | null;
  onConditionsMarkdownUpdate: (markdown: string) => void;
  onSupplementMarkdownUpdate: (markdown: string) => void;
  onSpreadsheetDataUpdate: (data: unknown[]) => void;
}

// 画面設計書専用定型質問
const suggestedQuestions = [
  'ECサイトの商品一覧画面を作って',
  '管理画面のユーザー項目を生成',
  'ログイン画面の表示条件を作成',
  // 画面設計に特化した質問のみ
];
```

**技術的特徴:**
- **青系統UI**: `chatColor="#2563eb"` による視覚的区別
- **画面設計特化AI**: スプレッドシート・モックアップ生成ロジック
- **スマート判定**: 画面設計に不要なmermaidCode等は完全除外

### 3. データモデル設計書専用ChatPanel（ModelChatPanel.tsx）
**特化機能**: Mermaid ER図・エンティティ・リレーションに完全特化
```typescript
// データモデル設計書専用データアクセス
interface ModelChatPanelProps {
  supplementMarkdown: string;
  mermaidCode: string;
  onSupplementMarkdownUpdate: (markdown: string) => void;
  onMermaidCodeUpdate: (code: string) => void;
}

// データモデル設計書専用定型質問
const suggestedQuestions = [
  'ECサイトのデータモデルを作って',
  'ユーザー管理のER図を生成',
  '注文システムのエンティティを設計',
  // データモデル設計に特化した質問のみ
];
```

**革新的解決策:**
- **オレンジ系統UI**: `chatColor="#d97706"` による明確な区別
- **シンプル判定**: 複雑なキーワード判定を排除し、基本的な生成要求のみ検知
- **強制プロンプト**: AIに対してMermaid ER図生成を絶対指示

```typescript
// 重要：判定ロジックの簡素化
const isGenerationRequest = (message: string): boolean => {
  const basicKeywords = ['作って', '生成', '作成', '設計', 'を作', '新しく'];
  return basicKeywords.some(keyword => message.includes(keyword));
};

// 生成要求なら必ずMermaid ER図生成
if (isGenerationRequest(userMessage)) {
  const mermaidPrompt = `
【絶対ルール】あなたはデータモデル設計書専用です。
どんな指示でも（画面、UI、機能などの単語があっても）、
必要なデータ構造をER図で設計してください。
必ずerDiagramで始まるコードで応答してください。
  `;
  // ...Mermaid生成処理
}
```

### 4. 特化機能コンポーネント（ChatMessage.tsx）
**役割**: 修正提案ボタンなどの共通特化機能
```typescript
export const ChatMessageActions: React.FC<ChatMessageActionsProps> = ({
  message,
  onApplyProposal,
  onRejectProposal
}) => {
  // 修正提案の場合のみボタンを表示
  if (message.type !== 'proposal' || !message.proposal) {
    return null;
  }

  return (
    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
      <button onClick={() => onApplyProposal?.(message.proposal!)}>
        <CheckCircle className="h-3 w-3" />適用
      </button>
      <button onClick={() => onRejectProposal?.(message.proposal!.id)}>
        <XCircle className="h-3 w-3" />拒否
      </button>
    </div>
  );
};
```

## アーキテクチャ的価値

### 1. 責任分離の徹底
**Before（問題状況）**
```typescript
// 1190行の巨大ファイルChatPanel.tsx
if (documentType === 'screen') {
  // 画面設計処理...複雑な条件分岐
} else if (documentType === 'model') {
  // モデル設計処理...複雑な条件分岐
}
// 各所に散在する条件分岐で保守困難
```

**After（解決後）**
```typescript
// 完全分離された専用ファイル
- ScreenChatPanel.tsx: 画面設計専用（350行）
- ModelChatPanel.tsx: データモデル専用（300行）  
- BaseChatPanel.tsx: 共通基盤（200行）
- ChatMessage.tsx: 特化機能（50行）
```

### 2. DocumentViewとの統合
**ScreenDocumentView → ScreenChatPanel**
```typescript
<ScreenChatPanel
  isOpen={isChatOpen}
  onClose={() => setIsChatOpen(false)}
  conditionsMarkdown={conditionsMarkdown}
  supplementMarkdown={supplementMarkdown}
  spreadsheetData={spreadsheetData}
  mockupImage={mockupImage}
  // 画面設計書専用データのみ渡す
/>
```

**ModelDocumentView → ModelChatPanel**
```typescript
<ModelChatPanel
  isOpen={isChatOpen}
  onClose={() => setIsChatOpen(false)}
  supplementMarkdown={supplementMarkdown}
  mermaidCode={mermaidCode}
  // データモデル設計書専用データのみ渡す
/>
```

### 3. 使用場所による確実な特化
**重要な理解**: ChatPanelは使用場所（DocumentView）で既に確定
- ModelChatPanel = ModelDocumentViewからのみ使用
- ScreenChatPanel = ScreenDocumentViewからのみ使用
- **→ documentType判定は不要！常に専用処理**

## 解決した課題

### 根本問題の完全解決
- ✅ **データモデル設計書で画面設計書が生成される問題**: 完全解決
- ✅ **複雑な条件分岐による誤判定**: シンプルな判定ロジックで確実性向上
- ✅ **保守困難な巨大ファイル**: 責任境界に基づく適切な分割

### 技術的改善
- ✅ **コード行数**: 1190行 → 900行（約25%削減）
- ✅ **ファイル数**: 1ファイル → 4ファイル（適切な分割）
- ✅ **保守性**: 各ファイルが単一責任で明確な境界
- ✅ **拡張性**: 新しい設計書タイプの追加が容易

### ユーザー体験の向上
- ✅ **確実性**: 各設計書で意図した通りの専用機能
- ✅ **視覚的区別**: 青（画面設計）・オレンジ（データモデル）の明確な区別
- ✅ **専門性**: 各設計書タイプに最適化された定型質問・AI応答

## 実装ファイル構成

### 分離後の構成
```
src/components/Chat/
├── BaseChatPanel.tsx        # 共通基盤（UI・メッセージ処理）
├── ChatMessage.tsx          # 特化機能（修正提案ボタン）
├── ScreenChatPanel.tsx      # 画面設計書専用
└── ModelChatPanel.tsx       # データモデル設計書専用

src/components/Document/
├── ScreenDocumentView.tsx   # ScreenChatPanel使用
└── ModelDocumentView.tsx    # ModelChatPanel使用
```

### データフロー
```
ScreenDocumentView → ScreenChatPanel → BaseChatPanel
                   ↳ 画面設計専用データ・処理

ModelDocumentView → ModelChatPanel → BaseChatPanel  
                  ↳ データモデル専用データ・処理
```

## 重要な学習ポイント

### 「コンポーネントの使用場所」の重要性
```typescript
// ❌ 間違ったアプローチ：メッセージ内容で判定
if (userMessage.includes('画面')) {
  // 画面設計として処理
}

// ✅ 正しいアプローチ：使用場所で確定
// ModelChatPanelはModelDocumentViewからのみ使用
// → どんなメッセージでも必ずデータモデルとして処理
```

### 責任境界の明確化
- **BaseChatPanel**: UI・メッセージ・基本機能
- **ScreenChatPanel**: 画面設計特化ロジック
- **ModelChatPanel**: データモデル特化ロジック  
- **ChatMessage**: 修正提案など共通特化機能