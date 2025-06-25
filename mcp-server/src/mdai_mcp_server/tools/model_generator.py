# src/mdai_mcp_server/tools/model_generator.py
"""
データモデル生成ツール
固定Mermaid返却による疎通確認用実装
"""

from typing import Dict, Optional, List
from datetime import datetime
import json

def setup_model_tools(app):
    """データモデル生成ツールをMCPアプリに登録"""
    
    @app.tool()
    async def generate_data_model(
        prompt: str,
        project_context: Optional[Dict] = None,
        references: Optional[List[str]] = None
    ) -> Dict:
        """
        データモデル設計書生成（固定版 - 疎通確認用）
        
        Args:
            prompt: ユーザーからの生成要求
            project_context: プロジェクト情報
            references: 参照される他の設計書
            
        Returns:
            生成されたデータモデル情報
        """
        
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