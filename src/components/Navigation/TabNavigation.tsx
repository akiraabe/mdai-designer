// src/components/Navigation/TabNavigation.tsx
import React from 'react';
import { FileText, Image, Table } from 'lucide-react';

// 型定義をexport（useTabNavigationで使用するため）
export type TabId = 'all' | 'conditions' | 'mockup' | 'definitions' | 'supplement';

interface TabInfo {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs: TabInfo[] = [
    { id: 'all', label: '全体表示', icon: FileText },
    { id: 'conditions', label: '表示条件', icon: FileText },
    { id: 'mockup', label: '画面イメージ', icon: Image },
    { id: 'definitions', label: '項目定義', icon: Table },
    { id: 'supplement', label: '補足説明', icon: FileText },
  ];

  return (
    <div className="bg-white rounded-t-lg shadow-sm">
      <div className="flex border-b overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};