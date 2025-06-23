import React, { useState } from 'react';
import { 
  initialConditionsMarkdown, 
  initialSupplementMarkdown, 
  initialSpreadsheetData 
} from './useInitialData';
import type { SpreadsheetData } from '../types/spreadsheet';

export const useDocumentState = () => {
  // インスタンス識別用のランダムID
  const instanceId = React.useRef(Math.random().toString(36).substr(2, 9)).current;
  
  console.log(`🔧 useDocumentState インスタンス作成: ${instanceId}`);
  
  // Markdownとスプレッドシートの状態
  const [conditionsMarkdown, setConditionsMarkdown] = useState<string>(initialConditionsMarkdown);
  const [supplementMarkdown, setSupplementMarkdown] = useState<string>(initialSupplementMarkdown);
  const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetData[]>(initialSpreadsheetData);
  
  // 画像状態
  const [mockupImage, setMockupImage] = useState<string | null>(null);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  
  // Mermaidコード状態
  const [mermaidCode, setMermaidCode] = useState<string>('');
  
  // 状態変更をログに記録
  const loggedSetMockupImage = React.useCallback((value: string | null) => {
    console.log(`📸 mockupImage変更 [${instanceId}]:`, value ? `${value.length}文字` : 'null');
    setMockupImage(value);
  }, [instanceId]);
  
  const loggedSetAiGeneratedImage = React.useCallback((value: string | null) => {
    console.log(`🤖 aiGeneratedImage変更 [${instanceId}]:`, value ? `${value.length}文字` : 'null');
    setAiGeneratedImage(value);
  }, [instanceId]);

  return {
    // 状態
    conditionsMarkdown,
    supplementMarkdown,
    spreadsheetData,
    mockupImage,
    aiGeneratedImage,
    mermaidCode,
    
    // セッター（ログ付き）
    setConditionsMarkdown,
    setSupplementMarkdown,
    setSpreadsheetData,
    setMockupImage: loggedSetMockupImage,
    setAiGeneratedImage: loggedSetAiGeneratedImage,
    setMermaidCode,
    
    // デバッグ情報
    _instanceId: instanceId,
  };
};