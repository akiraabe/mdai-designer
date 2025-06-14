// src/components/Common/ChatPanel.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'こんにちは！設計書作成のお手伝いをします。何かご質問はありますか？',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // メッセージが追加されたら自動で下にスクロール
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ダミー応答機能
  const getDummyResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('こんにちは') || lowerMessage.includes('はじめまして')) {
      return 'こんにちは！設計書システムへようこそ。どのような作業をお手伝いしましょうか？';
    }
    
    if (lowerMessage.includes('ヘルプ') || lowerMessage.includes('使い方')) {
      return `このシステムの主な機能をご紹介します：

1. **表示条件**: Markdown形式で条件を記述できます
2. **画面イメージ**: モックアップ画像をアップロードできます  
3. **項目定義**: スプレッドシート形式で項目を管理できます
4. **補足説明**: 追加情報をMarkdown形式で記述できます

各タブで個別編集、または「全体表示」で一覧できます。`;
    }
    
    if (lowerMessage.includes('保存') || lowerMessage.includes('セーブ')) {
      return '設計書の保存は右上の「保存」ボタンから行えます。JSON形式でローカルにダウンロードされます。保存したファイルは「読み込み」ボタンで復元できます。';
    }
    
    if (lowerMessage.includes('スプレッドシート') || lowerMessage.includes('表')) {
      return 'スプレッドシート機能について：\n\n• Excelからのコピー&ペーストが可能です\n• セル結合、書式設定もサポートしています\n• 日本語入力時のIME問題も解決済みです\n• 「テストデータ」ボタンでサンプルデータを読み込めます';
    }
    
    if (lowerMessage.includes('エラー') || lowerMessage.includes('問題')) {
      return '問題が発生している場合は以下をお試しください：\n\n1. ページをリロードしてみてください\n2. ブラウザのキャッシュをクリアしてください\n3. 読み込みが失敗した場合は、テストデータを読み込んでから再試行してください';
    }
    
    // デフォルト応答
    return `「${userMessage}」について承知いたしました。設計書作成に関するご質問でしたら、具体的にお聞かせください。

よくある質問：
• 使い方やヘルプについて
• 保存・読み込み方法について  
• スプレッドシート機能について
• エラーや問題の解決方法について`;
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // ユーザーメッセージを追加
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // ダミー応答を生成（少し遅延させて自然さを演出）
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: getDummyResponse(inputMessage),
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 500);

    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
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
          <MessageCircle className="h-4 w-4 text-blue-600" />
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            設計アシスタント
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '4px'
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
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
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
            style={{
              flex: 1,
              resize: 'none',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            rows={4}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            style={{
              backgroundColor: inputMessage.trim() ? '#3b82f6' : '#d1d5db',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};