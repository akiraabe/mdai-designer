// src/components/Document/ModelDocumentView.tsx
// データモデル設計書専用のドキュメント編集View

import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { CopilotKit } from '@copilotkit/react-core';
import type { Document, Project } from '../../types';

// 専用フック
import { useDocumentState } from '../../hooks/useDocumentState';
import { useTabNavigation } from '../../hooks/useTabNavigation';
import { useFileOperations } from '../../hooks/useFileOperations';

// 共通コンポーネント
import { DocumentHeader } from '../Header/DocumentHeader';
import { ActionButtons } from '../Header/ActionButtons';
import { TabNavigation } from '../Navigation/TabNavigation';
import { ModelChatPanel } from '../Chat/ModelChatPanel';
import { BackupManager } from '../Common/BackupManager';

// データモデル設計書専用セクション
import { ModelsSection } from '../Content/ModelsSection';
import { SupplementSection } from '../Content/SupplementSection';

// Utils
import { getDocumentTypeInfo } from '../../utils/documentTypes';

interface ModelDocumentViewProps {
  document: Document;
  project: Project;
  onUpdateDocument: (documentId: string, updates: {
    supplement?: string;
    mermaidCode?: string;
  }) => void;
  onGoBack: () => void;
}

export const ModelDocumentView: React.FC<ModelDocumentViewProps> = ({
  document,
  project,
  onUpdateDocument,
  onGoBack
}) => {
  // チャットパネル状態
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // バックアップ管理状態
  const [isBackupManagerOpen, setIsBackupManagerOpen] = useState(false);
  
  // タブナビゲーション（データモデル設計書専用タブのみ）
  const { activeTab, setActiveTab } = useTabNavigation();
  
  // データモデル設計書専用状態管理
  const {
    supplementMarkdown,
    mermaidCode,
    setSupplementMarkdown,
    setMermaidCode,
  } = useDocumentState();

  // 初期データの設定（データモデル設計書のフィールドのみ）
  useEffect(() => {
    setSupplementMarkdown(document.supplement || '');
    setMermaidCode(document.mermaidCode || '');
  }, [document, setSupplementMarkdown, setMermaidCode]);

  // データ変更時の自動保存（データモデル設計書フィールドのみ）
  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdateDocument(document.id, {
        supplement: supplementMarkdown,
        mermaidCode: mermaidCode,
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [supplementMarkdown, mermaidCode, document.id, onUpdateDocument]);

  // ファイル操作フック（データモデル設計書用）
  const {
    handleExport,
    handleImport,
  } = useFileOperations({
    conditionsMarkdown: '', // データモデル設計書では未使用
    supplementMarkdown,
    spreadsheetData: [], // データモデル設計書では未使用
    mockupImage: null, // データモデル設計書では未使用
    mermaidCode,
    setConditionsMarkdown: () => {}, // データモデル設計書では未使用
    setSupplementMarkdown,
    setSpreadsheetData: () => {}, // データモデル設計書では未使用
    setMockupImage: () => {}, // データモデル設計書では未使用
    setMermaidCode,
  });

  // バックアップ復元処理（データモデル設計書用）
  const handleRestoreFromBackup = (backupData: {
    conditionsMarkdown: string;
    supplementMarkdown: string;
    spreadsheetData: any[];
    mockupImage: string | null;
    mermaidCode: string;
  }) => {
    setSupplementMarkdown(backupData.supplementMarkdown || '');
    setMermaidCode(backupData.mermaidCode || '');
    // conditions, spreadsheet, mockupはデータモデル設計書では無視
    
    console.log('🔄 データモデル設計書バックアップからデータを復元しました');
  };

  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            {/* パンくずリスト */}
            <div className="flex items-center">
              <button
                onClick={onGoBack}
                className="flex items-center px-3 py-2 bg-gray-600 border border-gray-700 text-white hover:bg-gray-700 rounded-lg mr-4 font-bold"
                style={{ backgroundColor: '#4b5563', color: '#ffffff', fontWeight: 'bold' }}
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                戻る
              </button>
              <div className="text-sm text-gray-500 mr-4">
                {project.name} &gt; 
                <span style={{ marginLeft: '4px', marginRight: '4px' }}>
                  {getDocumentTypeInfo('model').icon}
                </span>
                {document.name}
                <span style={{ 
                  marginLeft: '8px', 
                  padding: '2px 6px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#d97706'
                }}>
                  {getDocumentTypeInfo('model').label}
                </span>
              </div>
            </div>

            {/* ドキュメントヘッダーとアクションボタン */}
            <div className="flex items-center space-x-6">
              <DocumentHeader
                title={document.name}
                updateDate={new Date(document.updatedAt).toLocaleDateString('ja-JP')}
                author="設計チーム"
              />
              <ActionButtons
                onImport={() => {
                  const input = window.document.getElementById('import-json') as HTMLInputElement;
                  input?.click();
                }}
                onExport={handleExport}
                onLoadTestData={() => {}} // データモデル設計書では未使用
                onFileImport={handleImport}
              />
            </div>
          </div>
        </div>

        {/* タブナビゲーション（データモデル設計書専用） */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          documentType="model"
        />

        {/* メインコンテンツ（データモデル設計書専用セクションのみ） */}
        <div className="bg-white rounded-b-lg shadow-sm p-6">
          {/* 全体表示 */}
          {activeTab === 'all' && (
            <div className="space-y-8">
              <ModelsSection
                mermaidCode={mermaidCode}
                onMermaidCodeUpdate={setMermaidCode}
              />
              <SupplementSection
                supplementMarkdown={supplementMarkdown}
                onSupplementChange={setSupplementMarkdown}
              />
            </div>
          )}

          {/* データモデルタブ */}
          {activeTab === 'models' && (
            <ModelsSection
              mermaidCode={mermaidCode}
              onMermaidCodeUpdate={setMermaidCode}
            />
          )}

          {/* 補足説明タブ */}
          {activeTab === 'supplement' && (
            <SupplementSection
              supplementMarkdown={supplementMarkdown}
              onSupplementChange={setSupplementMarkdown}
            />
          )}
        </div>

        {/* チャットボタン */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          style={{ 
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            backgroundColor: '#d97706', // データモデル設計書専用色（オレンジ）
            color: '#ffffff',
            border: 'none',
            borderRadius: '50%',
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#b45309'}
          onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#d97706'}
        >
          <MessageCircle size={24} color="white" strokeWidth={2} />
        </button>

        {/* チャットパネル（データモデル設計書専用） */}
        {isChatOpen && (
          <ModelChatPanel
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            supplementMarkdown={supplementMarkdown}
            mermaidCode={mermaidCode}
            onSupplementMarkdownUpdate={setSupplementMarkdown}
            onMermaidCodeUpdate={setMermaidCode}
            onShowBackupManager={() => setIsBackupManagerOpen(true)}
          />
        )}

        {/* バックアップ管理（データモデル設計書専用データ） */}
        <BackupManager
          isOpen={isBackupManagerOpen}
          onClose={() => setIsBackupManagerOpen(false)}
          onRestore={handleRestoreFromBackup}
          currentData={{
            conditionsMarkdown: '', // データモデル設計書では未使用
            supplementMarkdown,
            spreadsheetData: [], // データモデル設計書では未使用
            mockupImage: null, // データモデル設計書では未使用
            mermaidCode
          }}
        />
      </div>
    </CopilotKit>
  );
};