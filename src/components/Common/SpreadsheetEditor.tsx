// src/components/Common/SpreadsheetEditor.tsx
import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { SpreadsheetErrorBoundary } from './SpreadsheetErrorBoundary';
import type { SpreadsheetData } from '../../types/spreadsheet';

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
  
  // モード管理：false=表示モード（読み込み対応）、true=編集モード（フォーカス維持）
  const [isEditMode, setIsEditMode] = useState(false);
  
  // リサイズ機能用の状態
  const [height, setHeight] = useState(600); // デフォルト高さ
  const [isResizing, setIsResizing] = useState(false);
  const [resizeKey, setResizeKey] = useState(0); // 強制再マウント用
  const [forceResizeUpdate, setForceResizeUpdate] = useState(false); // リサイズ強制フラグ
  const [forceImportUpdate, setForceImportUpdate] = useState(0); // インポート強制更新用
  const resizeStartY = useRef(0);
  const startHeight = useRef(600);
  
  // データが無効な場合のフォールバック（簡略化して無限ループ防止）
  const validData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0 || !data[0]?.celldata || data[0].celldata.length === 0) {
      console.log('📊 サンプルデータを生成');
      return [{
        name: "Sheet1",
        celldata: [
          {r: 0, c: 0, v: {v: "項目名", m: "項目名", ct: {fa: "General", t: "g"}}},
          {r: 0, c: 1, v: {v: "データ型", m: "データ型", ct: {fa: "General", t: "g"}}},
          {r: 0, c: 2, v: {v: "説明", m: "説明", ct: {fa: "General", t: "g"}}},
          {r: 1, c: 0, v: {v: "ユーザーID", m: "ユーザーID", ct: {fa: "General", t: "g"}}},
          {r: 1, c: 1, v: {v: "文字列", m: "文字列", ct: {fa: "General", t: "g"}}},
          {r: 1, c: 2, v: {v: "ユーザーを一意に識別するID", m: "ユーザーを一意に識別するID", ct: {fa: "General", t: "g"}}}
        ],
        row: 100,
        column: 26,
        order: 0,
        config: {}
      }];
    }
    
    console.log('📊 既存データを使用');
    // データをそのまま返す（複雑な正規化は後で実装）
    return data;
  }, [data]);
  
  // インポート検出とキー強制更新
  useEffect(() => {
    const dataTimestamp = Date.now();
    
    // データが大幅に変更された場合（インポート等）を検出
    if (validData && validData.length > 0 && validData[0]?.celldata && validData[0].celldata.length > 0) {
      const currentCellCount = validData[0].celldata.length;
      const prevCellCount = parseInt(localStorage.getItem('prev-cell-count') || '0');
      
      // セル数が大幅に変化した場合はインポートと判断
      if (Math.abs(currentCellCount - prevCellCount) > 5) {
        console.log('📂 インポート検出！強制キー更新実行');
        setForceImportUpdate(prev => prev + 1);
        localStorage.setItem('prev-cell-count', currentCellCount.toString());
      }
    }
    
    localStorage.setItem('last-data-change-timestamp', dataTimestamp.toString());
  }, [validData]);

  // データ読み込み処理（両モード対応）
  useEffect(() => {
    console.log('📊 データ読み込み実行（モード:', isEditMode ? '編集' : '表示', ')');
    
    // セル結合情報の詳細ログ
    if (data?.[0]?.config?.merge && Object.keys(data[0].config.merge).length > 0) {
      console.log('🔗 セル結合情報あり:', data[0].config.merge);
    } else {
      console.log('❌ セル結合情報なし');
    }
    
    // Workbook APIでデータ更新（両モードで実行）
    if (workbookRef.current && validData && validData.length > 0) {
      console.log('📊 Workbook APIでデータ直接更新実行');
      
      // Fortune-Sheetの利用可能なAPIメソッドを調査
      console.log('🔍 Workbook利用可能メソッド:', Object.getOwnPropertyNames(workbookRef.current));
      console.log('🔍 Workbookプロトタイプメソッド:', Object.getOwnPropertyNames(Object.getPrototypeOf(workbookRef.current)));
      
      try {
        // 複数のAPIメソッドを試行
        if (typeof workbookRef.current.setData === 'function') {
          console.log('🎯 setDataメソッド使用');
          workbookRef.current.setData(validData);
        } else if (typeof workbookRef.current.loadData === 'function') {
          console.log('🎯 loadDataメソッド使用');
          workbookRef.current.loadData(validData);
        } else if (typeof workbookRef.current.refreshData === 'function') {
          console.log('🎯 refreshDataメソッド使用');
          workbookRef.current.refreshData(validData);
        } else if (typeof workbookRef.current.setOptions === 'function') {
          console.log('🎯 setOptionsメソッド使用');
          workbookRef.current.setOptions({data: validData});
        } else if (typeof workbookRef.current.create === 'function') {
          console.log('🎯 createメソッド使用');
          workbookRef.current.create({data: validData});
        } else {
          console.warn('⚠️ 利用可能なデータ更新メソッドが見つかりません');
          console.log('📋 利用可能メソッド一覧:', 
            Object.getOwnPropertyNames(workbookRef.current).filter(name => typeof workbookRef.current[name] === 'function')
          );
        }
        console.log('✅ Workbook APIでデータ更新成功');
        
      } catch (error) {
        console.warn('⚠️ Workbook API更新失敗:', error);
        console.log('🔄 プロパティ経由での更新をフォールバック実行');
        // フォールバック：プロパティによる強制再マウント
        setForceImportUpdate(prev => prev + 1);
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
  
  // リサイズ機能のイベントハンドラー
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    startHeight.current = height;
    e.preventDefault();
  }, [height]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaY = e.clientY - resizeStartY.current;
    const newHeight = Math.max(300, Math.min(1000, startHeight.current + deltaY)); // 最小300px、最大1000px
    setHeight(newHeight);
  }, [isResizing]);
  
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    
    // リサイズ完了後にWorkbookを強制再マウント
    console.log('� リサイズ完了：Workbook強制再マウント実行');
    setForceResizeUpdate(true);
    setResizeKey(prev => prev + 1);
    
    // フラグをリセット
    setTimeout(() => {
      setForceResizeUpdate(false);
    }, 200);
  }, []);
  
  // グローバルマウスイベントの管理
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);
  
  // onChangeハンドラー（編集モード時のみ動作）
  const handleChange = useCallback((sheets: any) => {
    if (!isEditMode) {
      console.log('📊 表示モード：onChange無視');
      return;
    }
    
    console.log('✏️ 編集モード：onChange処理実行');
    
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
        
        const normalizedSheet = {
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
  }, [isEditMode, onDataChange]);
  
  
  // データ読み込み判定の改善
  const isDataLoading = useMemo(() => {
    const hasRealData = validData?.[0]?.celldata && validData[0].celldata.length > 6; // サンプルデータより多い
    const hasSheetName = validData?.[0]?.name && validData[0].name !== 'Sheet1';
    return hasRealData || hasSheetName;
  }, [validData]);

  // キー生成用の値を別途抽出（ESLint対応）
  const sheetName = validData?.[0]?.name || 'default';
  const cellCount = validData?.[0]?.celldata?.length || 0;
  
  const cellDataSlice = useMemo(() => {
    return validData?.[0]?.celldata?.slice(0, 5) || [];
  }, [validData]);

  // モード別キー生成：編集モード時は絶対に固定（ただしリサイズ時は例外）
  const componentKey = useMemo(() => {
    if (isEditMode && !forceResizeUpdate && forceImportUpdate === 0) {
      // 編集モード（リサイズ・インポート時以外）：固定キー（フォーカス維持最優先）
      console.log('✏️ 編集モード：固定キー使用');
      return `workbook-edit-mode`;
    } else if (forceResizeUpdate) {
      // 表示モード時のリサイズ強制更新
      const key = `workbook-force-resize-${resizeKey}`;
      console.log('🔄 強制リサイズ：キー生成', key);
      return key;
    } else if (forceImportUpdate > 0) {
      // インポート時の強制更新
      const key = `workbook-force-import-${forceImportUpdate}`;
      console.log('📂 強制インポート更新：キー生成', key);
      return key;
    } else {
      // 表示モード または 読み込み時：動的キーで確実更新
      const dataHash = JSON.stringify(cellDataSlice) || '';
      const key = `workbook-view-${sheetName}-${cellCount}-${dataHash.length}`;
      console.log('📊 表示モード：動的キー生成', key, {isDataLoading});
      return key;
    }
  }, [isEditMode, forceResizeUpdate, resizeKey, forceImportUpdate, isDataLoading, sheetName, cellCount, cellDataSlice]);
  
  return (
    <SpreadsheetErrorBoundary onReset={() => {
      console.log('🔄 SpreadsheetEditor: エラーリセット、デフォルトデータで再初期化');
      onDataChange([{
        name: "新しいシート",
        celldata: [],
        row: 100,
        column: 26,
        order: 0,
        id: "default-sheet",
        status: 1,
        hide: 0,
        defaultRowHeight: 19,
        defaultColWidth: 73
      }]);
    }}>
      <div ref={containerRef} data-testid="spreadsheet-container" style={{ height: `${height}px`, width: '100%', minHeight: '300px', position: 'relative' }}>
        {/* モード切り替えコントロール */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: 'blue' }}>
            現在: {validData?.[0]?.name} (セル数: {validData?.[0]?.celldata?.length})
          </div>
          
          {/* スイッチコンポーネント */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>表示</span>
            <div
              data-testid="edit-mode-toggle"
              onClick={() => setIsEditMode(!isEditMode)}
              style={{
                width: '44px',
                height: '24px',
                backgroundColor: isEditMode ? '#10b981' : '#d1d5db',
                borderRadius: '12px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: isEditMode ? '22px' : '2px',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                }}
              />
            </div>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>編集</span>
          </div>
          
          <span style={{ 
            fontSize: '11px', 
            color: isEditMode ? '#10b981' : '#6b7280',
            fontWeight: 'bold'
          }}>
            {isEditMode 
              ? '✏️ 編集モード：手作業編集可能・フォーカス維持' 
              : '👁️ 表示モード：読み込み対応・編集無効'}
          </span>
        </div>
        <div style={{ fontSize: '10px', color: 'red', marginBottom: '4px' }}>
          デバッグ: セル数={validData?.[0]?.celldata?.length || 0}, データ={JSON.stringify(validData?.[0]?.celldata?.slice(0, 2))}
        </div>
        
        {/* 表示モード時の編集無効化オーバーレイ */}
        <div data-testid="workbook-container" style={{ 
          position: 'relative', 
          height: `${height - 88}px`, // 動的高さからコントロール部分を引いた値
          width: '100%' 
        }}>
          <Workbook
            ref={workbookRef}
            key={componentKey}
            data={validData}
            onChange={handleChange}
          />
          
          {!isEditMode && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'transparent',
                cursor: 'not-allowed',
                zIndex: 1000
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                alert('編集するには右上のスイッチで編集モードに切り替えてください');
              }}
            />
          )}
        </div>
        
        {/* リサイズハンドル */}
        <div
          data-testid="resize-handle"
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '8px',
            cursor: 'ns-resize',
            backgroundColor: isResizing ? '#10b981' : 'transparent',
            borderTop: isResizing ? '2px solid #10b981' : '2px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
        >
          <div style={{
            width: '40px',
            height: '4px',
            backgroundColor: isResizing ? '#10b981' : '#9ca3af',
            borderRadius: '2px',
            transition: 'all 0.2s'
          }} />
        </div>
      </div>
    </SpreadsheetErrorBoundary>
  );
};
