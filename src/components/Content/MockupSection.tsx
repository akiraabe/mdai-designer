// src/components/Content/MockupSection.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Image, Bot, X, Camera } from 'lucide-react';
import { MarkdownSection } from '../Common/MarkdownSection';
import { aiService } from '../../services/aiService';
import { convertAiMockupToImage } from '../../utils/htmlToImage';

interface MockupSectionProps {
  mockupImage: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageDelete?: () => void;
  conditionsMarkdown?: string;
  spreadsheetData?: any[];
  aiGeneratedImage?: string | null; // AI生成画像（新規追加）
  onAiImageGenerated?: (imageBase64: string) => void; // AI画像生成時のコールバック
  documentId?: string; // 設計書ID（新規追加）
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
  onImageDelete,
  conditionsMarkdown = "",
  spreadsheetData = [],
  aiGeneratedImage,
  onAiImageGenerated,
  documentId,
}) => {
  // AI生成HTML+CSS
  const [aiHtml, setAiHtml] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // 設計書別のLocalStorageキー
  const storageKey = documentId ? `ai-mockup-html-${documentId}` : LOCAL_STORAGE_KEY;

  // LocalStorageから初期値読込（設計書別）
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      console.log(`📥 AI HTML復元 [${documentId}]:`, saved.length, '文字');
      setAiHtml(saved);
    } else {
      console.log(`📭 AI HTML なし [${documentId}]`);
      setAiHtml(''); // 明示的にクリア
    }
  }, [storageKey, documentId]);

  // LocalStorageへ保存（設計書別）
  useEffect(() => {
    if (aiHtml) {
      console.log(`💾 AI HTML保存 [${documentId}]:`, aiHtml.length, '文字');
      localStorage.setItem(storageKey, aiHtml);
    }
  }, [aiHtml, storageKey, documentId]);

  // AIで画面イメージ（HTML+CSS）生成
  const handleGenerateAiMockup = useCallback(async () => {
    setIsGenerating(true);
    try {
      // 項目定義をMarkdownテーブルに変換
      const tableMarkdown = spreadsheetToMarkdownTable(spreadsheetData);

      // プロンプトを要件・項目定義から動的生成
      const prompt = `
以下の要件（Markdown）と項目定義（Markdownテーブル）に基づいて、シンプルなHTML+CSSの画面イメージを生成してください。

【重要な制約】
- 外部画像URL（via.placeholder.com等）は絶対に使用しないでください
- 画像が必要な場合はCSS Gradient、SVG、Unicode文字（絵文字）、背景色のみを使用してください
- インターネット接続が不要で完全にスタンドアロンで動作するHTMLにしてください

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

  // AI生成HTMLを画像として変換
  const handleCaptureAsImage = useCallback(async () => {
    console.log('🔍 画像変換デバッグ開始');
    console.log('🔍 aiHtml exists:', !!aiHtml);
    console.log('🔍 aiHtml length:', aiHtml?.length || 0);
    console.log('🔍 onAiImageGenerated exists:', !!onAiImageGenerated);
    
    if (!aiHtml || !aiHtml.trim()) {
      alert('⚠️ 画像に変換するAI生成コンテンツがありません。\n\n手順:\n1. 先に「AIで画面イメージ生成」ボタンをクリック\n2. HTML+CSSが生成されるのを待つ\n3. その後「画像として保存」ボタンをクリック');
      return;
    }

    console.log('🖼️ AI生成HTML→画像変換開始');
    console.log('📝 変換対象HTMLサイズ:', aiHtml.length, 'characters');
    console.log('📝 HTML内容プレビュー:', aiHtml.substring(0, 200) + '...');
    
    setIsCapturing(true);
    
    try {
      console.log('📞 convertAiMockupToImage関数を呼び出し中...');
      const imageBase64 = await convertAiMockupToImage(aiHtml);
      
      console.log('✅ AI生成画像の作成完了');
      console.log('📊 画像データサイズ:', imageBase64?.length || 0, 'characters');
      
      if (!imageBase64) {
        throw new Error('画像変換結果がnullまたは空です');
      }
      
      console.log('🔍 画像データプレビュー:', imageBase64.substring(0, 100) + '...');
      
      // 親コンポーネントに画像データを通知
      if (onAiImageGenerated) {
        console.log('📤 親コンポーネントに画像データを送信中...');
        onAiImageGenerated(imageBase64);
        console.log('✅ 親コンポーネントへの送信完了');
      } else {
        console.error('❌ onAiImageGenerated関数が存在しません');
      }
      
      // 成功メッセージを詳細化
      alert(`✅ AI生成画面を画像として保存しました！\n\n詳細:\n- 画像サイズ: ${Math.round(imageBase64.length / 1024)}KB\n- HTML要素数: 推定${(aiHtml.match(/<[^/][^>]*>/g) || []).length}個\n\n下記に緑枠のプレビューが表示されます。\nMarkdownエクスポート時に自動的に含まれます。`);
      
    } catch (error) {
      console.error('❌ 画像変換エラー:', error);
      console.error('❌ エラー詳細:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        aiHtmlLength: aiHtml?.length || 0,
        aiHtmlPreview: aiHtml?.substring(0, 100) || 'empty'
      });
      
      // 詳細なエラーメッセージ
      let errorMessage = 'エラー詳細:\n';
      if (error instanceof Error) {
        errorMessage += `種類: ${error.name}\n`;
        errorMessage += `メッセージ: ${error.message}\n`;
        if (error.message.includes('html2canvas')) {
          errorMessage += '\n💡 対処法:\n';
          errorMessage += '- ブラウザを再読み込みしてください\n';
          errorMessage += '- 別のブラウザで試してください\n';
          errorMessage += '- HTML内容を簡素化してください';
        }
      } else {
        errorMessage += `不明なエラー: ${String(error)}`;
      }
      
      alert(`❌ 画像変換に失敗しました。\n\n${errorMessage}\n\n🔍 ブラウザのコンソール（F12）で詳細を確認してください。`);
    } finally {
      setIsCapturing(false);
      console.log('🔄 画像変換処理完了');
    }
  }, [aiHtml, onAiImageGenerated]);

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

          {aiHtml && (
            <button
              type="button"
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg font-bold shadow-sm hover:bg-green-700 transition-colors text-sm"
              onClick={handleCaptureAsImage}
              disabled={isCapturing}
            >
              <Camera className="w-4 h-4 mr-2" />
              {isCapturing ? '変換中...' : '画像として保存'}
            </button>
          )}
          
          {/* テスト用：簡単なHTMLで変換テスト */}
          <button
            type="button"
            className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg font-bold shadow-sm hover:bg-purple-700 transition-colors text-sm"
            onClick={() => {
              const testHtml = `
                <div style="font-family: Arial, sans-serif; padding: 20px; background: #f0f9ff; border-radius: 8px;">
                  <h1 style="color: #1e40af; margin-bottom: 16px;">🧪 テスト画面</h1>
                  <p style="color: #374151; margin-bottom: 12px;">これは画像変換のテスト用HTMLです。</p>
                  <div style="background: #3b82f6; color: white; padding: 10px; border-radius: 4px; text-align: center;">
                    画像変換テスト成功！
                  </div>
                </div>
              `;
              setAiHtml(testHtml);
            }}
          >
            🧪 テスト用HTML
          </button>
          
          <span className="text-xs text-gray-500">PNG,JPG,GIF対応 | HTML+CSS自動生成 | 画像変換</span>
        </div>

        {/* 1. 画像アップロード表示エリア（順序修正）*/}
        {mockupImage ? (
          <div className="space-y-2">
            {/* 画像表示 */}
            <div className="border rounded-lg overflow-hidden">
              <img 
                src={mockupImage} 
                alt="画面モックアップ" 
                className="w-full h-auto max-h-80 object-contain"
              />
            </div>
            {/* 削除ボタン - 普通のスタイル */}
            {onImageDelete && (
              <div style={{ 
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '8px'
              }}>
                <button
                  onClick={onImageDelete}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                  title="画像を削除"
                >
                  <X style={{ width: '14px', height: '14px' }} />
                  画像削除
                </button>
              </div>
            )}
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

        {/* 3. AI生成画像プレビュー領域 */}
        {aiGeneratedImage && (
          <div className="border-2 border-green-300 rounded-lg overflow-hidden shadow-lg">
            <div className="p-3 bg-green-100 border-b-2 border-green-300">
              <div className="text-lg font-bold text-green-800">📸 変換完了！AI生成画像</div>
              <div className="text-sm text-green-700 mt-1">
                ✅ 画像変換が成功しました。この画像がMarkdownエクスポートに含まれます。
              </div>
              <div className="text-xs text-green-600 mt-1">
                画像サイズ: {Math.round(aiGeneratedImage.length / 1024)}KB | 
                サイズ: 1000x1200px
              </div>
            </div>
            <div className="bg-white p-4">
              <div className="text-center mb-2">
                <span className="text-sm font-medium text-gray-700">🖼️ 変換結果プレビュー</span>
              </div>
              <img 
                src={`data:image/png;base64,${aiGeneratedImage}`}
                alt="AI生成画面イメージ（変換結果）" 
                className="w-full h-auto max-h-96 object-contain border-2 border-gray-300 rounded shadow-sm"
                style={{ backgroundColor: '#f9fafb' }}
                onLoad={() => console.log('✅ AI生成画像の表示が完了しました')}
                onError={(e) => {
                  console.error('❌ AI生成画像の表示に失敗:', e);
                  console.error('❌ 画像データ長:', aiGeneratedImage.length);
                  console.error('❌ 画像データ先頭:', aiGeneratedImage.substring(0, 100));
                }}
              />
              <div className="text-center mt-2">
                <button
                  onClick={() => {
                    // 画像を新しいタブで開く（デバッグ用）
                    const newWindow = window.open();
                    if (newWindow) {
                      newWindow.document.write(`
                        <html>
                          <body style="margin:0;background:#f0f0f0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                            <img src="data:image/png;base64,${aiGeneratedImage}" style="max-width:100%;max-height:100%;border:1px solid #ccc;" />
                          </body>
                        </html>
                      `);
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  🔍 新しいタブで画像を開く（確認用）
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MarkdownSection>
  );
};
