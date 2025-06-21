// src/components/Content/MockupSection.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Image, Bot } from 'lucide-react';
import { MarkdownSection } from '../Common/MarkdownSection';
import { aiService } from '../../services/aiService';

interface MockupSectionProps {
  mockupImage: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const LOCAL_STORAGE_KEY = 'ai-mockup-html';

export const MockupSection: React.FC<MockupSectionProps> = ({
  mockupImage,
  onImageUpload,
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
      // プロンプト例（今後カスタマイズ可）
      const prompt = "ユーザー管理画面のHTML+CSSをシンプルに生成してください。フォームやテーブル、ボタンを含めてください。";
      // contextは空でOK（画面イメージのみ生成用途）
      const context = {
        conditionsMarkdown: "",
        supplementMarkdown: "",
        spreadsheetData: [],
        mockupImage: null,
        mermaidCode: ""
      };
      // OpenAI/BEDROCK等でAI呼び出し
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
  }, []);

  return (
    <MarkdownSection title="画面イメージ" icon={Image}>
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
            id="mockup-upload"
          />
          <label
            htmlFor="mockup-upload"
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 border border-gray-400 rounded-lg cursor-pointer hover:bg-gray-300 transition-colors font-bold shadow-md"
            style={{ backgroundColor: '#e5e7eb', color: '#1f2937', fontWeight: 'bold' }}
          >
            <Upload className="w-4 h-4 mr-2" />
            画像をアップロード
          </label>
          <span className="text-sm text-gray-500">
            PNG, JPG, GIF対応
          </span>
        </div>

        {/* AIで画面イメージ生成ボタン */}
        <div className="flex items-center space-x-4">
          <button
            type="button"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition-colors"
            onClick={handleGenerateAiMockup}
            disabled={isGenerating}
          >
            <Bot className="w-4 h-4 mr-2" />
            {isGenerating ? '生成中...' : 'AIで画面イメージ生成'}
          </button>
          <span className="text-sm text-gray-500">
            HTML+CSSで自動生成（サンプル）
          </span>
        </div>

        {/* AI生成プレビュー領域 */}
        {aiHtml && (
          <div className="border rounded-lg overflow-hidden mt-2">
            <div
              style={{ minHeight: 200, background: '#fff' }}
              dangerouslySetInnerHTML={{ __html: aiHtml }}
              data-testid="ai-mockup-preview"
            />
            <div className="text-xs text-gray-400 px-2 py-1 bg-gray-50 border-t">
              ※このプレビューはAI生成HTML+CSSをそのまま表示しています
            </div>
          </div>
        )}

        {/* 画像アップロード or プレースホルダー */}
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
  );
};
