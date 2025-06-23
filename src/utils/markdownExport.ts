import type { Document } from '../types';

/**
 * 設計書をMarkdown形式で書き起こしするユーティリティ関数
 */

/**
 * スプレッドシートデータをMarkdownテーブルに変換
 */
const convertSpreadsheetToMarkdownTable = (spreadsheetData: unknown[]): string => {
  if (!spreadsheetData || spreadsheetData.length === 0) {
    return '| 項目名 | 型 | 必須 | 説明 |\n|--------|----|----|------|\n| データなし | - | - | - |';
  }

  // Fortune-Sheetのcelldata形式を解析
  const sheet = spreadsheetData[0] as Record<string, unknown>;
  if (!sheet || !sheet.celldata) {
    return '| 項目名 | 型 | 必須 | 説明 |\n|--------|----|----|------|\n| データなし | - | - | - |';
  }

  const cells = sheet.celldata as Record<string, unknown>[];
  const rows: string[][] = [];
  
  // セルデータから行列を構築
  cells.forEach((cell: Record<string, unknown>) => {
    const r = (cell.r as number) || 0;
    const c = (cell.c as number) || 0;
    const value = ((cell.v as Record<string, unknown>)?.v as string) || '';
    
    // 行が存在しない場合は初期化
    while (rows.length <= r) {
      rows.push([]);
    }
    // 列が存在しない場合は初期化
    while (rows[r].length <= c) {
      rows[r].push('');
    }
    
    rows[r][c] = String(value);
  });

  // 空の行は除外
  const validRows = rows.filter(row => row.some(cell => cell.trim() !== ''));
  
  if (validRows.length === 0) {
    return '| 項目名 | 型 | 必須 | 説明 |\n|--------|----|----|------|\n| データなし | - | - | - |';
  }

  // Markdownテーブル形式に変換
  let markdown = '';
  
  validRows.forEach((row, index) => {
    // 行の最大列数に合わせて空白で埋める
    const maxCols = Math.max(...validRows.map(r => r.length));
    const paddedRow = [...row];
    while (paddedRow.length < maxCols) {
      paddedRow.push('');
    }
    
    const markdownRow = '| ' + paddedRow.map(cell => cell || '-').join(' | ') + ' |';
    markdown += markdownRow + '\n';
    
    // ヘッダー行の後に区切り線を追加
    if (index === 0) {
      const separator = '|' + paddedRow.map(() => '--------').join('|') + '|';
      markdown += separator + '\n';
    }
  });

  return markdown.trim();
};

/**
 * 画面設計書をMarkdown形式に変換
 */
export const convertScreenDocumentToMarkdown = (document: Document): string => {
  const { name, conditions, supplement, spreadsheet, mockup } = document;
  
  let markdown = `# ${name}\n\n`;
  markdown += `> 画面設計書\n\n`;
  markdown += `**作成日時**: ${new Date().toLocaleString('ja-JP')}\n\n`;
  
  // 表示条件
  markdown += `## 📋 表示条件\n\n`;
  if (conditions && conditions.trim()) {
    markdown += `${conditions}\n\n`;
  } else {
    markdown += `特になし\n\n`;
  }
  
  // 項目定義
  markdown += `## 📊 項目定義\n\n`;
  const tableMarkdown = convertSpreadsheetToMarkdownTable(spreadsheet);
  markdown += `${tableMarkdown}\n\n`;
  
  // 画面イメージ
  markdown += `## 🖼️ 画面イメージ\n\n`;
  if (mockup) {
    markdown += `![画面モックアップ](data:image/png;base64,${mockup})\n\n`;
  } else {
    markdown += `画像なし\n\n`;
  }
  
  // 補足説明
  markdown += `## 📝 補足説明\n\n`;
  if (supplement && supplement.trim()) {
    markdown += `${supplement}\n\n`;
  } else {
    markdown += `特になし\n\n`;
  }
  
  // メタデータ
  markdown += `---\n\n`;
  markdown += `**エクスポート情報**\n`;
  markdown += `- ツール: mdai-designer\n`;
  markdown += `- 形式: 画面設計書\n`;
  markdown += `- 生成日時: ${new Date().toISOString()}\n`;
  
  return markdown;
};

