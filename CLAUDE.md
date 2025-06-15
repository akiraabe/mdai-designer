# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

統合設計書システム - 設計文書の編集・管理のためのWebアプリケーション。Markdown形式での条件記述、画像モックアップアップロード、スプレッドシート形式での項目定義編集機能を提供。

## 開発コマンド

### 開発環境
```bash
npm install          # 初回セットアップ
npm run dev          # 開発サーバー起動 (Vite)
npm run build        # 本番ビルド (TypeScript コンパイル + Vite ビルド)
npm run lint         # ESLint実行
npm run preview      # ビルド後のプレビュー
```

## アーキテクチャ

### 技術スタック
- **フロントエンド**: React 19 + TypeScript + Vite
- **スタイリング**: CSS + Tailwind CSS classes
- **アイコン**: Lucide React
- **主要依存関係**:
  - `@fortune-sheet/react`: スプレッドシート機能（本番稼働中）
  - `@uiw/react-md-editor`: Markdownエディタ（本番稼働中）

### アプリケーション構造
- **単一ページアプリケーション**: 設計文書の統合編集・管理
- **タブベースUI**: 4つのメイン機能（全体表示/表示条件/画面イメージ/項目定義）
- **状態管理**: カスタムフックで状態・ロジック分離
- **データ永続化**: JSON形式でローカルファイルシステムへ保存・読み込み
- **コンポーネント指向**: 機能別にコンポーネント分割、保守性・テスタビリティ向上

### アーキテクチャ構成（リファクタリング後）

#### カスタムフック（状態・ロジック管理）
- **useDocumentState**: Markdown・スプレッドシート・画像の状態管理
- **useTabNavigation**: タブ切り替え状態管理
- **useFileOperations**: JSON保存・読み込み・画像アップロード処理
- **useSpreadsheetOperations**: スプレッドシート操作・テストデータ読み込み
- **useInitialData**: 初期データ定数管理

#### UIコンポーネント
##### Header系
- **DocumentHeader**: タイトル・更新日時・作成者表示
- **ActionButtons**: 読み込み・保存・テストデータボタン

##### Navigation系  
- **TabNavigation**: タブ切り替えUI・アクティブ状態管理

##### Content系
- **ConditionsSection**: 表示条件Markdown編集セクション
- **MockupSection**: 画面イメージアップロード・表示セクション
- **DefinitionsSection**: 項目定義スプレッドシート編集セクション
- **SupplementSection**: 補足説明Markdown編集セクション

##### Common系（共通コンポーネント）
- **MarkdownSection**: セクションレイアウト・アイコン・タイトル
- **MarkdownEditor**: @uiw/react-md-editorラッパー
- **SpreadsheetEditor**: Fortune-Sheet Workbookラッパー

#### メインコンポーネント
- **App.tsx**: 各コンポーネント統合・条件レンダリングのみ（145行に削減）

### データフロー
```typescript
interface DocumentData {
  conditions: string;      // 表示条件 (Markdown)
  supplement: string;      // 補足説明 (Markdown) 
  spreadsheet: any;        // Fortune-Sheetの完全なJSON構造
  mockup: string | null;   // 画面モックアップ (Base64)
  timestamp: string;       // 保存日時
}
```

### 状態管理パターン（カスタムフック化）

#### useDocumentState
- **conditionsMarkdown**: 表示条件のMarkdownテキスト
- **supplementMarkdown**: 補足説明のMarkdownテキスト
- **spreadsheetData**: Fortune-Sheetのcelldata形式（配列）
- **mockupImage**: Base64エンコードされた画像データ

#### useTabNavigation  
- **activeTab**: 現在表示中のタブID（'all' | 'conditions' | 'mockup' | 'definitions'）

#### useFileOperations
- **handleImageUpload**: 画像ファイルアップロード処理
- **handleSave**: JSON形式でのドキュメント保存
- **handleLoad**: JSONファイル読み込み・データ復元

#### useSpreadsheetOperations
- **handleLoadTestData**: 紫ボタン・テストデータ読み込み
- ライブラリ乗り換え対応のための抽象化レイヤー

## 重要な実装注意点

### 日本語環境
- UIは完全に日本語で構築
- ドキュメント管理は日本語環境向け
- コンソールログも日本語併記

### 開発・保守性向上
- **段階的リファクタリング**: 初期615行→145行（約77%削減）
- **責任分離**: 状態管理・ビジネスロジック・UI表示の完全分離
- **再利用性**: 共通コンポーネント化によるDRY原則遵守
- **型安全性**: TypeScript型定義の一元管理
- **テスタビリティ**: カスタムフック・コンポーネント単位での独立テスト可能

