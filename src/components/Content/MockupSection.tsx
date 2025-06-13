// src/components/Content/MockupSection.tsx
import React from 'react';
import { Upload, Image } from 'lucide-react';
import { MarkdownSection } from '../Common/MarkdownSection';

interface MockupSectionProps {
  mockupImage: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MockupSection: React.FC<MockupSectionProps> = ({
  mockupImage,
  onImageUpload,
}) => {
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
  );
};