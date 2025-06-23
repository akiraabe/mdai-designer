import JSZip from 'jszip';
import type { Document } from '../types';
import { convertProjectToMarkdown } from './markdownExport';

/**
 * プロジェクトをMarkdown+画像のZIPファイルとしてエクスポート
 */
export const downloadProjectAsZip = async (
  projectName: string,
  projectDescription: string,
  documents: Document[]
): Promise<void> => {
  console.log('📦 ZIP形式エクスポート開始:', projectName);
  
  try {
    const zip = new JSZip();
    
    // AI生成画像のマップを作成
    const aiGeneratedImages: Record<string, string> = {};
    documents.forEach(doc => {
      if (doc.aiGeneratedImage) {
        aiGeneratedImages[doc.id] = doc.aiGeneratedImage;
      }
    });
    
    // Markdownを生成（画像はファイル参照形式）
    const markdownContent = generateMarkdownWithImageRefs(
      projectName,
      projectDescription,
      documents,
      aiGeneratedImages
    );
    
    // Markdownファイルを追加
    zip.file(`${projectName}_設計書.md`, markdownContent);
    
    // imagesフォルダを作成
    const imagesFolder = zip.folder('images');
    
    // 各設計書の画像を追加
    documents.forEach(doc => {
      // アップロード画像
      if (doc.mockup) {
        const fileName = `${sanitizeFileName(doc.name)}_mockup.png`;
        imagesFolder?.file(fileName, doc.mockup, { base64: true });
        console.log(`📸 アップロード画像追加: ${fileName}`);
      }
      
      // AI生成画像
      if (doc.aiGeneratedImage) {
        const fileName = `${sanitizeFileName(doc.name)}_ai_generated.png`;
        imagesFolder?.file(fileName, doc.aiGeneratedImage, { base64: true });
        console.log(`🤖 AI生成画像追加: ${fileName}`);
      }
    });
    
    // ZIPファイルを生成
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // ダウンロード
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_設計書.zip`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ ZIP形式エクスポート完了');
  } catch (error) {
    console.error('❌ ZIP形式エクスポートエラー:', error);
    throw error;
  }
};

/**
 * 画像をファイル参照形式にしたMarkdownを生成
 */
const generateMarkdownWithImageRefs = (
  projectName: string,
  projectDescription: string,
  documents: Document[],
  aiGeneratedImages: Record<string, string>
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
      
      // アップロード画像
      if (doc.mockup) {
        const fileName = `${sanitizeFileName(doc.name)}_mockup.png`;
        markdown += `**アップロード画像:**\n`;
        markdown += `![${doc.name}画面モックアップ](./images/${fileName})\n\n`;
      }
      
      // AI生成画像
      const aiImage = aiGeneratedImages[doc.id];
      if (aiImage) {
        const fileName = `${sanitizeFileName(doc.name)}_ai_generated.png`;
        markdown += `**AI生成画面イメージ:**\n`;
        markdown += `![${doc.name}AI生成画面イメージ](./images/${fileName})\n\n`;
      }
      
      // 画像がない場合
      if (!doc.mockup && !aiImage) {
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
  
  // メタデータ
  markdown += `## 📄 エクスポート情報\n\n`;
  markdown += `- **ツール**: mdai-designer\n`;
  markdown += `- **形式**: プロジェクト統合設計書（ZIP版）\n`;
  markdown += `- **生成日時**: ${new Date().toISOString()}\n`;
  markdown += `- **総設計書数**: ${documents.length}件\n`;
  if (screenDocuments.length > 0) markdown += `  - 画面設計書: ${screenDocuments.length}件\n`;
  if (modelDocuments.length > 0) markdown += `  - データモデル設計書: ${modelDocuments.length}件\n`;
  
  const totalImages = documents.filter(d => d.mockup).length + Object.keys(aiGeneratedImages).length;
  if (totalImages > 0) {
    markdown += `- **画像ファイル数**: ${totalImages}件\n`;
    markdown += `  - アップロード画像: ${documents.filter(d => d.mockup).length}件\n`;
    markdown += `  - AI生成画像: ${Object.keys(aiGeneratedImages).length}件\n`;
  }
  
  return markdown;
};

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
 * ファイル名をサニタイズ
 */
const sanitizeFileName = (name: string): string => {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')  // 無効な文字を_に置換
    .replace(/\s+/g, '_')           // スペースを_に置換
    .substring(0, 100);             // 長さ制限
};