/**
 * データモデル設計書をMarkdown形式に変換
 */
export const convertModelDocumentToMarkdown = (document: Document): string => {
  const { name, supplement, mermaidCode } = document;
  
  let markdown = `# ${name}\n\n`;
  markdown += `> データモデル設計書\n\n`;
  markdown += `**作成日時**: ${new Date().toLocaleString('ja-JP')}\n\n`;
  
  // ER図（Mermaid記法）
  markdown += `## 🗄️ ER図\n\n`;
  if (mermaidCode && mermaidCode.trim()) {
    markdown += `\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n\n`;
    
    // エンティティ分析
    const entities = extractEntitiesFromMermaid(mermaidCode);
    if (entities.length > 0) {
      markdown += `## 📋 エンティティ一覧\n\n`;
      entities.forEach((entity, index) => {
        markdown += `### ${index + 1}. ${entity.name}\n\n`;
        if (entity.fields.length > 0) {
          markdown += `**フィールド:**\n\n`;
          markdown += `| フィールド名 | 型 | 制約 |\n`;
          markdown += `|-------------|-------|------|\n`;
          entity.fields.forEach(field => {
            const constraints = [];
            if (field.primaryKey) constraints.push('PK');
            if (field.foreignKey) constraints.push('FK');
            if (field.nullable === false) constraints.push('NOT NULL');
            
            markdown += `| ${field.name} | ${field.type} | ${constraints.join(', ') || '-'} |\n`;
          });
          markdown += `\n`;
        }
      });
    }
  } else {
    markdown += `ER図なし\n\n`;
  }
  
  // 補足説明
  markdown += `## 📝 補足説明\n\n`;
  if (supplement && supplement.trim()) {
    markdown += `${supplement}\n\n`;
  } else {
    markdown += `特になし\n\n`;
  }
  
  // メタデータ
  markdown += `---\n\n`;
  markdown += `**エクスポート情報**\n`;
  markdown += `- ツール: mdai-designer\n`;
  markdown += `- 形式: データモデル設計書\n`;
  markdown += `- 生成日時: ${new Date().toISOString()}\n`;
  
  return markdown;
};

/**
 * Mermaid ER図からエンティティ情報を抽出
 */
interface EntityField {
  name: string;
  type: string;
  primaryKey?: boolean;
  foreignKey?: boolean;
  nullable?: boolean;
}

interface EntityInfo {
  name: string;
  fields: EntityField[];
}

const extractEntitiesFromMermaid = (mermaidCode: string): EntityInfo[] => {
  const entities: EntityInfo[] = [];
  const lines = mermaidCode.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // エンティティ定義の行を検出（例: USER { ... }）
    const entityMatch = trimmed.match(/^(\w+)\s*\{/);
    if (entityMatch) {
      const entityName = entityMatch[1];
      const entity: EntityInfo = {
        name: entityName,
        fields: []
      };
      
      // フィールド行を検索
      const fieldMatches = trimmed.match(/\{(.+)\}/);
      if (fieldMatches) {
        const fieldsStr = fieldMatches[1];
        // 簡単なフィールド解析（実際の形式に応じて調整が必要）
        const fields = fieldsStr.split(',').map(f => f.trim()).filter(f => f);
        
        fields.forEach(fieldStr => {
          const parts = fieldStr.split(/\s+/);
          if (parts.length >= 2) {
            entity.fields.push({
              name: parts[1] || parts[0],
              type: parts[0],
              primaryKey: fieldStr.includes('PK'),
              foreignKey: fieldStr.includes('FK'),
              nullable: !fieldStr.includes('NOT NULL')
            });
          }
        });
      }
      
      entities.push(entity);
    }
  }
  
  return entities;
};

