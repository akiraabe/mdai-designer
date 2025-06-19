// src/components/Model/MermaidEditor.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { Eye, EyeOff, Code } from 'lucide-react';

interface MermaidEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Mermaidの初期化
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  themeVariables: {
    primaryColor: '#3b82f6',
    primaryTextColor: '#1f2937',
    primaryBorderColor: '#e5e7eb',
    lineColor: '#6b7280',
    secondaryColor: '#f3f4f6',
    tertiaryColor: '#ffffff'
  },
  er: {
    fontSize: 12,
    useMaxWidth: true
  }
});

export const MermaidEditor: React.FC<MermaidEditorProps> = ({
  value,
  onChange,
  placeholder = 'Mermaid記法でER図を記述してください...'
}) => {
  const [showPreview, setShowPreview] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const diagramId = useRef(`mermaid-${Date.now()}`);

  // Mermaid図表の描画
  const renderDiagram = useCallback(async () => {
    if (!previewRef.current || !value.trim()) {
      if (previewRef.current) {
        previewRef.current.innerHTML = `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 200px;
            color: #6b7280;
            background-color: #f9fafb;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            text-align: center;
          ">
            <div style="font-size: 32px; margin-bottom: 8px;">📚</div>
            <p style="margin: 0; font-size: 14px;">
              Mermaid記法でER図を記述すると<br />
              ここにプレビューが表示されます
            </p>
          </div>
        `;
      }
      setError(null);
      return;
    }

    try {
      // 新しいIDを生成
      const newId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      diagramId.current = newId;

      // Mermaidの構文チェック
      if (!value.includes('erDiagram')) {
        setError('ER図を描画するには "erDiagram" で始まる必要があります');
        return;
      }

      // 図表を描画
      const { svg } = await mermaid.render(newId, value);
      
      if (previewRef.current) {
        previewRef.current.innerHTML = svg;
        setError(null);
      }
    } catch (err) {
      console.error('Mermaid rendering error:', err);
      setError(err instanceof Error ? err.message : 'Mermaid構文エラーが発生しました');
      
      if (previewRef.current) {
        previewRef.current.innerHTML = `
          <div style="
            padding: 16px;
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            color: #dc2626;
          ">
            <p style="margin: 0; font-size: 14px; font-weight: 500;">
              ⚠️ 構文エラー
            </p>
            <p style="margin: 8px 0 0 0; font-size: 12px;">
              ${err instanceof Error ? err.message : 'Mermaid構文エラーが発生しました'}
            </p>
          </div>
        `;
      }
    }
  }, [value]);

  // 値が変更されたときに図表を再描画
  useEffect(() => {
    if (showPreview) {
      const timer = setTimeout(renderDiagram, 500); // デバウンス
      return () => clearTimeout(timer);
    }
  }, [value, showPreview, renderDiagram]);

  // 初回レンダリング
  useEffect(() => {
    if (showPreview) {
      renderDiagram();
    }
  }, [showPreview, renderDiagram]);

  // サンプルコードの挿入
  const insertSample = useCallback(() => {
    const sampleCode = `erDiagram
    User {
        int id PK
        string name
        string email
        datetime created_at
    }
    
    Order {
        int id PK
        int user_id FK
        decimal amount
        datetime order_date
    }
    
    OrderItem {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal price
    }
    
    Product {
        int id PK
        string name
        text description
        decimal price
        int stock
    }
    
    User ||--o{ Order : "has many"
    Order ||--o{ OrderItem : "contains"
    Product ||--o{ OrderItem : "in"`;
    
    onChange(sampleCode);
  }, [onChange]);

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: 'white'
    }}>
      {/* ツールバー */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Code size={16} color="#6b7280" />
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151'
          }}>
            Mermaid ER図エディター
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <button
            onClick={insertSample}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            サンプル挿入
          </button>
          
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: showPreview ? '#3b82f6' : '#f3f4f6',
              color: showPreview ? 'white' : '#374151',
              border: '1px solid ' + (showPreview ? '#3b82f6' : '#d1d5db'),
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showPreview ? <Eye size={14} /> : <EyeOff size={14} />}
            {showPreview ? 'プレビュー表示中' : 'プレビュー非表示'}
          </button>
        </div>
      </div>

      {/* エディター＋プレビューエリア */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr',
        height: '500px'
      }}>
        {/* テキストエディター */}
        <div style={{
          borderRight: showPreview ? '1px solid #e5e7eb' : 'none'
        }}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              height: '100%',
              padding: '16px',
              border: 'none',
              outline: 'none',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: '13px',
              lineHeight: '1.5',
              resize: 'none',
              backgroundColor: '#fafafa'
            }}
          />
        </div>

        {/* プレビューエリア */}
        {showPreview && (
          <div style={{
            padding: '16px',
            overflow: 'auto',
            backgroundColor: 'white'
          }}>
            <div
              ref={previewRef}
              style={{
                minHeight: '200px',
                textAlign: 'center'
              }}
            />
            {error && (
              <div style={{
                marginTop: '12px',
                padding: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#dc2626'
              }}>
                エラー: {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* フッター（ヘルプ情報） */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        fontSize: '11px',
        color: '#6b7280'
      }}>
        💡 <strong>Mermaid ER図記法:</strong> 
        エンティティ定義 → <code>EntityName &#123;&#123; field_type field_name &#125;&#125;</code> | 
        関係定義 → <code>Entity1 ||--o&#123;&#123; Entity2 : "relationship"</code> | 
        <a 
          href="https://mermaid.js.org/syntax/entityRelationshipDiagram.html" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#3b82f6', textDecoration: 'underline' }}
        >
          詳細ドキュメント
        </a>
      </div>
    </div>
  );
};