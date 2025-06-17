// src/components/Content/ModelsSection.tsx
import React, { useState } from 'react';
import { Database, ToggleLeft, ToggleRight } from 'lucide-react';
import { MarkdownSection } from '../Common/MarkdownSection';
import { ModelTextEditor } from '../Model/ModelTextEditor';
import { ERDiagramEditor } from '../Model/ERDiagramEditor';
import type { DomainModel, ModelRelationship } from '../../types/domainModel';

interface ModelsSectionProps {
  domainModels: DomainModel[];
  modelRelationships: ModelRelationship[];
  onModelsUpdate: (models: DomainModel[]) => void;
  onRelationshipsUpdate: (relationships: ModelRelationship[]) => void;
}

export const ModelsSection: React.FC<ModelsSectionProps> = ({
  domainModels,
  modelRelationships,
  onModelsUpdate,
  onRelationshipsUpdate
}) => {
  const [isVisualMode, setIsVisualMode] = useState(false);

  return (
    <MarkdownSection
      icon={Database}
      title="データモデル"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* モード切り替えトグル */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} color="#3b82f6" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
              編集モード
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              fontSize: '12px', 
              color: isVisualMode ? '#64748b' : '#3b82f6',
              fontWeight: isVisualMode ? 'normal' : 'bold'
            }}>
              テキスト
            </span>
            
            <button
              onClick={() => setIsVisualMode(!isVisualMode)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {isVisualMode ? (
                <ToggleRight size={24} />
              ) : (
                <ToggleLeft size={24} />
              )}
            </button>
            
            <span style={{ 
              fontSize: '12px', 
              color: isVisualMode ? '#3b82f6' : '#64748b',
              fontWeight: isVisualMode ? 'bold' : 'normal'
            }}>
              ビジュアル
            </span>
          </div>
        </div>

        {/* 統計表示 */}
        <div style={{
          display: 'flex',
          gap: '16px',
          padding: '8px 0',
          fontSize: '12px',
          color: '#64748b'
        }}>
          <div>📊 エンティティ: {domainModels.length}個</div>
          <div>🔗 リレーション: {modelRelationships.length}個</div>
          <div>📋 総フィールド数: {domainModels.reduce((total, model) => total + model.fields.length, 0)}個</div>
        </div>

        {/* エディタ */}
        {isVisualMode ? (
          <ERDiagramEditor
            models={domainModels}
            relationships={modelRelationships}
            onModelsUpdate={onModelsUpdate}
            onRelationshipsUpdate={onRelationshipsUpdate}
          />
        ) : (
          <ModelTextEditor
            models={domainModels}
            onModelsUpdate={onModelsUpdate}
          />
        )}

        {/* ヘルプテキスト */}
        <div style={{
          padding: '12px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#0369a1'
        }}>
          <strong>💡 使い方:</strong><br/>
          • <strong>テキストモード</strong>: Markdownライクな記法でモデル定義<br/>
          • <strong>ビジュアルモード</strong>: ドラッグ&ドロップでER図を編集<br/>
          • <strong>AI生成</strong>: 定義されたモデルを参照して高精度な設計書を自動生成
        </div>
      </div>
    </MarkdownSection>
  );
};