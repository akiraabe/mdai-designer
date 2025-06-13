// src/App.tsx
import React, { useState, useCallback } from 'react';
import { Upload, FileText, Image, Table, Save, Download } from 'lucide-react';
import './App.css'

// 実際の環境では以下のimportを使用
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

// 型定義
interface CellPosition {
  row: number;
  col: number;
}

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

// Fortune-Sheetコンポーネント（celldata形式対応）
interface SpreadsheetEditorProps {
  data: any;
  onChange: (data: any) => void;
}

const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = React.memo(({ 
  data, 
  onChange 
}) => {
  console.log('SpreadsheetEditor received data:', data);
  console.log('Data structure:', JSON.stringify(data, null, 2));
  
  return (
    <div style={{ height: '500px', width: '100%' }}>
      <Workbook
        data={data}
        onChange={onChange}
        lang="en"
      />
    </div>
  );
});

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

  // スプレッドシートデータ（Fortune-Sheet celldata形式）
  const [spreadsheetData, setSpreadsheetData] = useState([
    {
      name: "項目定義",
      celldata: [
        { r: 0, c: 0, v: { v: '項目名', ct: { fa: 'General', t: 'g' } } },
        { r: 0, c: 1, v: { v: '型', ct: { fa: 'General', t: 'g' } } },
        { r: 0, c: 2, v: { v: '必須', ct: { fa: 'General', t: 'g' } } },
        { r: 1, c: 0, v: { v: 'ユーザーID', ct: { fa: 'General', t: 'g' } } },
        { r: 1, c: 1, v: { v: 'String', ct: { fa: 'General', t: 'g' } } },
        { r: 1, c: 2, v: { v: '○', ct: { fa: 'General', t: 'g' } } }
      ]
    }
  ]);

  const [mockupImage, setMockupImage] = useState<string | null>(null);

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
  }, []);

  const handleSave = useCallback(() => {
    console.log('保存時のspreadsheetData:', spreadsheetData);
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

  const handleLoad = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleLoad called', e.target.files);
    const file = e.target.files?.[0];
    console.log('Selected file:', file);
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const docData: DocumentData = JSON.parse(result);
            
            // データを復元
            console.log('読み込み時のdocData.spreadsheet:', docData.spreadsheet);
            setConditionsMarkdown(docData.conditions || '');
            setSupplementMarkdown(docData.supplement || '');
            
            // Fortune-Sheetは配列形式が必要
            let spreadsheetArray;
            if (Array.isArray(docData.spreadsheet)) {
              spreadsheetArray = docData.spreadsheet;
            } else if (docData.spreadsheet && typeof docData.spreadsheet === 'object') {
              // 単一オブジェクトの場合は配列に変換
              spreadsheetArray = [docData.spreadsheet];
            } else {
              spreadsheetArray = [];
            }
            
            console.log('setSpreadsheetDataに渡すデータ:', spreadsheetArray);
            console.log('Fortune-Sheetに復元:', JSON.stringify(spreadsheetArray, null, 2));
            setSpreadsheetData(spreadsheetArray);
            setMockupImage(docData.mockup || null);
            
            alert('設計書を読み込みました！');
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
  }, []);

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
                console.log('読み込みボタンクリック');
                const input = document.getElementById('load-json') as HTMLInputElement;
                console.log('input element:', input);
                input?.click();
              }}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors border-2 border-orange-800"
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
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              保存
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
                onChange={setSpreadsheetData}
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
