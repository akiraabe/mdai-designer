// src/services/providers/bedrockProvider.ts
// Amazon Bedrock Claude-3.5 Sonnet プロバイダー

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { AIProvider, AIError, AIErrorType, type IAIProvider } from '../../types/aiTypes';

export class BedrockProvider implements IAIProvider {
  readonly name = AIProvider.BEDROCK;
  private client: BedrockRuntimeClient;
  private readonly modelId: string;
  private readonly region: string;

  constructor() {
    this.region = import.meta.env.VITE_AWS_REGION || 'us-east-1';
    this.modelId = import.meta.env.VITE_AWS_BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20240620-v1:0';
    
    console.log(`🔧 Bedrock初期化中... (Region: ${this.region}, Model: ${this.modelId})`);
    
    try {
      this.client = new BedrockRuntimeClient({
        region: this.region,
        credentials: {
          accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
          secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
        },
      });
      console.log('✅ Bedrockクライアント初期化完了');
    } catch (error) {
      console.error('❌ Bedrockクライアント初期化失敗:', error);
      throw new AIError(
        AIErrorType.AUTHENTICATION,
        AIProvider.BEDROCK,
        'Bedrockクライアントの初期化に失敗しました',
        error as Error
      );
    }
  }

  /**
   * 利用可能性チェック
   */
  checkAvailability(): boolean {
    const hasAccessKey = !!import.meta.env.VITE_AWS_ACCESS_KEY_ID;
    const hasSecretKey = !!import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
    
    return hasAccessKey && hasSecretKey;
  }

  /**
   * Claude-3.5 Sonnet による応答生成
   */
  async generateResponse(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.checkAvailability()) {
      throw new AIError(
        AIErrorType.AUTHENTICATION,
        AIProvider.BEDROCK,
        'AWS認証情報が設定されていません'
      );
    }

    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: userPrompt }]
        }
      ]
    };

    console.log(`🚀 Bedrock API呼び出し開始 (Model: ${this.modelId})`);
    console.log(`📝 System: ${systemPrompt.substring(0, 100)}...`);
    console.log(`👤 User: ${userPrompt.substring(0, 100)}...`);

    try {
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        body: JSON.stringify(payload),
        contentType: 'application/json',
        accept: 'application/json'
      });

      const startTime = Date.now();
      const response = await this.client.send(command);
      const endTime = Date.now();

      console.log(`⏱️ Bedrock API応答時間: ${endTime - startTime}ms`);

      if (!response.body) {
        throw new AIError(
          AIErrorType.MODEL_ERROR,
          AIProvider.BEDROCK,
          'Bedrockから空のレスポンスが返されました'
        );
      }

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      console.log('📊 Bedrock応答構造:', Object.keys(responseBody));

      const content = responseBody.content?.[0]?.text;
      if (!content) {
        console.error('❌ 不正なBedrock応答構造:', responseBody);
        throw new AIError(
          AIErrorType.MODEL_ERROR,
          AIProvider.BEDROCK,
          'Bedrockレスポンスから文字列コンテンツを取得できませんでした'
        );
      }

      console.log(`✅ Bedrock応答成功 (${content.length}文字)`);
      return content;
      
    } catch (error) {
      console.error('❌ Bedrock API エラー:', error);
      
      // エラータイプの判定
      const errorMessage = error instanceof Error ? error.message : String(error);
      let errorType: AIErrorType = AIErrorType.UNKNOWN;
      
      if (errorMessage.includes('UnauthorizedOperation') || errorMessage.includes('Forbidden')) {
        errorType = AIErrorType.AUTHENTICATION;
      } else if (errorMessage.includes('ThrottlingException') || errorMessage.includes('TooManyRequestsException')) {
        errorType = AIErrorType.RATE_LIMIT;
      } else if (errorMessage.includes('cors') || errorMessage.includes('CORS')) {
        errorType = AIErrorType.CORS;
      } else if (errorMessage.includes('NetworkingError') || errorMessage.includes('timeout')) {
        errorType = AIErrorType.NETWORK;
      } else if (errorMessage.includes('ValidationException') || errorMessage.includes('ModelError')) {
        errorType = AIErrorType.MODEL_ERROR;
      }

      throw new AIError(
        errorType,
        AIProvider.BEDROCK,
        `Bedrock API呼び出しに失敗しました: ${errorMessage}`,
        error as Error
      );
    }
  }

  /**
   * デバッグ情報の取得
   */
  getDebugInfo() {
    return {
      provider: this.name,
      modelId: this.modelId,
      region: this.region,
      available: this.checkAvailability(),
      credentials: {
        hasAccessKey: !!import.meta.env.VITE_AWS_ACCESS_KEY_ID,
        hasSecretKey: !!import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
        accessKeyPrefix: import.meta.env.VITE_AWS_ACCESS_KEY_ID?.substring(0, 4) + '***'
      }
    };
  }
}