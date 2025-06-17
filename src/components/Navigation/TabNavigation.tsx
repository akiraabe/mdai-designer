// src/components/Navigation/TabNavigation.tsx
import React from 'react';
import { FileText, Image, Table, Database } from 'lucide-react';
import { shouldShowTab } from '../../utils/documentTypes';
import type { DocumentType } from '../../types';

// 型定義をexport（useTabNavigationで使用するため）
export type TabId = 'all' | 'conditions' | 'mockup' | 'definitions' | 'models' | 'supplement';

interface TabInfo {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  documentType?: DocumentType; // 設計書タイプによるタブ制御
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  documentType = 'screen'
}) => {
  const allTabs: TabInfo[] = [
    { id: 'all', label: '全体表示', icon: FileText },
    { id: 'conditions', label: '表示条件', icon: FileText },
    { id: 'mockup', label: '画面イメージ', icon: Image },
    { id: 'definitions', label: '項目定義', icon: Table },
    { id: 'models', label: 'データモデル', icon: Database },
    { id: 'supplement', label: '補足説明', icon: FileText },
  ];

  // 設計書タイプに応じてタブをフィルタ
  const visibleTabs = allTabs.filter(tab => 
    tab.id === 'all' || shouldShowTab(documentType, tab.id)
  );

  return (
    <div className="bg-white rounded-t-lg shadow-sm">
      <div className="flex border-b overflow-x-auto">
        {visibleTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={{
              backgroundColor: activeTab === id ? '#eff6ff' : 'transparent',
              color: activeTab === id ? '#2563eb' : '#6b7280',
              fontWeight: 'bold'
            }}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};