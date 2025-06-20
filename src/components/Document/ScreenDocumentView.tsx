// src/components/Document/ScreenDocumentView.tsx
// 画面設計書専用のドキュメント編集View

import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { CopilotKit } from '@copilotkit/react-core';
import type { Document, Project } from '../../types';

// 専用フック
import { useDocumentState } from '../../hooks/useDocumentState';
import { useTabNavigation } from '../../hooks/useTabNavigation';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useSpreadsheetOperations } from '../../hooks/useSpreadsheetOperations';

// 共通コンポーネント
import { DocumentHeader } from '../Header/DocumentHeader';
import { ActionButtons } from '../Header/ActionButtons';
import { TabNavigation } from '../Navigation/TabNavigation';
import { ScreenChatPanel } from '../Chat/ScreenChatPanel';
import { BackupManager } from '../Common/BackupManager';

// 画面設計書専用セクション
import { ConditionsSection } from '../Content/ConditionsSection';
import { MockupSection } from '../Content/MockupSection';
import { DefinitionsSection } from '../Content/DefinitionsSection';
import { SupplementSection } from '../Content/SupplementSection';

// Utils
import { getDocumentTypeInfo } from '../../utils/documentTypes';

interface ScreenDocumentViewProps {
  document: Document;
  project: Project;
  onUpdateDocument: (documentId: string, updates: {
    conditions?: string;
    supplement?: string;
    spreadsheet?: any;
    mockup?: string | null;
  }) => void;
  onGoBack: () => void;
}

export const ScreenDocumentView: React.FC<ScreenDocumentViewProps> = ({
  document,
  project,
  onUpdateDocument,
  onGoBack
}) => {
  // チャットパネル状態
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // バックアップ管理状態
  const [isBackupManagerOpen, setIsBackupManagerOpen] = useState(false);
  
  // タブナビゲーション（画面設計書専用タブのみ）
  const { activeTab, setActiveTab } = useTabNavigation();
  
  // 画面設計書専用状態管理
  const {
    conditionsMarkdown,
    supplementMarkdown,
    spreadsheetData,
    mockupImage,
    setConditionsMarkdown,
    setSupplementMarkdown,
    setSpreadsheetData,
    setMockupImage,
  } = useDocumentState();

  // 初期データの設定（画面設計書のフィールドのみ）
  useEffect(() => {
    setConditionsMarkdown(document.conditions || '');
    setSupplementMarkdown(document.supplement || '');
    setSpreadsheetData(document.spreadsheet || []);
    setMockupImage(document.mockup || null);
  }, [document, setConditionsMarkdown, setSupplementMarkdown, setSpreadsheetData, setMockupImage]);

  // データ変更時の自動保存（画面設計書フィールドのみ）
  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdateDocument(document.id, {
        conditions: conditionsMarkdown,
        supplement: supplementMarkdown,
        spreadsheet: spreadsheetData,
        mockup: mockupImage,
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [conditionsMarkdown, supplementMarkdown, spreadsheetData, mockupImage, document.id, onUpdateDocument]);

  // ファイル操作フック（画面設計書用）
  const {
    handleImageUpload,
    handleExport,
    handleImport,
  } = useFileOperations({
    conditionsMarkdown,
    supplementMarkdown,
    spreadsheetData,
    mockupImage,
    mermaidCode: '', // 画面設計書では未使用
    setConditionsMarkdown,
    setSupplementMarkdown,
    setSpreadsheetData,
    setMockupImage,
    setMermaidCode: () => {}, // 画面設計書では未使用
  });

  // スプレッドシート操作フック
  const {
    handleLoadTestData,
  } = useSpreadsheetOperations({
    spreadsheetData,
    setSpreadsheetData,
  });

  // バックアップ復元処理（画面設計書用）
  const handleRestoreFromBackup = (backupData: {
    conditionsMarkdown: string;
    supplementMarkdown: string;
    spreadsheetData: any[];
    mockupImage: string | null;
    mermaidCode: string;
  }) => {
    setConditionsMarkdown(backupData.conditionsMarkdown || '');
    setSupplementMarkdown(backupData.supplementMarkdown || '');
    setSpreadsheetData(backupData.spreadsheetData || []);
    setMockupImage(backupData.mockupImage || null);
    // mermaidCodeは画面設計書では無視
    
    console.log('🔄 画面設計書バックアップからデータを復元しました');
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
                  {getDocumentTypeInfo('screen').icon}
                </span>
                {document.name}
                <span style={{ 
                  marginLeft: '8px', 
                  padding: '2px 6px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#6b7280'
                }}>
                  {getDocumentTypeInfo('screen').label}
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
                onLoadTestData={handleLoadTestData}
                onFileImport={handleImport}
              />
            </div>
          </div>
        </div>

        {/* タブナビゲーション（画面設計書専用） */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          documentType="screen"
        />

        {/* メインコンテンツ（画面設計書専用セクションのみ） */}
        <div className="bg-white rounded-b-lg shadow-sm p-6">
          {/* 全体表示 */}
          {activeTab === 'all' && (
            <div className="space-y-8">
              <ConditionsSection
                conditionsMarkdown={conditionsMarkdown}
                onConditionsChange={setConditionsMarkdown}
              />
              <MockupSection
                mockupImage={mockupImage}
                onImageUpload={handleImageUpload}
              />
              <DefinitionsSection
                spreadsheetData={spreadsheetData}
                onSpreadsheetChange={setSpreadsheetData}
              />
              <SupplementSection
                supplementMarkdown={supplementMarkdown}
                onSupplementChange={setSupplementMarkdown}
              />
            </div>
          )}

          {/* 表示条件タブ */}
          {activeTab === 'conditions' && (
            <ConditionsSection
              conditionsMarkdown={conditionsMarkdown}
              onConditionsChange={setConditionsMarkdown}
            />
          )}

          {/* 画面イメージタブ */}
          {activeTab === 'mockup' && (
            <MockupSection
              mockupImage={mockupImage}
              onImageUpload={handleImageUpload}
            />
          )}

          {/* 項目定義タブ */}
          {activeTab === 'definitions' && (
            <DefinitionsSection
              spreadsheetData={spreadsheetData}
              onSpreadsheetChange={setSpreadsheetData}
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
            backgroundColor: '#2563eb',
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
          onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb'}
        >
          <MessageCircle size={24} color="white" strokeWidth={2} />
        </button>

        {/* チャットパネル（画面設計書専用） */}
        {isChatOpen && (
          <ScreenChatPanel
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            conditionsMarkdown={conditionsMarkdown}
            supplementMarkdown={supplementMarkdown}
            spreadsheetData={spreadsheetData}
            mockupImage={mockupImage}
            onConditionsMarkdownUpdate={setConditionsMarkdown}
            onSupplementMarkdownUpdate={setSupplementMarkdown}
            onSpreadsheetDataUpdate={setSpreadsheetData}
            onShowBackupManager={() => setIsBackupManagerOpen(true)}
          />
        )}

        {/* バックアップ管理（画面設計書専用データ） */}
        <BackupManager
          isOpen={isBackupManagerOpen}
          onClose={() => setIsBackupManagerOpen(false)}
          onRestore={handleRestoreFromBackup}
          currentData={{
            conditionsMarkdown,
            supplementMarkdown,
            spreadsheetData,
            mockupImage,
            mermaidCode: '' // 画面設計書では未使用
          }}
        />
      </div>
    </CopilotKit>
  );
};