// src/components/Document/DocumentTypeSelector.tsx
import React from 'react';
import type { DocumentType } from '../../types';
import { getAllDocumentTypes } from '../../utils/documentTypes';

interface DocumentTypeSelectorProps {
  selectedType: DocumentType;
  onChange: (type: DocumentType) => void;
}

export const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({
  selectedType,
  onChange
}) => {
  const documentTypes = getAllDocumentTypes();

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ 
        display: 'block', 
        fontSize: '14px', 
        fontWeight: '500', 
        marginBottom: '8px',
        color: '#374151'
      }}>
        設計書タイプ
      </label>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '8px'
      }}>
        {documentTypes.map((typeInfo) => {
          const isDisabled = typeInfo.status === 'disabled';
          const isDevelopment = typeInfo.status === 'development';
          const isSelected = selectedType === typeInfo.type;
          
          return (
            <button
              key={typeInfo.type}
              type="button"
              onClick={() => !isDisabled && onChange(typeInfo.type)}
              disabled={isDisabled}
              style={{
                padding: '12px',
                border: `2px solid ${isSelected ? '#3b82f6' : isDisabled ? '#e5e7eb' : '#e5e7eb'}`,
                borderRadius: '8px',
                backgroundColor: isSelected ? '#eff6ff' : isDisabled ? '#f9fafb' : '#ffffff',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isDisabled ? 0.6 : 1,
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isDisabled && selectedType !== typeInfo.type) {
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDisabled && selectedType !== typeInfo.type) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }
              }}
            >
              <span style={{ fontSize: '20px' }}>{typeInfo.icon}</span>
              <div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: isDisabled ? '#9ca3af' : isSelected ? '#1e40af' : '#1f2937',
                  marginBottom: '2px'
                }}>
                  {typeInfo.label}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: isDisabled ? '#9ca3af' : '#6b7280',
                  lineHeight: '1.3'
                }}>
                  {typeInfo.description}
                </div>
              </div>
              
              {/* 状態表示バッジ */}
              {isDevelopment && (
                <div style={{
                  marginLeft: 'auto',
                  padding: '2px 6px',
                  backgroundColor: '#fbbf24',
                  color: '#92400e',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  borderRadius: '4px'
                }}>
                  開発中
                </div>
              )}
              
              {isDisabled && (
                <div style={{
                  marginLeft: 'auto',
                  padding: '2px 6px',
                  backgroundColor: '#e5e7eb',
                  color: '#6b7280',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  borderRadius: '4px'
                }}>
                  準備中
                </div>
              )}
              
              {isSelected && !isDisabled && (
                <div style={{
                  marginLeft: 'auto',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: 'white', fontSize: '10px' }}>✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* 選択されたタイプの詳細情報 */}
      {selectedType && (
        <div style={{
          marginTop: '12px',
          padding: '10px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#0369a1'
        }}>
          <strong>💡 {getAllDocumentTypes().find(t => t.type === selectedType)?.label}の特徴:</strong>
          <br />
          {selectedType === 'screen' && '画面イメージ、項目定義、表示条件など、UI設計に特化'}
          {selectedType === 'model' && 'データモデル、ER図、エンティティ関係に特化（テキスト・ビジュアル編集対応）'}
          {selectedType === 'api' && 'API仕様、エンドポイント、リクエスト/レスポンスに特化（現在準備中）'}
        </div>
      )}
    </div>
  );
};