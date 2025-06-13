// src/App.tsx
import React from 'react';
import './App.css';

// カスタムフック
import { useFileOperations } from './hooks/useFileOperations';
import { useSpreadsheetOperations } from './hooks/useSpreadsheetOperations';
import { useTabNavigation } from './hooks/useTabNavigation';
import { useDocumentState } from './hooks/useDocumentState';

// UIコンポーネント
import { DocumentHeader } from './components/Header/DocumentHeader';
import { ActionButtons } from './components/Header/ActionButtons';
import { TabNavigation } from './components/Navigation/TabNavigation';
import { ConditionsSection } from './components/Content/ConditionsSection';
import { MockupSection } from './components/Content/MockupSection';
import { DefinitionsSection } from './components/Content/DefinitionsSection';
import { SupplementSection } from './components/Content/SupplementSection';

// 型定義
// interface DocumentData {
//   conditions: string;
//   supplement: string;
//   spreadsheet: any; // Fortune-Sheetの完全なJSON構造
//   mockup: string | null;
//   timestamp: string;
// }

// メインコンポーネント
const App: React.FC = () => {
  // タブナビゲーションフック
  const { activeTab, setActiveTab } = useTabNavigation();
  
  // ドキュメント状態フック
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

  // ファイル操作フック
  const {
    handleImageUpload,
    handleSave,
    handleLoad,
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
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <DocumentHeader
            title="ユーザー管理画面 設計書"
            updateDate={new Date().toLocaleDateString('ja-JP')}
            author="設計チーム"
          />
          <ActionButtons
            onLoad={() => {
              const input = document.getElementById('load-json') as HTMLInputElement;
              input?.click();
            }}
            onSave={handleSave}
            onLoadTestData={handleLoadTestData}
            onFileLoad={handleLoad}
          />
        </div>
      </div>

      {/* タブナビゲーション */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* メインコンテンツ */}
      <div className="bg-white rounded-b-lg shadow-sm p-6">
        {/* 表示条件 */}
        {(activeTab === 'all' || activeTab === 'conditions') && (
          <ConditionsSection
            conditionsMarkdown={conditionsMarkdown}
            onConditionsChange={setConditionsMarkdown}
          />
        )}

        {/* 画面イメージ */}
        {(activeTab === 'all' || activeTab === 'mockup') && (
          <MockupSection
            mockupImage={mockupImage}
            onImageUpload={handleImageUpload}
          />
        )}

        {/* 項目定義 */}
        {(activeTab === 'all' || activeTab === 'definitions') && (
          <DefinitionsSection
            spreadsheetData={spreadsheetData}
            onSpreadsheetChange={setSpreadsheetData}
          />
        )}

        {/* 補足説明 */}
        {activeTab === 'all' && (
          <SupplementSection
            supplementMarkdown={supplementMarkdown}
            onSupplementChange={setSupplementMarkdown}
          />
        )}
      </div>

      {/* フッター */}
      <div className="mt-6 text-center text-sm text-gray-500">
        生成AI活用設計工程 - 統合設計書システム v2.0 (Vite + TypeScript)
      </div>
    </div>
  );
};

export default App;
