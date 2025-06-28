# src/mdai_mcp_server/server.py
"""
MDAI MCP Server
データモデル設計書生成のためのMCPサーバー
"""

from fastmcp import FastMCP

# 相対import用のパス調整
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from .tools.model_generator import setup_model_tools
    from .tools.design_draft_generator import setup_design_draft_tools
except ImportError:
    # 直接実行時のフォールバック
    from tools.model_generator import setup_model_tools
    from tools.design_draft_generator import setup_design_draft_tools

# MCPサーバー初期化
app = FastMCP("mdai-model-server")

# データモデル生成ツールをセットアップ
setup_model_tools(app)

# 設計書ドラフト生成ツールをセットアップ
setup_design_draft_tools(app)

def main():
    """MCPサーバーのエントリーポイント"""
    print("🚀 MDAI MCP Server starting...")
    print("🔧 Mode: AI Dynamic Generation (OpenAI/Bedrock)")
    print("📡 Running in stdio mode for MCP communication")
    
    try:
        # FastMCPはstdio通信がデフォルト
        app.run()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        raise

if __name__ == "__main__":
    main()