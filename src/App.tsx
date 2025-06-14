// src/App.tsx
import React, { useState } from 'react';
import './App.css';
import { MessageCircle } from 'lucide-react';

// CopilotKit
import { CopilotKit } from '@copilotkit/react-core';

// Chat関連
import { ChatPanel } from './components/Common/ChatPanel';

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
  // チャットパネル状態
  const [isChatOpen, setIsChatOpen] = useState(false);
  
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
    <CopilotKit
      runtimeUrl="/api/copilotkit" // ダミーエンドポイント
    >
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
        <div style={{ display: (activeTab === 'all' || activeTab === 'conditions') ? 'block' : 'none' }}>
          <ConditionsSection
            conditionsMarkdown={conditionsMarkdown}
            onConditionsChange={setConditionsMarkdown}
          />
        </div>

        {/* 画面イメージ */}
        <div style={{ display: (activeTab === 'all' || activeTab === 'mockup') ? 'block' : 'none' }}>
          <MockupSection
            mockupImage={mockupImage}
            onImageUpload={handleImageUpload}
          />
        </div>

        {/* 項目定義 */}
        <div style={{ display: (activeTab === 'all' || activeTab === 'definitions') ? 'block' : 'none' }}>
          <DefinitionsSection
            spreadsheetData={spreadsheetData}
            onSpreadsheetChange={setSpreadsheetData}
          />
        </div>

        {/* 補足説明 */}
        <div style={{ display: activeTab === 'all' ? 'block' : 'none' }}>
          <SupplementSection
            supplementMarkdown={supplementMarkdown}
            onSupplementChange={setSupplementMarkdown}
          />
        </div>
      </div>

        {/* フッター */}
        <div className="mt-6 text-center text-sm text-gray-500">
          生成AI活用設計工程 - 統合設計書システム v2.0 (Vite + TypeScript)
        </div>
      </div>

      {/* フローティングチャットボタン */}
      {!isChatOpen && (
        <button
          onClick={() => {
            console.log('チャットボタンクリック！');
            setIsChatOpen(true);
          }}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '12px',
            borderRadius: '50%',
            border: 'none',
            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
            cursor: 'pointer',
            zIndex: 40,
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.backgroundColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.backgroundColor = '#3b82f6';
          }}
          title="設計アシスタント"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* チャットパネル */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        conditionsMarkdown={conditionsMarkdown}
        supplementMarkdown={supplementMarkdown}
        spreadsheetData={spreadsheetData}
        mockupImage={mockupImage}
      />
    </CopilotKit>
  );
};

export default App;
