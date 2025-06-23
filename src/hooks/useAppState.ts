// アプリケーション状態管理フック
// プロジェクト階層管理システムの中核

import { useState, useEffect, useCallback } from 'react';
import type { AppState, AppMode, NavigationState, DocumentType } from '../types';
import { 
  loadAppState, 
  saveAppState,
  createProject,
  createDocument,
  addProject,
  addDocument,
  updateProject,
  updateDocument,
  deleteProject,
  deleteDocument,
  getCurrentDocument,
  getCurrentProject,
  getProjects,
  getDocumentsByProjectId
} from '../utils/storage';

export const useAppState = () => {
  // アプリケーション状態
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  
  // ナビゲーション状態
  const [navigationState, setNavigationState] = useState<NavigationState>({
    mode: appState.projects.length > 0 ? 'project-list' : 'project-list',
    currentProjectId: appState.currentProjectId,
    currentDocumentId: appState.currentDocumentId
  });

  // 状態変更時の自動保存
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // ナビゲーション状態とアプリ状態の同期
  useEffect(() => {
    setNavigationState(prev => ({
      ...prev,
      currentProjectId: appState.currentProjectId,
      currentDocumentId: appState.currentDocumentId
    }));
  }, [appState.currentProjectId, appState.currentDocumentId]);

  // プロジェクト作成
  const handleCreateProject = useCallback((name: string, description?: string) => {
    const newProject = createProject(name, description);
    const newState = addProject(appState, newProject);
    setAppState(newState);
    setNavigationState({
      mode: 'document-list',
      currentProjectId: newProject.id,
      currentDocumentId: null
    });
    console.log('✅ プロジェクト作成完了:', newProject.name);
  }, [appState]);

  // 設計書作成
  const handleCreateDocument = useCallback((name: string, projectId: string, type: DocumentType = 'screen') => {
    const newDocument = createDocument(name, projectId, type);
    const newState = addDocument(appState, newDocument);
    setAppState(newState);
    setNavigationState({
      mode: 'document-edit',
      currentProjectId: projectId,
      currentDocumentId: newDocument.id
    });
    console.log('✅ 設計書作成完了:', newDocument.name, 'タイプ:', type);
  }, [appState]);

  // プロジェクト選択
  const handleSelectProject = useCallback((projectId: string) => {
    setAppState(prev => ({
      ...prev,
      currentProjectId: projectId,
      currentDocumentId: null
    }));
    setNavigationState({
      mode: 'document-list',
      currentProjectId: projectId,
      currentDocumentId: null
    });
  }, []);

  // 設計書選択
  const handleSelectDocument = useCallback((documentId: string) => {
    const document = appState.documents.find(doc => doc.id === documentId);
    if (document) {
      setAppState(prev => ({
        ...prev,
        currentProjectId: document.projectId,
        currentDocumentId: documentId
      }));
      setNavigationState({
        mode: 'document-edit',
        currentProjectId: document.projectId,
        currentDocumentId: documentId
      });
    }
  }, [appState.documents]);

  // プロジェクト更新
  const handleUpdateProject = useCallback((projectId: string, updates: { name?: string; description?: string }) => {
    const newState = updateProject(appState, projectId, updates);
    setAppState(newState);
    console.log('✅ プロジェクト更新完了');
  }, [appState]);

  // 設計書更新
  const handleUpdateDocument = useCallback((documentId: string, updates: {
    name?: string;
    conditions?: string;
    supplement?: string;
    spreadsheet?: any;
    mockup?: string | null;
  }) => {
    const newState = updateDocument(appState, documentId, updates);
    setAppState(newState);
    // console.log('✅ 設計書更新完了');
  }, [appState]);

  // プロジェクト削除
  const handleDeleteProject = useCallback((projectId: string) => {
    const newState = deleteProject(appState, projectId);
    setAppState(newState);
    setNavigationState({
      mode: 'project-list',
      currentProjectId: null,
      currentDocumentId: null
    });
    console.log('✅ プロジェクト削除完了');
  }, [appState]);

  // 設計書削除
  const handleDeleteDocument = useCallback((documentId: string) => {
    const document = appState.documents.find(doc => doc.id === documentId);
    const newState = deleteDocument(appState, documentId);
    setAppState(newState);
    
    if (document) {
      setNavigationState({
        mode: 'document-list',
        currentProjectId: document.projectId,
        currentDocumentId: null
      });
    }
    console.log('✅ 設計書削除完了');
  }, [appState]);

  // 画面モード変更
  const handleChangeMode = useCallback((mode: AppMode) => {
    setNavigationState(prev => ({ ...prev, mode }));
  }, []);

  // 戻るナビゲーション
  const handleGoBack = useCallback(() => {
    switch (navigationState.mode) {
      case 'document-edit':
        setNavigationState({
          mode: 'document-list',
          currentProjectId: navigationState.currentProjectId,
          currentDocumentId: null
        });
        break;
      case 'document-list':
        setNavigationState({
          mode: 'project-list',
          currentProjectId: null,
          currentDocumentId: null
        });
        break;
      default:
        // project-listでは戻れない
        break;
    }
  }, [navigationState]);

  // 現在の設計書取得
  const currentDocument = getCurrentDocument(appState);
  
  // 現在のプロジェクト取得
  const currentProject = getCurrentProject(appState);
  
  // プロジェクト一覧取得
  const projects = getProjects(appState);
  
  // 全設計書取得
  const documents = appState.documents;
  
  // 現在のプロジェクトの設計書一覧取得
  const currentDocuments = navigationState.currentProjectId 
    ? getDocumentsByProjectId(appState, navigationState.currentProjectId)
    : [];

  return {
    // 状態
    appState,
    setAppState,
    navigationState,
    currentDocument,
    currentProject,
    projects,
    documents,
    currentDocuments,
    
    // アクション
    handleCreateProject,
    handleCreateDocument,
    handleSelectProject,
    handleSelectDocument,
    handleUpdateProject,
    handleUpdateDocument,
    handleDeleteProject,
    handleDeleteDocument,
    handleChangeMode,
    handleGoBack
  };
};
