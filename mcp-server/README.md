# MDAI MCP Server

統合設計書システム用のModel Context Protocol (MCP) サーバー。WebUIからのデータモデル生成要求をAI経由で処理します。

## 🚀 機能概要

- **AI動的生成**: OpenAI GPT-4 / AWS Bedrock Claude経由でMermaid ER図を生成
- **高品質プロンプト**: データモデル設計特化の詳細なプロンプトエンジニアリング
- **HTTP API**: WebUI（Viteプロキシ）経由でのシームレス統合
- **自動リロード**: コード変更時の自動再起動対応
- **フォールバック機能**: AI失敗時の適切なエラーハンドリング

## 📋 事前準備

### 1. 環境変数設定

AI生成機能を使用するために、以下のいずれかのAPIキーを設定してください：

```bash
# .envファイルを作成
cp .env.example .env

# .envファイルを編集して以下を設定
```

**OpenAI API（推奨）**
```bash
OPENAI_API_KEY=your-openai-api-key-here
```

**AWS Bedrock（代替/上級者向け）**
```bash
AWS_ACCESS_KEY_ID=your-aws-access-key-here
AWS_SECRET_ACCESS_KEY=your-aws-secret-key-here
AWS_REGION=us-west-2
```

### 2. 依存関係インストール

```bash
# mcp-serverディレクトリに移動
cd mcp-server

# uv環境での依存関係インストール
uv sync
```

## 🔧 サーバー起動方法

### HTTP サーバー起動（WebUI統合用・推奨）

```bash
# HTTPサーバー起動（ポート3001・自動リロード有効）
uv run mdai-http-server

# または詳細コマンド
uv run python -m mdai_mcp_server.start_http
```

**🔄 自動リロード機能**
- コード変更時に**自動的に再起動**
- 手動再起動は**不要**
- ターミナルで「Reloading...」と表示される

**起動確認:**
```bash
# ヘルスチェック
curl http://localhost:3001/health

# Ping テスト
curl -X POST http://localhost:3001/ \
  -H "Content-Type: application/json" \
  -d '{"method": "ping", "id": "test"}'
```

### 標準MCPサーバー起動（stdio通信）

```bash
# 標準MCPサーバー起動
uv run mdai-mcp-server

# または詳細コマンド
uv run python -m mdai_mcp_server.server
```

## 🌐 WebUIとの統合

### 1. MCPサーバー起動
```bash
cd mcp-server
uv run mdai-http-server
```

### 2. WebUI起動
```bash
cd ..  # プロジェクトルートに戻る
npm run dev
```

### 3. 動作確認
1. WebUIでデータモデル設計書を作成・編集
2. チャットパネルを開く
3. 「ECサイトのデータモデルを作って」などの生成要求を送信
4. AI生成されたMermaid ER図が表示されることを確認

## 🔧 利用可能なMCPツール

### `generate_data_model`
**説明**: AI経由でMermaid ER図とドキュメントを生成

**パラメータ**:
```json
{
  "prompt": "ECサイトのデータモデルを作って",
  "project_context": {
    "name": "プロジェクト名",
    "id": "project-id"
  },
  "references": ["参照する他の設計書"]
}
```

**レスポンス**:
```json
{
  "mermaidCode": "erDiagram\n  User { ... }",
  "supplement": "## データモデル設計書\n...",
  "metadata": {
    "generated_at": "2025-06-25T17:00:00",
    "mode": "ai_generated",
    "ai_provider": "openai"
  }
}
```

### `ping`
**説明**: サーバー疎通確認

**レスポンス**:
```json
{
  "status": "ok",
  "message": "MDAI MCP Server is running!"
}
```

### `get_server_info`
**説明**: サーバー情報取得

**レスポンス**:
```json
{
  "server_name": "MDAI MCP Server",
  "version": "0.1.0",
  "available_tools": ["generate_data_model", "ping", "get_server_info"]
}
```

## 🛠️ トラブルシューティング

### AI生成エラーの場合

**症状**: エラーER図が表示される
```
erDiagram
    ERROR {
        string message
        datetime occurred_at
    }
```

**解決方法**:
1. `.env`ファイルでAPIキーが正しく設定されているか確認
2. インターネット接続状況を確認
3. APIキーの利用制限・有効期限を確認

### サーバー起動エラーの場合

**ポート競合エラー**:
```bash
# ポート3001を使用中のプロセスを確認
lsof -i :3001

# プロセス停止
kill -9 <PID>
```

**依存関係エラー**:
```bash
# 依存関係を再インストール
uv sync --force
```

### WebUI連携エラーの場合

**プロキシエラー**:
- Vite開発サーバー（port 5173）が起動しているか確認
- MCPサーバー（port 3001）が起動しているか確認
- ブラウザのネットワークタブでプロキシエラーを確認

## 🔄 開発フロー

### 1. 開発サーバー起動（自動リロード）
```bash
# サーバー起動（コード変更時に自動再起動）
uv run mdai-http-server

# ターミナルに以下が表示される：
# 🚀 MDAI MCP HTTP Server starting...
# 🔧 Mode: AI Dynamic Generation
# 📡 Running HTTP server on port 3001 (Auto-reload enabled)
```

### 2. コード編集・テスト
```bash
# コード修正（保存時に自動再起動）
vim src/mdai_mcp_server/ai_service.py

# WebUIで即座にテスト可能
# 手動再起動は不要
```

### 3. 直接APIテスト
```bash
# データモデル生成テスト
curl -X POST http://localhost:3001/ \
  -H "Content-Type: application/json" \
  -d '{
    "method": "generate_data_model",
    "params": {
      "prompt": "ユーザー管理システムのデータモデル",
      "project_context": {"name": "テストプロジェクト"}
    },
    "id": "test_generate"
  }'
```

### 4. 手動再起動（必要な場合のみ）
```bash
# 自動リロードが効かない場合のみ
pkill -f mdai-http-server
uv run mdai-http-server
```

## 📁 プロジェクト構造

```
mcp-server/
├── src/mdai_mcp_server/
│   ├── __init__.py
│   ├── server.py              # 標準MCPサーバー
│   ├── http_server.py         # HTTP APIサーバー
│   ├── start_http.py          # HTTPサーバー起動スクリプト（自動リロード対応）
│   ├── ai_service.py          # AI統合サービス
│   └── tools/
│       ├── __init__.py
│       └── model_generator.py # データモデル生成ツール
├── tests/
├── .env.example               # 環境変数テンプレート
├── .env                       # 環境変数設定（作成必要）
├── pyproject.toml             # プロジェクト設定
└── README.md                  # このファイル
```

## 📖 関連ドキュメント

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [FastMCP Documentation](https://github.com/jlowin/fastmcp)
- [統合設計書システム CLAUDE.md](../CLAUDE.md)

## 🆘 サポート

問題が発生した場合は、以下の情報とともにお問い合わせください：

1. **サーバーログ**: MCPサーバーのコンソール出力
2. **エラーメッセージ**: WebUIブラウザの開発者ツール
3. **環境情報**: 
   ```bash
   uv --version
   python --version
   cat .env  # APIキーは除いて
   ```
4. **再現手順**: エラーが発生した操作の詳細