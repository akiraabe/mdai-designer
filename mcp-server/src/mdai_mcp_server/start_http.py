# src/mdai_mcp_server/start_http.py
"""
HTTP Server Entry Point
MCPサーバーをHTTP経由で起動
"""

def main():
    """HTTP サーバーのエントリーポイント"""
    from .http_server import http_app
    import uvicorn
    
    print("🚀 MDAI MCP HTTP Server starting...")
    print("🔧 Mode: AI Dynamic Generation (OpenAI/Bedrock)")
    print("📡 Running HTTP server on port 3001")
    print("🔗 WebUI可能: http://localhost:5173")
    
    uvicorn.run("mdai_mcp_server.http_server:http_app", host="0.0.0.0", port=3001, reload=True)

if __name__ == "__main__":
    main()