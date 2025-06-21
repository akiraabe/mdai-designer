// src/components/Chat/MentionSuggestions.tsx
// @メンション候補ポップアップコンポーネント

import React, { useEffect, useRef } from 'react';
import type { DocumentReference } from '../../services/documentReferenceService';

interface MentionSuggestionsProps {
  suggestions: DocumentReference[];
  isVisible: boolean;
  selectedIndex: number;
  onSelect: (suggestion: DocumentReference) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({
  suggestions,
  isVisible,
  selectedIndex,
  onSelect,
  onClose,
  position
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderCount = useRef(0); // useRefを最初に移動

  // デバッグログ
  console.log('🎯 MentionSuggestions: レンダリング', {
    isVisible,
    suggestionsCount: suggestions.length,
    selectedIndex,
    position,
    suggestions: suggestions.map(s => ({ name: s.name, type: s.type }))
  });

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  // 選択中の項目をスクロールして表示
  useEffect(() => {
    if (isVisible && selectedIndex >= 0) {
      const selectedElement = containerRef.current?.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isVisible]);

  if (!isVisible || suggestions.length === 0) {
    console.log('🎯 MentionSuggestions: 非表示', { isVisible, suggestionsCount: suggestions.length });
    return null;
  }

  console.log('🎯 MentionSuggestions: 表示決定！', { position, suggestionsCount: suggestions.length });

  // ドキュメントタイプ別の色設定
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'model':
        return '#d97706'; // オレンジ
      case 'screen':
        return '#2563eb'; // 青
      case 'api':
        return '#059669'; // 緑
      case 'database':
        return '#7c3aed'; // 紫
      default:
        return '#6b7280'; // グレー
    }
  };

  // ドキュメントタイプの表示名
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'model':
        return 'データモデル';
      case 'screen':
        return '画面設計';
      case 'api':
        return 'API設計';
      case 'database':
        return 'DB設計';
      default:
        return type;
    }
  };

  // 最終的な位置ログ
  console.log('🎯 MentionSuggestions: レンダリング', {
    isVisible,
    suggestionsCount: suggestions.length,
    selectedIndex,
    position,
    suggestions: suggestions.map(s => ({ name: s.name, type: s.type }))
  });
  
  // レンダリング回数をカウント
  renderCount.current += 1;
  
  // ループテスト：Alertを一時削除
  console.log(`🎯 MentionSuggestions レンダリング #${renderCount.current}`, {
    isVisible,
    suggestionsCount: suggestions.length,
    selectedIndex,
    position
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        backgroundColor: 'white', // 白背景
        border: '1px solid #e5e7eb', // グレーの細枠
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', // 自然な影
        zIndex: 1000, // 適切なz-index
        maxHeight: '200px',
        overflowY: 'auto',
        minWidth: '300px',
        maxWidth: '400px'
      }}
    >
      {/* ヘッダー */}
      <div style={{
        padding: '8px 12px',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        fontSize: '12px',
        fontWeight: '600',
        color: '#6b7280'
      }}>
        📋 参照可能な設計書 ({suggestions.length}件)
      </div>

      {/* 候補リスト */}
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.id}
          onClick={() => onSelect(suggestion)}
          style={{
            padding: '10px 12px',
            cursor: 'pointer',
            borderBottom: index < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
            backgroundColor: index === selectedIndex ? '#f3f4f6' : 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.1s ease'
          }}
          onMouseEnter={(e) => {
            if (index !== selectedIndex) {
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }
          }}
          onMouseLeave={(e) => {
            if (index !== selectedIndex) {
              e.currentTarget.style.backgroundColor = 'white';
            }
          }}
        >
          {/* ドキュメントアイコン */}
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            backgroundColor: getTypeColor(suggestion.type),
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '600',
            flexShrink: 0
          }}>
            {suggestion.type === 'model' && '🗄️'}
            {suggestion.type === 'screen' && '🖥️'}
            {suggestion.type === 'api' && '🔌'}
            {suggestion.type === 'database' && '🗃️'}
          </div>

          {/* ドキュメント情報 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#111827',
              marginBottom: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {suggestion.name}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280'
            }}>
              {getTypeLabel(suggestion.type)}設計書
            </div>
          </div>

          {/* 選択インジケーター */}
          {index === selectedIndex && (
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#2563eb',
              flexShrink: 0
            }} />
          )}
        </div>
      ))}

      {/* フッター */}
      <div style={{
        padding: '6px 12px',
        backgroundColor: '#f9fafb',
        borderTop: '1px solid #e5e7eb',
        fontSize: '11px',
        color: '#6b7280',
        textAlign: 'center'
      }}>
        ↑↓で選択、Enterで確定、Escでキャンセル
      </div>
    </div>
  );
};