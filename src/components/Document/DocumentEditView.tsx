// 設計書編集画面
// 既存の設計書編集機能をラップしたコンポーネント

import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import type { Document, Project } from '../../types';

// CopilotKit
import { CopilotKit } from '@copilotkit/react-core';

// Chat関連
import { ChatPanel } from '../Common/ChatPanel';
import { BackupManager } from '../Common/BackupManager';

// カスタムフック
import { useFileOperations } from '../../hooks/useFileOperations';
import { useSpreadsheetOperations } from '../../hooks/useSpreadsheetOperations';
import { useTabNavigation } from '../../hooks/useTabNavigation';
import { useDocumentState } from '../../hooks/useDocumentState';

// UIコンポーネント
import { DocumentHeader } from '../Header/DocumentHeader';
import { ActionButtons } from '../Header/ActionButtons';
import { TabNavigation } from '../Navigation/TabNavigation';
import { shouldShowTab, getDocumentTypeInfo } from '../../utils/documentTypes';
import { ConditionsSection } from '../Content/ConditionsSection';
import { MockupSection } from '../Content/MockupSection';
import { DefinitionsSection } from '../Content/DefinitionsSection';
import { ModelsSection } from '../Content/ModelsSection';
import { SupplementSection } from '../Content/SupplementSection';

interface DocumentEditViewProps {
  document: Document;
  project: Project;
  onUpdateDocument: (documentId: string, updates: {
    conditions?: string;
    supplement?: string;
    spreadsheet?: any;
    mockup?: string | null;
    mermaidCode?: string;
  }) => void;
  onGoBack: () => void;
}

