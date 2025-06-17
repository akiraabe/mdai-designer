// src/types/aiTypes.ts

export interface WebUIData {
  conditionsMarkdown: string;
  supplementMarkdown: string;
  spreadsheetData: any[];
  mockupImage: string | null;
}

export interface GeneratedDraft {
  spreadsheetData?: any[];
  conditions?: string;
  supplement?: string;
  type: 'spreadsheet' | 'conditions' | 'supplement' | 'mixed';
}

export interface AIConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface DesignGenerationRequest {
  prompt: string;
  context: WebUIData;
  targetType?: 'ecommerce' | 'admin' | 'landing' | 'general';
}