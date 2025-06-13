# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

統合設計書システム - 設計文書の編集・管理のためのWebアプリケーション。Markdown形式での条件記述、画像モックアップアップロード、スプレッドシート形式での項目定義編集機能を提供。

## 開発コマンド

### 開発環境
```bash
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
  - `@fortune-sheet/react`: スプレッドシート機能 (現在はデモ実装で代替)
  - `@uiw/react-md-editor`: Markdownエディタ (現在はデモ実装で代替)

### コンポーネント構成
- **App.tsx**: メインアプリケーションコンポーネント
  - タブ切り替え機能 (全体表示/表示条件/画面イメージ/項目定義)
  - 状態管理: useState hooks
  - データ保存: JSON形式でのローカルダウンロード

### デモ実装コンポーネント
- **FortuneSheetDemo**: スプレッドシート機能の代替実装
  - セル編集、行/列追加機能
  - 本番では`@fortune-sheet/react`を使用予定
- **MarkdownEditorDemo**: Markdownエディタの代替実装  
  - 編集・プレビュー機能付き
  - 本番では`@uiw/react-md-editor`を使用予定

### データ構造
```typescript
interface DocumentData {
  conditions: string;      // 表示条件 (Markdown)
  supplement: string;      // 補足説明 (Markdown)
  spreadsheet: string[][]; // 項目定義 (2次元配列)
  mockup: string | null;   // 画面モックアップ (Base64)
  timestamp: string;       // 保存日時
}
```

## 注意事項

### 本番デプロイ時
- コメントアウトされた本番用importを有効化:
  ```typescript
  // import { Workbook } from '@fortune-sheet/react';
  // import '@fortune-sheet/react/dist/index.css';
  // import MDEditor from '@uiw/react-md-editor';
  // import '@uiw/react-md-editor/markdown-editor.css';
  ```
- デモ実装 (FortuneSheetDemo, MarkdownEditorDemo) を本番ライブラリに置換

### 日本語対応
- UIは日本語で構築
- ドキュメント管理は日本語環境向け

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