### 推奨開発フロー
1. **新機能追加**: 対応するカスタムフックに処理追加→UIコンポーネント更新
2. **バグ修正**: 該当するフック・コンポーネントを特定→局所的修正
3. **ライブラリ変更**: Common系コンポーネントの実装のみ変更

## 重要：Fortune-Sheetコンポーネントのデータ更新問題対策

### 問題概要
Fortune-Sheetコンポーネント（SpreadsheetEditor）でデータを更新する際、以下の問題が発生する：
1. **チカチカ問題**: keyプロパティが変更されるとコンポーネントが再マウントされ、画面がチカチカする
2. **シート名問題**: シート名が同じ場合、データ内容が変わってもスプレッドシートの表示が更新されない

### 対策（必須）

#### 1. チカチカ問題の対策
**keyプロパティは絶対に固定化**
```typescript
// ❌ 絶対にやってはいけない
const componentKey = useMemo(() => {
  return `workbook-${Date.now()}`;
}, [data]);

// ✅ 正しい方法
const componentKey = 'workbook-fixed-key';
```

**データ更新はWorkbook APIを使用**
```typescript
// useEffectでWorkbook APIを使って直接データ更新
useEffect(() => {
  if (workbookRef.current && validData && validData.length > 0) {
    workbookRef.current.setData(validData);
  }
}, [validData]);
```

#### 2. シート名問題の対策（重要！）
**データ内容も含めたキー生成で確実な更新を保証**
```typescript
// ❌ シート名のみ（データ変更時に更新されない）
const componentKey = useMemo(() => {
  const sheetName = validData?.[0]?.name || 'default';
  return `workbook-${sheetName}`;
}, [validData?.[0]?.name]);

// ✅ データ内容も含める（推奨解決策）
const componentKey = useMemo(() => {
  const sheetName = validData?.[0]?.name || 'default';
  const cellCount = validData?.[0]?.celldata?.length || 0;
  const dataHash = JSON.stringify(validData?.[0]?.celldata?.slice(0, 5)) || '';
  return `workbook-${sheetName}-${cellCount}-${dataHash.length}`;
}, [validData?.[0]?.name, validData?.[0]?.celldata]);
```

### 問題の根本原因
**Reactのキー機能による制約**: Reactは同じキーのコンポーネントを再レンダリングしない。そのため：
- シート名が同じ → 同じキー → コンポーネント更新されない → データ変更が反映されない
- シート名が異なる → 異なるキー → コンポーネント再マウント → データ変更が反映される

### 実証済み解決策（最新版・推奨）
```typescript
// データ内容も含めたキー生成でデータ変更時の確実な更新を保証
const componentKey = useMemo(() => {
  const sheetName = validData?.[0]?.name || 'default';
  const cellCount = validData?.[0]?.celldata?.length || 0;
  const dataHash = JSON.stringify(validData?.[0]?.celldata?.slice(0, 5)) || '';
  return `workbook-${sheetName}-${cellCount}-${dataHash.length}`;
}, [validData?.[0]?.name, validData?.[0]?.celldata]);
```

**利点:**
- シート名が同じでもデータ内容が変われば確実に更新される
- チカチカは最小限（データ変更時のみ再マウント）
- セル数やデータ内容の変化を検知して適切に更新

### 再発防止策
- **必ず**この対策を適用すること
- 新しい開発者がこの問題に遭遇した場合、このドキュメントを参照させること
- コードレビュー時にkeyプロパティの実装を確認すること
- シート名問題の存在を開発チーム全体で共有すること

## 未解決の既知問題

### JSON読み込み（Retrieve）の不安定性
**現象**: 読み込みボタンでJSONファイルを読み込んだ時、ワークシートが更新される場合とされない場合がある

**調査状況**: 
- テストデータボタンは安定して動作
- 保存機能は正常に動作
- 問題は読み込み処理の複雑なデータ変換ロジックに起因する可能性が高い

**要調査ポイント**:
- `handleLoad`関数内のdata→celldata変換処理
- シート名の一致・不一致によるキー更新タイミング
- 読み込み時のデータ検証・正規化処理

**回避策**: 読み込み失敗時はページリロード後に再試行

## Fortune-Sheetの機能改善と制約

### 実装済み機能改善