/**
 * プロジェクト全体をMarkdown形式に変換
 */
export const convertProjectToMarkdown = (
  projectName: string,
  projectDescription: string,
  documents: Document[]
): string => {
  let markdown = `# ${projectName} 設計書\n\n`;
  
  // プロジェクト概要
  markdown += `## 📋 プロジェクト概要\n\n`;
  markdown += `**プロジェクト名**: ${projectName}\n`;
  if (projectDescription && projectDescription.trim()) {
    markdown += `**説明**: ${projectDescription}\n`;
  }
  markdown += `**作成日時**: ${new Date().toLocaleString('ja-JP')}\n`;
  markdown += `**設計書数**: ${documents.length}件\n\n`;
  
  // 設計書タイプ別に分類
  const screenDocuments = documents.filter(doc => doc.type === 'screen');
  const modelDocuments = documents.filter(doc => doc.type === 'model');
  const apiDocuments = documents.filter(doc => doc.type === 'api');
  const databaseDocuments = documents.filter(doc => doc.type === 'database');
  
  // 画面設計書セクション
  if (screenDocuments.length > 0) {
    markdown += `## 🖥️ 画面設計書 (${screenDocuments.length}件)\n\n`;
    
    screenDocuments.forEach((doc, index) => {
      markdown += `### ${index + 1}. ${doc.name}\n\n`;
      
      // 表示条件
      markdown += `#### 📋 表示条件\n`;
      if (doc.conditions && doc.conditions.trim()) {
        markdown += `${doc.conditions}\n\n`;
      } else {
        markdown += `特になし\n\n`;
      }
      
      // 項目定義
      markdown += `#### 📊 項目定義\n`;
      const tableMarkdown = convertSpreadsheetToMarkdownTable(doc.spreadsheet || []);
      markdown += `${tableMarkdown}\n\n`;
      
      // 画面イメージ
      markdown += `#### 🖼️ 画面イメージ\n`;
      if (doc.mockup) {
        markdown += `![${doc.name}画面モックアップ](data:image/png;base64,${doc.mockup})\n\n`;
      } else {
        markdown += `画像なし\n\n`;
      }
      
      // 補足説明
      markdown += `#### 📝 補足説明\n`;
      if (doc.supplement && doc.supplement.trim()) {
        markdown += `${doc.supplement}\n\n`;
      } else {
        markdown += `特になし\n\n`;
      }
      
      markdown += `---\n\n`;
    });
  }
  
  // データモデル設計書セクション
  if (modelDocuments.length > 0) {
    markdown += `## 🗄️ データモデル設計書 (${modelDocuments.length}件)\n\n`;
    
    modelDocuments.forEach((doc, index) => {
      markdown += `### ${index + 1}. ${doc.name}\n\n`;
      
      // ER図
      markdown += `#### 🗄️ ER図\n`;
      if (doc.mermaidCode && doc.mermaidCode.trim()) {
        markdown += `\`\`\`mermaid\n${doc.mermaidCode}\n\`\`\`\n\n`;
        
        // エンティティ分析
        const entities = extractEntitiesFromMermaid(doc.mermaidCode);
        if (entities.length > 0) {
          markdown += `#### 📋 エンティティ一覧\n\n`;
          entities.forEach((entity, entityIndex) => {
            markdown += `##### ${entityIndex + 1}. ${entity.name}\n\n`;
            if (entity.fields.length > 0) {
              markdown += `**フィールド:**\n\n`;
              markdown += `| フィールド名 | 型 | 制約 |\n`;
              markdown += `|-------------|-------|------|\n`;
              entity.fields.forEach(field => {
                const constraints = [];
                if (field.primaryKey) constraints.push('PK');
                if (field.foreignKey) constraints.push('FK');
                if (field.nullable === false) constraints.push('NOT NULL');
                
                markdown += `| ${field.name} | ${field.type} | ${constraints.join(', ') || '-'} |\n`;
              });
              markdown += `\n`;
            }
          });
        }
      } else {
        markdown += `ER図なし\n\n`;
      }
      
      // 補足説明
      markdown += `#### 📝 補足説明\n`;
      if (doc.supplement && doc.supplement.trim()) {
        markdown += `${doc.supplement}\n\n`;
      } else {
        markdown += `特になし\n\n`;
      }
      
      markdown += `---\n\n`;
    });
  }
  
  // API設計書セクション（実装予定）
  if (apiDocuments.length > 0) {
    markdown += `## 🔌 API設計書 (${apiDocuments.length}件)\n\n`;
    markdown += `*API設計書機能は現在開発中です。*\n\n`;
    apiDocuments.forEach((doc, index) => {
      markdown += `### ${index + 1}. ${doc.name}\n`;
      markdown += `設計書タイプ: API設計書（未実装）\n\n`;
    });
    markdown += `---\n\n`;
  }
  
  // データベース設計書セクション（実装予定）
  if (databaseDocuments.length > 0) {
    markdown += `## 🗃️ データベース設計書 (${databaseDocuments.length}件)\n\n`;
    markdown += `*データベース設計書機能は現在開発中です。*\n\n`;
    databaseDocuments.forEach((doc, index) => {
      markdown += `### ${index + 1}. ${doc.name}\n`;
      markdown += `設計書タイプ: データベース設計書（未実装）\n\n`;
    });
    markdown += `---\n\n`;
  }
  
  // メタデータ
  markdown += `## 📄 エクスポート情報\n\n`;
  markdown += `- **ツール**: mdai-designer\n`;
  markdown += `- **形式**: プロジェクト統合設計書\n`;
  markdown += `- **生成日時**: ${new Date().toISOString()}\n`;
  markdown += `- **総設計書数**: ${documents.length}件\n`;
  if (screenDocuments.length > 0) markdown += `  - 画面設計書: ${screenDocuments.length}件\n`;
  if (modelDocuments.length > 0) markdown += `  - データモデル設計書: ${modelDocuments.length}件\n`;
  if (apiDocuments.length > 0) markdown += `  - API設計書: ${apiDocuments.length}件\n`;
  if (databaseDocuments.length > 0) markdown += `  - データベース設計書: ${databaseDocuments.length}件\n`;
  
  return markdown;
};

