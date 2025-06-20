// src/components/Chat/ModelChatPanel.tsx
// データモデル設計書専用チャットパネル（Mermaid ER図・エンティティ・リレーション特化）

import React, { useState } from 'react';
import { BaseChatPanel, type ChatMessage } from './BaseChatPanel';
import { ChatMessageActions } from './ChatMessage';
import { generateChatResponse } from '../../services/aiService';
import { ModificationService } from '../../services/modificationService';
import { DocumentReferenceService } from '../../services/documentReferenceService';
import type { WebUIData, ModificationProposal } from '../../types/aiTypes';
import type { AppState } from '../../types';

interface ModelChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // データモデル設計書専用データアクセス
  supplementMarkdown: string;
  mermaidCode: string;
  // データモデル設計書専用データ更新機能
  onSupplementMarkdownUpdate: (markdown: string) => void;
  onMermaidCodeUpdate: (code: string) => void;
  // バックアップ管理機能
  onShowBackupManager?: () => void;
  // @メンション機能用
  appState: AppState;
  currentProjectId: string;
  currentDocumentId: string;
}

export const ModelChatPanel: React.FC<ModelChatPanelProps> = ({
  isOpen,
  onClose,
  supplementMarkdown,
  mermaidCode,
  onSupplementMarkdownUpdate,
  onMermaidCodeUpdate,
  onShowBackupManager,
  appState,
  currentProjectId,
  currentDocumentId
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'こんにちは！データモデル設計専用AIアシスタントです。ER図の生成や質問にお答えします！✨\n\n🎯 **データモデル特化機能**:\n• Mermaid ER図生成・編集\n• エンティティ設計提案\n• リレーション最適化\n• データベース設計支援',
      isUser: false,
      timestamp: new Date(),
      type: 'normal'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // @メンション機能: 参照可能な設計書を取得
  const referenceableDocuments = DocumentReferenceService.getReferenceableDocuments(
    appState, 
    currentProjectId, 
    currentDocumentId
  );
  const hasScreenDocument = referenceableDocuments.some(doc => doc.type === 'screen');

  // データモデル設計書専用の定型質問（逆参照対応）
  const suggestedQuestions = [
    '現在のデータは？',
    ...(hasScreenDocument ? [
      '@画面設計書 を参考にデータモデルを改善',
      '@画面設計書 の項目からエンティティを設計',
      '@画面設計書 に基づくER図の最適化'
    ] : []),
    'ECサイトのデータモデルを作って',
    'ユーザー管理のER図を生成',
    '注文システムのエンティティを設計',
    'リレーションを追加して',
    'テーブル設計を強化して',
    'データ正規化を提案して',
    '/status',
    '/help',
    '/write',
    '/backup'
  ];

  // マークダウンにチャット履歴を書き込む機能（補足説明欄）
  const writeToMarkdown = () => {
    const now = new Date();
    const timestamp = now.toLocaleString('ja-JP');
    
    // 既存のマークダウンにCopilotKitセクションを追加/更新
    let updatedMarkdown = supplementMarkdown;
    
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
    onSupplementMarkdownUpdate(updatedMarkdown);
    
    return `✅ **チャット履歴を補足説明に書き込みました！**

📝 **書き込み内容:**
- 最新${recentMessages.length}件のメッセージ
- タイムスタンプ: ${timestamp}
- 書き込み先: 補足説明セクション

「補足説明」タブを確認してください。`;
  };

  // データモデル設計書データが空かどうかの判定
  const isEmpty = (data: WebUIData): boolean => {
    return (!data.mermaidCode || data.mermaidCode.trim().length < 10);
  };

  // 生成要求の判定（データモデル設計書専用＝シンプル）
  const isGenerationRequest = (message: string): boolean => {
    const basicKeywords = ['作って', '生成', '作成', '設計', 'を作', '新しく'];
    return basicKeywords.some(keyword => message.includes(keyword));
  };

  // 修正提案要求の判定
  const isModificationRequest = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    const modificationKeywords = [
      '追加して', '変更して', '修正して', '削除して', '更新して',
      '改善して', '強化して', '見直して', '調整して', 'に変えて',
      'を加えて', 'を含めて', 'を外して', 'を消して',
      // データモデル固有の修正
      '関係を', 'テーブルを', 'フィールドを', '属性を'
    ];
    return modificationKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // 修正提案を処理する関数
  const handleModificationProposal = async (proposal: ModificationProposal): Promise<void> => {
    try {
      const currentData: WebUIData = {
        conditionsMarkdown: '', // データモデル設計書では未使用
        supplementMarkdown,
        spreadsheetData: [], // データモデル設計書では未使用
        mockupImage: null, // データモデル設計書では未使用
        mermaidCode
      };

      // 修正提案を適用
      const result = ModificationService.applyModificationProposal(proposal, currentData);
      
      if (result.success && result.updatedData) {
        // WebUIに反映
        if (result.updatedData.supplementMarkdown !== currentData.supplementMarkdown) {
          onSupplementMarkdownUpdate(result.updatedData.supplementMarkdown);
        }
        if (result.updatedData.mermaidCode !== currentData.mermaidCode) {
          console.log('🎯 Mermaidコード更新:', {
            before: currentData.mermaidCode?.substring(0, 50) || '（空）',
            after: result.updatedData.mermaidCode?.substring(0, 50) || '（空）',
            changed: true
          });
          onMermaidCodeUpdate(result.updatedData.mermaidCode);
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

  // AI統合応答機能（データモデル設計書特化）
  const getAIResponse = async (userMessage: string): Promise<string> => {
    const currentData: WebUIData = {
      conditionsMarkdown: '', // データモデル設計書では未使用
      supplementMarkdown,
      spreadsheetData: [], // データモデル設計書では未使用
      mockupImage: null, // データモデル設計書では未使用
      mermaidCode
    };

    console.log('🗄️ ModelChatPanel AIResponse:', {
      message: userMessage.substring(0, 100),
      hasSupplementMarkdown: !!supplementMarkdown,
      hasMermaidCode: !!mermaidCode,
      mermaidPreview: mermaidCode?.substring(0, 100) || '（空）',
      isEmpty: isEmpty(currentData),
      isGenerationRequest: isGenerationRequest(userMessage)
    });

    try {
      // 修正提案の場合
      if (isModificationRequest(userMessage)) {
        console.log('🎯 データモデル修正提案要求として認識:', userMessage);
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

      // 生成要求の場合（データモデル設計書では必ずMermaid生成）
      if (isGenerationRequest(userMessage)) {
        console.log('🆕 データモデル生成要求として認識:', userMessage);
        
        // Mermaid専用の生成プロンプトを作成
        const mermaidPrompt = `
【絶対ルール】あなたはデータモデル設計書専用です。以下の指示を必ずMermaid ER図で応答してください。

指示: ${userMessage}

【重要な解釈指針】:
どんな指示でも（画面、UI、機能などの単語があっても）、必要なデータ構造をER図で設計してください。
- 「画面を作って」→ その画面で扱うデータのエンティティ設計
- 「ログイン機能」→ User、Session等のエンティティ設計
- 「注文システム」→ Order、OrderItem、Product等のエンティティ設計
- 「管理機能」→ 管理に必要なデータ構造設計

現在の設計書状況:
- 補足説明: ${currentData.supplementMarkdown?.length || 0}文字
- Mermaid ER図: ${mermaidCode ? 'あり（追加・修正）' : '未設定（新規作成）'}

【必須】erDiagramで始まるMermaid記法で応答してください。エンティティと関係を定義してください。

例:
erDiagram
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
    User ||--o{ Order : "has many"
        `;
        
        const mermaidResponse = await generateChatResponse(mermaidPrompt, currentData);
        
        // mermaidコードを抽出
        const mermaidMatch = mermaidResponse.match(/```(?:mermaid)?\s*(erDiagram[\s\S]*?)```/i) || 
                            mermaidResponse.match(/(erDiagram[\s\S]*)/i);
        
        if (mermaidMatch) {
          const mermaidCodeGenerated = mermaidMatch[1].trim();
          console.log('🎨 Mermaidコード生成:', mermaidCodeGenerated.substring(0, 100));
          onMermaidCodeUpdate(mermaidCodeGenerated);
          return `🎨 **ER図を生成しました！**\n\n📊 **データモデル**: Mermaid記法でER図を作成\n- 「データモデル」タブで確認してください\n\n🎉 新しいER図が生成されました！さらに修正や追加が必要でしたらお知らせください。`;
        } else {
          return `❌ ER図の生成に失敗しました。再度お試しください。`;
        }
      }

      // 一般的なチャット応答（データモデル設計書コンテキスト）
      const systemContext = "【重要】あなたはデータモデル設計書のWebUIにいます。どんな質問・要求でも必ずデータモデル設計の観点から回答してください。画面の話が出ても、それをデータモデル（エンティティ、リレーション、ER図等）の観点で回答してください。";
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
      content: '🤖 データモデルAI生成中...',
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
      chatTitle="データモデル設計AIアシスタント"
      chatColor="#d97706"
      onMentionTriggered={() => referenceableDocuments}
    >
      <ChatMessageActions
        message={{} as any}
        onApplyProposal={handleModificationProposal}
        onRejectProposal={handleRejectProposal}
      />
    </BaseChatPanel>
  );
};