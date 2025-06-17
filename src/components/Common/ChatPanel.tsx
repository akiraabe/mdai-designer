// src/components/Common/ChatPanel.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { generateDesignDraft, generateChatResponse, checkAPIKey } from '../../services/aiService';
import { ModificationService } from '../../services/modificationService';
import type { WebUIData, GeneratedDraft, ModificationProposal } from '../../types/aiTypes';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  proposal?: ModificationProposal; // 修正提案データ
  type?: 'normal' | 'proposal' | 'applied' | 'rejected'; // メッセージタイプ
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // ページデータアクセス用
  conditionsMarkdown: string;
  supplementMarkdown: string;
  spreadsheetData: any[];
  mockupImage: string | null;
  // データ更新機能
  onConditionsMarkdownUpdate: (markdown: string) => void;
  onSupplementMarkdownUpdate: (markdown: string) => void;
  onSpreadsheetDataUpdate: (data: any[]) => void;
  // バックアップ管理機能
  onShowBackupManager?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  isOpen, 
  onClose, 
  conditionsMarkdown, 
  supplementMarkdown, 
  spreadsheetData, 
  mockupImage,
  onConditionsMarkdownUpdate,
  onSupplementMarkdownUpdate,
  onSpreadsheetDataUpdate,
  onShowBackupManager
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'こんにちは！AI設計アシスタントです。設計書の生成や質問にお答えします！✨\n\n🎯 **新機能**: 設計書の修正提案ができます！\n「〇〇を追加して」「△△を変更して」など、変更要求をお伝えください。',
      isUser: false,
      timestamp: new Date(),
      type: 'normal'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // APIキーの存在確認
  const hasAPIKey = checkAPIKey();
  
  // 定型質問ボタンの定義
  const suggestedQuestions = [
    '現在のデータは？',
    'ECサイトの商品一覧画面を作って',
    '管理画面のユーザー項目を生成',
    'ログイン画面の表示条件を作成',
    '認証項目を追加して',
    'セキュリティ項目を強化して',
    '/status',
    '/help',
    '/write',
    '/backup'
  ];

  // AIで生成されたデータをWebUIに反映
  const applyGeneratedDraft = (draft: GeneratedDraft): string => {
    try {
      let result = '✅ **AI生成コンテンツをWebUIに反映しました！**\n\n';
      
      if (draft.type === 'spreadsheet' && draft.spreadsheetData) {
        // スプレッドシートデータの構造を確認・変換
        const cellData = draft.spreadsheetData.map(cell => ({
          r: cell.r,
          c: cell.c,
          v: { v: cell.v, ct: { t: 'inlineStr' } }
        }));
        
        const sheetData = [{
          name: 'AI生成シート',
          celldata: cellData,
          row: Math.max(...cellData.map(c => c.r)) + 1,
          column: Math.max(...cellData.map(c => c.c)) + 1
        }];
        
        onSpreadsheetDataUpdate(sheetData);
        result += '📊 **スプレッドシート**: 項目定義データを生成\n';
        result += `- ${cellData.length}個のセルを生成\n`;
        result += '- 「項目定義」タブで確認してください\n\n';
      }
      
      if (draft.type === 'conditions' && draft.conditions) {
        onConditionsMarkdownUpdate(draft.conditions);
        result += '📝 **表示条件**: Markdownコンテンツを生成\n';
        result += '- 「表示条件」タブで確認してください\n\n';
      }
      
      if (draft.type === 'supplement' && draft.supplement) {
        onSupplementMarkdownUpdate(draft.supplement);
        result += '📋 **補足説明**: Markdownコンテンツを生成\n';
        result += '- 「補足説明」セクションで確認してください\n\n';
      }
      
      if (draft.type === 'mixed') {
        // 複数データタイプの場合
        if (draft.spreadsheetData) {
          const cellData = draft.spreadsheetData.map(cell => ({
            r: cell.r,
            c: cell.c,
            v: { v: cell.v, ct: { t: 'inlineStr' } }
          }));
          
          const sheetData = [{
            name: 'AI生成シート',
            celldata: cellData,
            row: Math.max(...cellData.map(c => c.r)) + 1,
            column: Math.max(...cellData.map(c => c.c)) + 1
          }];
          
          onSpreadsheetDataUpdate(sheetData);
          result += '📊 **スプレッドシート**: 項目定義データ\n';
        }
        
        if (draft.conditions) {
          onConditionsMarkdownUpdate(draft.conditions);
          result += '📝 **表示条件**: Markdownコンテンツ\n';
        }
        
        if (draft.supplement) {
          onSupplementMarkdownUpdate(draft.supplement);
          result += '📋 **補足説明**: Markdownコンテンツ\n';
        }
        
        result += '\n各タブで生成されたコンテンツを確認してください。\n\n';
      }
      
      result += '🎉 生成が完了しました！さらに修正や追加が必要でしたらお知らせください。';
      return result;
      
    } catch (error) {
      console.error('データ反映エラー:', error);
      return '❌ データの反映中にエラーが発生しました。生成されたデータの形式を確認してください。';
    }
  };

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

  // 設計書生成要求の判定
  const isDesignGenerationRequest = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    const keywords = [
      '作って', '生成', '作成', '画面', 'サイト', '項目', '定義', 
      'ログイン', '管理', '一覧', 'crud', 'フォーム', 'ec', 'ランディング'
    ];
    return keywords.some(keyword => lowerMessage.includes(keyword));
  };

  // 修正提案要求の判定
  const isModificationRequest = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    const modificationKeywords = [
      '追加して', '変更して', '修正して', '削除して', '更新して',
      '改善して', '強化して', '見直して', '調整して', 'に変えて',
      'を加えて', 'を含めて', 'を外して', 'を消して'
    ];
    return modificationKeywords.some(keyword => lowerMessage.includes(keyword));
  };

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

  // 修正提案を処理する関数
  const handleModificationProposal = async (proposal: ModificationProposal): Promise<void> => {
    try {
      const currentData: WebUIData = {
        conditionsMarkdown,
        supplementMarkdown,
        spreadsheetData,
        mockupImage
      };

      // 修正提案を適用
      const result = ModificationService.applyModificationProposal(proposal, currentData);
      
      if (result.success && result.updatedData) {
        // WebUIに反映
        if (result.updatedData.conditionsMarkdown !== currentData.conditionsMarkdown) {
          onConditionsMarkdownUpdate(result.updatedData.conditionsMarkdown);
        }
        if (result.updatedData.supplementMarkdown !== currentData.supplementMarkdown) {
          onSupplementMarkdownUpdate(result.updatedData.supplementMarkdown);
        }
        if (JSON.stringify(result.updatedData.spreadsheetData) !== JSON.stringify(currentData.spreadsheetData)) {
          onSpreadsheetDataUpdate(result.updatedData.spreadsheetData);
        }

        // 成功メッセージを追加
        const successMessage: ChatMessage = {
          id: Date.now().toString(),
          content: `✅ **修正提案を適用しました！**\n\n📋 **変更概要**: ${proposal.summary}\n\n🎯 **適用された変更**:\n${proposal.changes.map(change => `- ${change.target}: ${change.action} - ${change.reason}`).join('\n')}\n\n各タブでハイライトされた変更箇所を確認してください。`,
          isUser: false,
          timestamp: new Date(),
          type: 'applied'
        };
        
        setMessages(prev => [...prev, successMessage]);
        
      } else {
        // エラーメッセージを追加
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          content: `❌ **修正提案の適用に失敗しました**\n\n**エラー**:\n${result.errors.join('\n')}\n\nバックアップから手動で復元してください。`,
          isUser: false,
          timestamp: new Date(),
          type: 'rejected'
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('❌ 修正提案処理エラー:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `❌ **修正提案の処理中にエラーが発生しました**\n\n${error instanceof Error ? error.message : '不明なエラー'}`,
        isUser: false,
        timestamp: new Date(),
        type: 'rejected'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // AI統合応答機能
  const getAIResponse = async (userMessage: string): Promise<string> => {
    // APIキーが設定されていない場合のフォールバック
    if (!hasAPIKey) {
      return getFallbackResponse(userMessage);
    }
    
    const currentData: WebUIData = {
      conditionsMarkdown,
      supplementMarkdown, 
      spreadsheetData,
      mockupImage
    };
    
    try {
      // 修正提案要求の場合
      if (isModificationRequest(userMessage)) {
        const proposal = await ModificationService.generateModificationProposal(userMessage, currentData);
        
        // 修正提案をメッセージとして追加
        const proposalMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: `🎯 **修正提案を生成しました**\n\n📋 **概要**: ${proposal.summary}\n\n🔧 **提案された変更**:\n${proposal.changes.map(change => 
            `- **${change.target}** (${change.action}): ${change.reason} (信頼度: ${(change.confidence * 100).toFixed(0)}%)`
          ).join('\n')}\n\n⚠️ **注意事項**:\n${proposal.risks.map(risk => `- ${risk}`).join('\n')}\n\n**この提案を適用しますか？**`,
          isUser: false,
          timestamp: new Date(),
          type: 'proposal',
          proposal
        };
        
        setMessages(prev => [...prev, proposalMessage]);
        
        return '修正提案を確認してください。適用する場合は「適用」ボタンをクリックしてください。';
      }
      
      // 設計書生成要求の場合
      if (isDesignGenerationRequest(userMessage)) {
        const draft = await generateDesignDraft({
          prompt: userMessage,
          context: currentData
        });
        
        const result = applyGeneratedDraft(draft);
        return result;
      }
      
      // 一般的なチャット応答
      return await generateChatResponse(userMessage, currentData);
      
    } catch (error) {
      console.error('AI応答エラー:', error);
      return `❌ AI応答の生成に失敗しました。\n\n**エラー**: ${error instanceof Error ? error.message : '不明なエラー'}\n\n**対処法**:\n- インターネット接続を確認\n- APIキーが正しく設定されているか確認\n- しばらく時間をおいて再試行`;
    }
  };

  // フォールバック応答（APIキー未設定時）
  const getFallbackResponse = (userMessage: string): string => {
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
• \`/backup\` - バックアップ管理画面を開く

**修正提案機能:**
• 「〇〇を追加して」「△△を変更して」など、変更要求を送信
• AIが安全な修正提案を生成し、適用前に確認可能

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

    // /backupコマンドの処理
    if (userMessage.startsWith('/backup')) {
      if (onShowBackupManager) {
        onShowBackupManager();
        return '🔄 **バックアップ管理画面を開きました**\n\nバックアップの作成・復元・削除が可能です。';
      } else {
        return '⚠️ **バックアップ管理機能は現在利用できません**\n\n管理機能の設定を確認してください。';
      }
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
    
    // APIキー未設定の場合の案内
    if (isDesignGenerationRequest(userMessage)) {
      return `🔑 **AIによる設計書生成機能を利用するには**

OpenAI APIキーの設定が必要です：

1. OpenAI APIキーを取得
2. \`.env.local\` ファイルに以下を設定：
   \`\`\`
   VITE_OPENAI_API_KEY=your_api_key_here
   \`\`\`
3. 開発サーバーを再起動

設定後、AI生成機能が利用可能になります！`;
    }
    
    // デフォルト応答
    return `「${userMessage}」について承知いたしました。

**AI機能**: OpenAI APIキーを設定すると、AIによる設計書生成が利用できます。

よくある質問：
• 使い方やヘルプについて
• 保存・読み込み方法について  
• スプレッドシート機能について
• エラーや問題の解決方法について`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageText = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // ユーザーメッセージを追加
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // ローディングメッセージを追加
    const loadingMessage: ChatMessage = {
      id: 'loading',
      content: hasAPIKey ? '🤖 AI生成中...' : '🤖 処理中...',
      isUser: false,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // AI応答を取得
      const responseContent = await getAIResponse(messageText);
      
      // ローディングメッセージを削除し、実際の応答を追加
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== 'loading');
        return [...filtered, {
          id: (Date.now() + 1).toString(),
          content: responseContent,
          isUser: false,
          timestamp: new Date()
        }];
      });
      
    } catch (error) {
      // エラーの場合もローディングメッセージを削除
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== 'loading');
        return [...filtered, {
          id: (Date.now() + 1).toString(),
          content: `❌ エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
          isUser: false,
          timestamp: new Date()
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 質問ボタンクリック時の処理
  const handleQuestionClick = async (question: string) => {
    if (isLoading) return;
    
    setInputMessage('');
    setIsLoading(true);

    // ユーザーメッセージを追加
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: question,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // ローディングメッセージを追加
    const loadingMessage: ChatMessage = {
      id: 'loading',
      content: hasAPIKey ? '🤖 AI生成中...' : '🤖 処理中...',
      isUser: false,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // AI応答を取得
      const responseContent = await getAIResponse(question);
      
      // ローディングメッセージを削除し、実際の応答を追加
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== 'loading');
        return [...filtered, {
          id: (Date.now() + 1).toString(),
          content: responseContent,
          isUser: false,
          timestamp: new Date()
        }];
      });
      
    } catch (error) {
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== 'loading');
        return [...filtered, {
          id: (Date.now() + 1).toString(),
          content: `❌ エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
          isUser: false,
          timestamp: new Date()
        }];
      });
    } finally {
      setIsLoading(false);
    }
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
            {hasAPIKey ? 'AI設計アシスタント' : '設計アシスタント'}
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
              
              {/* 修正提案の場合、適用・拒否ボタンを表示 */}
              {message.type === 'proposal' && message.proposal && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleModificationProposal(message.proposal!)}
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCircle className="h-3 w-3" />
                    適用
                  </button>
                  <button
                    onClick={() => {
                      // 拒否メッセージを追加
                      const rejectMessage: ChatMessage = {
                        id: Date.now().toString(),
                        content: '❌ **修正提案を拒否しました**\n\n提案は適用されませんでした。',
                        isUser: false,
                        timestamp: new Date(),
                        type: 'rejected'
                      };
                      setMessages(prev => [...prev, rejectMessage]);
                    }}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <XCircle className="h-3 w-3" />
                    拒否
                  </button>
                </div>
              )}
              
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
            disabled={!inputMessage.trim() || isLoading}
            style={{
              backgroundColor: (inputMessage.trim() && !isLoading) ? '#3b82f6' : '#d1d5db',
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