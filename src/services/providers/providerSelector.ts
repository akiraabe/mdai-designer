// src/services/providers/providerSelector.ts
// AIプロバイダー選択ロジック

import { AIProvider } from '../../types/aiTypes';

/**
 * 利用可能なプロバイダーを優先順位で選択
 * 1. Amazon Bedrock (優先)
 * 2. OpenAI (フォールバック)
 */
export const selectProvider = (): AIProvider => {
  // Bedrock認証情報の確認
  const hasBedrockKeys = !!(
    import.meta.env.VITE_AWS_ACCESS_KEY_ID && 
    import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
  );
  
  // OpenAI認証情報の確認
  const hasOpenAIKey = !!import.meta.env.VITE_OPENAI_API_KEY;
  
  // セキュリティ警告
  if (hasBedrockKeys) {
    console.warn('⚠️ AWS認証情報がフロントエンドに設定されています');
    console.warn('🔒 本番環境ではプロキシサーバーの使用を推奨します');
  }
  
  // プロバイダー選択
  if (hasBedrockKeys) {
    console.log('🚀 Amazon Bedrock を使用します');
    return AIProvider.BEDROCK;
  } else if (hasOpenAIKey) {
    console.log('🔄 OpenAI を使用します (Bedrockキーなし)');
    return AIProvider.OPENAI;
  } else {
    console.error('❌ AIプロバイダーのAPIキーが設定されていません');
    throw new Error(
      'AIプロバイダーのAPIキーが設定されていません。\n' +
      '.env.local に以下のいずれかを設定してください:\n' +
      '- VITE_AWS_ACCESS_KEY_ID & VITE_AWS_SECRET_ACCESS_KEY (Bedrock)\n' +
      '- VITE_OPENAI_API_KEY (OpenAI)'
    );
  }
};

/**
 * 指定プロバイダーの利用可能性をチェック
 */
export const checkProviderAvailability = (provider: AIProvider): boolean => {
  switch (provider) {
    case AIProvider.BEDROCK:
      return !!(
        import.meta.env.VITE_AWS_ACCESS_KEY_ID && 
        import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
      );
    case AIProvider.OPENAI:
      return !!import.meta.env.VITE_OPENAI_API_KEY;
    default:
      return false;
  }
};

/**
 * 全プロバイダーの利用可能性レポート
 */
export const getProviderStatus = () => {
  const bedrock = checkProviderAvailability(AIProvider.BEDROCK);
  const openai = checkProviderAvailability(AIProvider.OPENAI);
  
  return {
    bedrock: {
      available: bedrock,
      status: bedrock ? '✅ 利用可能' : '❌ APIキー未設定'
    },
    openai: {
      available: openai,
      status: openai ? '✅ 利用可能' : '❌ APIキー未設定'
    },
    recommended: bedrock ? 'bedrock' : openai ? 'openai' : 'none'
  };
};