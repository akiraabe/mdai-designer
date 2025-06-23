import { useCallback } from 'react';
import type { Project, Document } from '../types';
import { addProject, addDocument, createProject, createDocument } from '../utils/storage';
import { downloadProjectAsMarkdown } from '../utils/markdownExport';

// プロジェクトエクスポート用のデータ構造
interface ProjectExportData {
  project: Project;              // プロジェクト情報
  documents: Document[];         // 関連する全設計書
  exportedAt: string;           // エクスポート日時
  version: string;              // データフォーマットバージョン
}

interface UseProjectOperationsProps {
  projects: Project[];
  documents: Document[];
  appState: any; // AppState
  setAppState: (state: any) => void; // 状態更新関数
  onCreateProject: (name: string, description?: string) => void;
  onCreateDocument: (name: string, projectId: string, type?: any) => void;
}

export const useProjectOperations = ({
  projects,
  documents,
  appState,
  setAppState,
  onCreateProject,
  onCreateDocument
}: UseProjectOperationsProps) => {

  // プロジェクト単位エクスポート
  const handleProjectExport = useCallback((projectId: string) => {
    console.log('📦 プロジェクトエクスポート開始:', projectId);
    
    // 対象プロジェクトを取得
    const targetProject = projects.find(p => p.id === projectId);
    if (!targetProject) {
      alert('エクスポート対象のプロジェクトが見つかりません。');
      return;
    }

    // 関連する設計書を取得
    const relatedDocuments = documents.filter(doc => doc.projectId === projectId);
    
    console.log('📦 エクスポート対象:', {
      project: targetProject.name,
      documentCount: relatedDocuments.length
    });

    // エクスポートデータを構築
    const exportData: ProjectExportData = {
      project: targetProject,
      documents: relatedDocuments,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    // ファイルとしてダウンロード
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${targetProject.name}_export.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert(`プロジェクト「${targetProject.name}」をエクスポートしました！\n設計書数: ${relatedDocuments.length}件`);
  }, [projects, documents]);

  // プロジェクト単位インポート
  const handleProjectImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📥 プロジェクトインポート開始');
    
    const file = e.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const importData: ProjectExportData = JSON.parse(result);
            
            console.log('📥 インポートデータ:', {
              project: importData.project?.name,
              documentCount: importData.documents?.length,
              version: importData.version
            });

            // データ検証
            if (!importData.project || !importData.documents) {
              throw new Error('不正なプロジェクトエクスポートファイルです。');
            }

            // 同名プロジェクトの存在確認
            const existingProject = projects.find(p => p.name === importData.project.name);
            if (existingProject) {
              const confirmed = window.confirm(
                `同名のプロジェクト「${importData.project.name}」が既に存在します。\n` +
                `上書きしますか？\n\n` +
                `※上書きすると既存のプロジェクトと設計書は削除されます。`
              );
              if (!confirmed) {
                return;
              }
            }

            // プロジェクトを作成（完全復元）
            const newProjectName = existingProject ? 
              `${importData.project.name}_imported` : 
              importData.project.name;
            
            // 新しいプロジェクトを作成
            const newProject = createProject(newProjectName, importData.project.description);
            const newAppState = addProject(appState, newProject);
            
            // 設計書を順次作成（内容も完全復元）
            let updatedState = newAppState;
            importData.documents.forEach((doc) => {
              const newDocument = createDocument(
                doc.name,
                newProject.id, // 新しいプロジェクトID
                doc.type,
                doc.conditions,      // 表示条件を復元
                doc.supplement,      // 補足説明を復元
                doc.spreadsheet,     // スプレッドシートデータを復元
                doc.mockup,          // 画面モックアップを復元
                doc.mermaidCode || ''  // Mermaid ER図コードを復元
              );
              updatedState = addDocument(updatedState, newDocument);
              console.log(`📥 設計書「${doc.name}」を内容込みで復元 (mermaidCode: ${doc.mermaidCode ? 'あり' : 'なし'})`);
            });
            
            // 状態を更新
            setAppState(updatedState);
            
            console.log('📥 インポート完了:', {
              project: newProjectName,
              documentsRestored: importData.documents.length
            });
            
            alert(
              `プロジェクト「${newProjectName}」をインポートしました！\n` +
              `設計書数: ${importData.documents.length}件\n\n` +
              `✅ 設計書の内容も完全に復元されました。`
            );
          }
        } catch (error) {
          console.error('インポートエラー:', error);
          alert('プロジェクトファイルのインポートに失敗しました。\nファイル形式を確認してください。');
        }
      };
      reader.readAsText(file);
    } else {
      alert('JSONファイルを選択してください。');
    }
    
    // ファイル選択をリセット
    e.target.value = '';
  }, [projects, onCreateProject, onCreateDocument]);

  // プロジェクト単位Markdownエクスポート
  const handleProjectMarkdownExport = useCallback((projectId: string) => {
    console.log('📄 プロジェクトMarkdownエクスポート開始:', projectId);
    
    // 対象プロジェクトを取得
    const targetProject = projects.find(p => p.id === projectId);
    if (!targetProject) {
      alert('エクスポート対象のプロジェクトが見つかりません。');
      return;
    }

    // 関連する設計書を取得
    const relatedDocuments = documents.filter(doc => doc.projectId === projectId);
    
    console.log('📄 Markdownエクスポート対象:', {
      project: targetProject.name,
      documentCount: relatedDocuments.length
    });

    // プロジェクト統合Markdownとしてダウンロード
    downloadProjectAsMarkdown(
      targetProject.name,
      targetProject.description || '',
      relatedDocuments
    );

    alert(`プロジェクト「${targetProject.name}」をMarkdown形式でエクスポートしました！\n設計書数: ${relatedDocuments.length}件`);
  }, [projects, documents]);

  return {
    handleProjectExport,
    handleProjectImport,
    handleProjectMarkdownExport
  };
};