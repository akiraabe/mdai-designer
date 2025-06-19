// src/components/Content/ModelsSection.tsx
import React from 'react';
import { Database } from 'lucide-react';
import { MarkdownSection } from '../Common/MarkdownSection';
import { MermaidEditor } from '../Model/MermaidEditor';

interface ModelsSectionProps {
  mermaidCode: string;
  onMermaidCodeUpdate: (code: string) => void;
}

export const ModelsSection: React.FC<ModelsSectionProps> = ({
  mermaidCode,
  onMermaidCodeUpdate
}) => {
  return (
    <MarkdownSection
      icon={Database}
      title="データモデル"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Mermaidエディター */}
        <MermaidEditor
          value={mermaidCode}
          onChange={onMermaidCodeUpdate}
          placeholder="Mermaid記法でER図を記述してください...

例:
erDiagram
    User {
        int id PK
        string name
        string email
    }
    Order {
        int id PK
        int user_id FK
    }
    User ||--o{ Order : &quot;has many&quot;"
        />

        {/* ヘルプテキスト */}
        <div style={{
          padding: '12px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#0369a1'
        }}>
          <strong>💡 Mermaid ER図記法:</strong><br/>
          • <strong>エンティティ定義</strong>: <code>EntityName &#123;&#123; field_type field_name &#125;&#125;</code><br/>
          • <strong>関係定義</strong>: <code>Entity1 ||--o&#123;&#123; Entity2 : "relationship"</code><br/>
          • <strong>フィールド属性</strong>: PK (主キー), FK (外部キー)<br/>
          • <strong>リアルタイムプレビュー</strong>: 入力と同時に図表が更新されます
        </div>
      </div>
    </MarkdownSection>
  );
};