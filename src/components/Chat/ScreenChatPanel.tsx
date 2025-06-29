// src/components/Chat/ScreenChatPanel.tsx
// 画面設計書専用チャットパネル（スプレッドシート・画面モックアップ・表示条件特化）

import React, { useState } from 'react';
import { BaseChatPanel, type ChatMessage } from './BaseChatPanel';
import { ChatMessageActions } from './ChatMessage';
// import { generateDesignDraft, generateChatResponse } from '../../services/aiService'; // MCPサーバー経由に変更
import { mcpClient } from '../../services/mcpClient';
import { ModificationService } from '../../services/modificationService';
import { DocumentReferenceService } from '../../services/documentReferenceService';
import type { WebUIData, GeneratedDraft, ModificationProposal } from '../../types/aiTypes';
import type { AppState } from '../../types';
import type { SpreadsheetData } from '../../types/spreadsheet';

interface ScreenChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // 画面設計書専用データアクセス
  conditionsMarkdown: string;
  supplementMarkdown: string;
  spreadsheetData: SpreadsheetData[];
  mockupImage: string | null;
  // 画面設計書専用データ更新機能
  onConditionsMarkdownUpdate: (markdown: string) => void;
  onSupplementMarkdownUpdate: (markdown: string) => void;
  onSpreadsheetDataUpdate: (data: SpreadsheetData[]) => void;
  // バックアップ管理機能
  onShowBackupManager?: () => void;
  // Model Driven Architecture対応
  appState: AppState;
  currentProjectId: string;
  currentDocumentId: string;
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
  onShowBackupManager,
  appState,
  currentProjectId,
  currentDocumentId
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

  // Model Driven Architecture対応: 参照可能な設計書を取得
  const referenceableDocuments = DocumentReferenceService.getReferenceableDocuments(
    appState, 
    currentProjectId, 
    currentDocumentId
  );
  const hasDataModelDocument = referenceableDocuments.some(doc => doc.type === 'model');
  
  console.log('🖥️ ScreenChatPanel: 参照可能な設計書', {
    projectId: currentProjectId,
    documentId: currentDocumentId,
    referenceableCount: referenceableDocuments.length,
    documents: referenceableDocuments.map(doc => ({ name: doc.name, type: doc.type })),
    hasDataModel: hasDataModelDocument
  });

  // @メンション機能のデバッグ用関数
  const debugMentionFunction = () => {
    console.log('🔍 @メンション機能デバッグ:', {
      referenceableDocuments: referenceableDocuments.length,
      sampleDocuments: referenceableDocuments.slice(0, 3).map(doc => ({ name: doc.name, type: doc.type })),
      functionType: typeof DocumentReferenceService.getReferenceableDocuments
    });
    return referenceableDocuments;
  };

  // 画面設計書専用の定型質問（Model Driven対応）
  const suggestedQuestions = [
    '現在のデータは？',
    ...(hasDataModelDocument ? [
      '@データモデル設計書 を参考にユーザー管理画面を作って',
      '@データモデル設計書 のエンティティから項目定義を生成',
      '@データモデル設計書 に基づく CRUD画面を設計'
    ] : []),
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
        
        const sheetData: SpreadsheetData[] = [{
          name: 'AI生成シート',
          celldata: cellData,
          row: Math.max(...cellData.map(c => c.r)) + 1,
          column: Math.max(...cellData.map(c => c.c)) + 1,
          order: 0,
          id: 'ai-generated-sheet',
          status: 1,
          hide: 0,
          defaultRowHeight: 19,
          defaultColWidth: 73
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
          
          const sheetData: SpreadsheetData[] = [{
            name: 'AI生成シート',
            celldata: cellData,
            row: Math.max(...cellData.map(c => c.r)) + 1,
            column: Math.max(...cellData.map(c => c.c)) + 1,
            order: 0,
            id: 'ai-generated-mixed-sheet',
            status: 1,
            hide: 0,
            defaultRowHeight: 19,
            defaultColWidth: 73
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

  // @メンション処理：参照されたデータモデル設計書の内容を取得
  const processDataModelReference = (userMessage: string): { processedMessage: string; context: string } => {
    const mentions = DocumentReferenceService.parseMentions(userMessage);
    let contextInfo = '';
    let processedMessage = userMessage;

    for (const mention of mentions) {
      const referencedDoc = DocumentReferenceService.findDocumentByMention(
        appState, 
        currentProjectId, 
        mention
      );

      if (referencedDoc && referencedDoc.type === 'model') {
        console.log('🗄️ データモデル設計書参照:', referencedDoc.name);
        
        // Mermaidコードからエンティティ情報を抽出
        if (referencedDoc.content.mermaidCode) {
          const entities = DocumentReferenceService.parseEntitiesFromMermaid(referencedDoc.content.mermaidCode);
          
          if (entities.length > 0) {
            contextInfo += `\n\n## 📊 参照データモデル: ${referencedDoc.name}\n\n`;
            
            entities.forEach(entity => {
              contextInfo += `### ${entity.name}エンティティ\n`;
              contextInfo += '| フィールド名 | データ型 | 制約 |\n';
              contextInfo += '|------------|----------|------|\n';
              
              entity.fields.forEach(field => {
                const constraints = [];
                if (field.primaryKey) constraints.push('PK');
                if (field.foreignKey) constraints.push('FK');
                if (!field.nullable) constraints.push('NOT NULL');
                
                contextInfo += `| ${field.name} | ${field.type} | ${constraints.join(', ')} |\n`;
              });
              
              if (entity.relationships.length > 0) {
                contextInfo += '\n**リレーション:**\n';
                entity.relationships.forEach(rel => {
                  contextInfo += `- ${rel.type}: ${rel.targetEntity}${rel.description ? ` (${rel.description})` : ''}\n`;
                });
              }
              contextInfo += '\n';
            });
          }
        }

        // 補足説明も含める
        if (referencedDoc.content.supplement) {
          contextInfo += `### 📝 補足説明\n${referencedDoc.content.supplement}\n\n`;
        }

        // メッセージから@メンションを除去し、参照内容の説明に置換
        processedMessage = processedMessage.replace(
          `@${mention}`, 
          `上記のデータモデル(${referencedDoc.name})`
        );
      }
    }

    return { processedMessage, context: contextInfo };
  };

  // 既存データの存在チェック
  const hasExistingData = (data: WebUIData): boolean => {
    const hasConditions = data.conditionsMarkdown && data.conditionsMarkdown.trim().length > 0;
    const hasSpreadsheet = data.spreadsheetData && data.spreadsheetData.length > 0 && 
                          data.spreadsheetData[0]?.celldata && data.spreadsheetData[0].celldata.length > 0;
    const hasSuplement = data.supplementMarkdown && data.supplementMarkdown.trim().length > 0;
    const hasMockup = data.mockupImage && data.mockupImage.length > 0;
    
    return hasConditions || hasSpreadsheet || hasSuplement || hasMockup;
  };

  // AI統合応答機能（Model Driven Architecture対応）
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
      hasMockup: !!mockupImage,
      mentions: DocumentReferenceService.parseMentions(userMessage)
    });

    try {
      // @メンション処理を実行
      const { processedMessage, context } = processDataModelReference(userMessage);
      const hasModelReference = context.length > 0;
      
      if (hasModelReference) {
        console.log('🗄️ Model Driven Architecture: データモデル参照を検出');
      }

      // 修正提案の場合
      const isModification = isModificationRequest(processedMessage);
      const isScreenDesign = isScreenDesignRequest(processedMessage);
      
      console.log('🔍 メッセージ判定デバッグ:', {
        message: processedMessage,
        isModification,
        isScreenDesign,
        hasModelReference
      });
      
      if (isModification) {
        console.log('🎯 画面設計書修正提案要求として認識:', processedMessage);
        
        try {
          const proposal = await ModificationService.generateModificationProposal(processedMessage, currentData);
          
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
          
        } catch (modificationError) {
          console.error('❌ 修正提案生成失敗:', modificationError);
          
          // 修正提案生成に失敗した場合は、エラーメッセージを返して処理を終了
          return `❌ **修正提案生成エラー**\n\nMCP修正提案システムとの通信に失敗しました。\n\n**エラー**: ${modificationError instanceof Error ? modificationError.message : '不明なエラー'}\n\n**対処法**:\n- MCPサーバーが起動しているか確認してください\n- しばらく時間をおいて再試行してください`;
        }
      }

      // /writeコマンドの処理
      if (processedMessage.startsWith('/write')) {
        return writeToMarkdown();
      }

      // /backupコマンドの処理
      if (processedMessage.startsWith('/backup')) {
        if (onShowBackupManager) {
          onShowBackupManager();
          return '🔄 **バックアップ管理画面を開きました**\n\nバックアップの作成・復元・削除が可能です。';
        } else {
          return '⚠️ **バックアップ管理機能は現在利用できません**\n\n管理機能の設定を確認してください。';
        }
      }

      // Model Driven画面設計生成の場合
      if (hasModelReference && isScreenDesignRequest(processedMessage)) {
        console.log('🚀 Model Driven Architecture: データモデルを基にした画面設計生成');
        
        // データモデル情報をプロンプトに注入
        const enhancedPrompt = `${context}\n\n## 🎯 要求\n${processedMessage}\n\n**重要**: 上記のデータモデルを参考に、一貫性のある画面設計を行ってください。エンティティのフィールドをスプレッドシートの項目定義として正確に反映し、適切な画面レイアウトを提案してください。`;
        
        try {
          const mcpResult = await mcpClient.generateDesignDraft({
            prompt: enhancedPrompt,
            context: currentData,
            target_type: 'screen',
            project_context: {
              name: '現在のプロジェクト',
              id: currentProjectId || 'default'
            }
          });
          
          console.log('🔍 MCP生レスポンス (Model Driven):', mcpResult);
          const draft: GeneratedDraft = mcpResult;
          
          const result = applyGeneratedDraft(draft);
          return `🗄️ **Model Driven Architecture適用**\n\nデータモデル設計書の情報を基に画面設計を生成しました。\n\n${result}`;
        } catch (error) {
          console.error('❌ MCP設計書生成失敗:', error);
          return '❌ **設計書生成エラー**\n\nMCPサーバーとの通信に失敗しました。サーバーが起動しているか確認してください。';
        }
      }

      // 画面設計生成要求の場合（通常）- 修正提案でない場合のみ
      if (isScreenDesign && !isModification) {
        console.log('🎨 画面設計書生成要求として認識:', processedMessage);
        
        // 既存データがある場合は選択肢を表示
        if (hasExistingData(currentData)) {
          console.log('⚠️ 既存データを検出、選択肢を表示');
          
          const selectionMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: `🤔 **既存の設計書データがあります。どちらを希望しますか？**

**現在のデータ状況:**
${currentData.conditionsMarkdown ? '• 表示条件: あり' : ''}
${currentData.spreadsheetData?.length ? '• 項目定義: あり' : ''}
${currentData.supplementMarkdown ? '• 補足説明: あり' : ''}
${currentData.mockupImage ? '• 画面イメージ: あり' : ''}

**操作を選択してください:**`,
            isUser: false,
            timestamp: new Date(),
            type: 'action_selection',
            actionOptions: {
              originalMessage: processedMessage,
              currentData: currentData,
              actions: [
                {
                  id: 'replace',
                  label: '🔄 全て置き換える',
                  description: '新しい設計書に全置き換え（既存データは削除）',
                  action: 'generate_design_draft'
                },
                {
                  id: 'modify',
                  label: '➕ 既存に追加・修正',
                  description: '今ある内容に変更を加える（既存データは保持）',
                  action: 'generate_modification_proposal'
                }
              ]
            }
          };
          
          setMessages(prev => [...prev, selectionMessage]);
          
          return '上記の選択肢からご希望の操作を選んでください。';
        }
        
        // 既存データがない場合は通常の新規生成
        console.log('🆕 新規生成として実行');
        try {
          const mcpResult = await mcpClient.generateDesignDraft({
            prompt: processedMessage,
            context: currentData,
            target_type: 'screen',
            project_context: {
              name: '現在のプロジェクト',
              id: currentProjectId || 'default'
            }
          });
          
          console.log('🔍 MCP生レスポンス (新規):', mcpResult);
          const draft: GeneratedDraft = mcpResult;
          
          const result = applyGeneratedDraft(draft);
          return result;
        } catch (error) {
          console.error('❌ MCP設計書生成失敗:', error);
          return '❌ **設計書生成エラー**\n\nMCPサーバーとの通信に失敗しました。サーバーが起動しているか確認してください。';
        }
      }

      // 一般的なチャット応答（Model Driven対応）
      try {
        const systemContext = "【重要】あなたは画面設計書のWebUIにいます。どんな質問・要求でも必ず画面設計の観点から回答してください。ERダイアグラムの話が出ても、それを画面設計の要素（画面項目、フォーム、レイアウト等）に変換して回答してください。";
        
        let contextualPrompt = systemContext;
        if (hasModelReference) {
          contextualPrompt += `\n\n${context}`;
        }
        contextualPrompt += `\n\n${processedMessage}`;
        
        const mcpResult = await mcpClient.generateChatResponse({
          user_message: contextualPrompt,
          context: currentData,
          document_type: 'screen',
          project_context: {
            name: '現在のプロジェクト',
            id: currentProjectId || 'default'
          }
        });
        
        return mcpResult.response;
      } catch (mcpError) {
        console.error('❌ MCPチャット応答失敗:', mcpError);
        return '❌ **チャット応答エラー**\n\nMCPサーバーとの通信に失敗しました。サーバーが起動しているか確認してください。';
      }

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

  // 選択肢のハンドラー
  const handleActionSelect = async (actionId: string, actionData: any): Promise<void> => {
    console.log('🎯 ユーザー選択:', actionId, actionData);
    
    const currentData: WebUIData = {
      conditionsMarkdown,
      supplementMarkdown,
      spreadsheetData,
      mockupImage,
      mermaidCode: ''
    };
    
    try {
      if (actionData.action === 'generate_design_draft') {
        // 全置き換え
        console.log('🔄 全置き換え処理開始...');
        
        const mcpResult = await mcpClient.generateDesignDraft({
          prompt: actionData.originalMessage,
          context: currentData,
          target_type: 'screen',
          project_context: {
            name: '現在のプロジェクト',
            id: currentProjectId || 'default'
          }
        });
        
        const draft: GeneratedDraft = mcpResult;
        const result = applyGeneratedDraft(draft);
        
        const successMessage: ChatMessage = {
          id: Date.now().toString(),
          content: `🔄 **全置き換え完了**\n\n${result}`,
          isUser: false,
          timestamp: new Date(),
          type: 'applied'
        };
        setMessages(prev => [...prev, successMessage]);
        
      } else if (actionData.action === 'generate_modification_proposal') {
        // 既存に追加・修正
        console.log('➕ 追加・修正処理開始...');
        
        const proposal = await ModificationService.generateModificationProposal(
          actionData.originalMessage, 
          currentData
        );
        
        const proposalMessage: ChatMessage = {
          id: Date.now().toString(),
          content: `➕ **修正提案を生成しました**\n\n📋 **概要**: ${proposal.summary}\n\n🔧 **提案された変更**:\n${proposal.changes.map(change => 
            `- **${change.target}** (${change.action}): ${change.reason} (信頼度: ${(change.confidence * 100).toFixed(0)}%)`
          ).join('\n')}\n\n⚠️ **注意事項**:\n${proposal.risks.map(risk => `- ${risk}`).join('\n')}\n\n**この提案を適用しますか？**`,
          isUser: false,
          timestamp: new Date(),
          type: 'proposal',
          proposal
        };
        
        setMessages(prev => [...prev, proposalMessage]);
      }
      
    } catch (error) {
      console.error('❌ 選択処理エラー:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `❌ **処理エラー**\n\n選択した操作の実行中にエラーが発生しました。\n\n**エラー**: ${error instanceof Error ? error.message : '不明なエラー'}\n\n**対処法**:\n- MCPサーバーが起動しているか確認してください\n- しばらく時間をおいて再試行してください`,
        isUser: false,
        timestamp: new Date(),
        type: 'rejected'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
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
      onMentionTriggered={debugMentionFunction}
    >
      <ChatMessageActions
        message={{} as any}
        onApplyProposal={handleModificationProposal}
        onRejectProposal={handleRejectProposal}
        onActionSelect={handleActionSelect}
      />
    </BaseChatPanel>
  );
};