// src/components/Header/DocumentHeader.tsx
import React from 'react';

interface DocumentHeaderProps {
  title: string;
  updateDate: string;
  author: string;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  title,
  updateDate,
  author,
}) => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {title}
      </h1>
      <div className="text-sm text-gray-600">
        最終更新: {updateDate} | 作成者: {author}
      </div>
    </div>
  );
};