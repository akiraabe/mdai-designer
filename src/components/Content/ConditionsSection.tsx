// src/components/Content/ConditionsSection.tsx
import React from 'react';
import { FileText } from 'lucide-react';
import { MarkdownSection } from '../Common/MarkdownSection';
import { MarkdownEditor } from '../Common/MarkdownEditor';

interface ConditionsSectionProps {
  conditionsMarkdown: string;
  onConditionsChange: (value: string) => void;
}

export const ConditionsSection: React.FC<ConditionsSectionProps> = ({
  conditionsMarkdown,
  onConditionsChange,
}) => {
  return (
    <MarkdownSection title="表示条件" icon={FileText}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">編集可能なMarkdown形式</span>
          <span className="text-xs text-gray-400">## で見出し、- でリスト</span>
        </div>
        <MarkdownEditor
          value={conditionsMarkdown}
          onChange={onConditionsChange}
          testId="conditions-markdown-editor"
        />
      </div>
    </MarkdownSection>
  );
};