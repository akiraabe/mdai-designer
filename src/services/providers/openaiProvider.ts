// src/services/providers/openaiProvider.ts
// OpenAI GPT-4o プロバイダー

import OpenAI from 'openai';
import { AIProvider, AIError, AIErrorType, type IAIProvider } from '../../types/aiTypes';

export class OpenAIProvider implements IAIProvider {
  readonly name = AIProvider.OPENAI;
  private client: OpenAI;
  private readonly model: string;

  constructor() {
    this.model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o';
    console.log(`🔧 OpenAI初期化中... (Model: ${this.model})`);
    
    try {
      this.client = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
        dangerouslyAllowBrowser: true // フロントエンド用設定
      });
      console.log('✅ OpenAIクライアント初期化完了');
    } catch (error) {
      console.error('❌ OpenAIクライアント初期化失敗:', error);
      throw new AIError(
        AIErrorType.AUTHENTICATION,
        AIProvider.OPENAI,
        'OpenAIクライアントの初期化に失敗しました',
        error as Error
      );
    }
  }

  /**
   * 利用可能性チェック
   */
  checkAvailability(): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY;
  }

  /**
   * GPT-4o による応答生成
   */
  async generateResponse(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.checkAvailability()) {
      throw new AIError(
        AIErrorType.AUTHENTICATION,
        AIProvider.OPENAI,
        'OpenAI APIキーが設定されていません'
      );
    }

    console.log(`🚀 OpenAI API呼び出し開始 (Model: ${this.model})`);
    console.log(`📝 System: ${systemPrompt.substring(0, 100)}...`);
    console.log(`👤 User: ${userPrompt.substring(0, 100)}...`);

    try {
      const startTime = Date.now();
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });
      const endTime = Date.now();

      console.log(`⏱️ OpenAI API応答時間: ${endTime - startTime}ms`);

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new AIError(
          AIErrorType.MODEL_ERROR,
          AIProvider.OPENAI,
          'OpenAIから空のレスポンスが返されました'
        );
      }

      console.log(`✅ OpenAI応答成功 (${content.length}文字)`);
      return content;
      
    } catch (error) {
      console.error('❌ OpenAI API エラー:', error);
      
      // エラータイプの判定
      const errorMessage = error instanceof Error ? error.message : String(error);
      let errorType: AIErrorType = AIErrorType.UNKNOWN;
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorType = AIErrorType.AUTHENTICATION;
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        errorType = AIErrorType.RATE_LIMIT;
      } else if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
        errorType = AIErrorType.QUOTA_EXCEEDED;
      } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
        errorType = AIErrorType.NETWORK;
      }

      throw new AIError(
        errorType,
        AIProvider.OPENAI,
        `OpenAI API呼び出しに失敗しました: ${errorMessage}`,
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
      model: this.model,
      available: this.checkAvailability(),
      apiKeyPrefix: import.meta.env.VITE_OPENAI_API_KEY?.substring(0, 4) + '***'
    };
  }
}