import { useCallback } from 'react';

// テストデータ用の固定データ（紫ボタン用）
const testData = [
  {
    name: "🟣テストデータ🟣",
    celldata: [
      { r: 0, c: 0, v: { v: '項目名', ct: { fa: 'General', t: 'g' } } },
      { r: 0, c: 1, v: { v: '型', ct: { fa: 'General', t: 'g' } } },
      { r: 0, c: 2, v: { v: '必須', ct: { fa: 'General', t: 'g' } } },
      { r: 0, c: 3, v: { v: '説明', ct: { fa: 'General', t: 'g' } } },
      { r: 1, c: 0, v: { v: 'ユーザーID', ct: { fa: 'General', t: 'g' } } },
      { r: 1, c: 1, v: { v: 'string', ct: { fa: 'General', t: 'g' } } },
      { r: 1, c: 2, v: { v: '○', ct: { fa: 'General', t: 'g' } } },
      { r: 1, c: 3, v: { v: 'システム内で一意の識別子', ct: { fa: 'General', t: 'g' } } },
      { r: 2, c: 0, v: { v: 'ユーザー名', ct: { fa: 'General', t: 'g' } } },
      { r: 2, c: 1, v: { v: 'string', ct: { fa: 'General', t: 'g' } } },
      { r: 2, c: 2, v: { v: '○', ct: { fa: 'General', t: 'g' } } },
      { r: 2, c: 3, v: { v: '表示用のユーザー名', ct: { fa: 'General', t: 'g' } } },
      { r: 3, c: 0, v: { v: 'メールアドレス', ct: { fa: 'General', t: 'g' } } },
      { r: 3, c: 1, v: { v: 'email', ct: { fa: 'General', t: 'g' } } },
      { r: 3, c: 2, v: { v: '○', ct: { fa: 'General', t: 'g' } } },
      { r: 3, c: 3, v: { v: 'ログイン用メールアドレス', ct: { fa: 'General', t: 'g' } } },
      { r: 4, c: 0, v: { v: '権限レベル', ct: { fa: 'General', t: 'g' } } },
      { r: 4, c: 1, v: { v: 'number', ct: { fa: 'General', t: 'g' } } },
      { r: 4, c: 2, v: { v: '○', ct: { fa: 'General', t: 'g' } } },
      { r: 4, c: 3, v: { v: '1:一般, 2:管理者, 3:システム管理者', ct: { fa: 'General', t: 'g' } } },
      { r: 5, c: 0, v: { v: '最終ログイン', ct: { fa: 'General', t: 'g' } } },
      { r: 5, c: 1, v: { v: 'datetime', ct: { fa: 'General', t: 'g' } } },
      { r: 5, c: 2, v: { v: '×', ct: { fa: 'General', t: 'g' } } },
      { r: 5, c: 3, v: { v: '最後にログインした日時', ct: { fa: 'General', t: 'g' } } }
    ],
    row: 100,
    column: 26,
    order: 0
  }
];

interface UseSpreadsheetOperationsProps {
  spreadsheetData: any[];
  setSpreadsheetData: (data: any[]) => void;
}

export const useSpreadsheetOperations = ({
  spreadsheetData,
  setSpreadsheetData,
}: UseSpreadsheetOperationsProps) => {
  
  // テストデータ読み込み処理
  const handleLoadTestData = useCallback(() => {
    console.log('🔄 テストデータボタンクリック - データ変更開始');
    console.log('🔄 変更前:', spreadsheetData[0]?.name);
    console.log('🔄 変更前セル数:', spreadsheetData[0]?.celldata?.length);
    
    // テストデータを新しいインスタンスとして作成
    const newTestData = JSON.parse(JSON.stringify(testData));
    console.log('🔄 新しいテストデータ:', newTestData[0]?.name);
    console.log('🔄 新しいセル数:', newTestData[0]?.celldata?.length);
    
    // 直接状態を更新
    setSpreadsheetData(newTestData);
    console.log('🔄 データ変更完了');
  }, [spreadsheetData, setSpreadsheetData]);

  // 🔄 将来の拡張ポイント（ライブラリ乗り換え時に便利）
  // const handleClearSpreadsheet = useCallback(() => { ... }, []);
  // const handleExportToExcel = useCallback(() => { ... }, []);
  // const handleImportFromExcel = useCallback(() => { ... }, []);

  return {
    handleLoadTestData,
    // 将来の拡張
    // handleClearSpreadsheet,
    // handleExportToExcel,
    // handleImportFromExcel,
  };
};