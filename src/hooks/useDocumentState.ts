import { useState } from 'react';
import { 
  initialConditionsMarkdown, 
  initialSupplementMarkdown, 
  initialSpreadsheetData 
} from './useInitialData';
import type { SpreadsheetData } from '../types/spreadsheet';

export const useDocumentState = () => {
  // Markdownとスプレッドシートの状態
  const [conditionsMarkdown, setConditionsMarkdown] = useState<string>(initialConditionsMarkdown);
  const [supplementMarkdown, setSupplementMarkdown] = useState<string>(initialSupplementMarkdown);
  const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetData[]>(initialSpreadsheetData);
  
  // 画像状態
  const [mockupImage, setMockupImage] = useState<string | null>(null);
  
  // Mermaidコード状態
  const [mermaidCode, setMermaidCode] = useState<string>('');

  return {
    // 状態
    conditionsMarkdown,
    supplementMarkdown,
    spreadsheetData,
    mockupImage,
    mermaidCode,
    
    // セッター
    setConditionsMarkdown,
    setSupplementMarkdown,
    setSpreadsheetData,
    setMockupImage,
    setMermaidCode,
  };
};