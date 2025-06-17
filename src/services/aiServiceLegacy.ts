// src/services/aiService.ts
import OpenAI from 'openai';
import type { WebUIData, GeneratedDraft, DesignGenerationRequest } from '../types/aiTypes';

// OpenAI クライアント初期化
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // フロントエンド用設定
});

/**
 * WebUIが空白かどうかを判定
 */
const isWebUIBlank = (context: WebUIData): boolean => {
  const conditionsEmpty = !context.conditionsMarkdown || context.conditionsMarkdown.trim().length === 0;
  const supplementEmpty = !context.supplementMarkdown || context.supplementMarkdown.trim().length === 0;
  const spreadsheetEmpty = !context.spreadsheetData || context.spreadsheetData.length === 0 || 
    !context.spreadsheetData[0]?.celldata || context.spreadsheetData[0].celldata.length === 0;
  const mockupEmpty = !context.mockupImage;
  
  // 3つ以上が空の場合はブランクと判定
  const emptyCount = [conditionsEmpty, supplementEmpty, spreadsheetEmpty, mockupEmpty].filter(Boolean).length;
  return emptyCount >= 3;
};

/**
 * ユーザー指示からターゲットタイプを推定
 */
const inferTargetType = (prompt: string): string => {
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
};

/**
 * 設計書生成のメインファンクション
 */
export const generateDesignDraft = async (request: DesignGenerationRequest): Promise<GeneratedDraft> => {
  const { prompt, context } = request;
  
  // ユーザー指示からターゲットタイプを推定
  const targetType = request.targetType || inferTargetType(prompt);
  
  // WebUIがブランクの場合は統合ドラフト生成
  const isBlank = isWebUIBlank(context);
  const systemPrompt = createSystemPrompt(context, targetType, isBlank);
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content || '';
    return parseAIResponse(response, prompt);
    
  } catch (error) {
    console.error('AI生成エラー:', error);
    throw new Error('AI生成に失敗しました。APIキーとネットワーク接続を確認してください。');
  }
};

/**
 * 一般的なチャット応答生成
 */
export const generateChatResponse = async (userMessage: string, context: WebUIData): Promise<string> => {
  const systemPrompt = `
あなたは画面設計書作成の専門アシスタントです。
現在のWebUI状況を分析し、ユーザーの質問に具体的で実用的な回答をしてください。

現在のデータ状況:
- 表示条件: ${context.conditionsMarkdown?.length || 0}文字
- 補足説明: ${context.supplementMarkdown?.length || 0}文字  
- スプレッドシート: ${context.spreadsheetData?.[0]?.celldata?.length || 0}セル
- 画面イメージ: ${context.mockupImage ? 'あり' : 'なし'}

回答は日本語で簡潔に答えてください。
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    return completion.choices[0]?.message?.content || 'すみません、応答の生成に失敗しました。';
    
  } catch (error) {
    console.error('チャット応答エラー:', error);
    return 'AI応答の生成に失敗しました。しばらく時間をおいて再試行してください。';
  }
};

/**
 * ブランクUI用の統合ドラフト生成プロンプト
 */
const createBlankUIPrompt = (_context: WebUIData, targetType: string): string => {
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
};

/**
 * システムプロンプト生成
 */
const createSystemPrompt = (context: WebUIData, targetType: string, isBlankUI: boolean = false): string => {
  
  // ブランクUIの場合は統合ドラフト生成プロンプト
  if (isBlankUI) {
    return createBlankUIPrompt(context, targetType);
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
};

/**
 * AI応答をパース
 */
const parseAIResponse = (response: string, originalPrompt: string): GeneratedDraft => {
  try {
    // JSONブロックを検索
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const jsonData = JSON.parse(jsonMatch[1]);
      
      if (jsonData.type === 'spreadsheet') {
        return {
          type: 'spreadsheet',
          spreadsheetData: jsonData.data
        };
      } else if (jsonData.type === 'conditions') {
        return {
          type: 'conditions',
          conditions: jsonData.content
        };
      } else if (jsonData.type === 'supplement') {
        return {
          type: 'supplement',
          supplement: jsonData.content
        };
      } else if (jsonData.type === 'mixed') {
        return {
          type: 'mixed',
          spreadsheetData: jsonData.spreadsheetData,
          conditions: jsonData.conditions,
          supplement: jsonData.supplement
        };
      }
    }
    
    // フォールバック: テキスト解析
    return parseTextResponse(response, originalPrompt);
    
  } catch (error) {
    console.error('AI応答パースエラー:', error);
    return parseTextResponse(response, originalPrompt);
  }
};

/**
 * テキスト応答の解析（フォールバック）
 */
const parseTextResponse = (response: string, originalPrompt: string): GeneratedDraft => {
  const lowerPrompt = originalPrompt.toLowerCase();
  
  // スプレッドシート生成の判定
  if (lowerPrompt.includes('項目') || lowerPrompt.includes('スプレッドシート') || lowerPrompt.includes('定義')) {
    // 簡単なスプレッドシートデータを生成
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
};

/**
 * APIキーの存在確認
 */
export const checkAPIKey = (): boolean => {
  return !!import.meta.env.VITE_OPENAI_API_KEY;
};