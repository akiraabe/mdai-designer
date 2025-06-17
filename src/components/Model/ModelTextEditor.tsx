// src/components/Model/ModelTextEditor.tsx
import React, { useState } from 'react';
import type { DomainModel } from '../../types/domainModel';

interface ModelTextEditorProps {
  models: DomainModel[];
  onModelsUpdate: (models: DomainModel[]) => void;
}

export const ModelTextEditor: React.FC<ModelTextEditorProps> = ({
  models,
  onModelsUpdate
}) => {
  const [modelText, setModelText] = useState(() => 
    modelsToText(models)
  );

  // モデルをテキスト形式に変換
  function modelsToText(models: DomainModel[]): string {
    return models.map(model => `
# ${model.name}
description: ${model.description || ''}

fields:
${model.fields.map(field => 
  `  ${field.name}: ${field.type}${field.required ? ' required' : ''}${field.primaryKey ? ' primary' : ''}`
).join('\n')}

relationships:
${model.relationships.map(rel => 
  `  ${rel.type} -> ${rel.targetModel}`
).join('\n')}
`).join('\n---\n');
  }

  // テキストからモデルに変換（簡易版）
  function textToModels(text: string): DomainModel[] {
    const sections = text.split('---').filter(s => s.trim());
    
    return sections.map((section, index) => {
      const lines = section.trim().split('\n');
      const nameMatch = lines[0].match(/^# (.+)$/);
      const name = nameMatch ? nameMatch[1] : `Entity${index + 1}`;
      
      const descMatch = lines.find(l => l.startsWith('description:'));
      const description = descMatch ? descMatch.replace('description:', '').trim() : '';
      
      // フィールド解析
      const fieldsStart = lines.findIndex(l => l.trim() === 'fields:');
      const relsStart = lines.findIndex(l => l.trim() === 'relationships:');
      
      const fieldLines = fieldsStart >= 0 ? 
        lines.slice(fieldsStart + 1, relsStart >= 0 ? relsStart : undefined)
          .filter(l => l.trim().startsWith('  ')) : [];
      
      const fields = fieldLines.map((line, fIndex) => {
        const fieldText = line.trim();
        const [namePart, ...typeParts] = fieldText.split(':');
        const typeText = typeParts.join(':').trim();
        
        const [type, ...modifiers] = typeText.split(' ');
        const required = modifiers.includes('required');
        const primaryKey = modifiers.includes('primary');
        
        return {
          id: `${name}_field_${fIndex}`,
          name: namePart.trim(),
          type: type as any,
          required,
          primaryKey
        };
      });

      return {
        id: `model_${index}`,
        name,
        description,
        fields,
        relationships: [],
        businessRules: []
      };
    });
  }

  const handleApply = () => {
    try {
      const newModels = textToModels(modelText);
      onModelsUpdate(newModels);
    } catch (error) {
      alert('テキスト形式エラー: ' + error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
          モデル定義（テキスト形式）
        </h3>
        <button
          onClick={handleApply}
          style={{
            padding: '6px 12px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          適用
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', height: '500px' }}>
        {/* テキストエディタ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
            モデル定義
          </label>
          <textarea
            value={modelText}
            onChange={(e) => setModelText(e.target.value)}
            style={{
              flex: 1,
              fontFamily: 'monospace',
              fontSize: '12px',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              resize: 'none'
            }}
            placeholder={`# User
description: ユーザー情報

fields:
  id: string required primary
  name: string required
  email: string required
  createdAt: datetime required

relationships:
  one-to-many -> Project

---

# Project
description: プロジェクト情報

fields:
  id: string required primary
  name: string required
  userId: string required
  status: string required

relationships:
  many-to-one -> User`}
          />
        </div>

        {/* プレビュー */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
            プレビュー
          </label>
          <div style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#f9fafb',
            overflow: 'auto',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            {models.map(model => (
              <div key={model.id} style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
                  📊 {model.name}
                </div>
                <div style={{ color: '#6b7280', marginBottom: '4px' }}>
                  {model.description}
                </div>
                <div style={{ marginLeft: '8px' }}>
                  {model.fields.map(field => (
                    <div key={field.id} style={{ color: '#374151' }}>
                      • {field.name}: <span style={{ color: '#7c3aed' }}>{field.type}</span>
                      {field.primaryKey && <span style={{ color: '#f59e0b' }}> [PK]</span>}
                      {field.required && <span style={{ color: '#ef4444' }}> *</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 使用例 */}
      <div style={{
        padding: '8px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <strong>💡 記法例:</strong><br/>
        • fields: name: type required primary<br/>
        • relationships: one-to-many → TargetModel<br/>
        • types: string, number, date, datetime, boolean, text, email
      </div>
    </div>
  );
};