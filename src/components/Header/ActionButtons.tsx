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
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          backgroundColor: '#ea580c',
          color: 'white',
          border: '2px solid #c2410c',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer'
        }}
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
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer'
        }}
      >
        <Download className="w-4 h-4 mr-2" />
        エクスポート
      </button>
      <button
        data-testid="test-data-button"
        onClick={onLoadTestData}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          backgroundColor: '#9333ea',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer'
        }}
      >
        テストデータ
      </button>
    </div>
  );
};