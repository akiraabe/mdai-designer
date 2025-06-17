// src/services/aiServiceV2.ts
// 統合AIサービス - Bedrock優先 + OpenAIフォールバック

import { BedrockProvider } from './providers/bedrockProvider';
import { OpenAIProvider } from './providers/openaiProvider';
import { selectProvider, checkProviderAvailability, getProviderStatus } from './providers/providerSelector';
import { 
  AIProvider, 
  AIError, 
  AIErrorType,
  type IAIProvider,
  type WebUIData,
  type DesignGenerationRequest,
  type GeneratedDraft 
} from '../types/aiTypes';

class AIService {
  private primaryProvider: IAIProvider;
  private fallbackProvider: IAIProvider | null = null;
  private currentProvider: AIProvider;

  constructor() {
    console.log('🚀 統合AIサービス初期化中...');
    
    // プロバイダー状況の確認
    const status = getProviderStatus();
    console.log('📊 プロバイダー状況:', status);
    
    // プライマリプロバイダーの選択
    this.currentProvider = selectProvider();
    this.primaryProvider = this.createProvider(this.currentProvider);
    
    // フォールバックプロバイダーの設定
    if (this.currentProvider === AIProvider.BEDROCK && checkProviderAvailability(AIProvider.OPENAI)) {
      this.fallbackProvider = this.createProvider(AIProvider.OPENAI);
      console.log('🔄 OpenAIフォールバック利用可能');
    } else if (this.currentProvider === AIProvider.OPENAI && checkProviderAvailability(AIProvider.BEDROCK)) {
      this.fallbackProvider = this.createProvider(AIProvider.BEDROCK);
      console.log('🔄 Bedrockフォールバック利用可能');
    }
    
    console.log(`✅ AIサービス初期化完了 (Primary: ${this.currentProvider})`);
  }

  private createProvider(provider: AIProvider): IAIProvider {
    switch (provider) {
      case AIProvider.BEDROCK:
        return new BedrockProvider();
      case AIProvider.OPENAI:
        return new OpenAIProvider();
      default:
        throw new Error(`不明なプロバイダー: ${provider}`);
    }
  }

  /**
   * 設計書ドラフト生成（メイン機能）
   */
  async generateDesignDraft(request: DesignGenerationRequest): Promise<GeneratedDraft> {
    const { prompt, context } = request;
    
    // ターゲットタイプの推定
    const targetType = request.targetType || this.inferTargetType(prompt);
    
    // WebUIがブランクかどうかの判定
    const isBlank = this.isWebUIBlank(context);
    const systemPrompt = this.createSystemPrompt(context, targetType, isBlank);
    
    try {
      // プライマリプロバイダーで試行
      const response = await this.primaryProvider.generateResponse(systemPrompt, prompt);
      console.log(`✅ ${this.primaryProvider.name.toUpperCase()} で生成成功`);
      
      return this.parseAIResponse(response, prompt);
      
    } catch (error) {
      console.error(`❌ ${this.primaryProvider.name.toUpperCase()} エラー:`, error);
      
      // フォールバック処理
      if (this.fallbackProvider) {
        return this.executeWithFallback(systemPrompt, prompt, error as AIError);
      } else {
        throw error;
      }
    }
  }

  /**
   * チャット応答生成
   */
  async generateChatResponse(userMessage: string, context: WebUIData): Promise<string> {
    const systemPrompt = this.createChatSystemPrompt(context);
    
    try {
      const response = await this.primaryProvider.generateResponse(systemPrompt, userMessage);
      console.log(`✅ ${this.primaryProvider.name.toUpperCase()} チャット応答成功`);
      return response;
      
    } catch (error) {
      console.error(`❌ ${this.primaryProvider.name.toUpperCase()} チャットエラー:`, error);
      
      if (this.fallbackProvider) {
        try {
          console.log(`🔄 ${this.fallbackProvider.name.toUpperCase()} フォールバック実行中...`);
          const response = await this.fallbackProvider.generateResponse(systemPrompt, userMessage);
          console.log(`✅ ${this.fallbackProvider.name.toUpperCase()} フォールバック成功`);
          return response;
        } catch (fallbackError) {
          console.error('❌ フォールバック失敗:', fallbackError);
          return 'AI応答の生成に失敗しました。しばらく時間をおいて再試行してください。';
        }
      } else {
        return 'AI応答の生成に失敗しました。APIキーとネットワーク接続を確認してください。';
      }
    }
  }