#### 1. セル結合情報の保存・復元対応 ✅
**実装内容:**
- セル結合情報（config.merge）の詳細ログ追加
- 保存時・読み込み時・変更時の結合情報の流れを追跡可能
- handleChange関数とuseFileOperations関数で結合情報を確実に保存

**使用方法:**
- Excelからセル結合をコピペ → 保存 → 読み込み
- コンソールで「🔗 セル結合情報あり」「💾 セル結合情報を保存」ログを確認

#### 2. 日本語IME入力時のセル移動問題対策 ✅
**問題:** 日本語入力でIME確定時のEnterキーが次セル移動として認識される

**実装内容:**
- compositionstart/compositionendイベントでIME状態を追跡
- IME入力中のEnterキーをstopPropagation()で無効化
- containerRef経由でSpreadsheetEditor全体にイベントリスナー設定

**動作確認:**
- 日本語入力時にコンソールで「🈶 IME入力開始/終了」ログが表示
- IME確定のEnterキーではセル移動しない

### ライブラリ制約により実装困難な機能

#### 3. 書式情報（セル高さ・折り返し）のコピペ対応 ❌
**制約理由:**
- Fortune-Sheetライブラリの書式互換性が限定的
- Excelの複雑な書式設定（行高さ自動調整、テキスト折り返し詳細設定等）との互換性なし
- セルレベルの詳細書式情報（フォント、パディング等）の完全保持が困難

**代替案:**
- より高機能なスプレッドシートライブラリの検討（Luckysheet、OnlyOffice、AG-Grid等）
- 基本的な書式情報（太字、色等）のみの対応に留める

**判断:**
- プロジェクトの複雑性とライブラリ制約を考慮し、この機能は諦める
- Fortune-Sheetの標準機能範囲内での運用を推奨

## CopilotKit統合による次世代AI設計アシスタント機能 🚀

### 📋 **実装概要**
統合設計書システムにCopilotKitを統合し、**完全双方向のAIアシスタント機能**を実装。WebUIデータの読み取りからMarkdownへの書き込みまで、本格的なAI設計支援の基盤を構築。

### ✅ **実装済み機能**

#### **1. 基本チャット機能**
- **技術スタック**: `@copilotkit/react-core`, `@copilotkit/react-ui`
- **UI仕様**: 右下フローティング（525×1000px）、スムーズアニメーション
- **UX最適化**: 4行入力エリア、自動スクロール、ホバー効果

#### **2. WebUIデータアクセス機能（CopilotKitの核心価値）**
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

#### **3. コマンドシステム**
```bash
/help    # ヘルプ表示
/status  # データ状況と完成度（％）表示
/data    # スプレッドシート全データ詳細
/write   # チャット履歴をMarkdownに書き込み
```

#### **4. 双方向データ連携（画期的な実装）**
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

#### **5. フォローアップクエスチョン機能**
- **定型質問ボタン**: ワンクリックで頻用質問を送信
- **ホバー効果**: 青いハイライトで視覚的フィードバック
- **レスポンシブ配置**: 入力エリア上部に最適配置

### 🎯 **技術的革新点**

#### **データフロー設計**
```
App.tsx ←→ ChatPanel.tsx
├── 📖 Read:  conditionsMarkdown, spreadsheetData, etc.
└── 📝 Write: onConditionsMarkdownUpdate()
```

#### **実装ファイル構成**
- `src/App.tsx`: CopilotKitProvider設定、データ受け渡し
- `src/components/Common/ChatPanel.tsx`: AI機能の中核実装

### 🚀 **将来の拡張可能性（LLM統合後）**

#### **知能的設計支援（実装準備完了）**
```typescript
// LLM統合イメージ
const getLLMResponse = async (userMessage: string, context: WebUIData) => {
  const systemPrompt = `
  あなたは設計書作成の専門家です。
  現在のWebUI状況: ${JSON.stringify(context)}
  指示に従って具体的で実用的な設計を行ってください。
  `;
  return await callLLM(systemPrompt, userMessage);
};
```

**期待される機能:**
- **自動項目提案**: 「ECサイトの項目を提案して」→ 業界標準項目の自動生成
- **設計書品質チェック**: 不足項目の指摘・改善提案
- **仕様書自動生成**: スプレッドシートからAPI仕様書等を自動作成
- **セキュリティ監査**: 専門知識に基づく脆弱性チェック

