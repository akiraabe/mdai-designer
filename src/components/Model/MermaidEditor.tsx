// src/components/Model/MermaidEditor.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { Eye, Code, Split } from 'lucide-react';

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
  const [displayMode, setDisplayMode] = useState<'split' | 'preview-only' | 'editor-only'>('split');
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
    if (displayMode !== 'editor-only') {
      const timer = setTimeout(renderDiagram, 500); // デバウンス
      return () => clearTimeout(timer);
    }
  }, [value, displayMode, renderDiagram]);

  // 初回レンダリング
  useEffect(() => {
    if (displayMode !== 'editor-only') {
      renderDiagram();
    }
  }, [displayMode, renderDiagram]);

  // サンプルコードの挿入
  const insertSample = useCallback(() => {
    // 既存データがある場合は確認ダイアログを表示
    if (value.trim().length > 0) {
      const confirmed = window.confirm(
        '⚠️ サンプルデータで上書きしますか？\n\n' +
        '現在のMermaidコードが削除され、サンプルのER図に置き換わります。\n' +
        'この操作は元に戻せません。'
      );
      
      if (!confirmed) {
        return; // キャンセルされた場合は何もしない
      }
    }
    
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
  }, [value, onChange]);

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
            onClick={() => {
              // 3モード循環: split → preview-only → editor-only → split
              setDisplayMode(
                displayMode === 'split' ? 'preview-only' :
                displayMode === 'preview-only' ? 'editor-only' : 'split'
              );
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: 
                displayMode === 'split' ? '#3b82f6' :
                displayMode === 'preview-only' ? '#059669' : '#6b7280',
              color: 'white',
              border: '1px solid ' + (
                displayMode === 'split' ? '#3b82f6' :
                displayMode === 'preview-only' ? '#059669' : '#6b7280'
              ),
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {displayMode === 'split' ? <Split size={14} /> :
             displayMode === 'preview-only' ? <Eye size={14} /> : <Code size={14} />}
            {displayMode === 'split' ? '分割表示' :
             displayMode === 'preview-only' ? 'プレビューのみ' : 'エディターのみ'}
          </button>
        </div>
      </div>

      {/* エディター＋プレビューエリア */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 
          displayMode === 'split' ? '1fr 1fr' :
          displayMode === 'preview-only' ? '1fr' :
          displayMode === 'editor-only' ? '1fr' : '1fr',
        height: `${height}px`
      }}>
        {/* テキストエディター */}
        {displayMode !== 'preview-only' && (
          <div style={{
            borderRight: displayMode === 'split' ? '1px solid #e5e7eb' : 'none'
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
        {displayMode !== 'editor-only' && (
          <div style={{
            padding: '16px',
            overflow: 'auto',
            backgroundColor: 'white'
          }}>
            <style>
              {`
                /* 🎯 シンプル解決：全ての色を白で統一 */
                .mermaid-preview * {
                  background-color: white !important;
                  background: white !important;
                  fill: white !important;
                }
                .mermaid-preview table {
                  border: 1px solid #e5e7eb !important;
                }
                .mermaid-preview table td,
                .mermaid-preview table th {
                  border: 1px solid #e5e7eb !important;
                  background-color: white !important;
                  color: #374151 !important;
                }
                .mermaid-preview text {
                  fill: #374151 !important;
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