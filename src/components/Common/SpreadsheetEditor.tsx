// src/components/Common/SpreadsheetEditor.tsx
import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { SpreadsheetErrorBoundary } from './SpreadsheetErrorBoundary';

interface CellData {
  r: number;
  c: number;
  v: {
    v: any;
    m?: string;
    ct?: {
      fa: string;
      t: string;
    };
  } | any;
}

interface SheetConfig {
  merge?: Record<string, any>;
  rowlen?: Record<string, number>;
  columnlen?: Record<string, number>;
  rowhidden?: Record<string, number>;
  colhidden?: Record<string, number>;
  borderInfo?: any[];
  authority?: Record<string, any>;
}

interface SpreadsheetData {
  name: string;
  celldata?: CellData[];
  row: number;
  column: number;
  order: number;
  config?: SheetConfig;
  id?: string;
  status?: number;
  hide?: number;
  defaultRowHeight?: number;
  defaultColWidth?: number;
  data?: any[][];
}

interface SpreadsheetEditorProps {
  data: SpreadsheetData[];
  onDataChange: (newData: SpreadsheetData[]) => void;
}

export const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({ 
  data,
  onDataChange
}) => {
  const workbookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // データが無効な場合のフォールバック（簡略化して無限ループ防止）
  const validData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [{
        name: "Sheet1",
        celldata: [],
        row: 100,
        column: 26,
        order: 0,
        config: {}
      }];
    }
    
    // データをそのまま返す（複雑な正規化は後で実装）
    return data;
  }, [data]);
  
  // データ受信時のログ（読み込み調査用）
  useEffect(() => {
    console.log('📊 SpreadsheetEditor データ受信:', {
      name: data?.[0]?.name,
      cellCount: data?.[0]?.celldata?.length,
      hasCelldata: !!data?.[0]?.celldata,
      hasData: !!data?.[0]?.data,
      mergeInfo: data?.[0]?.config?.merge
    });
    
    // セル結合情報の詳細ログ
    if (data?.[0]?.config?.merge && Object.keys(data[0].config.merge).length > 0) {
      console.log('🔗 セル結合情報あり:', data[0].config.merge);
    } else {
      console.log('❌ セル結合情報なし');
    }
    
    // Workbook APIを使ってデータを直接更新（再マウント不要）
    if (workbookRef.current && validData && validData.length > 0) {
      console.log('📊 Workbook APIでデータ直接更新実行');
      try {
        workbookRef.current.setData(validData);
        console.log('✅ Workbook APIでデータ更新成功');
      } catch (error) {
        console.warn('⚠️ Workbook API更新失敗:', error);
      }
    }
  }, [data, validData]);
  
  // 日本語IME入力対応のイベントハンドラー
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    let isComposing = false;
    
    const handleCompositionStart = () => {
      isComposing = true;
      console.log('🈶 IME入力開始');
    };
    
    const handleCompositionEnd = () => {
      isComposing = false;
      console.log('🈶 IME入力終了');
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // IME入力中のEnterキーを無視
      if (isComposing && e.key === 'Enter') {
        console.log('🈶 IME入力中のEnterキーを無視');
        e.stopPropagation();
        return false;
      }
    };
    
    // スプレッドシート内の入力要素に対してイベントを設定
    container.addEventListener('compositionstart', handleCompositionStart, true);
    container.addEventListener('compositionend', handleCompositionEnd, true);
    container.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      container.removeEventListener('compositionstart', handleCompositionStart, true);
      container.removeEventListener('compositionend', handleCompositionEnd, true);
      container.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);
  
  // onChangeハンドラー（書式情報完全保存対応）
  const handleChange = useCallback((sheets: any) => {
    console.log('🔍 データ詳細:', {
      celldata: !!sheets?.[0]?.celldata,
      data: !!sheets?.[0]?.data,
      dataLength: sheets?.[0]?.data?.length,
      dataType: typeof sheets?.[0]?.data
    });
    
    if (sheets && sheets.length > 0) {
      // 完全なシートデータを保存（data→celldata変換対応）
      const completeSheets = sheets.map((sheet: SpreadsheetData, index: number) => {
        // Fortune-Sheetのdata形式をcelldata形式に変換
        let celldata = sheet.celldata || [];
        
        if (sheet.data && Array.isArray(sheet.data)) {
          console.log('🔄 data→celldata変換実行');
          celldata = [];
          sheet.data.forEach((row: any[], rowIndex: number) => {
            if (Array.isArray(row)) {
              row.forEach((cell: any, colIndex: number) => {
                if (cell && cell !== null && cell !== undefined && cell !== '') {
                  celldata.push({
                    r: rowIndex,
                    c: colIndex,
                    v: typeof cell === 'object' ? cell : { v: cell, m: String(cell), ct: { fa: 'General', t: 'g' } }
                  });
                }
              });
            }
          });
          console.log('✅ 変換完了。セル数:', celldata.length);
        }
        
        return {
          // 基本プロパティ
          name: sheet.name,
          id: sheet.id,
          status: sheet.status,
          order: sheet.order !== undefined ? sheet.order : index,
          hide: sheet.hide || 0,
          row: sheet.row || 100,
          column: sheet.column || 26,
          defaultRowHeight: sheet.defaultRowHeight || 19,
          defaultColWidth: sheet.defaultColWidth || 73,
          
          // セルデータ（変換済み）
          celldata: celldata,
          
          // 書式設定（最重要！）
          config: {
            merge: sheet.config?.merge || {},                    // 結合セル
            rowlen: sheet.config?.rowlen || {},                  // 行の高さ
            columnlen: sheet.config?.columnlen || {},            // 列の幅
            rowhidden: sheet.config?.rowhidden || {},            // 非表示行
            colhidden: sheet.config?.colhidden || {},            // 非表示列
            borderInfo: sheet.config?.borderInfo || [],          // 罫線情報
            authority: sheet.config?.authority || {}             // シート保護
          }
        };
        
        // セル結合情報の変更保存ログ
        if (normalizedSheet.config?.merge && Object.keys(normalizedSheet.config.merge).length > 0) {
          console.log('💾 セル結合情報を保存:', normalizedSheet.config.merge);
        }
        
        return normalizedSheet;
      });
      
      // console.log('✅ onDataChangeを呼び出し! セル数:', completeSheets[0]?.celldata?.length);
      onDataChange(completeSheets);
    }
  }, [onDataChange]);
  
  
  // データ内容も含めたキー生成でデータ変更時の確実な更新を保証
  const componentKey = useMemo(() => {
    const sheetName = validData?.[0]?.name || 'default';
    const cellCount = validData?.[0]?.celldata?.length || 0;
    const dataHash = JSON.stringify(validData?.[0]?.celldata?.slice(0, 5)) || '';
    return `workbook-${sheetName}-${cellCount}-${dataHash.length}`;
  }, [validData?.[0]?.name, validData?.[0]?.celldata]);
  
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
      <div ref={containerRef} style={{ height: '500px', width: '100%' }}>
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
          options={{
            // 日本語IME入力対応
            container: 'luckysheet',
            allowEdit: true,
            showinfobar: false,
            showsheetbar: true,
            showstatisticBar: false,
            // IME入力時のエンターキー処理を無効化
            enableAddRow: false,
            // セル編集時の詳細設定
            functionButton: '<i class="fa fa-calculator" aria-hidden="true"></i>',
            // 日本語入力モード設定
            editMode: false,
            // エンターキーでのセル移動を制御
            allowCopy: true,
            allowEdit: true,
            forceCalculation: false
          }}
        />
      </div>
    </SpreadsheetErrorBoundary>
  );
};
