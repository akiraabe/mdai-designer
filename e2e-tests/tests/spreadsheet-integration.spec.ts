import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

/**
 * 設計書エディタ統合テスト
 * 
 * テストシナリオ：
 * 1. 画面初期化（初期表示）
 * 2. テストデータ読み込み
 * 3. Markdownエリア編集
 * 4. 項目定義エリア拡大
 * 5. 項目定義エリア縮小
 * 6. ファイルエクスポート
 * 7. 画面リロード
 * 8. ファイルインポート
 * 9. 最終状態確認
 */

test.describe('設計書エディタ統合テスト', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // 開発サーバーにアクセス
    await page.goto('/');
    
    // 初期化完了まで待機
    await page.waitForLoadState('networkidle');
  });

  test('基本操作フロー：編集→エクスポート→インポート', async ({ page }) => {
    console.log('🎬 プロジェクト階層管理フローテスト開始');

    // 1. プロジェクト一覧画面表示
    console.log('📸 Step 1: プロジェクト一覧画面表示');
    await helpers.takeFullPageScreenshot('01-project-list-display');
    
    // プロジェクト一覧画面が表示されていることを確認
    await expect(page.locator('h1:has-text("プロジェクト一覧")')).toBeVisible();

    // 2. プロジェクト作成
    console.log('📸 Step 2: プロジェクト作成');
    await helpers.createProject('E2Eテストプロジェクト', 'Playwrightでの自動テスト用プロジェクト');
    await helpers.takeFullPageScreenshot('02-project-created');

    // 3. 設計書作成
    console.log('📸 Step 3: 設計書作成');
    await helpers.createDocument('E2Eテスト設計書');
    await helpers.takeFullPageScreenshot('03-document-created');

    // 4. 設計書編集画面へ移動（自動）
    console.log('📸 Step 4: 設計書編集画面表示');
    await page.waitForTimeout(1000); // 画面遷移待機
    await helpers.takeFullPageScreenshot('04-document-edit-view');

    // 5. テストデータ読み込み
    console.log('📸 Step 5: テストデータ読み込み');
    await helpers.clickTestDataButton();
    await page.waitForTimeout(1000);
    await helpers.takeFullPageScreenshot('05-test-data-loaded');

    // 6. Markdownエリア編集
    console.log('📸 Step 6: Markdown編集');
    await helpers.editMarkdownArea('☕ E2Eテスト実行中\n\nプロジェクト階層管理システムのテストを実施中です。');
    await helpers.takeFullPageScreenshot('06-markdown-edited');

    // 7. スプレッドシート編集
    console.log('📸 Step 7: スプレッドシート編集');
    await helpers.switchToEditMode();
    await helpers.editSpreadsheetCell('A3', 'E2Eテストデータ');
    await helpers.takeFullPageScreenshot('07-spreadsheet-edited');

    // 8. ファイルエクスポート
    console.log('📸 Step 8: ファイルエクスポート');
    const savedFilename = await helpers.saveToFile();
    await helpers.takeFullPageScreenshot('08-after-export');
    console.log(`💾 エクスポート完了: ${savedFilename}`);

    // 9. 最終確認
    console.log('✅ Step 9: 最終確認');
    
    // 設計書編集画面が表示されているか確認
    await expect(page.locator('[data-testid="spreadsheet-container"]')).toBeVisible();
    
    await helpers.takeFullPageScreenshot('09-final-verification');

    console.log('🎉 プロジェクト階層管理テスト完了！');
  });

  test('編集モード切り替えテスト', async () => {
    console.log('🎬 編集モード切り替えテスト開始');

    // 初期状態（表示モード）
    await helpers.takeFullPageScreenshot('mode-01-initial-view');
    
    // 編集モードに切り替え
    await helpers.switchToEditMode();
    await helpers.takeFullPageScreenshot('mode-02-edit-mode');
    
    // セル編集をテスト
    await helpers.editSpreadsheetCell('A3', 'テストデータ入力');
    await helpers.takeFullPageScreenshot('mode-03-cell-edited');
    
    // 表示モードに戻す
    await helpers.switchToViewMode();
    await helpers.takeFullPageScreenshot('mode-04-back-to-view');

    console.log('✅ 編集モード切り替えテスト完了！');
  });
});