  /**
   * フォールバック実行
   */
  private async executeWithFallback(
    systemPrompt: string, 
    userPrompt: string, 
    primaryError: AIError
  ): Promise<GeneratedDraft> {
    if (!this.fallbackProvider) {
      throw primaryError;
    }

    try {
      console.log(`🔄 ${this.fallbackProvider.name.toUpperCase()} フォールバック実行中...`);
      
      const response = await this.fallbackProvider.generateResponse(systemPrompt, userPrompt);
      console.log(`✅ ${this.fallbackProvider.name.toUpperCase()} フォールバック成功`);
      
      return this.parseAIResponse(response, userPrompt);
      
    } catch (fallbackError) {
      console.error('❌ フォールバック失敗:', fallbackError);
      
      // 両方のエラーを含んだメッセージを作成
      const combinedMessage = 
        `プライマリ (${this.primaryProvider.name}): ${primaryError.message}\n` +
        `フォールバック (${this.fallbackProvider.name}): ${(fallbackError as Error).message}`;
      
      throw new AIError(
        AIErrorType.UNKNOWN,
        this.primaryProvider.name,
        `全てのAIプロバイダーで失敗しました:\n${combinedMessage}`,
        primaryError
      );
    }
  }

  /**
   * WebUIが空白かどうかを判定
   */
  private isWebUIBlank(context: WebUIData): boolean {
    const conditionsEmpty = !context.conditionsMarkdown || context.conditionsMarkdown.trim().length === 0;
    const supplementEmpty = !context.supplementMarkdown || context.supplementMarkdown.trim().length === 0;
    const spreadsheetEmpty = !context.spreadsheetData || context.spreadsheetData.length === 0 || 
      !context.spreadsheetData[0]?.celldata || context.spreadsheetData[0].celldata.length === 0;
    const mockupEmpty = !context.mockupImage;
    
    // 3つ以上が空の場合はブランクと判定
    const emptyCount = [conditionsEmpty, supplementEmpty, spreadsheetEmpty, mockupEmpty].filter(Boolean).length;
    return emptyCount >= 3;
  }

  /**
   * ユーザー指示からターゲットタイプを推定
   */
  private inferTargetType(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('ec') || lowerPrompt.includes('商品') || lowerPrompt.includes('カート') || lowerPrompt.includes('注文')) {
      return 'ecommerce';
    } else if (lowerPrompt.includes('管理') || lowerPrompt.includes('admin') || lowerPrompt.includes('ユーザー管理')) {
      return 'admin';
    } else if (lowerPrompt.includes('ログイン') || lowerPrompt.includes('認証') || lowerPrompt.includes('login')) {
      return 'auth';
    } else if (lowerPrompt.includes('ランディング') || lowerPrompt.includes('lp') || lowerPrompt.includes('トップ')) {
      return 'landing';
    } else if (lowerPrompt.includes('ブログ') || lowerPrompt.includes('記事') || lowerPrompt.includes('cms')) {
      return 'blog';
    }
    
