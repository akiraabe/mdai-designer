// src/components/Content/MockupSection.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Image, Bot } from 'lucide-react';
import { MarkdownSection } from '../Common/MarkdownSection';
import { aiService } from '../../services/aiService';

interface MockupSectionProps {
  mockupImage: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  conditionsMarkdown?: string;
  spreadsheetData?: any[];
}

const LOCAL_STORAGE_KEY = 'ai-mockup-html';

// 項目定義（spreadsheetData）をMarkdownテーブル形式に変換
function spreadsheetToMarkdownTable(spreadsheetData: any[]): string {
  if (!spreadsheetData || spreadsheetData.length === 0) return '（項目定義なし）';

  // 1シート目のみ対象
  const sheet = spreadsheetData[0];
  const celldata = sheet.celldata || [];
  if (!celldata.length) return '（項目定義なし）';

  // 行列の最大値を取得
  const maxRow = Math.max(...celldata.map((cell: any) => cell.r));
  const maxCol = Math.max(...celldata.map((cell: any) => cell.c));

  // 2次元配列に変換
  const table: string[][] = [];
  for (let r = 0; r <= maxRow; r++) {
    table[r] = [];
    for (let c = 0; c <= maxCol; c++) {
      const cell = celldata.find((cell: any) => cell.r === r && cell.c === c);
      table[r][c] = cell ? (cell.v?.v || cell.v || "") : "";
    }
  }

  // Markdownテーブル文字列生成
  let md = '';
  if (table.length > 0) {
    // ヘッダー
    md += '| ' + table[0].join(' | ') + ' |\n';
    md += '| ' + table[0].map(() => '---').join(' | ') + ' |\n';
    // データ
    for (let r = 1; r < table.length; r++) {
      md += '| ' + table[r].join(' | ') + ' |\n';
    }
  }
  return md || '（項目定義なし）';
}

export const MockupSection: React.FC<MockupSectionProps> = ({
  mockupImage,
  onImageUpload,
  conditionsMarkdown = "",
  spreadsheetData = [],
}) => {
  // AI生成HTML+CSS
  const [aiHtml, setAiHtml] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // LocalStorageから初期値読込
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) setAiHtml(saved);
  }, []);

  // LocalStorageへ保存
  useEffect(() => {
    if (aiHtml) {
      localStorage.setItem(LOCAL_STORAGE_KEY, aiHtml);
    }
  }, [aiHtml]);

  // AIで画面イメージ（HTML+CSS）生成
  const handleGenerateAiMockup = useCallback(async () => {
    setIsGenerating(true);
    try {
      // 項目定義をMarkdownテーブルに変換
      const tableMarkdown = spreadsheetToMarkdownTable(spreadsheetData);

      // プロンプトを要件・項目定義から動的生成
      const prompt = `
以下の要件（Markdown）と項目定義（Markdownテーブル）に基づいて、シンプルなHTML+CSSの画面イメージを生成してください。
# 要件
${conditionsMarkdown || "（要件なし）"}

# 項目定義
${tableMarkdown}
      `;
      const context = {
        conditionsMarkdown,
        supplementMarkdown: "",
        spreadsheetData,
        mockupImage: null,
        mermaidCode: ""
      };
      const html = await aiService.generateChatResponse(prompt, context);
      setAiHtml(html);
    } catch (e) {
      // エラー時はダミーHTML
      const dummyHtml = `
        <style>
          .ai-mockup-container { font-family: sans-serif; background: #f9fafb; padding: 24px; border-radius: 12px; }
          .ai-mockup-title { font-size: 1.5rem; font-weight: bold; margin-bottom: 16px; }
          .ai-mockup-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          .ai-mockup-table th, .ai-mockup-table td { border: 1px solid #d1d5db; padding: 8px; }
          .ai-mockup-button { background: #2563eb; color: #fff; border: none; border-radius: 6px; padding: 8px 16px; font-size: 1rem; cursor: pointer; }
          .ai-mockup-input { border: 1px solid #d1d5db; border-radius: 4px; padding: 6px 10px; }
        </style>
        <div class="ai-mockup-container">
          <div class="ai-mockup-title">ユーザー管理画面</div>
          <table class="ai-mockup-table">
            <thead>
              <tr><th>ID</th><th>名前</th><th>メール</th><th>操作</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>山田太郎</td>
                <td>taro@example.com</td>
                <td><button class="ai-mockup-button">編集</button></td>
              </tr>
              <tr>
                <td>2</td>
                <td>鈴木花子</td>
                <td>hanako@example.com</td>
                <td><button class="ai-mockup-button">編集</button></td>
              </tr>
            </tbody>
          </table>
          <input class="ai-mockup-input" placeholder="新規ユーザー名" />
          <button class="ai-mockup-button" style="margin-left:8px;">追加</button>
        </div>
      `;
      setAiHtml(dummyHtml);
    }
    setIsGenerating(false);
  }, [conditionsMarkdown, spreadsheetData]);

  return (
    <MarkdownSection title="画面イメージ" icon={Image}>
      <div className="space-y-2">
        {/* コントロールボタンエリア - コンパクトに並列配置 */}
        <div className="flex items-center space-x-3">
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
            id="mockup-upload"
          />
          <label
            htmlFor="mockup-upload"
            className="flex items-center px-3 py-2 bg-gray-200 text-gray-800 border border-gray-400 rounded-lg cursor-pointer hover:bg-gray-300 transition-colors font-bold shadow-sm text-sm"
            style={{ backgroundColor: '#e5e7eb', color: '#1f2937', fontWeight: 'bold' }}
          >
            <Upload className="w-4 h-4 mr-2" />
            画像をアップロード
          </label>
          
          <button
            type="button"
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-sm hover:bg-blue-700 transition-colors text-sm"
            onClick={handleGenerateAiMockup}
            disabled={isGenerating}
          >
            <Bot className="w-4 h-4 mr-2" />
            {isGenerating ? '生成中...' : 'AIで画面イメージ生成'}
          </button>
          
          <span className="text-xs text-gray-500">PNG,JPG,GIF対応 | HTML+CSS自動生成</span>
        </div>

        {/* 1. 画像アップロード表示エリア（順序修正）*/}
        {mockupImage ? (
          <div className="border rounded-lg overflow-hidden">
            <img 
              src={mockupImage} 
              alt="画面モックアップ" 
              className="w-full h-auto max-h-80 object-contain"
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Image className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">画面モックアップ画像をアップロード</p>
          </div>
        )}

        {/* 2. AI生成プレビュー領域（順序修正）*/}
        {aiHtml && (
          <div className="border rounded-lg overflow-hidden">
            <div
              style={{ minHeight: 150, background: '#fff' }}
              dangerouslySetInnerHTML={{ __html: aiHtml }}
              data-testid="ai-mockup-preview"
            />
            <div className="text-xs text-gray-400 px-2 py-1 bg-gray-50 border-t">
              AI生成HTML+CSS
            </div>
          </div>
        )}
      </div>
    </MarkdownSection>
  );
};
