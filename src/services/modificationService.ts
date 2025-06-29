// src/services/modificationService.ts
// 修正提案生成・管理サービス

import { BackupService } from './backupService';
import type { 
  ModificationRequest, 
  ModificationProposal, 
  ProposedChange, 
  WebUIData,
  DiffResult 
} from '../types/aiTypes';

export class ModificationService {
  /**
   * ユーザーの変更要求から修正提案を生成
   */
  static async generateModificationProposal(
    changeDescription: string, 
    currentData: WebUIData
  ): Promise<ModificationProposal> {
    const timestamp = Date.now();
    const proposalId = `mod_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🔍 修正提案生成開始:', changeDescription);
    
    // 修正前にバックアップを作成
    BackupService.createAutoBackup(
      currentData, 
      '修正提案生成前のバックアップ',
      proposalId
    );
    
    const request: ModificationRequest = {
      changeDescription,
      context: currentData,
      timestamp
    };

    try {
      // AI に修正提案を依頼（専用プロンプトを使用）
      const systemPrompt = this.createModificationSystemPrompt(currentData);
      const response = await this.generateModificationResponse(systemPrompt, changeDescription);
      
      // AI応答から提案を解析
      const proposal = this.parseModificationResponse(response, request, proposalId);
      
      console.log('✅ 修正提案生成完了:', proposal.summary);
      return proposal;
      
    } catch (error) {
      console.error('❌ 修正提案生成エラー:', error);
      
      // エラー時はフォールバック提案を生成
      return this.createFallbackProposal(request, proposalId);
    }
  }

  /**
   * 修正提案用システムプロンプト作成
   */
  private static createModificationSystemPrompt(currentData: WebUIData): string {
    return `
あなたは設計書修正の専門家です。ユーザーの変更要求を分析し、現在の設計書をどう修正すべきか具体的な提案をしてください。

現在の設計書状況:
- 表示条件: ${currentData.conditionsMarkdown?.length || 0}文字
- 補足説明: ${currentData.supplementMarkdown?.length || 0}文字
- スプレッドシート: ${currentData.spreadsheetData?.[0]?.celldata?.length || 0}セル
- 画面イメージ: ${currentData.mockupImage ? 'あり' : 'なし'}
- Mermaid ER図: ${currentData.mermaidCode?.length || 0}文字

### 現在のMermaid ER図コード:
\`\`\`
${currentData.mermaidCode || '（未設定）'}
\`\`\`

## 応答形式（必須）
必ず以下のJSON形式で応答してください：

\`\`\`json
{
  "summary": "変更概要の簡潔な説明",
  "changes": [
    {
      "target": "conditions",
      "action": "add", 
      "location": "末尾",
      "newContent": "追加する具体的な内容",
      "reason": "変更理由",
      "confidence": 0.85
    }
  ],
  "risks": ["潜在的なリスク1", "潜在的なリスク2"]
}
\`\`\`

## 重要な指針
1. **JSON形式必須**: 上記の形式以外では応答しないでください
2. **ターゲット指定**: target は "conditions", "supplement", "spreadsheet", "mermaid" のみ使用
3. **安全性優先**: 既存データを壊さない修正方法を提案
4. **具体性**: 変更位置と内容を明確に指定
5. **理由明示**: なぜその変更が必要かを説明

## Mermaid ER図記法（mermaidターゲット使用時）
ER図、データモデル、エンティティ関係に関する要求の場合は target: "mermaid" を使用し、以下の記法で記述してください：

\`\`\`
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
\`\`\`

必ずJSON形式で応答してください。
`;
  }

