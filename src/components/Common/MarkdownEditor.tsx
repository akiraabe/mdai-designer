// src/components/Common/MarkdownEditor.tsx
import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = React.memo(({ 
  value, 
  onChange
}) => {
  return (
    <div data-color-mode="light">
      <MDEditor
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