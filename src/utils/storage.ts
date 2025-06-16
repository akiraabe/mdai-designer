// ローカルストレージ操作ユーティリティ
// プロジェクト階層管理システムのデータ永続化

import type { Project, Document, AppState } from '../types';
import { STORAGE_KEYS } from '../types';

/**
 * UUID生成ユーティリティ
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * ISO文字列の現在日時取得
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * ローカルストレージからアプリケーション状態を読み込み
 */
export function loadAppState(): AppState {
  try {
    const storedState = localStorage.getItem(STORAGE_KEYS.APP_STATE);
    if (storedState) {
      const parsedState = JSON.parse(storedState) as AppState;
      return {
        projects: parsedState.projects || [],
        documents: parsedState.documents || [],
        currentProjectId: parsedState.currentProjectId || null,
        currentDocumentId: parsedState.currentDocumentId || null
      };
    }
  } catch (error) {
    console.error('❌ アプリケーション状態の読み込みに失敗:', error);
  }
  
  // デフォルト状態を返す
  return {
    projects: [],
    documents: [],
    currentProjectId: null,
    currentDocumentId: null
  };
}

/**
 * アプリケーション状態をローカルストレージに保存
 */
export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(state));
    console.log('💾 アプリケーション状態を保存しました');
  } catch (error) {
    console.error('❌ アプリケーション状態の保存に失敗:', error);
  }
}

/**
 * プロジェクト作成
 */
export function createProject(name: string, description?: string): Project {
  const now = getCurrentTimestamp();
  return {
    id: generateUUID(),
    name,
    description,
    createdAt: now,
    updatedAt: now,
    documentIds: []
  };
}

/**
 * 設計書作成
 */
export function createDocument(
  name: string,
  projectId: string,
  conditions = '',
  supplement = '',
  spreadsheet = null,
  mockup: string | null = null
): Document {
  const now = getCurrentTimestamp();
  return {
    id: generateUUID(),
    projectId,
    name,
    conditions,
    supplement,
    spreadsheet,
    mockup,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * プロジェクト一覧取得
 */
export function getProjects(state: AppState): Project[] {
  return state.projects.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * 特定プロジェクトの設計書一覧取得
 */
export function getDocumentsByProjectId(state: AppState, projectId: string): Document[] {
  return state.documents
    .filter(doc => doc.projectId === projectId)
    .sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

/**
 * プロジェクト追加
 */
export function addProject(state: AppState, project: Project): AppState {
  return {
    ...state,
    projects: [...state.projects, project],
    currentProjectId: project.id
  };
}

/**
 * 設計書追加
 */
export function addDocument(state: AppState, document: Document): AppState {
  // プロジェクトのdocumentIdsも更新
  const updatedProjects = state.projects.map(project =>
    project.id === document.projectId
      ? {
          ...project,
          documentIds: [...project.documentIds, document.id],
          updatedAt: getCurrentTimestamp()
        }
      : project
  );

  return {
    ...state,
    projects: updatedProjects,
    documents: [...state.documents, document],
    currentDocumentId: document.id
  };
}

/**
 * プロジェクト更新
 */
export function updateProject(state: AppState, projectId: string, updates: Partial<Project>): AppState {
  const updatedProjects = state.projects.map(project =>
    project.id === projectId
      ? {
          ...project,
          ...updates,
          updatedAt: getCurrentTimestamp()
        }
      : project
  );

  return {
    ...state,
    projects: updatedProjects
  };
}

/**
 * 設計書更新
 */
export function updateDocument(state: AppState, documentId: string, updates: Partial<Document>): AppState {
  const updatedDocuments = state.documents.map(document =>
    document.id === documentId
      ? {
          ...document,
          ...updates,
          updatedAt: getCurrentTimestamp()
        }
      : document
  );

  // 親プロジェクトの更新日時も更新
  const document = state.documents.find(d => d.id === documentId);
  const updatedProjects = document 
    ? state.projects.map(project =>
        project.id === document.projectId
          ? { ...project, updatedAt: getCurrentTimestamp() }
          : project
      )
    : state.projects;

  return {
    ...state,
    projects: updatedProjects,
    documents: updatedDocuments
  };
}

/**
 * プロジェクト削除
 */
export function deleteProject(state: AppState, projectId: string): AppState {
  // 関連する設計書も全て削除
  const filteredDocuments = state.documents.filter(doc => doc.projectId !== projectId);
  const filteredProjects = state.projects.filter(project => project.id !== projectId);

  return {
    ...state,
    projects: filteredProjects,
    documents: filteredDocuments,
    currentProjectId: state.currentProjectId === projectId ? null : state.currentProjectId,
    currentDocumentId: state.documents.some(doc => 
      doc.id === state.currentDocumentId && doc.projectId === projectId
    ) ? null : state.currentDocumentId
  };
}

/**
 * 設計書削除
 */
export function deleteDocument(state: AppState, documentId: string): AppState {
  const document = state.documents.find(d => d.id === documentId);
  if (!document) return state;

  // プロジェクトのdocumentIdsからも削除
  const updatedProjects = state.projects.map(project =>
    project.id === document.projectId
      ? {
          ...project,
          documentIds: project.documentIds.filter(id => id !== documentId),
          updatedAt: getCurrentTimestamp()
        }
      : project
  );

  const filteredDocuments = state.documents.filter(doc => doc.id !== documentId);

  return {
    ...state,
    projects: updatedProjects,
    documents: filteredDocuments,
    currentDocumentId: state.currentDocumentId === documentId ? null : state.currentDocumentId
  };
}

/**
 * 現在の設計書取得
 */
export function getCurrentDocument(state: AppState): Document | null {
  if (!state.currentDocumentId) return null;
  return state.documents.find(doc => doc.id === state.currentDocumentId) || null;
}

/**
 * 現在のプロジェクト取得
 */
export function getCurrentProject(state: AppState): Project | null {
  if (!state.currentProjectId) return null;
  return state.projects.find(project => project.id === state.currentProjectId) || null;
}

/**
 * 既存データのマイグレーション
 * 従来の単一設計書から階層構造への移行
 */
export function migrateFromLegacyData(): AppState | null {
  // 将来的に従来データがある場合の移行処理
  // 現在は新規インストールのみ想定
  return null;
}