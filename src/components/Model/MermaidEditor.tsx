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
  const [viewMode, setViewMode] = useState<'split' | 'preview-only'>('split');
  const [error, setError] = useState<string | null>(null);
  const [height, setHeight] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const diagramId = useRef(`mermaid-${Date.now()}`);
  const containerRef = useRef<HTMLDivElement>(null);

  // リサイズ機能
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const newHeight = e.clientY - rect.top - 48; // ツールバーの高さを引いた値
    
    // 最小/最大値を制限
    const constrainedHeight = Math.max(300, Math.min(800, newHeight));
    setHeight(constrainedHeight);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
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
    <div
      ref={containerRef}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'white',
        position: 'relative'
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
            onClick={() => setViewMode(viewMode === 'split' ? 'preview-only' : 'split')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: viewMode === 'preview-only' ? '#059669' : '#f3f4f6',
              color: viewMode === 'preview-only' ? 'white' : '#374151',
              border: '1px solid ' + (viewMode === 'preview-only' ? '#059669' : '#d1d5db'),
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {viewMode === 'preview-only' ? <Eye size={14} /> : <Code size={14} />}
            {viewMode === 'preview-only' ? 'プレビューのみ' : 'エディター表示'}
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
        gridTemplateColumns: 
          viewMode === 'preview-only' && showPreview ? '1fr' :
          showPreview ? '1fr 1fr' : '1fr',
        height: `${height}px`
      }}>
        {/* テキストエディター */}
        {viewMode !== 'preview-only' && (
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
        )}

        {/* プレビューエリア */}
        {showPreview && (
          <div style={{
            padding: '16px',
            overflow: 'auto',
            backgroundColor: 'white'
          }}>
            <style>
              {`
                /* Mermaidテーブルの交互行の色を落ち着いた色調に変更 */
                .mermaid-preview table tr:nth-child(even) {
                  background-color: #f8fafc !important;
                }
                .mermaid-preview table tr:nth-child(odd) {
                  background-color: #ffffff !important;
                }
                
                /* ⭐ 新規追加：テーブルセル直接指定 */
                .mermaid-preview table td {
                  background-color: inherit !important;
                  background: inherit !important;
                }
                .mermaid-preview table tr:nth-child(even) td {
                  background-color: #f8fafc !important;
                  background: #f8fafc !important;
                }
                .mermaid-preview table tr:nth-child(odd) td {
                  background-color: #ffffff !important;
                  background: #ffffff !important;
                }
                
                /* ⭐ 新規追加：Mermaidの動的生成要素対応 */
                .mermaid-preview [fill*="#"] {
                  fill: #f1f5f9 !important;
                }
                .mermaid-preview [style*="background"] {
                  background-color: #f8fafc !important;
                }
                
                /* ⭐ 新規追加：Mermaid内部クラス名対応 */
                .mermaid-preview .er .entityBox {
                  fill: #f1f5f9 !important;
                }
                .mermaid-preview .er .entity .label {
                  background-color: #f8fafc !important;
                }
                .mermaid-preview .er .attribute {
                  background-color: inherit !important;
                }
                
                /* ⭐ 青色系の色を全て上書き */
                .mermaid-preview [fill="#dbeafe"],
                .mermaid-preview [fill="#bfdbfe"],
                .mermaid-preview [fill="#93c5fd"],
                .mermaid-preview [fill="#60a5fa"] {
                  fill: #f1f5f9 !important;
                }
                .mermaid-preview [style*="#dbeafe"],
                .mermaid-preview [style*="#bfdbfe"],
                .mermaid-preview [style*="#93c5fd"],
                .mermaid-preview [style*="#60a5fa"] {
                  background-color: #f8fafc !important;
                }
              `}
            </style>
            <div
              ref={previewRef}
              className="mermaid-preview"
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

      {/* リサイズハンドル */}
      <div
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
  );
};