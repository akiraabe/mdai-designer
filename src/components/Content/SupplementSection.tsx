// src/components/Content/SupplementSection.tsx
import React from 'react';
import { FileText } from 'lucide-react';
import { MarkdownSection } from '../Common/MarkdownSection';
import { MarkdownEditor } from '../Common/MarkdownEditor';

interface SupplementSectionProps {
  supplementMarkdown: string;
  onSupplementChange: (value: string) => void;
}

export const SupplementSection: React.FC<SupplementSectionProps> = ({
  supplementMarkdown,
  onSupplementChange,
}) => {
  // 空の場合のデフォルト表示
  const displayValue = supplementMarkdown.trim() || '特になし';
  
  return (
    <MarkdownSection title="補足説明" icon={FileText}>
      <MarkdownEditor
        value={displayValue}
        onChange={(value) => {
          // "特になし"が削除された場合は空文字にする
          const newValue = value === '特になし' ? '' : value;
          onSupplementChange(newValue);
        }}
        placeholder="補足説明を入力してください..."
      />
    </MarkdownSection>
  );
};