/**
 * プロジェクトをMarkdownファイルとしてダウンロード
 */
export const downloadProjectAsMarkdown = (
  projectName: string,
  projectDescription: string,
  documents: Document[]
): void => {
  console.log('📄 プロジェクト単位Markdownエクスポート開始:', projectName);
  
  const markdown = convertProjectToMarkdown(projectName, projectDescription, documents);
  const filename = `${projectName}_project-design.md`;
  
  // ファイルダウンロード
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  
  console.log(`📄 プロジェクト統合Markdownエクスポート完了: ${filename}`);
  console.log(`📊 エクスポート統計:`, {
    総設計書数: documents.length,
    画面設計書: documents.filter(d => d.type === 'screen').length,
    データモデル設計書: documents.filter(d => d.type === 'model').length,
  });
};

/**
 * 設計書をMarkdownファイルとしてダウンロード（既存機能・後方互換性用）
 */
export const downloadDocumentAsMarkdown = (document: Document): void => {
  let markdown: string;
  let filename: string;
  
  if (document.type === 'screen') {
    markdown = convertScreenDocumentToMarkdown(document);
    filename = `${document.name}_screen-design.md`;
  } else if (document.type === 'model') {
    markdown = convertModelDocumentToMarkdown(document);
    filename = `${document.name}_data-model.md`;
  } else {
    // その他のタイプは画面設計書として扱う
    markdown = convertScreenDocumentToMarkdown(document);
    filename = `${document.name}_design.md`;
  }
  
  // ファイルダウンロード
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  
  console.log(`📄 Markdownエクスポート完了: ${filename}`);
};