    return 'general';
  }

  /**
   * システムプロンプト生成
   */
  private createSystemPrompt(context: WebUIData, targetType: string, isBlankUI: boolean = false): string {
    if (isBlankUI) {
      return this.createBlankUIPrompt(context, targetType);
    }
    
    return `
あなたは経験豊富な画面設計書作成の専門家です。
ユーザーの指示に従って具体的で実用的な設計書ドラフトを生成してください。

現在のWebUI状況:
- 表示条件: ${context.conditionsMarkdown?.substring(0, 200) || '未入力'}
- 補足説明: ${context.supplementMarkdown?.substring(0, 200) || '未入力'}
- スプレッドシート: ${context.spreadsheetData?.[0]?.celldata?.length || 0}セル存在
- 画面イメージ: ${context.mockupImage ? 'アップロード済み' : '未アップロード'}

生成タイプ: ${targetType}

## 出力形式
以下のJSONライクな形式で応答してください：

**スプレッドシート生成の場合:**
\`\`\`json
{
  "type": "spreadsheet",
  "data": [
    {"r": 0, "c": 0, "v": "項目名"},
    {"r": 0, "c": 1, "v": "型"},
    {"r": 0, "c": 2, "v": "必須"},
    {"r": 1, "c": 0, "v": "ユーザーID"},
    {"r": 1, "c": 1, "v": "文字列"},
    {"r": 1, "c": 2, "v": "○"}
  ]
}
\`\`\`

**Markdown生成の場合:**
\`\`\`json
{
  "type": "conditions",
  "content": "# 表示条件\\n\\n## 基本表示\\n- 項目1\\n- 項目2"
}
\`\`\`

業界標準に従った実用的な内容を生成してください。
`;
  }

  /**
   * ブランクUI用のプロンプト
   */
  private createBlankUIPrompt(_context: WebUIData, targetType: string): string {
    return `
あなたは経験豊富な画面設計書作成の専門家です。
現在WebUIは空白状態のため、ユーザーの指示に基づいて**完全な設計書ドラフト**を一括生成してください。

生成対象: ${targetType}システム

## 出力形式（必須）
以下のJSON形式で、スプレッドシート・表示条件・補足説明をすべて含む統合ドラフトを生成してください：

\`\`\`json
{
  "type": "mixed",
  "spreadsheetData": [
    {"r": 0, "c": 0, "v": "項目名"},
    {"r": 0, "c": 1, "v": "型"},
    {"r": 0, "c": 2, "v": "必須"},
    {"r": 0, "c": 3, "v": "説明"},
    {"r": 1, "c": 0, "v": "具体的項目名"},
    {"r": 1, "c": 1, "v": "文字列"},
    {"r": 1, "c": 2, "v": "○"},
    {"r": 1, "c": 3, "v": "項目の詳細説明"}
  ],
  "conditions": "# 表示条件\\n\\n## 基本表示\\n- 具体的な表示ルール\\n- アクセス権限\\n- 画面遷移条件",
  "supplement": "# 補足説明\\n\\n## 技術仕様\\n- 実装上の注意点\\n## セキュリティ\\n- 考慮事項"
}
\`\`\`

## 生成要件
1. **項目定義**: 実用的で業界標準に沿った項目を10-15個程度
2. **表示条件**: 具体的な業務ルールと技術仕様
3. **補足説明**: セキュリティ・パフォーマンス・保守性の観点

実際の開発で使用できる高品質なドラフトを生成してください。
`;
  }

  /**
   * チャット用システムプロンプト
   */
  private createChatSystemPrompt(context: WebUIData): string {
    return `
あなたは画面設計書作成の専門アシスタントです。
現在のWebUI状況を分析し、ユーザーの質問に具体的で実用的な回答をしてください。

現在のデータ状況:
- 表示条件: ${context.conditionsMarkdown?.length || 0}文字
- 補足説明: ${context.supplementMarkdown?.length || 0}文字  
- スプレッドシート: ${context.spreadsheetData?.[0]?.celldata?.length || 0}セル
- 画面イメージ: ${context.mockupImage ? 'あり' : 'なし'}

回答は日本語で簡潔に答えてください。
`;
  }

  /**
   * AI応答のパース
   */
  private parseAIResponse(response: string, originalPrompt: string): GeneratedDraft {
    console.log('🔍 AI応答パース開始');
    console.log('📏 応答長:', response.length, '文字');
    console.log('📄 AI応答 (先頭500文字):', response.substring(0, 500) + '...');
    console.log('📄 AI応答 (末尾200文字):', '...' + response.substring(response.length - 200));
    
    try {
      // JSONブロック検索のデバッグ
      console.log('🔍 JSON検索パターンをテスト中...');
      
      // パターン1: 標準的な ```json ... ```
      const jsonMatch1 = response.match(/```json\s*([\s\S]*?)\s*```/);
      console.log('📝 パターン1 (```json):', jsonMatch1 ? 'マッチ' : 'なし');
      
      // パターン2: 柔軟な ``` { ... } ```  
      const jsonMatch2 = response.match(/```\s*([\s\S]*?)\s*```/);
      console.log('📝 パターン2 (``` block):', jsonMatch2 ? 'マッチ' : 'なし');
      
      // パターン3: 開始のみ検索（終了タグがない場合）
      const jsonMatch3 = response.match(/```json\s*([\s\S]*)/);
      console.log('📝 パターン3 (```json 開始のみ):', jsonMatch3 ? 'マッチ' : 'なし');
      
      // 優先順位でマッチしたパターンを処理
      const matchedPattern = jsonMatch1 || jsonMatch2 || jsonMatch3;
      if (matchedPattern) {
        console.log('🔍 マッチしたパターンで処理開始');
        console.log('🔍 ブロック内容:', matchedPattern[1].substring(0, 200) + '...');
        try {
          let cleanJson = matchedPattern[1].trim();
          
          // 末尾の ``` を除去（もしあれば）
          if (cleanJson.endsWith('```')) {
            cleanJson = cleanJson.substring(0, cleanJson.length - 3).trim();
          }
          
          console.log('🧹 クリーン後:', cleanJson.substring(0, 200) + '...');
          const jsonData = JSON.parse(cleanJson);
          console.log('✅ JSONパース成功');
          console.log('📊 データタイプ:', jsonData.type);
          
          if (jsonData.type === 'mixed') {
            console.log('🎯 混合タイプとして処理');
            console.log('📊 スプレッドシートデータ:', jsonData.spreadsheetData?.length || 0, '件');
            console.log('📝 表示条件:', jsonData.conditions?.length || 0, '文字');
            console.log('📖 補足説明:', jsonData.supplement?.length || 0, '文字');
            return {
              type: 'mixed',
              spreadsheetData: jsonData.spreadsheetData,
              conditions: jsonData.conditions,
              supplement: jsonData.supplement
            };
          } else if (jsonData.type === 'spreadsheet') {
            console.log('📋 スプレッドシートタイプとして処理');
            return {
              type: 'spreadsheet',
              spreadsheetData: jsonData.data || jsonData.spreadsheetData
            };
          } else if (jsonData.type === 'conditions') {
            console.log('📝 表示条件タイプとして処理');
            return {
              type: 'conditions',
              conditions: jsonData.content || jsonData.conditions
            };
          } else if (jsonData.type === 'supplement') {
            console.log('📖 補足説明タイプとして処理');
            return {
              type: 'supplement',
              supplement: jsonData.content || jsonData.supplement
            };
          }
        } catch (parseError: unknown) {
          console.error('❌ JSONパースエラー:', parseError);
          
          const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
          console.log('📝 パースエラー詳細:', errorMessage);
          
          // エラー位置周辺を表示
          if (errorMessage.includes('position')) {
            const position = parseInt(errorMessage.match(/position (\d+)/)?.[1] || '0');
            const start = Math.max(0, position - 50);
            const end = Math.min(matchedPattern[1].length, position + 50);
            console.log('🔍 エラー位置周辺:', matchedPattern[1].substring(start, end));
            console.log('👆 エラー位置:', ' '.repeat(Math.min(50, position - start)) + '^');
          }
          
          // JSONの修復を試行
          console.log('🔧 JSON修復を試行中...');
          const repairedJson = this.repairJSON(matchedPattern[1]);
          if (repairedJson) {
            try {
              const jsonData = JSON.parse(repairedJson);
              console.log('✅ JSON修復成功！');
              if (jsonData.type === 'mixed') {
                return {
                  type: 'mixed',
                  spreadsheetData: jsonData.spreadsheetData,
                  conditions: jsonData.conditions,
                  supplement: jsonData.supplement
                };
              }
            } catch (repairError) {
              console.error('❌ 修復も失敗:', repairError);
            }
          }
        }
      }
      
      console.log('❌ すべてのパターンでJSONブロックが見つかりません');
      
      // フォールバック: テキスト解析
      console.log('🔄 テキスト解析フォールバックに移行');
      return this.parseTextResponse(response, originalPrompt);
      
    } catch (error) {
      console.error('❌ AI応答パースエラー:', error);
      console.log('🔄 エラー時テキスト解析フォールバックに移行');
      return this.parseTextResponse(response, originalPrompt);
    }
  }

  /**
   * テキスト応答の解析（フォールバック）
   */
  private parseTextResponse(response: string, originalPrompt: string): GeneratedDraft {
    const lowerPrompt = originalPrompt.toLowerCase();
    
    // スプレッドシート生成の判定
    if (lowerPrompt.includes('項目') || lowerPrompt.includes('スプレッドシート') || lowerPrompt.includes('定義')) {
      const sampleData = [
        { r: 0, c: 0, v: "項目名" },
        { r: 0, c: 1, v: "型" },
        { r: 0, c: 2, v: "必須" },
        { r: 1, c: 0, v: "生成された項目" },
        { r: 1, c: 1, v: "文字列" },
        { r: 1, c: 2, v: "○" }
      ];
      
      return {
        type: 'spreadsheet',
        spreadsheetData: sampleData
      };
    }
    
    // Markdown生成
    return {
      type: 'conditions', 
      conditions: `# AI生成コンテンツ\n\n${response}`
    };
  }

  /**
   * 破損したJSONの修復を試行
   */
  private repairJSON(brokenJson: string): string | null {
    try {
      console.log('🔧 JSON修復ステップ1: 末尾の不完全な部分を除去');
      
      // 最後の完全な "}" を探す
      let lastCompleteEnd = -1;
      let braceCount = 0;
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < brokenJson.length; i++) {
        const char = brokenJson[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') {
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              lastCompleteEnd = i;
            }
          }
        }
      }
      
      if (lastCompleteEnd > 0) {
        const repairedJson = brokenJson.substring(0, lastCompleteEnd + 1);
        console.log('🔧 修復後のJSON長:', repairedJson.length, '文字');
        console.log('🔧 修復後末尾:', repairedJson.substring(repairedJson.length - 100));
        return repairedJson;
      }
      
      return null;
    } catch (error) {
      console.error('🔧 JSON修復エラー:', error);
      return null;
    }
  }

  /**
   * サービス情報の取得
   */
  getServiceInfo() {
    return {
      primary: {
        provider: this.primaryProvider.name,
        available: this.primaryProvider.checkAvailability(),
        debug: this.primaryProvider.name === AIProvider.BEDROCK ? 
          (this.primaryProvider as BedrockProvider).getDebugInfo() :
          (this.primaryProvider as OpenAIProvider).getDebugInfo()
      },
      fallback: this.fallbackProvider ? {
        provider: this.fallbackProvider.name,
        available: this.fallbackProvider.checkAvailability(),
        debug: this.fallbackProvider.name === AIProvider.BEDROCK ? 
          (this.fallbackProvider as BedrockProvider).getDebugInfo() :
          (this.fallbackProvider as OpenAIProvider).getDebugInfo()
      } : null,
      status: getProviderStatus()
    };
  }
}

// シングルトンインスタンス
export const aiService = new AIService();

// レガシー互換性関数
export const generateDesignDraft = (request: DesignGenerationRequest): Promise<GeneratedDraft> => 
  aiService.generateDesignDraft(request);

export const generateChatResponse = (userMessage: string, context: WebUIData): Promise<string> => 
  aiService.generateChatResponse(userMessage, context);

export const checkAPIKey = (): boolean => {
  return aiService.getServiceInfo().primary.available;
};