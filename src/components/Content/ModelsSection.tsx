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

      </div>
    </MarkdownSection>
  );
};