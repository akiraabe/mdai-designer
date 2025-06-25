// src/services/mcpClient.ts
/**
 * MCP Client Service
 * WebUIからMCPサーバーとの通信を管理
 */

interface MCPRequest {
  method: string;
  params?: any;
  id?: string;
}

interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
  id?: string;
}

interface DataModelGenerationRequest {
  prompt: string;
  project_context?: {
    name: string;
    id: string;
  };
  references?: string[];
}

interface DataModelGenerationResult {
  mermaidCode: string;
  supplement: string;
  metadata: {
    generated_at: string;
    prompt_used: string;
    mode: string;
    project_context?: any;
    references: string[];
    server_version: string;
    generation_type: string;
  };
}

export class MCPClientService {
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * MCPサーバーの疎通確認
   */
  async ping(): Promise<any> {
    console.log('🏓 MCPサーバーへPing送信...');
    
    const request: MCPRequest = {
      method: 'ping',
      id: `ping_${Date.now()}`
    };

    try {
      const response = await this.sendRequest(request);
      console.log('🏓 Pong受信:', response.result);
      return response.result;
    } catch (error) {
      console.error('❌ Ping失敗:', error);
      throw error;
    }
  }

  /**
   * MCPサーバー情報取得
   */
  async getServerInfo(): Promise<any> {
    console.log('ℹ️ MCPサーバー情報取得...');
    
    const request: MCPRequest = {
      method: 'get_server_info',
      id: `info_${Date.now()}`
    };

    try {
      const response = await this.sendRequest(request);
      console.log('ℹ️ サーバー情報:', response.result);
      return response.result;
    } catch (error) {
      console.error('❌ サーバー情報取得失敗:', error);
      throw error;
    }
  }

  /**
   * データモデル生成要求
   */
  async generateDataModel(params: DataModelGenerationRequest): Promise<DataModelGenerationResult> {
    console.log('🔄 データモデル生成要求:', params);
    
    const request: MCPRequest = {
      method: 'generate_data_model',
      params: {
        prompt: params.prompt,
        project_context: params.project_context,
        references: params.references || []
      },
      id: `generate_${Date.now()}`
    };

    try {
      const response = await this.sendRequest(request);
      console.log('✅ データモデル生成完了:', response.result);
      return response.result;
    } catch (error) {
      console.error('❌ データモデル生成失敗:', error);
      throw error;
    }
  }

  /**
   * MCPサーバーへのリクエスト送信（HTTP経由）
   * 開発時はViteプロキシ経由でMCPサーバーと通信
   */
  private async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      // 開発時は/api/mcp経由でプロキシアクセス
      const url = '/api/mcp';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const mcpResponse: MCPResponse = await response.json();

      if (mcpResponse.error) {
        throw new Error(`MCP Error ${mcpResponse.error.code}: ${mcpResponse.error.message}`);
      }

      return mcpResponse;
    } catch (error) {
      console.error('🚫 MCP通信エラー:', error);
      throw error;
    }
  }

  /**
   * MCPサーバーの稼働状況確認
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.ping();
      return true;
    } catch (error) {
      console.warn('⚠️ MCPサーバーに接続できません:', error);
      return false;
    }
  }
}

// シングルトンインスタンス
export const mcpClient = new MCPClientService();

// デバッグ用：グローバルオブジェクトに追加
if (typeof window !== 'undefined') {
  (window as any).mcpClient = mcpClient;
}