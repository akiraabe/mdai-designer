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
    console.log('💾 保存実行! セル数:', spreadsheetData[0]?.celldata?.length);
    console.log('💾 保存するデータ:', spreadsheetData[0]);
    
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
            console.log('📂 読み込み開始');
            console.log('📂 JSONファイルの内容:', docData);
            console.log('📂 スプレッドシート部分:', docData.spreadsheet);
            
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
              
              // dataプロパティがある場合はcelldataに変換（安全性強化）
              let celldata = sheet?.celldata || [];
              if (sheet?.data && Array.isArray(sheet.data)) {
                celldata = [];
                sheet.data.forEach((row: any[], rowIndex: number) => {
                  if (Array.isArray(row)) {
                    row.forEach((cell: any, colIndex: number) => {
                      // null、undefined、空文字をスキップ
                      if (cell === null || cell === undefined || cell === '') {
                        return;
                      }
                      
                      try {
                        if (typeof cell === 'object' && cell.v !== undefined) {
                          // 既にFortune-Sheet形式のセル（書式情報保持）
                          if (cell.v !== null && cell.v !== undefined && cell.v !== '') {
                            celldata.push({
                              r: rowIndex,
                              c: colIndex,
                              v: {
                                v: cell.v,
                                m: String(cell.m || cell.v), // 必ず文字列化
                                ct: cell.ct || { fa: 'General', t: 'g' },
                                // 書式情報もコピー
                                ff: cell.ff,
                                fc: cell.fc,
                                fs: cell.fs,
                                bl: cell.bl,
                                it: cell.it,
                                bg: cell.bg,
                                ht: cell.ht,
                                vt: cell.vt,
                                tr: cell.tr,
                                tb: cell.tb
                              }
                            });
                          }
                        } else {
                          // プリミティブ値
                          const stringValue = String(cell);
                          if (stringValue.trim() !== '') {
                            celldata.push({
                              r: rowIndex,
                              c: colIndex,
                              v: {
                                v: cell,
                                m: stringValue,
                                ct: { fa: 'General', t: 'g' }
                              }
                            });
                          }
                        }
                      } catch (err) {
                        console.warn(`⚠️ セル(${rowIndex},${colIndex})の変換でエラー:`, err, cell);
                      }
                    });
                  }
                });
                console.log(`📂 シート${index} data→celldata変換完了:`, celldata.length);
                console.log(`📂 変換されたcelldata:`, celldata.slice(0, 3));
              }
              
              // celldataの追加検証・修正
              celldata = celldata.filter((cell: any) => {
                if (!cell || typeof cell.r !== 'number' || typeof cell.c !== 'number') {
                  console.warn('⚠️ 読み込み時: 無効なセル座標、除外:', cell);
                  return false;
                }
                if (!cell.v || cell.v.v === undefined || cell.v.v === null || cell.v.v === '') {
                  return false;
                }
                return true;
              }).map((cell: any) => ({
                r: cell.r,
                c: cell.c,
                v: {
                  v: cell.v.v,
                  m: String(cell.v.m || cell.v.v),
                  ct: cell.v.ct || { fa: 'General', t: 'g' },
                  // セルレベル書式情報を保持
                  ff: cell.v.ff,     // フォントファミリー
                  fc: cell.v.fc,     // フォント色
                  fs: cell.v.fs,     // フォントサイズ
                  bl: cell.v.bl,     // 太字
                  it: cell.v.it,     // イタリック
                  bg: cell.v.bg,     // 背景色
                  ht: cell.v.ht,     // 水平配置
                  vt: cell.v.vt,     // 垂直配置
                  tr: cell.v.tr,     // テキスト回転
                  tb: cell.v.tb      // テキスト折り返し
                }
              }));
              
              const normalizedSheet = {
                // 基本プロパティ
                name: sheet.name || `Sheet${index + 1}`,
                id: sheet.id,
                status: sheet.status || 1,
                order: sheet.order !== undefined ? sheet.order : index,
                hide: sheet.hide || 0,
                row: sheet.row || 100,
                column: sheet.column || 26,
                defaultRowHeight: sheet.defaultRowHeight || 19,
                defaultColWidth: sheet.defaultColWidth || 73,
                
                // セルデータ
                celldata: celldata,
                
                // 書式設定を完全復元（最重要！）
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
              
              console.log(`📂 シート${index} 変換後:`, {
                name: normalizedSheet.name,
                celldataLength: normalizedSheet.celldata.length,
                sampleCells: normalizedSheet.celldata.slice(0, 3)
              });
              
              return normalizedSheet;
            });
            
            console.log('📂 最終的なスプレッドシートデータ:', normalizedSheets);
            console.log('📂 最終セル数:', normalizedSheets[0]?.celldata?.length);
            
            setConditionsMarkdown(docData.conditions || '');
            setSupplementMarkdown(docData.supplement || '');
            console.log('📂 Reactステート更新実行');
            
            // テストデータボタンと同じシンプルな処理
            setSpreadsheetData(normalizedSheets);
            console.log('📂 スプレッドシートデータ更新完了');
            
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