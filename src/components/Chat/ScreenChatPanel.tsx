// src/components/Chat/ScreenChatPanel.tsx
// 画面設計書専用チャットパネル（スプレッドシート・画面モックアップ・表示条件特化）

import React, { useState } from 'react';
import { BaseChatPanel, type ChatMessage } from './BaseChatPanel';
import { ChatMessageActions } from './ChatMessage';
import { generateDesignDraft, generateChatResponse } from '../../services/aiService';
import { ModificationService } from '../../services/modificationService';
import type { WebUIData, GeneratedDraft, ModificationProposal } from '../../types/aiTypes';

interface ScreenChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // 画面設計書専用データアクセス
  conditionsMarkdown: string;
  supplementMarkdown: string;
  spreadsheetData: unknown[];
  mockupImage: string | null;
  // 画面設計書専用データ更新機能
  onConditionsMarkdownUpdate: (markdown: string) => void;
  onSupplementMarkdownUpdate: (markdown: string) => void;
  onSpreadsheetDataUpdate: (data: unknown[]) => void;
  // バックアップ管理機能
  onShowBackupManager?: () => void;
}

export const ScreenChatPanel: React.FC<ScreenChatPanelProps> = ({
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
      content: 'こんにちは！画面設計専用AIアシスタントです。画面設計書の生成や質問にお答えします！✨\n\n🎯 **画面設計特化機能**:\n• スプレッドシート項目定義生成\n• 表示条件作成・修正\n• 画面レイアウト提案\n• UI/UX改善提案',
      isUser: false,
      timestamp: new Date(),
      type: 'normal'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // 画面設計書専用の定型質問
  const suggestedQuestions = [
    '現在のデータは？',
    'ECサイトの商品一覧画面を作って',
    '管理画面のユーザー項目を生成',
    'ログイン画面の表示条件を作成',
    '認証項目を追加して',
    'セキュリティ項目を強化して',
    '画面レイアウトを提案して',
    '/status',
    '/help',
    '/write',
    '/backup'
  ];

  // AIで生成されたデータをWebUIに反映（画面設計書用）
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

  // 画面設計書データが空かどうかの判定
  const isDataEmpty = (data: WebUIData): boolean => {
    const hasConditions = data.conditionsMarkdown && data.conditionsMarkdown.trim().length > 0;
    const hasSpreadsheet = data.spreadsheetData && data.spreadsheetData.length > 0 && (data.spreadsheetData[0] as any)?.celldata?.length > 0;
    const hasMockup = data.mockupImage && data.mockupImage.length > 0;
    return !(hasConditions || hasSpreadsheet || hasMockup);
  };

  // 画面設計特化の要求判定
  const isScreenDesignRequest = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    const keywords = [
      '画面', 'フォーム', 'レイアウト', 'ui', 'ux', '表示',
      '項目', '定義', 'スプレッドシート', '入力', 'ボタン',
      'ログイン', '管理', '一覧', 'crud', 'ec', 'ランディング',
      '作って', '生成', '作成'
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

  // 修正提案を処理する関数
  const handleModificationProposal = async (proposal: ModificationProposal): Promise<void> => {
    try {
      const currentData: WebUIData = {
        conditionsMarkdown,
        supplementMarkdown,
        spreadsheetData,
        mockupImage,
        mermaidCode: '' // 画面設計書では未使用
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

  // AI統合応答機能（画面設計書特化）
  const getAIResponse = async (userMessage: string): Promise<string> => {
    const currentData: WebUIData = {
      conditionsMarkdown,
      supplementMarkdown,
      spreadsheetData,
      mockupImage,
      mermaidCode: '' // 画面設計書では未使用
    };

    console.log('🖥️ ScreenChatPanel AIResponse:', {
      message: userMessage.substring(0, 100),
      hasConditions: !!conditionsMarkdown,
      hasSpreadsheet: spreadsheetData?.length > 0,
      hasMockup: !!mockupImage
    });

    try {
      // 修正提案の場合
      if (isModificationRequest(userMessage)) {
        console.log('🎯 画面設計書修正提案要求として認識:', userMessage);
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

      // 画面設計生成要求の場合
      if (isScreenDesignRequest(userMessage)) {
        const draft = await generateDesignDraft({
          prompt: userMessage,
          context: currentData
        });
        
        const result = applyGeneratedDraft(draft);
        return result;
      }

      // 一般的なチャット応答（画面設計書コンテキスト）
      const systemContext = "【重要】あなたは画面設計書のWebUIにいます。どんな質問・要求でも必ず画面設計の観点から回答してください。ERダイアグラムの話が出ても、それを画面設計の要素（画面項目、フォーム、レイアウト等）に変換して回答してください。";
      const contextualPrompt = `${systemContext}\n\n${userMessage}`;
      return await generateChatResponse(contextualPrompt, currentData);

    } catch (error) {
      console.error('AI応答エラー:', error);
      return `❌ AI応答の生成に失敗しました。\n\n**エラー**: ${error instanceof Error ? error.message : '不明なエラー'}\n\n**対処法**:\n- インターネット接続を確認\n- APIキーが正しく設定されているか確認\n- しばらく時間をおいて再試行`;
    }
  };

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);

    // ユーザーメッセージを追加
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // ローディングメッセージを追加
    const loadingMessage: ChatMessage = {
      id: 'loading',
      content: '🤖 画面設計AI生成中...',
      isUser: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // AI応答を取得
      const responseContent = await getAIResponse(message);
      
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

  const handleQuestionClick = async (question: string) => {
    await handleSendMessage(question);
  };

  const handleRejectProposal = (_proposalId: string) => {
    const rejectMessage: ChatMessage = {
      id: Date.now().toString(),
      content: '❌ **修正提案を拒否しました**\n\n提案は適用されませんでした。',
      isUser: false,
      timestamp: new Date(),
      type: 'rejected'
    };
    setMessages(prev => [...prev, rejectMessage]);
  };

  return (
    <BaseChatPanel
      isOpen={isOpen}
      onClose={onClose}
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
      suggestedQuestions={suggestedQuestions}
      onQuestionClick={handleQuestionClick}
      chatTitle="画面設計AIアシスタント"
      chatColor="#2563eb"
    >
      <ChatMessageActions
        message={undefined as any}
        onApplyProposal={handleModificationProposal}
        onRejectProposal={handleRejectProposal}
      />
    </BaseChatPanel>
  );
};