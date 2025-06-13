import { useState } from 'react';

// タブID型定義
type TabId = 'all' | 'conditions' | 'mockup' | 'definitions';

export const useTabNavigation = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');

  return {
    activeTab,
    setActiveTab,
  };
};