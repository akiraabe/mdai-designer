// 設計書編集画面
// 既存の設計書編集機能をラップしたコンポーネント

import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import type { Document, Project } from '../../types';

// CopilotKit
import { CopilotKit } from '@copilotkit/react-core';

// Chat関連
import { ChatPanel } from '../Common/ChatPanel';

// カスタムフック
import { useFileOperations } from '../../hooks/useFileOperations';
import { useSpreadsheetOperations } from '../../hooks/useSpreadsheetOperations';
import { useTabNavigation } from '../../hooks/useTabNavigation';
import { useDocumentState } from '../../hooks/useDocumentState';

// UIコンポーネント
import { DocumentHeader } from '../Header/DocumentHeader';
import { ActionButtons } from '../Header/ActionButtons';
import { TabNavigation } from '../Navigation/TabNavigation';
import { ConditionsSection } from '../Content/ConditionsSection';
import { MockupSection } from '../Content/MockupSection';
import { DefinitionsSection } from '../Content/DefinitionsSection';
import { SupplementSection } from '../Content/SupplementSection';

interface DocumentEditViewProps {
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

export const DocumentEditView: React.FC<DocumentEditViewProps> = ({
  document,
  project,
  onUpdateDocument,
  onGoBack
}) => {
  // チャットパネル状態
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // タブナビゲーションフック
  const { activeTab, setActiveTab } = useTabNavigation();
  
  // ドキュメント状態フック（初期値をpropsから設定）
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

  // 初期データの設定
  useEffect(() => {
    setConditionsMarkdown(document.conditions || '');
    setSupplementMarkdown(document.supplement || '');
    setSpreadsheetData(document.spreadsheet || []);
    setMockupImage(document.mockup || null);
  }, [document, setConditionsMarkdown, setSupplementMarkdown, setSpreadsheetData, setMockupImage]);

  // データ変更時の自動保存
  useEffect(() => {
    const saveData = () => {
      onUpdateDocument(document.id, {
        conditions: conditionsMarkdown,
        supplement: supplementMarkdown,
        spreadsheet: spreadsheetData,
        mockup: mockupImage
      });
    };

    // 初期ロード以外で保存
    const timer = setTimeout(saveData, 1000);
    return () => clearTimeout(timer);
  }, [conditionsMarkdown, supplementMarkdown, spreadsheetData, mockupImage, document.id, onUpdateDocument]);

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
    setConditionsMarkdown,
    setSupplementMarkdown,
    setSpreadsheetData,
    setMockupImage,
  });

  // スプレッドシート操作フック
  const {
    handleLoadTestData,
  } = useSpreadsheetOperations({
    spreadsheetData,
    setSpreadsheetData,
  });

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
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                戻る
              </button>
              <div className="text-sm text-gray-500 mr-4">
                {project.name} &gt; {document.name}
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
        />

        {/* メインコンテンツ */}
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
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-40"
        >
          <MessageCircle className="w-6 h-6" />
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
          />
        )}
      </div>
    </CopilotKit>
  );
};