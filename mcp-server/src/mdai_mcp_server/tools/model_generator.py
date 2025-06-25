# src/mdai_mcp_server/tools/model_generator.py
"""
データモデル生成ツール
固定Mermaid返却による疎通確認用実装
"""

from typing import Dict, Optional, List
from datetime import datetime
import json
from ..ai_service import ai_service

def setup_model_tools(app):
    """データモデル生成ツールをMCPアプリに登録"""
    
    @app.tool()
    async def generate_data_model(
        prompt: str,
        project_context: Optional[Dict] = None,
        references: Optional[List[str]] = None
    ) -> Dict:
        """
        データモデル設計書生成（AI動的生成）
        
        Args:
            prompt: ユーザーからの生成要求
            project_context: プロジェクト情報
            references: 参照される他の設計書
            
        Returns:
            生成されたデータモデル情報
        """
        
        print(f"📥 AI Data model generation request received:")
        print(f"   Prompt: {prompt}")
        print(f"   Project: {project_context.get('name', '不明') if project_context else '不明'}")
        print(f"   References: {references or []}")
        
        try:
            # AI経由でデータモデルを生成
            result = await ai_service.generate_data_model(
                prompt=prompt,
                project_context=project_context,
                references=references,
                current_mermaid_code=""  # 現在のMermaidコード（拡張可能）
            )
            
            print(f"✅ AI Data model generated successfully")
            print(f"   Mode: {result['metadata']['mode']}")
            print(f"   AI Provider: {result['metadata']['ai_provider']}")
            mermaid_lines = len(result['mermaidCode'].split('\n'))
            print(f"   Mermaid lines: {mermaid_lines}")
            print(f"   Supplement chars: {len(result['supplement'])}")
            
            return result
            
        except Exception as e:
            print(f"❌ AI generation error: {e}")
            print(f"🔄 Falling back to error response")
            
            # エラー時は明確なエラーメッセージを返す
            error_result = {
                "mermaidCode": """erDiagram
    ERROR {
        string message
        datetime occurred_at
    }""",
                "supplement": f"""## ❌ データモデル生成エラー

### エラー詳細
- **発生日時**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **エラー内容**: {str(e)}
- **プロンプト**: {prompt}

### 対処方法
1. **AI API設定確認**: 環境変数が正しく設定されているか確認
2. **ネットワーク確認**: インターネット接続状況を確認
3. **再試行**: しばらく時間をおいて再度実行

### 環境変数設定例
```bash
export OPENAI_API_KEY="your-openai-key"
export AWS_ACCESS_KEY_ID="your-aws-key"
export AWS_SECRET_ACCESS_KEY="your-aws-secret"
export AWS_REGION="us-west-2"
```
""",
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "prompt_used": prompt,
                    "mode": "error",
                    "project_context": project_context,
                    "references": references or [],
                    "server_version": "0.1.0",
                    "generation_type": "error_response",
                    "error": str(e)
                }
            }
            
            return error_result
    
    @app.tool()
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
    
    @app.tool()
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

    # ツール登録完了をログ出力
    print("🛠️ Model generation tools registered:")
    print("   - generate_data_model: データモデル生成（固定版）")
    print("   - ping: 疎通確認")
    print("   - get_server_info: サーバー情報取得")