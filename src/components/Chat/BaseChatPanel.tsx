// src/components/Chat/BaseChatPanel.tsx
// チャットパネルの共通基盤コンポーネント（UI・メッセージ処理）

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { checkAPIKey } from '../../services/aiService';
import type { ModificationProposal } from '../../types/aiTypes';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  proposal?: ModificationProposal;
  type?: 'normal' | 'proposal' | 'applied' | 'rejected';
}

interface BaseChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  suggestedQuestions: string[];
  onQuestionClick: (question: string) => Promise<void>;
  chatTitle?: string;
  chatColor?: string;
  children?: React.ReactNode; // 修正提案ボタンなど、特化機能用
}

export const BaseChatPanel: React.FC<BaseChatPanelProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isLoading,
  suggestedQuestions,
  onQuestionClick,
  chatTitle = 'AI設計アシスタント',
  chatColor = '#3b82f6',
  children
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // APIキーの存在確認
  const hasAPIKey = checkAPIKey();

  // メッセージが追加されたら自動で下にスクロール
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageText = inputMessage;
    setInputMessage('');
    
    await onSendMessage(messageText);
  };

  const handleQuestionClick = async (question: string) => {
    if (isLoading) return;
    await onQuestionClick(question);
  };

  return (
    <>
      {/* CSS アニメーション */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div 
        style={{
        position: 'fixed',
        bottom: '80px', // ボタンの上に配置
        right: '20px',
        width: '525px',
        height: '1000px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(100%) scale(0.95)',
        opacity: isOpen ? 1 : 0,
        transition: 'all 0.3s ease-in-out',
        pointerEvents: isOpen ? 'auto' : 'none'
      }}
    >
      {/* ヘッダー */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f8fafc',
        borderRadius: '12px 12px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasAPIKey ? (
            <Sparkles className="h-4 w-4 text-purple-600" />
          ) : (
            <MessageCircle className="h-4 w-4 text-blue-600" />
          )}
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            {hasAPIKey ? chatTitle : '設計アシスタント'}
          </h3>
          {hasAPIKey && (
            <span style={{ 
              fontSize: '10px', 
              backgroundColor: '#dcfce7', 
              color: '#166534', 
              padding: '2px 6px', 
              borderRadius: '4px',
              fontWeight: '500'
            }}>
              AI
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '4px',
            backgroundColor: 'transparent',
            fontWeight: 'bold'
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* メッセージエリア */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                message.isUser
                  ? 'bg-blue-600 text-white'
                  : message.type === 'proposal'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : message.type === 'applied'
                  ? 'bg-green-50 text-green-900 border border-green-200'
                  : message.type === 'rejected'
                  ? 'bg-red-50 text-red-900 border border-red-200'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              
              {/* 特化機能エリア（修正提案ボタンなど） */}
              {children && React.isValidElement(children) && 
                React.cloneElement(children, { message } as any)}
              
              <div
                className={`text-xs mt-1 ${
                  message.isUser ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
        {/* スクロール用の要素 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 定型質問ボタンエリア */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #f3f4f6',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ 
          fontSize: '12px', 
          color: '#6b7280', 
          marginBottom: '8px',
          fontWeight: '500'
        }}>
          💡 よく使われる質問
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px'
        }}>
          {suggestedQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleQuestionClick(question)}
              disabled={isLoading}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '6px 12px',
                fontSize: '12px',
                color: '#374151',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                opacity: isLoading ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.borderColor = chatColor;
                  e.currentTarget.style.color = chatColor;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.color = '#374151';
                }
              }}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* 入力エリア */}
      <div style={{
        borderTop: '1px solid #e5e7eb',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="メッセージを入力してください... (Shift+Enterで改行)"
            disabled={isLoading}
            style={{
              flex: 1,
              resize: 'none',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              opacity: isLoading ? 0.5 : 1
            }}
            rows={4}
            onFocus={(e) => {
              if (!isLoading) {
                e.target.style.borderColor = chatColor;
              }
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            style={{
              backgroundColor: (inputMessage.trim() && !isLoading) ? chatColor : '#d1d5db',
              color: '#ffffff',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              cursor: (inputMessage.trim() && !isLoading) ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
          >
            {isLoading ? (
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};