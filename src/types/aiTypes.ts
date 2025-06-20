// src/types/aiTypes.ts
// AI関連の型定義

// WebUIの現在の状態
export interface WebUIData {
  conditionsMarkdown: string;
  supplementMarkdown: string;
  spreadsheetData: any[];
  mockupImage: string | null;
  mermaidCode: string;
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

// 修正提案システム関連型定義
export interface ModificationRequest {
  changeDescription: string;  // ユーザーの変更要求
  context: WebUIData;         // 現在の設計書状態
  timestamp: number;          // リクエスト時刻
}

export interface ModificationProposal {
  id: string;                 // 提案ID
  request: ModificationRequest;
  changes: ProposedChange[];  // 変更提案の詳細
  summary: string;            // 変更概要
  risks: string[];            // 潜在的なリスク
  timestamp: number;          // 提案生成時刻
}

export interface ProposedChange {
  target: 'conditions' | 'supplement' | 'supplementary' | 'spreadsheet' | 'mockup' | 'mermaid';
  action: 'add' | 'modify' | 'delete';
  location?: string;          // 変更位置（行番号、セル位置等）
  originalContent?: string;   // 元の内容
  newContent: string;         // 新しい内容
  reason: string;             // 変更理由
  confidence: number;         // 信頼度 (0-1)
}

export interface BackupData {
  id: string;                 // バックアップID
  timestamp: number;          // バックアップ時刻
  label: string;              // 人間向けラベル
  data: WebUIData;           // バックアップされたデータ
  metadata?: {
    modificationId?: string;  // 関連する修正提案ID
    reason: string;           // バックアップ理由
  };
}

// 差分情報
export interface DiffResult {
  target: 'conditions' | 'supplement' | 'spreadsheet' | 'mermaid';
  hasChanges: boolean;
  additions: string[];        // 追加された内容
  modifications: string[];    // 変更された内容
  deletions: string[];        // 削除された内容
}

// レガシー互換性（削除予定）
export interface AIConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}