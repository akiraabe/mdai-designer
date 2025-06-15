// src/components/Header/ActionButtons.tsx
import React from 'react';
import { Upload, Save } from 'lucide-react';

interface ActionButtonsProps {
  onLoad: () => void;
  onSave: () => void;
  onLoadTestData: () => void;
  onFileLoad: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onLoad,
  onSave,
  onLoadTestData,
  onFileLoad,
}) => {
  return (
    <div className="flex space-x-3">
      <button
        data-testid="load-button"
        onClick={onLoad}
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
        読み込み
      </button>
      <input
        type="file"
        accept=".json"
        onChange={onFileLoad}
        className="hidden"
        id="load-json"
      />
      <button
        data-testid="save-button"
        onClick={onSave}
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
        <Save className="w-4 h-4 mr-2" />
        保存
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