# 開発ガイド

## 開発コマンド

### 開発環境
```bash
npm install          # 初回セットアップ
npm run dev          # 開発サーバー起動 (Vite)
npm run build        # 本番ビルド (TypeScript コンパイル + Vite ビルド)
npm run lint         # ESLint実行
npm run preview      # ビルド後のプレビュー
```

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

## 開発時の重要なルール

### Following conventions
When making changes to files, first understand the file's code conventions. Mimic code style, use existing libraries and utilities, and follow existing patterns.
- NEVER assume that a given library is available, even if it is well known. Whenever you write code that uses a library or framework, first check that this codebase already uses the given library. For example, you might look at neighboring files, or check the package.json (or cargo.toml, and so on depending on the language).
- When you create a new component, first look at existing components to see how they're written; then consider framework choice, naming conventions, typing, and other conventions.
- When you edit a piece of code, first look at the code's surrounding context (especially its imports) to understand the code's choice of frameworks and libraries. Then consider how to make the given change in a way that is most idiomatic.
- Always follow security best practices. Never introduce code that exposes or logs secrets and keys. Never commit secrets or keys to the repository.

### Code style
- IMPORTANT: DO NOT ADD ***ANY*** COMMENTS unless asked