### 📊 **実証されたCopilotKitの価値**
1. **Webサイトデータアクセス**: リアルタイムでのUI状態取得
2. **双方向データ連携**: チャットからWebUIへの書き込み
3. **ユーザビリティ**: 定型質問、コマンド、視覚的フィードバック
4. **拡張性**: LLM統合への完璧な土台

### 🎉 **達成した成果**
**本実装により、単なるチャットボットではなく「Webアプリケーションと完全に統合されたAIアシスタント」の基盤が完成。実際のLLM統合により、革新的な設計支援ツールへの発展が可能。**

---

**結論**: CopilotKitを活用した双方向AI統合により、次世代の設計書作成支援システムの基盤を確立。WebUIとAIの境界を超えた、真のコラボレーション環境を実現。

## SpreadsheetEditor編集モード切り替え機能（2025年1月実装） 🎯

### 📋 **実装概要**
SpreadsheetEditorに**編集モード・表示モード切り替え機能**を実装。手作業編集時のフォーカス維持問題と読み込み時のデータ更新問題を根本的に解決し、ユーザビリティを大幅向上。

### ✅ **実装済み機能**

#### **1. モード切り替えシステム**
- **UIコンポーネント**: iOS風トグルスイッチによる直感的なモード切り替え
- **表示モード（デフォルト）**: 読み込み対応・編集無効化
- **編集モード**: 手作業編集可能・フォーカス維持・読み込み無効化
- **視覚的フィードバック**: 現在のモードと機能を色付きで明確表示

#### **2. 技術的解決策**

**問題1: 手作業編集時のフォーカス問題**
```typescript
// 解決策: モード別キー生成
const componentKey = useMemo(() => {
  if (isEditMode) {
    return 'workbook-edit-mode';  // 固定キーでフォーカス維持
  } else {
    // 表示モード：動的キーで読み込み対応
    const key = `workbook-view-${sheetName}-${cellCount}-${dataHash.length}`;
    return key;
  }
}, [isEditMode, validData?.[0]?.name, validData?.[0]?.celldata]);
```

**問題2: 表示モードでの誤編集防止**
```typescript
// 解決策: 透明オーバーレイによる編集無効化
{!isEditMode && (
  <div style={{ 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'transparent',
    cursor: 'not-allowed',
    zIndex: 1000
  }} />
)}
```

**問題3: 両モードでのデータ表示**
```typescript
// 解決策: データ読み込み処理を両モードで実行
useEffect(() => {
  if (workbookRef.current && validData && validData.length > 0) {
    workbookRef.current.setData(validData);
  }
}, [data, validData]);
```

#### **3. UX/UI改善**

**スイッチデザイン**
- **左位置（グレー）**: 表示モード - 読み込み対応・編集無効
- **右位置（緑）**: 編集モード - 手作業編集可能・フォーカス維持
- **アニメーション**: スムーズな切り替えエフェクト
- **状態表示**: 現在のモードと機能を即座に理解可能

**レイアウト最適化**
```typescript
// スプレッドシートエリアの適切なサイズ設定
<div style={{ 
  height: 'calc(100% - 80px)',  // コントロール部分を除いた残り高さ
  width: '100%' 
}}>
```

### 🎯 **技術的革新点**

#### **1. 責任分離の実現**
- **表示モード**: データ読み込み・表示専用
- **編集モード**: 手作業編集・フォーカス維持専用
- **完全分離**: 互いに干渉しない独立した動作

#### **2. ユーザー体験の最適化**
- **明示的モード切り替え**: ユーザーが意図的に編集モードを選択
- **視覚的フィードバック**: 現在の状態が一目で分かるUI
- **操作の安全性**: 誤操作による意図しない編集の防止

#### **3. 開発保守性の向上**
```typescript
// 問題解決前: 複雑な条件分岐と状態管理
// - 手作業編集時の再描画制御
// - 読み込み時のデータ更新制御
// - フォーカス維持とデータ更新の両立

// 問題解決後: シンプルなモード分離
const [isEditMode, setIsEditMode] = useState(false);
// 各モードで独立した明確な動作
```

### 🚀 **解決した課題**

#### **Before（問題状況）**
- ❌ 手作業編集時にフォーカスが外れる
- ❌ 表示モードでも誤って編集できてしまう
- ❌ 読み込み機能と編集機能の競合
- ❌ ユーザーが現在の状態を把握できない

#### **After（解決後）**
- ✅ 編集モード時のフォーカス完全維持
- ✅ 表示モード時の編集完全無効化
- ✅ 読み込み機能の安定動作
- ✅ 直感的なモード切り替えUI

