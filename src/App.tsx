// src/App.tsx - プロジェクト階層管理システム
import React from 'react';
import './App.css';

// カスタムフック
import { useAppState } from './hooks/useAppState';

// UIコンポーネント
import { ProjectListView } from './components/Project/ProjectListView';
import { DocumentListView } from './components/Document/DocumentListView';
import { DocumentEditView } from './components/Document/DocumentEditView';

// メインコンポーネント
const App: React.FC = () => {
  // アプリケーション状態管理
  const {
    navigationState,
    currentDocument,
    currentProject,
    projects,
    currentDocuments,
    handleCreateProject,
    handleCreateDocument,
    handleSelectProject,
    handleSelectDocument,
    handleUpdateProject,
    handleUpdateDocument,
    handleDeleteProject,
    handleDeleteDocument,
    handleGoBack
  } = useAppState();

  // 画面モードに応じたレンダリング
  const renderCurrentView = () => {
    switch (navigationState.mode) {
      case 'project-list':
        return (
          <ProjectListView
            projects={projects}
            onCreateProject={handleCreateProject}
            onSelectProject={handleSelectProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
          />
        );
      
      case 'document-list':
        if (!currentProject) {
          console.error('プロジェクトが選択されていません');
          return <div>エラー: プロジェクトが見つかりません</div>;
        }
        return (
          <DocumentListView
            project={currentProject}
            documents={currentDocuments}
            onCreateDocument={handleCreateDocument}
            onSelectDocument={handleSelectDocument}
            onUpdateDocument={(documentId, updates) => handleUpdateDocument(documentId, updates)}
            onDeleteDocument={handleDeleteDocument}
            onGoBack={handleGoBack}
          />
        );
      
      case 'document-edit':
        if (!currentDocument || !currentProject) {
          console.error('設計書またはプロジェクトが選択されていません');
          return <div>エラー: 設計書が見つかりません</div>;
        }
        return (
          <DocumentEditView
            document={currentDocument}
            project={currentProject}
            onUpdateDocument={handleUpdateDocument}
            onGoBack={handleGoBack}
          />
        );
      
      default:
        return <div>不明な画面モードです</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentView()}
    </div>
  );
};

export default App;