// src/utils/documentTypes.ts
import type { DocumentType, DocumentTypeInfo } from '../types';

export const DOCUMENT_TYPES: Record<DocumentType, DocumentTypeInfo> = {
  screen: {
    type: 'screen',
    label: '画面設計書',
    description: 'UI画面の設計・仕様を定義',
    icon: '🖥️',
    defaultTabs: ['conditions', 'mockup', 'definitions', 'supplement'],
    status: 'available',
    visible: true
  },
  model: {
    type: 'model',
    label: 'データモデル設計書（開発中）',
    description: 'エンティティとER図の設計・定義',
    icon: '🗄️',
    defaultTabs: ['models', 'supplement'],
    status: 'development',
    visible: true
  },
  api: {
    type: 'api',
    label: 'API設計書',
    description: 'API仕様とエンドポイント定義（準備中）',
    icon: '🔌',
    defaultTabs: ['conditions', 'definitions', 'supplement'],
    status: 'disabled',
    visible: true
  },
  database: {
    type: 'database',
    label: 'データベース設計書',
    description: 'テーブル設計とスキーマ定義',
    icon: '🗃️',
    defaultTabs: ['definitions', 'models', 'supplement'],
    status: 'disabled',
    visible: false
  }
};

export const getDocumentTypeInfo = (type: DocumentType): DocumentTypeInfo => {
  return DOCUMENT_TYPES[type];
};

export const getAllDocumentTypes = (): DocumentTypeInfo[] => {
  return Object.values(DOCUMENT_TYPES).filter(type => type.visible !== false);
};

export const getDocumentTypeName = (type: DocumentType): string => {
  return DOCUMENT_TYPES[type]?.label || type;
};

export const getDocumentTypeIcon = (type: DocumentType): string => {
  return DOCUMENT_TYPES[type]?.icon || '📄';
};

export const shouldShowTab = (documentType: DocumentType, tabId: string): boolean => {
  const typeInfo = DOCUMENT_TYPES[documentType];
  return typeInfo?.defaultTabs.includes(tabId) ?? false;
};