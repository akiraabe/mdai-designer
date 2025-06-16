import { useState } from 'react';
import { 
  initialConditionsMarkdown, 
  initialSupplementMarkdown, 
  initialSpreadsheetData 
} from './useInitialData';

export const useDocumentState = () => {
  // Markdownとスプレッドシートの状態
  const [conditionsMarkdown, setConditionsMarkdown] = useState<string>(initialConditionsMarkdown);
  const [supplementMarkdown, setSupplementMarkdown] = useState<string>(initialSupplementMarkdown);
  const [spreadsheetData, setSpreadsheetData] = useState(initialSpreadsheetData);
  
  // 画像状態
  const [mockupImage, setMockupImage] = useState<string | null>(null);

  // 元のセッター関数をそのまま使用（無限ループ防止）

  return {
    // 状態
    conditionsMarkdown,
    supplementMarkdown,
    spreadsheetData,
    mockupImage,
    
    // セッター
    setConditionsMarkdown,
    setSupplementMarkdown,
    setSpreadsheetData,
    setMockupImage,
  };
};