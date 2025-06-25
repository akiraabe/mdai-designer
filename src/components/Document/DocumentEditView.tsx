// src/components/Document/DocumentEditView.tsx
// 設計書タイプ別のルーターコンポーネント（ビッグスイッチ実装）

import React from 'react';
import type { Document, Project } from '../../types';

// タイプ別専用Viewコンポーネント
import { ScreenDocumentView } from './ScreenDocumentView';
import { ModelDocumentView } from './ModelDocumentView';

interface DocumentEditViewProps {
  document: Document;
  project: Project;
  onUpdateDocument: (documentId: string, updates: {
    conditions?: string;
    supplement?: string;
    spreadsheet?: any;
    mockup?: string | null;
    aiGeneratedImage?: string | null;
    mermaidCode?: string;
    tags?: string[];
  }) => void;
  onGoBack: () => void;
}

/**
 * ドキュメントタイプに応じて専用Viewコンポーネントにルーティングする
 * ビッグスイッチパターンによる完全な責任分離
 */
export const DocumentEditView: React.FC<DocumentEditViewProps> = ({
  document,
  project,
  onUpdateDocument,
  onGoBack
}) => {
  // 🎯 ビッグスイッチ: ドキュメントタイプによる完全分離
  switch (document.type) {
    case 'screen':
      console.log('🖥️ 画面設計書専用Viewにルーティング');
      return (
        <ScreenDocumentView
          document={document}
          project={project}
          onUpdateDocument={onUpdateDocument}
          onGoBack={onGoBack}
        />
      );
      
    case 'model':
      console.log('🗄️ データモデル設計書専用Viewにルーティング');
      return (
        <ModelDocumentView
          document={document}
          project={project}
          onUpdateDocument={onUpdateDocument}
          onGoBack={onGoBack}
        />
      );
      
    case 'api':
      console.log('🔌 API設計書は未実装のため画面設計書Viewで代替');
      return (
        <ScreenDocumentView
          document={document}
          project={project}
          onUpdateDocument={onUpdateDocument}
          onGoBack={onGoBack}
        />
      );
      
    case 'database':
      console.log('🗃️ データベース設計書は未実装のためモデル設計書Viewで代替');
      return (
        <ModelDocumentView
          document={document}
          project={project}
          onUpdateDocument={onUpdateDocument}
          onGoBack={onGoBack}
        />
      );
      
    default:
      console.warn('⚠️ 不明なドキュメントタイプ、画面設計書Viewで代替:', document.type);
      return (
        <ScreenDocumentView
          document={document}
          project={project}
          onUpdateDocument={onUpdateDocument}
          onGoBack={onGoBack}
        />
      );
  }
};