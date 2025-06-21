import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright設定ファイル - 設計書エディタE2Eテスト
 */
export default defineConfig({
  // テストディレクトリ（新しい構造に更新）
  testDir: './current',
  
  // 並列実行を無効化（リソース軽減）
  fullyParallel: false,
  
  // 失敗時のリトライ回数
  retries: 1,
  
  // 各テストのタイムアウト
  timeout: 60000, // 60秒
  
  // レポート設定
  reporter: [
    ['html', { outputFolder: 'test-results' }],
    ['list']
  ],
  
  // グローバル設定
  use: {
    // ベースURL（開発サーバー）
    baseURL: 'http://localhost:5173',
    
    // スクリーンショット設定
    screenshot: 'only-on-failure',
    
    // 動画録画（失敗時のみ）
    video: 'retain-on-failure',
    
    // ブラウザトレース（デバッグ用）
    trace: 'on-first-retry',
  },

  // ブラウザ設定
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // フルページスクリーンショット用の大きなビューポート
        viewport: { width: 1920, height: 1080 }
      },
    },
  ],

  // 開発サーバーの自動起動（オプション）
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    cwd: '../', // メインプロジェクトディレクトリ
  },
});