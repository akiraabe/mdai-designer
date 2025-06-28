# MDAI MCP Server 技術詳細

統合設計書システム用MCPサーバーの技術的詳細・開発情報。

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
├── README.md                  # 概要・使い方
└── TECHNICAL.md               # このファイル（技術詳細）
```

## 🔍 アーキテクチャ詳細

### MCP Transport層
- **stdio transport**: Claude Desktop等の標準MCPクライアント用
- **HTTP transport**: WebUI統合用（JSON-RPC 2.0 over HTTP）

### AI統合層
- **優先度**: Bedrock（設定されている場合）→ OpenAI
- **フォールバック**: AI失敗時の安全なエラーハンドリング
- **品質保証**: Mermaid構文チェック・自動修正

### プロンプトエンジニアリング
- **データモデル特化**: ER図生成に最適化されたプロンプト
- **文法エラー防止**: バッククォート除去・PK/FK修正
- **構造化出力**: JSON形式での確実なレスポンス

## 🧪 テスト・デバッグ

### ログレベル
```python
# ai_service.py で詳細ログ
print(f"🔵 OpenAI API呼び出し開始...")
print(f"✅ OpenAI API成功: {len(response)}文字")
```

### エラーハンドリング
```python
# フォールバック機能
try:
    ai_response = await self._generate_with_ai(prompt)
except Exception as e:
    return await self._generate_fallback_data(prompt)
```

## 📊 パフォーマンス

### AI生成時間
- **平均**: 3-5秒（OpenAI GPT-4.1）
- **最大**: 10秒（複雑なモデル）
- **タイムアウト**: 30秒

### メモリ使用量
- **ベース**: ~50MB（Python + FastMCP）
- **AI生成時**: +20MB（一時的）
- **最大**: ~100MB

## 🔒 セキュリティ

### API キー管理
- **環境変数**: .envファイルでの安全な管理
- **Git除外**: .gitignoreで機密情報の保護
- **最小権限**: AI APIの読み取り専用アクセス

### ネットワーク
- **CORS**: WebUI（localhost:5173）のみ許可
- **HTTP**: localhost bindingによる外部アクセス制限

## 📖 関連技術

### 依存ライブラリ
- **FastMCP**: MCP プロトコル実装
- **FastAPI**: HTTP API サーバー
- **OpenAI**: AI生成サービス
- **boto3**: AWS Bedrock連携
- **uvicorn**: ASGI サーバー

### MCP標準準拠
- **JSON-RPC 2.0**: メッセージプロトコル
- **初期化ハンドシェイク**: capabilities交換
- **Tools実装**: generate_data_model, ping, get_server_info
- **エラーハンドリング**: 標準エラーコード対応

## 🆘 デバッグ情報

問題が発生した場合の診断情報：

```bash
# 環境情報
uv --version
python --version
cat .env  # APIキーは除いて

# サーバーログ
uv run mdai-http-server 2>&1 | tee server.log

# 依存関係確認
uv tree

# ネットワーク確認
curl http://localhost:3001/health
```