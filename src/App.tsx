// src/App.tsx
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Upload, FileText, Image, Table, Save } from 'lucide-react';
import './App.css'

// 実際の環境では以下のimportを使用
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

// カスタムフック
import { useFileOperations } from './hooks/useFileOperations';

// 型定義
interface DocumentData {
  conditions: string;
  supplement: string;
  spreadsheet: any; // Fortune-Sheetの完全なJSON構造
  mockup: string | null;
  timestamp: string;
}

interface TabInfo {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Fortune-Sheetコンポーネント（onChange対応）
interface SpreadsheetEditorProps {
  data: any;
  onDataChange: (newData: any) => void;
}

const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({ 
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
  
  // データが無効な場合のフォールバック
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
    return data;
  }, [data]);
  
  // チカチカ最小限でデータ更新を確実に（シート名変更時のみキー更新）
  const componentKey = useMemo(() => {
    const sheetName = validData?.[0]?.name || 'default';
    return `workbook-${sheetName}`;
  }, [validData?.[0]?.name]);
  
  return (
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
  );
};

// 本格的なMarkdownエディタ
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = React.memo(({ 
  value, 
  onChange
}) => {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        height={400}
        preview="edit"
        hideToolbar={false}
        data-color-mode="light"
      />
    </div>
  );
});

// MarkdownSection コンポーネント
const MarkdownSection: React.FC<{
  title: string;
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}> = React.memo(({ title, children, icon: Icon }) => (
  <div className="mb-8">
    <div className="flex items-center mb-4 border-b pb-2">
      <Icon className="w-5 h-5 mr-2 text-blue-600" />
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    </div>
    <div className="max-w-none">
      {children}
    </div>
  </div>
));

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

