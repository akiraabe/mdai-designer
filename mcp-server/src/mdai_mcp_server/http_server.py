# src/mdai_mcp_server/http_server.py
"""
MCP HTTP Server
WebUIからのHTTPリクエストをMCPプロトコルに変換
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional

from .tools.model_generator import setup_model_tools

# FastAPI アプリケーション
http_app = FastAPI(title="MDAI MCP HTTP Server", version="0.1.0")

# CORS設定
http_app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite開発サーバー
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MCPツールの実装を格納する辞書
tools_registry = {}

def register_tools():
    """MCPツールをHTTP経由で呼び出し可能にする"""
    
    async def generate_data_model(
        prompt: str,
        project_context: Optional[Dict] = None,
        references: Optional[list] = None
    ) -> Dict:
        """データモデル生成ツール"""
        print(f"📥 Data model generation request received:")
        print(f"   Prompt: {prompt}")
        print(f"   Project: {project_context.get('name', '不明') if project_context else '不明'}")
        print(f"   References: {references or []}")
        
        # 固定のMermaid ER図を返却（疎通確認用）
        fixed_mermaid = """erDiagram
    USER {
        string id PK
        string name
        string email
        datetime created_at
        datetime updated_at
    }
    
    PROJECT {
        string id PK
        string name
        string description
        string owner_id FK
        datetime created_at
        datetime updated_at
    }
    
    DOCUMENT {
        string id PK
        string project_id FK
        string name
        string type
        json content
        datetime created_at
        datetime updated_at
    }
    
    USER ||--o{ PROJECT : owns
    PROJECT ||--o{ DOCUMENT : contains"""
        
        # 固定の補足説明
        fixed_supplement = f"""## データモデル設計書

### 生成情報
- **生成日時**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **プロンプト**: {prompt}
- **プロジェクト**: {project_context.get('name', '不明') if project_context else '不明'}

### モデル概要
基本的なユーザー・プロジェクト・設計書管理のためのER図です。

#### エンティティ説明
- **USER**: システム利用者
  - id: ユーザーID（主キー）
  - name: ユーザー名
  - email: メールアドレス
  - created_at: 作成日時
  - updated_at: 更新日時

- **PROJECT**: 設計プロジェクト  
  - id: プロジェクトID（主キー）
  - name: プロジェクト名
  - description: プロジェクト説明
  - owner_id: 所有者ID（外部キー）
  - created_at: 作成日時
  - updated_at: 更新日時

- **DOCUMENT**: 設計書
  - id: 設計書ID（主キー）
  - project_id: プロジェクトID（外部キー）
  - name: 設計書名
  - type: 設計書タイプ
  - content: 設計書内容（JSON）
  - created_at: 作成日時
  - updated_at: 更新日時

#### リレーション
- 1人のユーザーは複数のプロジェクトを所有
- 1つのプロジェクトは複数の設計書を含む

### 🔧 疎通確認用データ
これは疎通確認用の固定データです。実際のAI生成は次のフェーズで実装されます。

### 参照情報
{f"参照された設計書: {', '.join(references)}" if references else "参照設計書: なし"}
"""
        
        result = {
            "mermaidCode": fixed_mermaid,
            "supplement": fixed_supplement,
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "prompt_used": prompt,
                "mode": "fixed_response",
                "project_context": project_context,
                "references": references or [],
                "server_version": "0.1.0",
                "generation_type": "fixed_mermaid_for_testing"
            }
        }
        
        print(f"✅ Data model generated successfully")
        mermaid_lines = len(fixed_mermaid.split('\n'))
        print(f"   Mermaid lines: {mermaid_lines}")
        print(f"   Supplement chars: {len(fixed_supplement)}")
        
        return result

    async def ping() -> Dict:
        """疎通確認用のシンプルなツール"""
        print("🏓 Ping request received")
        
        result = {
            "status": "ok",
            "message": "MDAI MCP Server is running!",
            "timestamp": datetime.now().isoformat(),
            "server_name": "mdai-model-server",
            "version": "0.1.0",
            "mode": "fixed_response_testing"
        }
        
        print("🏓 Pong response sent")
        return result

    async def get_server_info() -> Dict:
        """サーバー情報取得ツール"""
        print("ℹ️ Server info request received")
        
        result = {
            "server_name": "MDAI MCP Server",
            "version": "0.1.0",
            "description": "データモデル設計書生成用MCPサーバー",
            "mode": "fixed_response_testing",
            "available_tools": [
                "generate_data_model",
                "ping", 
                "get_server_info"
            ],
            "status": "ready",
            "uptime": "running",
            "timestamp": datetime.now().isoformat()
        }
        
        print("ℹ️ Server info response sent")
        return result

    # ツールを登録
    tools_registry["generate_data_model"] = generate_data_model
    tools_registry["ping"] = ping
    tools_registry["get_server_info"] = get_server_info
    
    print("🛠️ HTTP Server tools registered:")
    print("   - generate_data_model: データモデル生成（固定版）")
    print("   - ping: 疎通確認")
    print("   - get_server_info: サーバー情報取得")

# ツール登録を実行
register_tools()

@http_app.post("/")
async def handle_mcp_request(request: Request):
    """MCPリクエストをHTTP経由で処理"""
    try:
        # JSONリクエストを解析
        body = await request.json()
        method = body.get("method")
        params = body.get("params", {})
        request_id = body.get("id")
        
        print(f"📨 MCP HTTP Request: {method}")
        
        # 対応するツールを呼び出し
        if method not in tools_registry:
            raise HTTPException(
                status_code=400, 
                detail=f"Unknown method: {method}"
            )
        
        tool_func = tools_registry[method]
        
        # パラメータがある場合は展開して呼び出し
        if params:
            if isinstance(params, dict):
                result = await tool_func(**params)
            else:
                result = await tool_func(params)
        else:
            result = await tool_func()
        
        # MCP形式のレスポンスを返却
        response = {
            "result": result,
            "id": request_id
        }
        
        print(f"✅ MCP HTTP Response: {method} completed")
        return response
        
    except Exception as e:
        print(f"❌ MCP HTTP Error: {e}")
        error_response = {
            "error": {
                "code": -32603,
                "message": str(e)
            },
            "id": body.get("id") if 'body' in locals() else None
        }
        return error_response

@http_app.get("/health")
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {
        "status": "ok",
        "server": "MDAI MCP HTTP Server",
        "version": "0.1.0",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 MDAI MCP HTTP Server starting...")
    print("🔧 Mode: Fixed Mermaid Response (疎通確認用)")
    print("📡 Running HTTP server on port 3001")
    
    uvicorn.run(http_app, host="0.0.0.0", port=3001)