# mdai-designer 🎨

> AI-powered Model Driven Architecture design document editor supporting screen design, data modeling, and project management

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![OSS Ready](https://img.shields.io/badge/OSS-Ready-green.svg)](LICENSE-ANALYSIS.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](package.json)
[![React](https://img.shields.io/badge/React-19+-blue.svg)](package.json)

## ✨ Features

### 🖥️ Screen Design Documents
- **表示条件**: Markdown形式での画面仕様記述
- **画面イメージ**: モックアップ画像のアップロード・管理
- **項目定義**: Fortune-Sheetによるスプレッドシート形式編集
- **補足説明**: 詳細仕様のMarkdown記述

### 🗄️ Data Model Design Documents  
- **ER図エディタ**: Mermaid記法によるビジュアルER図作成
- **テキストエディタ**: 構造化されたエンティティ定義
- **双方向同期**: テキスト⇔ビジュアル自動変換
- **統計表示**: エンティティ数、リレーション数、フィールド数

### 🤖 AI-Powered Design Generation
- **自然言語指示**: 「ECサイトの設計書を作って」から自動生成
- **修正提案**: 既存設計書への安全な変更提案
- **@メンション機能**: 設計書間の参照による高度な生成
- **バックアップ**: 全変更の自動バックアップ・復元機能

### 📋 Project Management
- **プロジェクト階層**: 複数設計書の統合管理
- **エクスポート/インポート**: JSON形式でのプロジェクト単位バックアップ
- **設計書タイプ**: 画面設計、データモデル、API設計（準備中）
- **完全復元**: 内容・画像・スプレッドシートの100%復元

### 🔄 Model Driven Architecture
- **MDA実装**: データモデル → 画面設計の自動生成
- **設計書連携**: @メンション機能による設計書間参照
- **一貫性保証**: エンティティ定義の画面項目への自動反映
- **双方向設計**: 画面設計 ⇔ データモデルの相互参照

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm または yarn

### Installation
```bash
git clone https://github.com/akiraabe/mdai-designer.git
cd mdai-designer
npm install
```

### Development
```bash
npm run dev
```
ブラウザで http://localhost:5173 にアクセス

### Build
```bash
npm run build
npm run preview
```

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: CSS + Tailwind CSS classes  
- **Icons**: Lucide React
- **Spreadsheet**: Fortune-Sheet (production ready)
- **Markdown**: @uiw/react-md-editor (production ready)
- **AI Integration**: AWS Bedrock + OpenAI API
- **Diagrams**: Mermaid + React Flow

### Key Design Patterns
- **Custom Hooks**: 状態管理とビジネスロジックの分離
- **Component Architecture**: 機能別コンポーネント分割
- **Type-Safe**: TypeScript完全対応
- **Responsibility Separation**: UI・状態・ロジックの明確な分離

## 📚 Documentation

- [📋 Project Instructions (CLAUDE.md)](CLAUDE.md) - 包括的な技術仕様
- [🔧 Migration Guide](MIGRATION.md) - リポジトリ移行手順
- [📄 License Analysis](LICENSE-ANALYSIS.md) - OSS対応ライセンス分析
- [📝 Third-Party Notices](NOTICE.md) - 依存ライブラリクレジット

## 🎯 Use Cases

### 企業システム設計
- **要件定義書**: AIとの対話で要件を設計書化
- **画面設計書**: モックアップ + 項目定義の統合管理
- **データモデル**: ER図による論理設計
- **API設計**: RESTful API仕様書（開発予定）

### 個人開発・学習
- **システム設計学習**: MDA概念の実践的理解
- **AI協調設計**: 自然言語による設計書生成体験
- **設計パターン**: 業界標準パターンの学習・適用

## 🎬 Demo

### AIアシスタントによるドラフト生成
![ai_generate_draft](./fixture/ai_generate_draft.gif)

## 🤝 Contributing

プロジェクトへの貢献を歓迎します！

1. **Fork** このリポジトリ
2. **Feature branch** を作成 (`git checkout -b feature/amazing-feature`)
3. **Commit** 変更内容 (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Pull Request** を作成

詳細は [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。

## 📄 License

このプロジェクトは MIT License の下で公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

### Third-party Licenses
全ての依存ライブラリはOSS互換ライセンスです。詳細は [NOTICE.md](NOTICE.md) をご覧ください。

## 🎉 Acknowledgments

- **React Community** - 素晴らしいエコシステム
- **Fortune-Sheet** - 高機能スプレッドシートコンポーネント
- **Mermaid** - 美しい図表生成ライブラリ
- **AWS Bedrock** - 強力なAI基盤サービス
- **Open Source Community** - このプロジェクトを支える全てのライブラリ

---

## 🔗 Links

- **GitHub**: https://github.com/akiraabe/mdai-designer
- **Issues**: https://github.com/akiraabe/mdai-designer/issues
- **Discussions**: https://github.com/akiraabe/mdai-designer/discussions

*Made with ❤️ by the mdai-designer contributors*