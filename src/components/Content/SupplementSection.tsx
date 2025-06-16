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
  return (
    <MarkdownSection title="補足説明" icon={FileText}>
      <MarkdownEditor
        value={supplementMarkdown}
        onChange={onSupplementChange}
      />
    </MarkdownSection>
  );
};