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
