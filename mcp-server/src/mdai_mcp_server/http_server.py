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
from .tools.design_draft_generator import setup_design_draft_tools
from .ai_service import ai_service

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
        """AI動的データモデル生成ツール"""
        return await ai_service.generate_data_model(
            prompt=prompt,
            project_context=project_context,
            references=references,
            current_mermaid_code=""
        )

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

    async def generate_design_draft(
        prompt: str,
        context: Optional[Dict] = None,
        target_type: Optional[str] = None,
        project_context: Optional[Dict] = None
    ) -> Dict:
        """設計書ドラフト生成ツール"""
        return await ai_service.generate_design_draft(
            prompt=prompt,
            context=context or {},
            target_type=target_type,
            project_context=project_context
        )

    async def generate_chat_response(
        user_message: str,
        context: Optional[Dict] = None,
        document_type: Optional[str] = None,
        project_context: Optional[Dict] = None
    ) -> Dict:
        """チャット応答生成ツール"""
        response = await ai_service.generate_chat_response(
            user_message=user_message,
            context=context or {},
            document_type=document_type,
            project_context=project_context
        )
        return {
            "response": response,
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "message_used": user_message,
                "mode": "chat_response",
                "document_type": document_type or "general",
                "project_context": project_context,
                "server_version": "0.1.0",
                "generation_type": "ai_chat_response"
            }
        }

    async def generate_mockup_html(
        prompt: str,
        context: Optional[Dict] = None,
        project_context: Optional[Dict] = None
    ) -> Dict:
        """HTML画面イメージ生成ツール"""
        html_result = await ai_service.generate_mockup_html(
            prompt=prompt,
            context=context or {},
            project_context=project_context
        )
        return {
            "html": html_result,
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "prompt_used": prompt,
                "mode": "mockup_html",
                "project_context": project_context,
                "server_version": "0.1.0",
                "generation_type": "ai_mockup_html"
            }
        }

    async def generate_modification_proposal(
        system_prompt: str,
        user_prompt: str,
        context: Optional[Dict] = None,
        project_context: Optional[Dict] = None
    ) -> Dict:
        """修正提案生成ツール"""
        proposal_result = await ai_service.generate_modification_proposal(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            context=context or {},
            project_context=project_context
        )
        return {
            "response": proposal_result,
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "system_prompt_used": system_prompt,
                "user_prompt_used": user_prompt,
                "mode": "modification_proposal",
                "project_context": project_context,
                "server_version": "0.1.0",
                "generation_type": "ai_modification_proposal"
            }
        }

    # ツールを登録
    tools_registry["generate_data_model"] = generate_data_model
    tools_registry["generate_design_draft"] = generate_design_draft
    tools_registry["generate_chat_response"] = generate_chat_response
    tools_registry["generate_mockup_html"] = generate_mockup_html
    tools_registry["generate_modification_proposal"] = generate_modification_proposal
    tools_registry["ping"] = ping
    tools_registry["get_server_info"] = get_server_info
    
    print("🛠️ HTTP Server tools registered:")
    print("   - generate_data_model: AI動的データモデル生成（OpenAI/Bedrock）")
    print("   - generate_design_draft: AI動的設計書ドラフト生成（OpenAI/Bedrock）")
    print("   - generate_chat_response: AI動的チャット応答生成（OpenAI/Bedrock）")
    print("   - generate_mockup_html: AI画面イメージHTML+CSS生成（OpenAI/Bedrock）")
    print("   - generate_modification_proposal: AI修正提案生成（OpenAI/Bedrock）")
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
    print("🔧 Mode: AI Dynamic Generation (OpenAI/Bedrock)")
    print("📡 Running HTTP server on port 3001")
    
    uvicorn.run(http_app, host="0.0.0.0", port=3001)