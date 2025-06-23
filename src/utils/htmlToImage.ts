import html2canvas from 'html2canvas';

/**
 * HTML文字列を画像（Base64）に変換するユーティリティ
 */

/**
 * HTMLコンテンツを画像として変換
 * @param htmlContent HTML文字列（CSS含む）
 * @param options 変換オプション
 * @returns Base64形式の画像データ
 */
export const convertHtmlToImage = async (
  htmlContent: string,
  options: {
    width?: number;
    height?: number;
    backgroundColor?: string;
  } = {}
): Promise<string> => {
  const {
    width = 800,
    height = 600,
    backgroundColor = '#ffffff'
  } = options;

  console.log('🖼️ HTML→画像変換開始');
  console.log('📐 変換設定:', { width, height, backgroundColor });

  // 一時的なコンテナ要素を作成
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.top = '-9999px';
  tempContainer.style.left = '-9999px';
  tempContainer.style.width = `${width}px`;
  tempContainer.style.height = `${height}px`;
  tempContainer.style.backgroundColor = backgroundColor;
  tempContainer.style.overflow = 'hidden';
  tempContainer.style.padding = '16px';
  tempContainer.style.boxSizing = 'border-box';
  
  console.log('📦 一時コンテナを作成しました:', {
    width: tempContainer.style.width,
    height: tempContainer.style.height,
    background: tempContainer.style.backgroundColor
  });

  try {
    console.log('🔧 Step A: HTMLコンテンツを挿入開始...');
    // HTMLコンテンツを挿入
    tempContainer.innerHTML = htmlContent;
    const elementCount = tempContainer.querySelectorAll('*').length;
    console.log('📝 HTMLコンテンツを挿入しました。要素数:', elementCount);
    
    if (elementCount === 0) {
      throw new Error('HTMLコンテンツが空または無効です');
    }
    
    console.log('🔧 Step B: DOMに追加開始...');
    // DOMに一時的に追加
    document.body.appendChild(tempContainer);
    console.log('➕ 一時コンテナをDOMに追加しました');

    console.log('🔧 Step C: レンダリング待機開始...');
    // 少し待機してレンダリングを完了させる
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('⏱️ レンダリング待機完了');

    console.log('🔧 Step D: html2canvasライブラリ確認...');
    if (typeof html2canvas === 'undefined') {
      throw new Error('html2canvasライブラリが読み込まれていません');
    }
    console.log('✅ html2canvasライブラリ確認完了');

    // html2canvasでキャプチャ
    console.log('📸 html2canvasでキャプチャ開始...', {
      width,
      height,
      要素数: elementCount
    });
    
    const canvas = await html2canvas(tempContainer, {
      width: width,
      height: height,
      useCORS: true,
      allowTaint: true,
      logging: false
    });
    
    console.log('📸 html2canvasキャプチャ完了:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      canvasExists: !!canvas
    });

    if (!canvas) {
      throw new Error('html2canvasでcanvasが生成されませんでした');
    }

    console.log('🔧 Step E: Base64変換開始...');
    // CanvasをBase64に変換
    const base64Image = canvas.toDataURL('image/png');
    console.log('🔄 Base64変換完了:', {
      dataURLLength: base64Image.length,
      hasDataPrefix: base64Image.startsWith('data:image/png;base64,')
    });
    
    if (!base64Image || base64Image.length < 100) {
      throw new Error('Base64変換結果が空または異常に小さいです');
    }
    
    console.log('✅ HTML→画像変換完了', {
      originalHtmlSize: htmlContent.length,
      base64ImageSize: base64Image.length,
      canvasDimensions: `${canvas.width}x${canvas.height}`,
      base64Preview: base64Image.substring(0, 50) + '...'
    });

    // data:image/png;base64, の部分を除去してBase64のみ返却
    const base64Only = base64Image.split(',')[1];
    console.log('📤 Base64データのみを返却:', base64Only?.length || 0, 'characters');
    
    if (!base64Only) {
      throw new Error('Base64データの分割に失敗しました');
    }
    
    return base64Only;

  } catch (error) {
    console.error('❌ HTML→画像変換エラー:', error);
    throw new Error(`HTML→画像変換に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  } finally {
    // 一時要素を削除
    if (document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
  }
};

/**
 * AI生成HTML+CSS専用の画像変換（シンプル版）
 * MockupSectionのHTML構造に最適化された設定
 */
export const convertAiMockupToImage = async (htmlContent: string): Promise<string> => {
  return convertHtmlToImage(htmlContent, {
    width: 1000,
    height: 1200, // 余裕を持った高さ
    backgroundColor: '#f9fafb'
  });
};

/**
 * HTML画像変換のプレビュー機能
 * 実際の変換前にサイズ等を確認
 */
export const previewHtmlImageConversion = (htmlContent: string): {
  estimatedSize: string;
  htmlLength: number;
  hasStyles: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
} => {
  const htmlLength = htmlContent.length;
  const hasStyles = htmlContent.includes('<style>') || htmlContent.includes('style=');
  
  // HTMLの複雑度を推定
  const elementCount = (htmlContent.match(/<[^/][^>]*>/g) || []).length;
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  
  if (elementCount > 50) {
    complexity = 'complex';
  } else if (elementCount > 20) {
    complexity = 'moderate';
  }

  // 推定画像サイズ（Base64）
  const estimatedImageSize = Math.round((1000 * 700 * 4 * 1.33) / 1024); // PNG推定
  const estimatedSize = estimatedImageSize > 1024 
    ? `${Math.round(estimatedImageSize / 1024)}MB` 
    : `${estimatedImageSize}KB`;

  return {
    estimatedSize,
    htmlLength,
    hasStyles,
    complexity
  };
};