import { useCallback } from 'react';

// 型定義（App.tsxから複製）
interface DocumentData {
  conditions: string;
  supplement: string;
  spreadsheet: any;
  mockup: string | null;
  timestamp: string;
}

interface UseFileOperationsProps {
  conditionsMarkdown: string;
  supplementMarkdown: string;
  spreadsheetData: any[];
  mockupImage: string | null;
  setConditionsMarkdown: (value: string) => void;
  setSupplementMarkdown: (value: string) => void;
  setSpreadsheetData: (data: any[]) => void;
  setMockupImage: (image: string | null) => void;
}

export const useFileOperations = ({
  conditionsMarkdown,
  supplementMarkdown,
  spreadsheetData,
  mockupImage,
  setConditionsMarkdown,
  setSupplementMarkdown,
  setSpreadsheetData,
  setMockupImage,
}: UseFileOperationsProps) => {
  
  // 画像アップロード処理
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setMockupImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [setMockupImage]);

  // 保存処理
  const handleSave = useCallback(() => {
    console.log('💾 保存実行');
    console.log('💾 現在のspreadsheetData:', spreadsheetData);
    console.log('💾 スプレッドシート名:', spreadsheetData[0]?.name);
    console.log('💾 セル数:', spreadsheetData[0]?.celldata?.length);
    
    const docData: DocumentData = {
      conditions: conditionsMarkdown,
      supplement: supplementMarkdown,
      spreadsheet: spreadsheetData,
      mockup: mockupImage,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(docData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design-document.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [conditionsMarkdown, supplementMarkdown, spreadsheetData, mockupImage]);

  // 読み込み処理（元のhandleLoadをそのままコピー）
  const handleLoad = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📂 読み込み開始');
    const file = e.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const docData: DocumentData = JSON.parse(result);
            
            // データを復元（詳細ログ付き）
            console.log('📂 読み込み完了 - JSONからスプレッドシートデータを復元');
            console.log('📂 復元するスプレッドシートデータ:', docData.spreadsheet);
            
            // データ型を確認・修正
            let spreadsheetToRestore = docData.spreadsheet;
            if (!Array.isArray(spreadsheetToRestore)) {
              console.warn('⚠️ スプレッドシートデータが配列ではありません、空配列で初期化します');
              spreadsheetToRestore = [];
            }
            
            // Fortune-Sheet用にデータ構造を修正
            const normalizedSheets = spreadsheetToRestore.map((sheet: any, index: number) => {
              console.log(`📂 シート${index} 変換前:`, {
                name: sheet?.name,
                hasData: !!sheet?.data,
                hasCelldata: !!sheet?.celldata,
                dataLength: sheet?.data?.length,
                celldataLength: sheet?.celldata?.length
              });
              
              // dataプロパティがある場合はcelldataに変換
              let celldata = sheet?.celldata || [];
              if (sheet?.data && Array.isArray(sheet.data)) {
                celldata = [];
                sheet.data.forEach((row: any[], rowIndex: number) => {
                  if (Array.isArray(row)) {
                    row.forEach((cell: any, colIndex: number) => {
                      if (cell !== null && cell !== undefined) {
                        if (typeof cell === 'object' && cell.v !== undefined) {
                          celldata.push({
                            r: rowIndex,
                            c: colIndex,
                            v: {
                              v: cell.v,
                              m: cell.m || cell.v,
                              ct: cell.ct || { fa: 'General', t: 'g' }
                            }
                          });
                        } else if (cell !== '') {
                          celldata.push({
                            r: rowIndex,
                            c: colIndex,
                            v: {
                              v: cell,
                              m: cell,
                              ct: { fa: 'General', t: 'g' }
                            }
                          });
                        }
                      }
                    });
                  }
                });
                console.log(`📂 シート${index} data→celldata変換完了:`, celldata.length);
                console.log(`📂 変換されたcelldata:`, celldata.slice(0, 3));
              }
              
              const normalizedSheet = {
                name: sheet.name || `Sheet${index + 1}`,
                row: sheet.row || 100,
                column: sheet.column || 26,
                order: sheet.order !== undefined ? sheet.order : index,
                ...sheet,
                celldata: celldata
              };
              
              console.log(`📂 シート${index} 変換後:`, {
                name: normalizedSheet.name,
                celldataLength: normalizedSheet.celldata.length,
                sampleCells: normalizedSheet.celldata.slice(0, 3)
              });
              
              return normalizedSheet;
            });
            
            console.log('📂 最終的なスプレッドシートデータ:', normalizedSheets);
            
            setConditionsMarkdown(docData.conditions || '');
            setSupplementMarkdown(docData.supplement || '');
            setSpreadsheetData(normalizedSheets);
            setMockupImage(docData.mockup || null);
            
            alert(`設計書を読み込みました！\nスプレッドシート: ${normalizedSheets.length}シート\nセル数: ${normalizedSheets[0]?.celldata?.length || 0}`);
          }
        } catch (error) {
          alert('JSONファイルの読み込みに失敗しました。');
          console.error('Load error:', error);
        }
      };
      reader.readAsText(file);
    } else {
      alert('JSONファイルを選択してください。');
    }
    // ファイル選択をリセット
    e.target.value = '';
  }, [setConditionsMarkdown, setSupplementMarkdown, setSpreadsheetData, setMockupImage]);

  return {
    handleImageUpload,
    handleSave,
    handleLoad,
  };
};