// src/components/Content/DefinitionsSection.tsx
import React from 'react';
import { Table } from 'lucide-react';
import { MarkdownSection } from '../Common/MarkdownSection';
import { SpreadsheetEditor } from '../Common/SpreadsheetEditor';

interface DefinitionsSectionProps {
  spreadsheetData: any[];
  onSpreadsheetChange: (data: any[]) => void;
}

export const DefinitionsSection: React.FC<DefinitionsSectionProps> = ({
  spreadsheetData,
  onSpreadsheetChange,
}) => {
  return (
    <MarkdownSection title="項目定義" icon={Table}>
      <div className="space-y-4">
        <p className="text-gray-600">
          Excelからコピペ可能です。セルをクリックして直接編集できます。
        </p>
        
        <SpreadsheetEditor 
          data={spreadsheetData}
          onDataChange={onSpreadsheetChange}
        />
        
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
          <strong>Fortune-Sheet機能:</strong> 
          Excel並みの編集機能 | 数式・書式設定・条件付き書式 | 
          CSV/Excel読み込み・書き出し | すべてJSON形式で完全保存
        </div>
      </div>
    </MarkdownSection>
  );
};