  /**
   * 修正提案専用のAI応答生成（MCP経由）
   */
  private static async generateModificationResponse(systemPrompt: string, userPrompt: string): Promise<string> {
    const { mcpClient } = await import('./mcpClient');
    
    try {
      console.log('🔄 MCP経由で修正提案生成開始...');
      
      const mcpResult = await mcpClient.generateModificationProposal({
        system_prompt: systemPrompt,
        user_prompt: userPrompt,
        project_context: {
          name: '現在のプロジェクト',
          id: 'default'
        }
      });
      
      console.log('✅ MCP修正提案生成成功');
      return mcpResult.response;
      
    } catch (error) {
      console.error('❌ MCP修正提案生成エラー:', error);
      
      // MCPサーバーエラー時は明確なエラーメッセージを返す
      throw new Error(`MCP修正提案生成失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  /**
   * AI応答から修正提案をパース
   */
  private static parseModificationResponse(
    response: string, 
    request: ModificationRequest,
    proposalId: string
  ): ModificationProposal {
    console.log('🔍 AI応答解析開始');
    
    try {
      // JSONブロックを検索
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('JSON形式の応答が見つかりません');
      }
      
      const parsedData = JSON.parse(jsonMatch[1]);
      
      // 提案データの検証と正規化
      const changes: ProposedChange[] = (parsedData.changes || []).map((change: any) => ({
        target: change.target || 'conditions',
        action: change.action || 'modify',
        location: change.location || '',
        originalContent: change.originalContent || '',
        newContent: change.newContent || '',
        reason: change.reason || '理由不明',
        confidence: Math.min(Math.max(change.confidence || 0.5, 0), 1)
      }));
      
      return {
        id: proposalId,
        request,
        changes,
        summary: parsedData.summary || '設計書の修正提案',
        risks: parsedData.risks || [],
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error('❌ AI応答解析エラー:', error);
      return this.createFallbackProposal(request, proposalId);
    }
  }

  /**
   * フォールバック提案生成（AI失敗時）
   */
  private static createFallbackProposal(
    request: ModificationRequest,
    proposalId: string
  ): ModificationProposal {
    console.log('🔄 フォールバック提案を生成');
    
    return {
      id: proposalId,
      request,
      changes: [{
        target: 'conditions',
        action: 'add',
        location: '末尾',
        newContent: `\n\n## ユーザー要求\n${request.changeDescription}\n\n*この変更要求は手動で処理してください。*`,
        reason: 'AI解析失敗のため手動処理が必要',
        confidence: 0.1
      }],
      summary: 'AI解析失敗 - 手動処理が必要な変更要求',
      risks: ['自動処理できないため、手動での検証と実装が必要'],
      timestamp: Date.now()
    };
  }

  /**
   * 修正提案を実際のデータに適用
   */
  static applyModificationProposal(
    proposal: ModificationProposal,
    currentData: WebUIData
  ): { success: boolean; updatedData?: WebUIData; errors: string[] } {
    console.log('🔄 修正提案適用開始:', proposal.summary);
    
    const errors: string[] = [];
    const updatedData: WebUIData = JSON.parse(JSON.stringify(currentData)); // ディープコピー
    
    try {
      // 適用前に安全バックアップ
      BackupService.createAutoBackup(
        currentData,
        '修正提案適用前のバックアップ',
        proposal.id
      );
      
      // 各変更を順次適用
      for (const change of proposal.changes) {
        try {
          this.applyIndividualChange(change, updatedData);
          console.log(`✅ 変更適用成功: ${change.target} - ${change.action}`);
        } catch (error) {
          const errorMsg = `変更適用失敗 (${change.target}): ${error}`;
          console.error('❌', errorMsg);
          errors.push(errorMsg);
        }
      }
      
      if (errors.length === 0) {
        console.log('✅ 全ての変更が正常に適用されました');
        return { success: true, updatedData, errors: [] };
      } else {
        console.warn('⚠️ 一部の変更で問題が発生しました');
        return { success: false, updatedData, errors };
      }
      
    } catch (error) {
      console.error('❌ 修正提案適用エラー:', error);
      return { 
        success: false, 
        errors: [`修正提案の適用に失敗しました: ${error}`] 
      };
    }
  }

  /**
   * 個別の変更をデータに適用
   */
  private static applyIndividualChange(change: ProposedChange, data: WebUIData): void {
    switch (change.target) {
      case 'conditions':
        this.applyMarkdownChange(change, data, 'conditionsMarkdown');
        break;
      case 'supplement':
      case 'supplementary': // supplementaryも対応
        this.applyMarkdownChange(change, data, 'supplementMarkdown');
        break;
      case 'spreadsheet':
        this.applySpreadsheetChange(change, data);
        break;
      case 'mermaid':
        console.log('🎯 Mermaid変更適用開始:', change);
        this.applyMermaidChange(change, data);
        console.log('✅ Mermaid変更適用完了:', data.mermaidCode?.substring(0, 100));
        break;
      default:
        throw new Error(`未対応のターゲット: ${change.target}`);
    }
  }

  /**
   * Markdownの変更を適用
   */
  private static applyMarkdownChange(
    change: ProposedChange, 
    data: WebUIData, 
    field: 'conditionsMarkdown' | 'supplementMarkdown'
  ): void {
    const currentContent = data[field] || '';
    
    switch (change.action) {
      case 'add':
        // ハイライト付きで追加
        const highlightedContent = `**[DRAFT]** ${change.newContent} **(AI追加)**`;
        data[field] = currentContent + '\n\n' + highlightedContent;
        break;
        
      case 'modify':
        if (change.originalContent && currentContent.includes(change.originalContent)) {
          // 既存内容を置換（ハイライト付き）
          const modifiedContent = `**[DRAFT]** ${change.newContent} **(AI修正)**`;
          data[field] = currentContent.replace(change.originalContent, modifiedContent);
        } else {
          // 見つからない場合は末尾に追加
          const highlightedContent = `**[DRAFT]** ${change.newContent} **(AI修正)**`;
          data[field] = currentContent + '\n\n' + highlightedContent;
        }
        break;
        
      case 'delete':
        if (change.originalContent && currentContent.includes(change.originalContent)) {
          // 削除マーカー付きで残す
          const deletionMarker = `~~${change.originalContent}~~ **(AI削除提案)**`;
          data[field] = currentContent.replace(change.originalContent, deletionMarker);
        }
        break;
    }
  }

  /**
   * Mermaidコードの変更を適用
   */
  private static applyMermaidChange(change: ProposedChange, data: WebUIData): void {
    const currentContent = data.mermaidCode || '';
    
    switch (change.action) {
      case 'add':
        // 既存のMermaidコードに追加
        if (currentContent.trim()) {
          // 既存コードがある場合、適切な位置に追加
          if (currentContent.includes('erDiagram')) {
            // ER図の場合、新しいエンティティや関係を追加
            data.mermaidCode = currentContent + '\n\n' + change.newContent;
          } else {
            // 新しい図表として追加
            data.mermaidCode = currentContent + '\n\n' + change.newContent;
          }
        } else {
          // 新規作成
          data.mermaidCode = change.newContent;
        }
        break;
        
      case 'modify':
        if (change.originalContent && currentContent.includes(change.originalContent)) {
          // 既存内容を置換
          data.mermaidCode = currentContent.replace(change.originalContent, change.newContent);
        } else {
          // 見つからない場合は全体を更新
          data.mermaidCode = change.newContent;
        }
        break;
        
      case 'delete':
        if (change.originalContent && currentContent.includes(change.originalContent)) {
          // 指定された部分を削除
          data.mermaidCode = currentContent.replace(change.originalContent, '');
        } else {
          // 全体クリア
          data.mermaidCode = '';
        }
        break;
    }
  }

  /**
   * スプレッドシートの変更を適用（基本実装）
   */
  private static applySpreadsheetChange(change: ProposedChange, data: WebUIData): void {
    // スプレッドシートの変更は複雑なため、基本的な実装のみ
    // 詳細は今後のフェーズで拡張
    
    if (!data.spreadsheetData || data.spreadsheetData.length === 0) {
      data.spreadsheetData = [{
        name: 'AI修正シート',
        celldata: [],
        row: 1,
        column: 1
      }];
    }
    
    // 簡単な追加処理（行の末尾に追加）
    if (change.action === 'add') {
      const sheet = data.spreadsheetData[0];
      const nextRow = (sheet.celldata || []).length > 0 
        ? Math.max(...sheet.celldata.map((cell: any) => cell.r)) + 1 
        : 0;
      
      // 新しいセルを追加（仮実装）
      const newCell = {
        r: nextRow,
        c: 0,
        v: { 
          v: `[DRAFT] ${change.newContent}`,
          ct: { t: 'inlineStr' }
        }
      };
      
      sheet.celldata = sheet.celldata || [];
      sheet.celldata.push(newCell);
      sheet.row = Math.max(sheet.row || 1, nextRow + 1);
    }
  }

  /**
   * 変更前後の差分を計算
   */
  static calculateDiff(originalData: WebUIData, modifiedData: WebUIData): DiffResult[] {
    const results: DiffResult[] = [];
    
    // Markdownの差分計算
    const conditionsDiff = this.calculateMarkdownDiff(
      originalData.conditionsMarkdown || '',
      modifiedData.conditionsMarkdown || ''
    );
    if (conditionsDiff.hasChanges) {
      results.push({ target: 'conditions', ...conditionsDiff });
    }
    
    const supplementDiff = this.calculateMarkdownDiff(
      originalData.supplementMarkdown || '',
      modifiedData.supplementMarkdown || ''
    );
    if (supplementDiff.hasChanges) {
      results.push({ target: 'supplement', ...supplementDiff });
    }
    
    // スプレッドシートの差分は今後実装
    
    return results;
  }

  /**
   * Markdownテキストの差分計算（シンプル版）
   */
  private static calculateMarkdownDiff(original: string, modified: string): Omit<DiffResult, 'target'> {
    if (original === modified) {
      return {
        hasChanges: false,
        additions: [],
        modifications: [],
        deletions: []
      };
    }
    
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    
    const additions: string[] = [];
    const modifications: string[] = [];
    const deletions: string[] = [];
    
    // 簡単な差分検出（完全一致ベース）
    modifiedLines.forEach(line => {
      if (!originalLines.includes(line)) {
        if (line.includes('[DRAFT]') || line.includes('**(AI')) {
          additions.push(line);
        } else {
          modifications.push(line);
        }
      }
    });
    
    originalLines.forEach(line => {
      if (!modifiedLines.includes(line)) {
        deletions.push(line);
      }
    });
    
    return {
      hasChanges: additions.length > 0 || modifications.length > 0 || deletions.length > 0,
      additions,
      modifications,
      deletions
    };
  }
}