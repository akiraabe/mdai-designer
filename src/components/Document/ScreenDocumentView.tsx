// src/components/Document/ScreenDocumentView.tsx
// 画面設計書専用のドキュメント編集View

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { CopilotKit } from '@copilotkit/react-core';
import type { Document, Project } from '../../types';

// 専用フック
import { useDocumentState } from '../../hooks/useDocumentState';
import { useTabNavigation } from '../../hooks/useTabNavigation';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useSpreadsheetOperations } from '../../hooks/useSpreadsheetOperations';
import { useAppState } from '../../hooks/useAppState';

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
    aiGeneratedImage?: string | null;
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
  
  // アプリケーション状態（Model Driven Architecture対応）
  const { appState } = useAppState();
  
  // タブナビゲーション（画面設計書専用タブのみ）
  const { activeTab, setActiveTab } = useTabNavigation();
  
  // 画面設計書専用状態管理
  const {
    conditionsMarkdown,
    supplementMarkdown,
    spreadsheetData,
    mockupImage,
    aiGeneratedImage,
    setConditionsMarkdown,
    setSupplementMarkdown,
    setSpreadsheetData,
    setMockupImage,
    setAiGeneratedImage,
  } = useDocumentState();

  // AI生成画像設定時のデバッグログ
  const handleAiImageGenerated = useCallback((imageBase64: string) => {
    console.log('🎯 ScreenDocumentView: AI画像受信開始');
    console.log('🎯 受信データサイズ:', imageBase64?.length || 0, 'characters');
    console.log('🎯 受信データ先頭:', imageBase64?.substring(0, 50) + '...');
    
    if (!imageBase64) {
      console.error('❌ ScreenDocumentView: 受信したAI画像データが空です');
      return;
    }
    
    setAiGeneratedImage(imageBase64);
    console.log('✅ ScreenDocumentView: AI画像状態を更新しました');
    
    // 状態更新の確認（次のレンダリングサイクルで）
    setTimeout(() => {
      console.log('🔍 状態更新確認:', {
        aiGeneratedImageLength: aiGeneratedImage?.length || 0,
        設定値との一致: aiGeneratedImage === imageBase64
      });
    }, 100);
  }, [aiGeneratedImage]);

  // AI生成画像状態の変更を監視
  useEffect(() => {
    console.log('🔄 AI生成画像状態が変更されました:', {
      存在: !!aiGeneratedImage,
      サイズ: aiGeneratedImage?.length || 0,
      タイプ: typeof aiGeneratedImage
    });
  }, [aiGeneratedImage]);

  // 初期データの設定（画面設計書のフィールドのみ）
  useEffect(() => {
    console.log('🔄 初期データ設定useEffect実行:', {
      documentId: document.id,
      aiGeneratedImageExists: !!document.aiGeneratedImage,
      currentAiImageExists: !!aiGeneratedImage
    });
    
    setConditionsMarkdown(document.conditions || '');
    setSupplementMarkdown(document.supplement || '');
    setSpreadsheetData(document.spreadsheet || []);
    setMockupImage(document.mockup || null);
    
    // AI生成画像は常に設定（クリアも含む）
    if (document.aiGeneratedImage !== aiGeneratedImage) {
      console.log('📥 DocumentからAI生成画像を設定:', document.aiGeneratedImage ? `${document.aiGeneratedImage.length} characters` : 'null (クリア)');
      setAiGeneratedImage(document.aiGeneratedImage || null);
    }
  }, [document.id, document.conditions, document.supplement, document.spreadsheet, document.mockup, document.aiGeneratedImage, setConditionsMarkdown, setSupplementMarkdown, setSpreadsheetData, setMockupImage, setAiGeneratedImage]);

  // 基本データの自動保存（AI生成画像以外）
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

  // AI生成画像の保存（即座に実行、ループを防ぐ）
  useEffect(() => {
    if (aiGeneratedImage && aiGeneratedImage !== document.aiGeneratedImage) {
      console.log('💾 AI生成画像を保存中...', aiGeneratedImage.length, 'characters');
      onUpdateDocument(document.id, {
        aiGeneratedImage: aiGeneratedImage,
      });
    }
  }, [aiGeneratedImage, document.id, document.aiGeneratedImage, onUpdateDocument]);

  // 画像削除機能
  const handleImageDelete = useCallback(() => {
    if (window.confirm('画像を削除しますか？この操作は元に戻せません。')) {
      setMockupImage(null);
    }
  }, [setMockupImage]);

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
                onImageDelete={handleImageDelete}
                conditionsMarkdown={conditionsMarkdown}
                spreadsheetData={spreadsheetData}
                aiGeneratedImage={aiGeneratedImage}
                onAiImageGenerated={handleAiImageGenerated}
                documentId={document.id}
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
              onImageDelete={handleImageDelete}
              conditionsMarkdown={conditionsMarkdown}
              spreadsheetData={spreadsheetData}
              aiGeneratedImage={aiGeneratedImage}
              onAiImageGenerated={handleAiImageGenerated}
              documentId={document.id}
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

        {/* チャットパネル（Model Driven Architecture対応） */}
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
            appState={appState}
            currentProjectId={project.id}
            currentDocumentId={document.id}
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
