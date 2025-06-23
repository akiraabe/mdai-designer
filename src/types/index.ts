// 型定義ファイル
// プロジェクト階層管理システムの型定義

export interface Project {
  id: string;              // UUID
  name: string;            // プロジェクト名
  description?: string;    // プロジェクト説明
  createdAt: string;      // 作成日時 (ISO文字列)
  updatedAt: string;      // 更新日時 (ISO文字列)
  documentIds: string[];  // 配下の設計書ID一覧
}

// 設計書タイプ
export type DocumentType = 'screen' | 'model' | 'api' | 'database';

export interface Document {
  id: string;              // UUID
  projectId: string;       // 親プロジェクトID
  name: string;            // 設計書名
  type: DocumentType;      // 設計書タイプ
  conditions: string;      // 表示条件 (Markdown)
  supplement: string;      // 補足説明 (Markdown)
  spreadsheet: any;        // スプレッドシートデータ (Fortune-Sheet形式) // eslint-disable-line @typescript-eslint/no-explicit-any
  mockup: string | null;   // 画面モックアップ (Base64)
  aiGeneratedImage?: string | null; // AI生成画像 (Base64)
  mermaidCode?: string;    // Mermaid ER図コード
  createdAt: string;      // 作成日時 (ISO文字列)
  updatedAt: string;      // 更新日時 (ISO文字列)
}

export interface AppState {
  projects: Project[];              // 全プロジェクト
  documents: Document[];            // 全設計書
  currentProjectId: string | null;  // 現在選択中のプロジェクトID
  currentDocumentId: string | null; // 現在選択中の設計書ID
}

// ローカルストレージキー定数
export const STORAGE_KEYS = {
  PROJECTS: 'design-doc-editor-projects',
  DOCUMENTS: 'design-doc-editor-documents',
  CURRENT_PROJECT: 'design-doc-editor-current-project',
  CURRENT_DOCUMENT: 'design-doc-editor-current-document',
  APP_STATE: 'design-doc-editor-app-state'
} as const;

// アプリケーションモード
export type AppMode = 'project-list' | 'document-list' | 'document-edit';

// 画面遷移の状態管理
export interface NavigationState {
  mode: AppMode;
  currentProjectId: string | null;
  currentDocumentId: string | null;
}

// プロジェクト作成・編集用のフォームデータ
export interface ProjectFormData {
  name: string;
  description?: string;
}

// 設計書作成・編集用のフォームデータ
export interface DocumentFormData {
  name: string;
  projectId: string;
  type: DocumentType;
}

// 設計書タイプ情報
export interface DocumentTypeInfo {
  type: DocumentType;
  label: string;
  description: string;
  icon: string;
  defaultTabs: string[];
  status?: 'available' | 'development' | 'disabled'; // 状態フィールド
  visible?: boolean; // 表示可否
}