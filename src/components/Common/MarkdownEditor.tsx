// src/components/Common/MarkdownEditor.tsx
import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = React.memo(({ 
  value, 
  onChange,
  // @ts-ignore - placeholderは将来の拡張用に定義
  placeholder = ''
}) => {
  return (
    <div data-color-mode="light" data-testid="markdown-editor-container">
      <MDEditor
        data-testid="markdown-editor"
        value={value}
        onChange={(val) => onChange(val || '')}
        height={400}
        preview="edit"
        hideToolbar={false}
        data-color-mode="light"
      />
    </div>
  );
});