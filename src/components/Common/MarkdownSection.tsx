// src/components/Common/MarkdownSection.tsx
import React from 'react';

interface MarkdownSectionProps {
  title: string;
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}

export const MarkdownSection: React.FC<MarkdownSectionProps> = React.memo(({ 
  title, 
  children, 
  icon: Icon 
}) => (
  <div className="mb-8">
    <div className="flex items-center mb-4 border-b pb-2">
      <Icon className="w-5 h-5 mr-2 text-blue-600" />
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    </div>
    <div className="max-w-none">
      {children}
    </div>
  </div>
));