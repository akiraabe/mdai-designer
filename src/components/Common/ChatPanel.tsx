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
  // ページデータアクセス用
  conditionsMarkdown: string;
  supplementMarkdown: string;
  spreadsheetData: any[];
  mockupImage: string | null;
  // マークダウン更新機能
  onConditionsMarkdownUpdate: (markdown: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  isOpen, 
  onClose, 
  conditionsMarkdown, 
  supplementMarkdown, 
  spreadsheetData, 
  mockupImage,
  onConditionsMarkdownUpdate
}) => {
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
  
  // 定型質問ボタンの定義
  const suggestedQuestions = [
    '現在のデータは？',
    'スプレッドシートの中身',
    '表示条件を教えて',
    '/status',
    '/help',
    '/write'
  ];

  // マークダウンにチャット履歴を書き込む機能
  const writeToMarkdown = () => {
    const now = new Date();
    const timestamp = now.toLocaleString('ja-JP');
    
    // 既存のマークダウンにCopilotKitセクションを追加/更新
    let updatedMarkdown = conditionsMarkdown;
    
    // CopilotKitセクションが既に存在するかチェック
    const copilotSection = '\n\n### CopilotKitからの書き込み\n';
    const sectionExists = updatedMarkdown.includes('### CopilotKitからの書き込み');
    
    if (!sectionExists) {
      updatedMarkdown += copilotSection;
    }
    
    // 最新のチャット履歴を箇条書きで追加
    const recentMessages = messages.slice(-6); // 最新6件のメッセージ
    let chatHistory = `\n**${timestamp} のチャット履歴:**\n`;
    
    recentMessages.forEach((msg) => {
      const speaker = msg.isUser ? '👤 ユーザー' : '🤖 アシスタント';
      const content = msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '');
      chatHistory += `- **${speaker}**: ${content}\n`;
    });
    
    chatHistory += '\n---\n';
    
    // セクションの最後に新しい履歴を追加
    if (sectionExists) {
      const parts = updatedMarkdown.split('### CopilotKitからの書き込み');
      updatedMarkdown = parts[0] + '### CopilotKitからの書き込み' + parts[1] + chatHistory;
    } else {
      updatedMarkdown += chatHistory;
    }
    
    // マークダウンを更新
    onConditionsMarkdownUpdate(updatedMarkdown);
    
    return `✅ **チャット履歴を表示条件に書き込みました！**

📝 **書き込み内容:**
- 最新${recentMessages.length}件のメッセージ
- タイムスタンプ: ${timestamp}
- 書き込み先: 表示条件セクション

「表示条件」タブを確認してください。`;
  };

  // メッセージが追加されたら自動で下にスクロール
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 現在のページデータを解析する関数
  const analyzeCurrentData = () => {
    // スプレッドシートからセル数とサンプルデータを取得
    const cellCount = spreadsheetData?.[0]?.celldata?.length || 0;
    const sampleCells = spreadsheetData?.[0]?.celldata?.slice(0, 5) || [];
    const sheetName = spreadsheetData?.[0]?.name || 'シート名なし';
    
    // Markdownの内容を簡単に解析
    const conditionsLength = conditionsMarkdown?.length || 0;
    const supplementLength = supplementMarkdown?.length || 0;
    const hasImage = !!mockupImage;
    
    return {
      spreadsheet: {
        cellCount,
        sampleCells,
        sheetName,
        hasData: cellCount > 0
      },
      conditions: {
        length: conditionsLength,
        hasContent: conditionsLength > 0,
        preview: conditionsMarkdown?.substring(0, 100) || ''
      },
      supplement: {
        length: supplementLength,
        hasContent: supplementLength > 0,
        preview: supplementMarkdown?.substring(0, 100) || ''
      },
      mockup: {
        hasImage
      }
    };
  };

  // ダミー応答機能
  const getDummyResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    const currentData = analyzeCurrentData();
    
    // /helpコマンドの処理
    if (userMessage.startsWith('/help')) {
      return `🤖 **設計アシスタント ヘルプ**

**利用可能なコマンド:**
• \`/help\` - このヘルプを表示
• \`/status\` - 現在のデータ状況を表示
• \`/data\` - スプレッドシートの詳細データを表示
• \`/write\` - チャット履歴を表示条件に書き込み

**よくある質問:**
• "現在のデータは？" - 全体の状況確認
• "スプレッドシートの中身" - 項目定義の詳細
• "表示条件は？" - 表示条件の内容確認
• "もっと詳しく" - より詳細な情報表示

**使い方のコツ:**
チャット下部の質問ボタンをクリックするか、上記のコマンドを直接入力してください。`;
    }

    // /statusコマンドの処理
    if (userMessage.startsWith('/status')) {
      return `📊 **現在の設計書ステータス**

**データ入力状況:**
✅ 項目定義: ${currentData.spreadsheet.hasData ? `${currentData.spreadsheet.cellCount}セル入力済み` : '未入力'}
✅ 表示条件: ${currentData.conditions.hasContent ? `${currentData.conditions.length}文字入力済み` : '未入力'}
✅ 補足説明: ${currentData.supplement.hasContent ? `${currentData.supplement.length}文字入力済み` : '未入力'}
✅ 画面イメージ: ${currentData.mockup.hasImage ? 'アップロード済み' : '未アップロード'}

**完成度:** ${Math.round((
  (currentData.spreadsheet.hasData ? 1 : 0) +
  (currentData.conditions.hasContent ? 1 : 0) +
  (currentData.supplement.hasContent ? 1 : 0) +
  (currentData.mockup.hasImage ? 1 : 0)
) / 4 * 100)}%`;
    }

    // /dataコマンドの処理
    if (userMessage.startsWith('/data')) {
      if (currentData.spreadsheet.hasData) {
        const allCells = spreadsheetData?.[0]?.celldata || [];
        const sortedCells = allCells.sort((a: any, b: any) => {
          if (a.r !== b.r) return a.r - b.r;
          return a.c - b.c;
        });

        let detailedData = '📋 **スプレッドシート全データ:**\n\n';
        sortedCells.slice(0, 20).forEach((cell: any) => {
          const cellValue = cell.v?.v || cell.v || '';
          const cellRef = String.fromCharCode(65 + cell.c) + (cell.r + 1);
          detailedData += `${cellRef}: "${cellValue}"\n`;
        });

        if (allCells.length > 20) {
          detailedData += `\n...他${allCells.length - 20}個のセル`;
        }

        return detailedData;
      } else {
        return '❌ スプレッドシートにデータがありません。「テストデータ」ボタンでサンプルを読み込んでください。';
      }
    }

    // /writeコマンドの処理
    if (userMessage.startsWith('/write')) {
      return writeToMarkdown();
    }
    
    // 現在のデータに関する質問への対応
    if (lowerMessage.includes('現在') || lowerMessage.includes('データ') || lowerMessage.includes('内容')) {
      return `現在の設計書の状況をお伝えします：

📊 **項目定義（スプレッドシート）**
• シート名: ${currentData.spreadsheet.sheetName}
• セル数: ${currentData.spreadsheet.cellCount}個
• データ: ${currentData.spreadsheet.hasData ? '入力済み' : '未入力'}

📝 **表示条件**
• 文字数: ${currentData.conditions.length}文字
• 内容: ${currentData.conditions.hasContent ? `"${currentData.conditions.preview}..."` : '未入力'}

📋 **補足説明**  
• 文字数: ${currentData.supplement.length}文字
• 内容: ${currentData.supplement.hasContent ? `"${currentData.supplement.preview}..."` : '未入力'}

🖼️ **画面イメージ**
• モックアップ: ${currentData.mockup.hasImage ? 'アップロード済み' : '未アップロード'}

何か具体的にお聞きしたいことはありますか？`;
    }

    if (lowerMessage.includes('スプレッドシート') || lowerMessage.includes('項目定義') || lowerMessage.includes('中身') || lowerMessage.includes('詳細')) {
      if (currentData.spreadsheet.hasData) {
        // スプレッドシートの詳細データを解析
        const allCells = spreadsheetData?.[0]?.celldata || [];
        const rows: { [key: number]: { [key: number]: string } } = {};
        
        // セルデータを行列形式に整理
        allCells.forEach((cell: any) => {
          if (!rows[cell.r]) rows[cell.r] = {};
          rows[cell.r][cell.c] = cell.v?.v || cell.v || '';
        });
        
        // 表形式で表示（最初の10行まで）
        let tableData = '';
        const sortedRows = Object.keys(rows).map(Number).sort((a, b) => a - b).slice(0, 10);
        
        sortedRows.forEach(rowIndex => {
          const row = rows[rowIndex];
          const maxCol = Math.max(...Object.keys(row).map(Number));
          let rowData = '';
          for (let col = 0; col <= Math.min(maxCol, 5); col++) {
            rowData += `${row[col] || ''}`.padEnd(15, ' ') + '| ';
          }
          tableData += `行${rowIndex + 1}: ${rowData}\n`;
        });

        return `📊 項目定義スプレッドシートの詳細：

**基本情報**
• シート名: ${currentData.spreadsheet.sheetName}
• 合計セル数: ${currentData.spreadsheet.cellCount}個
• データ範囲: ${sortedRows.length}行 × ${Math.max(...sortedRows.map(r => Math.max(...Object.keys(rows[r]).map(Number))))}列

**データ内容（上位10行）**
\`\`\`
${tableData}
\`\`\`

さらに詳しく知りたい場合は「もっと詳しく」と聞いてください。`;
      } else {
        return '項目定義スプレッドシートはまだ空です。「テストデータ」ボタンでサンプルデータを読み込むか、直接入力してみてください。';
      }
    }

    if (lowerMessage.includes('もっと詳しく') || lowerMessage.includes('全部') || lowerMessage.includes('すべて')) {
      if (currentData.spreadsheet.hasData) {
        const allCells = spreadsheetData?.[0]?.celldata || [];
        let detailedData = '📋 スプレッドシート全データ：\n\n';
        
        // セル位置順にソート
        const sortedCells = allCells.sort((a: any, b: any) => {
          if (a.r !== b.r) return a.r - b.r;
          return a.c - b.c;
        });

        sortedCells.slice(0, 50).forEach((cell: any) => {
          const cellValue = cell.v?.v || cell.v || '';
          const cellRef = String.fromCharCode(65 + cell.c) + (cell.r + 1); // A1形式
          detailedData += `${cellRef}: "${cellValue}"\n`;
        });

        if (allCells.length > 50) {
          detailedData += `\n...他${allCells.length - 50}個のセル`;
        }

        return detailedData;
      } else {
        return 'スプレッドシートにデータがありません。';
      }
    }

    if (lowerMessage.includes('表示条件') || lowerMessage.includes('条件')) {
      if (currentData.conditions.hasContent) {
        return `表示条件の内容：

文字数: ${currentData.conditions.length}文字
内容（抜粋）: "${currentData.conditions.preview}..."

表示条件について具体的に知りたいことがあればお聞かせください。`;
      } else {
        return '表示条件はまだ入力されていません。「表示条件」タブでMarkdown形式で条件を記述してください。';
      }
    }
    
    if (lowerMessage.includes('こんにちは') || lowerMessage.includes('はじめまして')) {
      return 'こんにちは！設計書システムへようこそ。現在のデータを読み取って分析できます。「現在のデータは？」などと聞いてみてください。';
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

  // 質問ボタンクリック時の処理
  const handleQuestionClick = (question: string) => {
    setInputMessage(question);
    // 少し遅延してから自動送信
    setTimeout(() => {
      if (question.trim()) {
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          content: question,
          isUser: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        setTimeout(() => {
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: getDummyResponse(question),
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
        }, 500);

        setInputMessage('');
      }
    }, 100);
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
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '6px 12px',
                fontSize: '12px',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.color = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.color = '#374151';
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