export const DocumentEditView: React.FC<DocumentEditViewProps> = ({
  document,
  project,
  onUpdateDocument,
  onGoBack
}) => {
  // チャットパネル状態
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // バックアップ管理状態
  const [isBackupManagerOpen, setIsBackupManagerOpen] = useState(false);
  
  // タブナビゲーションフック
  const { activeTab, setActiveTab } = useTabNavigation();
  
  // ドキュメント状態フック（初期値をpropsから設定）
  const {
    conditionsMarkdown,
    supplementMarkdown,
    spreadsheetData,
    mockupImage,
    mermaidCode,
    setConditionsMarkdown,
    setSupplementMarkdown,
    setSpreadsheetData,
    setMockupImage,
    setMermaidCode,
  } = useDocumentState();

  // 初期データの設定
  useEffect(() => {
    setConditionsMarkdown(document.conditions || '');
    setSupplementMarkdown(document.supplement || '');
    setSpreadsheetData(document.spreadsheet || []);
    setMockupImage(document.mockup || null);
    setMermaidCode(document.mermaidCode || '');
  }, [document, setConditionsMarkdown, setSupplementMarkdown, setSpreadsheetData, setMockupImage, setMermaidCode]);

  // データ変更時の自動保存
  useEffect(() => {
    const saveData = () => {
      onUpdateDocument(document.id, {
        conditions: conditionsMarkdown,
        supplement: supplementMarkdown,
        spreadsheet: spreadsheetData,
        mockup: mockupImage,
        mermaidCode: mermaidCode
      });
    };

    // 初期ロード以外で保存
    const timer = setTimeout(saveData, 1000);
    return () => clearTimeout(timer);
  }, [conditionsMarkdown, supplementMarkdown, spreadsheetData, mockupImage, mermaidCode, document.id, onUpdateDocument]);

  // ファイル操作フック
  const {
    handleImageUpload,
    handleExport,
    handleImport,
  } = useFileOperations({
    conditionsMarkdown,
    supplementMarkdown,
    spreadsheetData,
    mockupImage,
    mermaidCode,
    setConditionsMarkdown,
    setSupplementMarkdown,
    setSpreadsheetData,
    setMockupImage,
    setMermaidCode,
  });

  // スプレッドシート操作フック
  const {
    handleLoadTestData,
  } = useSpreadsheetOperations({
    spreadsheetData,
    setSpreadsheetData,
  });

  // バックアップ復元処理
  const handleRestoreFromBackup = (backupData: {
    conditionsMarkdown: string;
    supplementMarkdown: string;
    spreadsheetData: any[];
    mockupImage: string | null;
  }) => {
    setConditionsMarkdown(backupData.conditionsMarkdown || '');
    setSupplementMarkdown(backupData.supplementMarkdown || '');
    setSpreadsheetData(backupData.spreadsheetData || []);
    setMockupImage(backupData.mockupImage || null);
    
    console.log('🔄 バックアップからデータを復元しました');
    
    // データ変更後の自動保存はuseEffectで行われる
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
                  {getDocumentTypeInfo(document.type || 'screen').icon}
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
                  {getDocumentTypeInfo(document.type || 'screen').label}
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

        {/* タブナビゲーション */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          documentType={document.type || 'screen'}
        />

        {/* メインコンテンツ */}
        <div className="bg-white rounded-b-lg shadow-sm p-6">
          {/* 全体表示 */}
          {activeTab === 'all' && (
            <div className="space-y-8">
              {shouldShowTab(document.type || 'screen', 'conditions') && (
                <ConditionsSection
                  conditionsMarkdown={conditionsMarkdown}
                  onConditionsChange={setConditionsMarkdown}
                />
              )}
              {shouldShowTab(document.type || 'screen', 'mockup') && (
                <MockupSection
                  mockupImage={mockupImage}
                  onImageUpload={handleImageUpload}
                />
              )}
              {shouldShowTab(document.type || 'screen', 'definitions') && (
                <DefinitionsSection
                  spreadsheetData={spreadsheetData}
                  onSpreadsheetChange={setSpreadsheetData}
                />
              )}
              {shouldShowTab(document.type || 'screen', 'models') && (
                <ModelsSection
                  mermaidCode={mermaidCode}
                  onMermaidCodeUpdate={setMermaidCode}
                />
              )}
              {shouldShowTab(document.type || 'screen', 'supplement') && (
                <SupplementSection
                  supplementMarkdown={supplementMarkdown}
                  onSupplementChange={setSupplementMarkdown}
                />
              )}
            </div>
          )}

          {/* 表示条件タブ */}
          {activeTab === 'conditions' && shouldShowTab(document.type || 'screen', 'conditions') && (
            <ConditionsSection
              conditionsMarkdown={conditionsMarkdown}
              onConditionsChange={setConditionsMarkdown}
            />
          )}

          {/* 画面イメージタブ */}
          {activeTab === 'mockup' && shouldShowTab(document.type || 'screen', 'mockup') && (
            <MockupSection
              mockupImage={mockupImage}
              onImageUpload={handleImageUpload}
            />
          )}

          {/* 項目定義タブ */}
          {activeTab === 'definitions' && shouldShowTab(document.type || 'screen', 'definitions') && (
            <DefinitionsSection
              spreadsheetData={spreadsheetData}
              onSpreadsheetChange={setSpreadsheetData}
            />
          )}

          {/* データモデルタブ */}
          {activeTab === 'models' && shouldShowTab(document.type || 'screen', 'models') && (
            <ModelsSection
              mermaidCode={mermaidCode}
              onMermaidCodeUpdate={setMermaidCode}
            />
          )}

          {/* 補足説明タブ */}
          {activeTab === 'supplement' && shouldShowTab(document.type || 'screen', 'supplement') && (
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

        {/* チャットパネル */}
        {isChatOpen && (
          <ChatPanel
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

        {/* バックアップ管理 */}
        <BackupManager
          isOpen={isBackupManagerOpen}
          onClose={() => setIsBackupManagerOpen(false)}
          onRestore={handleRestoreFromBackup}
          currentData={{
            conditionsMarkdown,
            supplementMarkdown,
            spreadsheetData,
            mockupImage
          }}
        />
      </div>
    </CopilotKit>
  );
};