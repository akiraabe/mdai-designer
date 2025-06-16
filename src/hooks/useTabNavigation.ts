import { useState } from 'react';
import type { TabId } from '../components/Navigation/TabNavigation';

export const useTabNavigation = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');

  return {
    activeTab,
    setActiveTab,
  };
};