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
- **単一ページアプリケーション**: App.tsxに全機能を集約
- **タブベースUI**: 4つのメイン機能（全体表示/表示条件/画面イメージ/項目定義）
- **状態管理**: React useState hooks でローカル状態管理
- **データ永続化**: JSON形式でローカルファイルシステムへ保存・読み込み

### コンポーネント構成
- **App.tsx**: メインアプリケーションコンポーネント（全機能統合）
- **SpreadsheetEditor**: Fortune-Sheet Workbookのラッパーコンポーネント
- **MarkdownEditor**: @uiw/react-md-editorのラッパーコンポーネント
- **MarkdownSection**: 再利用可能なセクションコンポーネント

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

### 状態管理パターン
- **conditionsMarkdown**: 表示条件のMarkdownテキスト
- **supplementMarkdown**: 補足説明のMarkdownテキスト
- **spreadsheetData**: Fortune-Sheetのcelldata形式（配列）
- **mockupImage**: Base64エンコードされた画像データ
- **activeTab**: 現在表示中のタブID

## 重要な実装注意点

### 日本語環境
- UIは完全に日本語で構築
- ドキュメント管理は日本語環境向け
- コンソールログも日本語併記

## 重要：Fortune-Sheetコンポーネントのチカチカ問題対策

### 問題概要
Fortune-Sheetコンポーネント（SpreadsheetEditor）でデータを更新する際、keyプロパティが変更されるとコンポーネントが再マウントされ、画面がチカチカする問題が発生する。

### 対策（必須）
1. **keyプロパティは絶対に固定化**
   ```typescript
   // ❌ 絶対にやってはいけない
   const componentKey = useMemo(() => {
     return `workbook-${Date.now()}`;
   }, [data]);
   
   // ✅ 正しい方法
   const componentKey = 'workbook-fixed-key';
   ```

2. **データ更新はWorkbook APIを使用**
   ```typescript
   // useEffectでWorkbook APIを使って直接データ更新
   useEffect(() => {
     if (workbookRef.current && validData && validData.length > 0) {
       workbookRef.current.setData(validData);
     }
   }, [validData]);
   ```

3. **状態更新は直接実行**
   ```typescript
   // ❌ setTimeout等の遅延処理は不要
   setTimeout(() => setSpreadsheetData(newData), 50);
   
   // ✅ 直接更新
   setSpreadsheetData(newData);
   ```

### 再発防止策
- **必ず**この対策を適用すること
- 新しい開発者がこの問題に遭遇した場合、このドキュメントを参照させること
- コードレビュー時にkeyプロパティの変更がないことを確認すること

### 実証済み解決策（推奨）
チカチカを最小限に抑えつつ、確実にデータを更新する方法：

```typescript
// シート名変更時のみキーを更新（最適解）
const componentKey = useMemo(() => {
  const sheetName = validData?.[0]?.name || 'default';
  return `workbook-${sheetName}`;
}, [validData?.[0]?.name]);
```

**利点:**
- シート名が変わる時だけ再マウント（チカチカ最小限）
- データ更新は確実に反映される
- セル内容の変更では再マウントしない

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