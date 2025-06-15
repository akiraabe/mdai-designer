// src/components/Header/ActionButtons.tsx
import React from 'react';
import { Download, Upload } from 'lucide-react';

interface ActionButtonsProps {
  onImport: () => void;
  onExport: () => void;
  onLoadTestData: () => void;
  onFileImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onImport,
  onExport,
  onLoadTestData,
  onFileImport,
}) => {
  return (
    <div className="flex space-x-3">
      <button
        data-testid="import-button"
        onClick={onImport}
        className="flex items-center px-4 py-2 bg-orange-500 text-white border-2 border-orange-600 rounded-md text-sm font-bold cursor-pointer hover:bg-orange-600 transition-colors shadow-md"
        style={{ backgroundColor: '#f97316', color: '#ffffff', fontWeight: 'bold' }}
      >
        <Upload className="w-4 h-4 mr-2" />
        インポート
      </button>
      <input
        type="file"
        accept=".json"
        onChange={onFileImport}
        className="hidden"
        id="import-json"
      />
      <button
        data-testid="export-button"
        onClick={onExport}
        className="flex items-center px-4 py-2 bg-blue-500 text-white border border-blue-600 rounded-md text-sm font-bold cursor-pointer hover:bg-blue-600 transition-colors shadow-md"
        style={{ backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 'bold' }}
      >
        <Download className="w-4 h-4 mr-2" />
        エクスポート
      </button>
      <button
        data-testid="test-data-button"
        onClick={onLoadTestData}
        className="flex items-center px-4 py-2 bg-purple-500 text-white border border-purple-600 rounded-md text-sm font-bold cursor-pointer hover:bg-purple-600 transition-colors shadow-md"
        style={{ backgroundColor: '#a855f7', color: '#ffffff', fontWeight: 'bold' }}
      >
        テストデータ
      </button>
    </div>
  );
};