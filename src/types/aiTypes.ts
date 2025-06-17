// src/types/aiTypes.ts
// AI関連の型定義

// WebUIの現在の状態
export interface WebUIData {
  conditionsMarkdown: string;
  supplementMarkdown: string;
  spreadsheetData: any[];
  mockupImage: string | null;
}

// AI生成結果
export interface GeneratedDraft {
  type: 'spreadsheet' | 'conditions' | 'supplement' | 'mixed';
  spreadsheetData?: any[];
  conditions?: string;
  supplement?: string;
}

// AI生成リクエスト
export interface DesignGenerationRequest {
  prompt: string;
  context: WebUIData;
  targetType?: string;
}

// AIプロバイダー種別
export type AIProvider = 'bedrock' | 'openai';
export const AIProvider = {
  BEDROCK: 'bedrock' as const,
  OPENAI: 'openai' as const
} as const;

// AIエラータイプ
export type AIErrorType = 'authentication' | 'rate_limit' | 'network' | 'quota_exceeded' | 'model_error' | 'cors' | 'unknown';
export const AIErrorType = {
  AUTHENTICATION: 'authentication' as const,
  RATE_LIMIT: 'rate_limit' as const,
  NETWORK: 'network' as const,
  QUOTA_EXCEEDED: 'quota_exceeded' as const,
  MODEL_ERROR: 'model_error' as const,
  CORS: 'cors' as const,
  UNKNOWN: 'unknown' as const
} as const;

// AIエラークラス
export class AIError extends Error {
  public type: AIErrorType;
  public provider: AIProvider;
  public originalError?: Error;

  constructor(
    type: AIErrorType,
    provider: AIProvider,
    message: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'AIError';
    this.type = type;
    this.provider = provider;
    this.originalError = originalError;
  }
}

// プロバイダー共通インターフェース
export interface IAIProvider {
  readonly name: AIProvider;
  generateResponse(systemPrompt: string, userPrompt: string): Promise<string>;
  checkAvailability(): boolean;
}

// レガシー互換性（削除予定）
export interface AIConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}