### 📊 **実装の価値**

#### **1. ユーザビリティ向上**
- **作業効率**: セル編集時のフォーカス維持による連続入力の実現
- **操作安全性**: 意図しない編集の完全防止
- **直感性**: iOS風UIによる学習コストゼロの操作感

#### **2. 技術的安定性**
- **競合解決**: 読み込み処理と編集処理の完全分離
- **予測可能性**: モード別の明確な動作仕様
- **保守性**: シンプルな状態管理による開発効率向上

#### **3. 将来の拡張性**
- **機能追加**: 各モードに特化した機能の追加が容易
- **カスタマイズ**: ユーザー設定による詳細なモード制御
- **統合**: 他のコンポーネントとのモード連携

### 🎉 **達成した成果**

**本実装により、SpreadsheetEditorは「単純なスプレッドシート表示コンポーネント」から「高度なユーザーインタラクションに対応した業務レベルのエディタ」へと進化。Fortune-Sheetライブラリの制約を克服し、実用的なWebアプリケーション開発における重要な技術的突破を実現。**

### 🔧 **技術仕様**

```typescript
// 主要な状態管理
const [isEditMode, setIsEditMode] = useState(false);

// キー生成ロジック
const componentKey = useMemo(() => {
  return isEditMode ? 'workbook-edit-mode' : dynamicViewKey;
}, [isEditMode, validData]);

// データ読み込み処理
useEffect(() => {
  if (workbookRef.current && validData && validData.length > 0) {
    workbookRef.current.setData(validData);
  }
}, [data, validData]);

// 編集制御
const handleChange = useCallback((sheets: any) => {
  if (!isEditMode) return;  // 表示モード時は編集無視
  // 編集モード時のみデータ保存処理
}, [isEditMode, onDataChange]);
```

---

**結論**: 編集モード切り替え機能により、スプレッドシート操作の根本的な課題を解決し、プロフェッショナルレベルのユーザー体験を実現。技術的制約の克服と実用性の両立を達成した革新的な実装。

### 🔧 **SpreadsheetEditor機能チェックリスト**

**機能修正時は必ず以下を確認すること：**

#### **基本機能**
- [ ] **データ表示**: サンプルデータが正常に表示される
- [ ] **読み込み機能**: JSONファイル読み込みでデータが正常に更新される
- [ ] **保存機能**: データが正常にJSONファイルに保存される
- [ ] **テストデータ読み込み**: 紫ボタンでテストデータが読み込める

#### **モード切り替え機能**
- [ ] **表示モード→編集モード**: スイッチで正常に切り替わる
- [ ] **編集モード→表示モード**: スイッチで正常に切り替わる
- [ ] **表示モード時の編集無効化**: クリックしてもアラートが表示され編集できない
- [ ] **編集モード時の編集可能**: セルをクリックして編集できる

#### **フォーカス維持機能**
- [ ] **編集モード時のセル入力**: Enter押下後、次のセルにフォーカスが移動する
- [ ] **編集モード時の連続入力**: 複数セルを連続で編集できる
- [ ] **カーソル行方不明問題**: 再描画によるフォーカス喪失が発生しない

#### **リサイズ機能**
- [ ] **リサイズハンドル表示**: スプレッドシート下部にリサイズハンドルが表示される
- [ ] **高さ変更**: ドラッグで高さが変更できる
- [ ] **Workbook追随**: リサイズ後にWorkbookの表示領域が連動して変更される
- [ ] **表示モード時のリサイズ**: 表示モードでリサイズが正常に動作する
- [ ] **編集モード時のリサイズ**: 編集モードでリサイズが正常に動作する

#### **複合機能**
- [ ] **読み込み後の編集**: 読み込み→編集モード→セル編集の流れが正常
- [ ] **編集後の保存**: 編集→保存の流れが正常
- [ ] **リサイズ後の読み込み**: リサイズ→読み込みの流れが正常
- [ ] **モード切り替え後のリサイズ**: モード切り替え→リサイズの流れが正常

#### **エラー対応**
- [ ] **不正データの処理**: 空データや破損データでもエラーにならない
- [ ] **コンソールログ**: 適切なデバッグログが出力される
- [ ] **エラーバウンダリ**: 予期しないエラーで画面が白くならない

**注意事項:**
- キー生成ロジックの変更時は**全項目**を確認すること
- useEffectの依存配列変更時は**フォーカス機能**を重点確認すること
- 新機能追加時は**既存機能への影響**を必ず確認すること
