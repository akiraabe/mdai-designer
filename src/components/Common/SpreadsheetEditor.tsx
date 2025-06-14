// src/components/Common/SpreadsheetEditor.tsx
import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { SpreadsheetErrorBoundary } from './SpreadsheetErrorBoundary';

interface SpreadsheetEditorProps {
  data: any;
  onDataChange: (newData: any) => void;
}

export const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({ 
  data,
  onDataChange
}) => {
  const workbookRef = useRef<any>(null);
  
  // データの詳細ログ出力
  useEffect(() => {
    console.log('📊 SpreadsheetEditor データ受信:', {
      hasData: !!data,
      isArray: Array.isArray(data),
      length: data?.length,
      firstSheet: data?.[0],
      sheetName: data?.[0]?.name,
      cellCount: data?.[0]?.celldata?.length,
      firstFewCells: data?.[0]?.celldata?.slice(0, 3)
    });
  }, [data]);
  
  // onChangeハンドラー
  const handleChange = useCallback((sheets: any) => {
    console.log('📝 Fortune-Sheet変更検出:', {
      sheetName: sheets?.[0]?.name,
      cellCount: sheets?.[0]?.celldata?.length
    });
    
    if (sheets && sheets.length > 0) {
      console.log('📤 データを親コンポーネントに同期');
      onDataChange(sheets);
    }
  }, [onDataChange]);
  
  // データが無効な場合のフォールバック + セルデータ正規化
  const validData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn('⚠️ 無効なデータ、デフォルトシートを使用');
      return [{
        name: "Sheet1",
        celldata: [],
        row: 100,
        column: 26,
        order: 0
      }];
    }
    
    // セルデータの正規化（undefinedセル対策）
    const normalizedData = data.map((sheet, index) => {
      const normalizedCelldata = (sheet.celldata || []).filter((cell: any) => {
        // 必須プロパティの検証
        if (!cell || typeof cell.r !== 'number' || typeof cell.c !== 'number') {
          console.warn('⚠️ 無効なセル座標、除外:', cell);
          return false;
        }
        
        // セル値の検証・正規化
        if (!cell.v || typeof cell.v !== 'object') {
          console.warn('⚠️ 無効なセル値、除外:', cell);
          return false;
        }
        
        // 値が空の場合は除外
        if (cell.v.v === undefined || cell.v.v === null || cell.v.v === '') {
          return false;
        }
        
        return true;
      }).map((cell: any) => {
        // セル値の正規化
        return {
          r: cell.r,
          c: cell.c,
          v: {
            v: cell.v.v,
            m: cell.v.m || String(cell.v.v), // 表示テキスト
            ct: cell.v.ct || { fa: 'General', t: 'g' } // セルタイプ
          }
        };
      });
      
      console.log(`📊 シート"${sheet.name}"正規化: ${sheet.celldata?.length || 0} → ${normalizedCelldata.length}セル`);
      
      return {
        name: sheet.name || `Sheet${index + 1}`,
        row: sheet.row || 100,
        column: sheet.column || 26,
        order: sheet.order !== undefined ? sheet.order : index,
        celldata: normalizedCelldata
      };
    });
    
    return normalizedData;
  }, [data]);
  
  // チカチカ最小限でデータ更新を確実に（シート名変更時のみキー更新）
  const componentKey = useMemo(() => {
    const sheetName = validData?.[0]?.name || 'default';
    return `workbook-${sheetName}`;
  }, [validData?.[0]?.name]);
  
  return (
    <SpreadsheetErrorBoundary onReset={() => {
      console.log('🔄 SpreadsheetEditor: エラーリセット、デフォルトデータで再初期化');
      onDataChange([{
        name: "新しいシート",
        celldata: [],
        row: 100,
        column: 26,
        order: 0
      }]);
    }}>
      <div style={{ height: '500px', width: '100%' }}>
        <div style={{ fontSize: '12px', color: 'blue', marginBottom: '4px' }}>
          現在: {validData?.[0]?.name} (セル数: {validData?.[0]?.celldata?.length})
          <span style={{ marginLeft: '10px', color: '#10b981', fontSize: '11px' }}>
            ✅ 編集内容は自動保存されます
          </span>
        </div>
        <div style={{ fontSize: '10px', color: 'red', marginBottom: '4px' }}>
          デバッグ: {JSON.stringify(validData?.[0]?.celldata?.slice(0, 2))}
        </div>
        <Workbook
          ref={workbookRef}
          key={componentKey}
          data={validData}
          onChange={handleChange}
          lang="en"
        />
      </div>
    </SpreadsheetErrorBoundary>
  );
};