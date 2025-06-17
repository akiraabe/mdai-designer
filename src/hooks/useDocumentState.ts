import { useState } from 'react';
import { 
  initialConditionsMarkdown, 
  initialSupplementMarkdown, 
  initialSpreadsheetData 
} from './useInitialData';
import type { DomainModel, ModelRelationship } from '../types/domainModel';

export const useDocumentState = () => {
  // Markdownとスプレッドシートの状態
  const [conditionsMarkdown, setConditionsMarkdown] = useState<string>(initialConditionsMarkdown);
  const [supplementMarkdown, setSupplementMarkdown] = useState<string>(initialSupplementMarkdown);
  const [spreadsheetData, setSpreadsheetData] = useState(initialSpreadsheetData);
  
  // 画像状態
  const [mockupImage, setMockupImage] = useState<string | null>(null);
  
  // データモデル状態
  const [domainModels, setDomainModels] = useState<DomainModel[]>([]);
  const [modelRelationships, setModelRelationships] = useState<ModelRelationship[]>([]);

  // 元のセッター関数をそのまま使用（無限ループ防止）

  return {
    // 状態
    conditionsMarkdown,
    supplementMarkdown,
    spreadsheetData,
    mockupImage,
    domainModels,
    modelRelationships,
    
    // セッター
    setConditionsMarkdown,
    setSupplementMarkdown,
    setSpreadsheetData,
    setMockupImage,
    setDomainModels,
    setModelRelationships,
  };
};