// メインコンポーネント
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // 表示条件のMarkdown
  const [conditionsMarkdown, setConditionsMarkdown] = useState<string>(`## 表示条件

### アクセス権限
- ログイン済みユーザーのみアクセス可能
- 管理者権限保持者は全ユーザー閲覧可能
- 一般ユーザーは自分の情報のみ閲覧可能

### 表示ルール
- データが存在しない場合は「データなし」を表示
- 権限不足の場合は403エラーページにリダイレクト`);

  // 補足説明のMarkdown
  const [supplementMarkdown, setSupplementMarkdown] = useState<string>(`## 補足説明

### データフロー
1. 認証情報の確認
2. 権限レベルの判定
3. 適切なユーザーデータの取得
4. 画面への反映

### エラーハンドリング
- 権限不足: 403エラーページにリダイレクト
- データ取得失敗: エラーメッセージを表示
- ネットワークエラー: 再試行ボタンを表示

### パフォーマンス考慮
- 大量データの場合はページネーション実装
- キャッシュ機能により応答速度向上`);

  // スプレッドシートデータ - 超シンプルテスト
  const [spreadsheetData, setSpreadsheetData] = useState([
    {
      name: "項目定義",
      celldata: [
        { r: 0, c: 0, v: { v: 'A1', ct: { fa: 'General', t: 'g' } } },
        { r: 0, c: 1, v: { v: 'B1', ct: { fa: 'General', t: 'g' } } },
        { r: 1, c: 0, v: { v: 'A2', ct: { fa: 'General', t: 'g' } } },
        { r: 1, c: 1, v: { v: 'B2', ct: { fa: 'General', t: 'g' } } }
      ]
    }
  ]);

  const [mockupImage, setMockupImage] = useState<string | null>(null);

  // ファイル操作フック
  const {
    handleImageUpload,
    handleSave,
    handleLoad,
  } = useFileOperations({
    conditionsMarkdown,
    supplementMarkdown,
    spreadsheetData,
    mockupImage,
    setConditionsMarkdown,
    setSupplementMarkdown,
    setSpreadsheetData,
    setMockupImage,
  });


  const tabs: TabInfo[] = [
    { id: 'all', label: '全体表示', icon: FileText },
    { id: 'conditions', label: '表示条件', icon: FileText },
    { id: 'mockup', label: '画面イメージ', icon: Image },
    { id: 'definitions', label: '項目定義', icon: Table },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ユーザー管理画面 設計書
            </h1>
            <div className="text-sm text-gray-600">
              最終更新: {new Date().toLocaleDateString('ja-JP')} | 作成者: 設計チーム
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                const input = document.getElementById('load-json') as HTMLInputElement;
                input?.click();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                backgroundColor: '#ea580c',
                color: 'white',
                border: '2px solid #c2410c',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              読み込み
            </button>
            <input
              type="file"
              accept=".json"
              onChange={handleLoad}
              className="hidden"
              id="load-json"
            />
            <button
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              保存
            </button>
            <button
              onClick={() => {
                console.log('🔄 テストデータボタンクリック - データ変更開始');
                console.log('🔄 変更前:', spreadsheetData[0]?.name);
                console.log('🔄 変更前セル数:', spreadsheetData[0]?.celldata?.length);
                
                // テストデータを新しいインスタンスとして作成
                const newTestData = JSON.parse(JSON.stringify(testData));
                console.log('🔄 新しいテストデータ:', newTestData[0]?.name);
                console.log('🔄 新しいセル数:', newTestData[0]?.celldata?.length);
                
                // 直接状態を更新（useEffectでWorkbook APIが呼ばれる）
                setSpreadsheetData(newTestData);
                console.log('🔄 データ変更完了');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                backgroundColor: '#9333ea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              テストデータ
            </button>
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="bg-white rounded-t-lg shadow-sm">
        <div className="flex border-b overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="bg-white rounded-b-lg shadow-sm p-6">
        {/* 表示条件 */}
        {(activeTab === 'all' || activeTab === 'conditions') && (
          <MarkdownSection title="表示条件" icon={FileText}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">編集可能なMarkdown形式</span>
                <span className="text-xs text-gray-400">## で見出し、- でリスト</span>
              </div>
              <MarkdownEditor
                value={conditionsMarkdown}
                onChange={setConditionsMarkdown}
              />
            </div>
          </MarkdownSection>
        )}

        {/* 画面イメージ */}
        {(activeTab === 'all' || activeTab === 'mockup') && (
          <MarkdownSection title="画面イメージ" icon={Image}>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="mockup-upload"
                />
                <label
                  htmlFor="mockup-upload"
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  画像をアップロード
                </label>
                <span className="text-sm text-gray-500">
                  PNG, JPG, GIF対応
                </span>
              </div>
              
              {mockupImage ? (
                <div className="border rounded-lg overflow-hidden">
                  <img 
                    src={mockupImage} 
                    alt="画面モックアップ" 
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <Image className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-2">画面モックアップ画像をアップロードしてください</p>
                  <p className="text-sm text-gray-400">
                    Figma, Sketch, 手描きスキャン等、任意の形式で構いません
                  </p>
                </div>
              )}
            </div>
          </MarkdownSection>
        )}

        {/* 項目定義 */}
        {(activeTab === 'all' || activeTab === 'definitions') && (
          <MarkdownSection title="項目定義" icon={Table}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  Excelからコピペ可能です。セルをクリックして直接編集できます。
                </p>
                <div className="flex space-x-2">
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    Excel貼り付けヘルプ
                  </button>
                </div>
              </div>
              
              <SpreadsheetEditor 
                data={spreadsheetData}
                onDataChange={setSpreadsheetData}
              />
              
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                <strong>Fortune-Sheet機能:</strong> 
                Excel並みの編集機能 | 数式・書式設定・条件付き書式 | 
                CSV/Excel読み込み・書き出し | すべてJSON形式で完全保存
              </div>
            </div>
          </MarkdownSection>
        )}

        {/* 補足説明 */}
        {activeTab === 'all' && (
          <MarkdownSection title="補足説明" icon={FileText}>
            <MarkdownEditor
              value={supplementMarkdown}
              onChange={setSupplementMarkdown}
            />
          </MarkdownSection>
        )}
      </div>

      {/* フッター */}
      <div className="mt-6 text-center text-sm text-gray-500">
        生成AI活用設計工程 - 統合設計書システム v2.0 (Vite + TypeScript)
      </div>
    </div>
  );
};

export default App;
