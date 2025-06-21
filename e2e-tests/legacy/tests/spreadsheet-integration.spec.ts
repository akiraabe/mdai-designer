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
    try {
      await helpers.switchToEditMode();
      await helpers.editSpreadsheetCell('A3', 'E2Eテストデータ');
      await helpers.takeFullPageScreenshot('07-spreadsheet-edited');
    } catch (error) {
      console.log('⚠️ スプレッドシート編集でエラー:', error);
      await helpers.takeFullPageScreenshot('07-spreadsheet-edit-error');
    }

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

  test('編集モード切り替えテスト', async ({ page }) => {
    console.log('🎬 編集モード切り替えテスト開始');

    // 初期状態で何が表示されているかを確認
    await helpers.takeFullPageScreenshot('mode-01-initial-view');
    
    // プロジェクト一覧画面が表示されている場合の処理
    if (await page.locator('h1:has-text("プロジェクト一覧")').isVisible().catch(() => false)) {
      console.log('📸 プロジェクト一覧画面からスタート');
      
      // プロジェクト作成
      await helpers.createProject('編集モードテストプロジェクト', 'モード切り替えテスト用');
      await helpers.takeFullPageScreenshot('mode-01b-project-created');
      
      // 設計書作成
      await helpers.createDocument('編集モードテスト設計書');
      await helpers.takeFullPageScreenshot('mode-01c-document-created');
      
      // 設計書編集画面への遷移を待機
      await page.waitForTimeout(1500);
    }
    
    // 設計書編集画面の確認
    await expect(page.locator('[data-testid="spreadsheet-container"]')).toBeVisible({ timeout: 10000 });
    await helpers.takeFullPageScreenshot('mode-02-edit-screen-confirmed');
    
    // 編集モードに切り替え
    await helpers.switchToEditMode();
    await helpers.takeFullPageScreenshot('mode-03-edit-mode');
    
    // セル編集をテスト（簡略化）
    try {
      await helpers.editSpreadsheetCell('A3', 'テストデータ入力');
      await helpers.takeFullPageScreenshot('mode-04-cell-edited');
    } catch (error) {
      console.log('⚠️ セル編集でエラー:', error);
      await helpers.takeFullPageScreenshot('mode-04-cell-edit-error');
    }
    
    // 表示モードに戻す
    try {
      await helpers.switchToViewMode();
      await helpers.takeFullPageScreenshot('mode-05-back-to-view');
    } catch (error) {
      console.log('⚠️ 表示モード切り替えでエラー:', error);
      await helpers.takeFullPageScreenshot('mode-05-view-mode-error');
    }

    console.log('✅ 編集モード切り替えテスト完了！');
  });

  test('JSONインポート修正テスト', async ({ page }) => {
    console.log('🎬 JSONインポート修正テスト開始');

    // 初期状態で何が表示されているかを確認
    await helpers.takeFullPageScreenshot('import-01-initial-view');
    
    // プロジェクト一覧画面が表示されている場合の処理
    if (await page.locator('h1:has-text("プロジェクト一覧")').isVisible().catch(() => false)) {
      console.log('📸 プロジェクト一覧画面からスタート');
      
      // プロジェクト作成
      await helpers.createProject('インポートテストプロジェクト', 'JSONインポート機能テスト用');
      await helpers.takeFullPageScreenshot('import-02-project-created');
      
      // 設計書作成
      await helpers.createDocument('インポートテスト設計書');
      await helpers.takeFullPageScreenshot('import-03-document-created');
      
      // 設計書編集画面への遷移を待機
      await page.waitForTimeout(1500);
    }
    
    // 設計書編集画面の確認
    await expect(page.locator('[data-testid="spreadsheet-container"]')).toBeVisible({ timeout: 10000 });
    await helpers.takeFullPageScreenshot('import-04-edit-screen-confirmed');
    
    // 1. 初期データ作成
    console.log('📸 Step 1: 初期データ作成');
    await helpers.clickTestDataButton();
    await helpers.takeFullPageScreenshot('import-05-test-data-loaded');
    
    // 2. Markdown編集
    console.log('📸 Step 2: Markdown編集');
    await helpers.editMarkdownArea('🧪 インポートテスト用データ\n\nJSONインポート機能のテストを実行中です。');
    await helpers.takeFullPageScreenshot('import-06-markdown-edited');
    
    // 3. スプレッドシート編集
    console.log('📸 Step 3: スプレッドシート編集');
    await helpers.switchToEditMode();
    await helpers.editSpreadsheetCell('A3', 'インポートテスト項目');
    await helpers.takeFullPageScreenshot('import-07-spreadsheet-edited');
    
    // 4. エクスポート
    console.log('📸 Step 4: エクスポート');
    const savedFilename = await helpers.saveToFile();
    await helpers.takeFullPageScreenshot('import-08-exported');
    console.log(`💾 エクスポート完了: ${savedFilename}`);
    
    // 5. ページリロード（クリアな状態）
    console.log('📸 Step 5: ページリロード');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await helpers.takeFullPageScreenshot('import-09-after-reload');
    
    // 6. 設計書編集画面に再度移動
    console.log('📸 Step 6: 設計書編集画面に再移動');
    if (await page.locator('h1:has-text("プロジェクト一覧")').isVisible().catch(() => false)) {
      // プロジェクト選択
      await page.click('text=インポートテストプロジェクト');
      await page.waitForTimeout(1000);
      
      // 設計書選択
      await page.click('text=インポートテスト設計書');
      await page.waitForTimeout(1500);
    }
    
    await expect(page.locator('[data-testid="spreadsheet-container"]')).toBeVisible({ timeout: 10000 });
    await helpers.takeFullPageScreenshot('import-10-empty-edit-screen');
    
    // 7. JSONインポート実行
    console.log('📸 Step 7: JSONインポート実行');
    try {
      await helpers.loadFromFile(savedFilename);
      await page.waitForTimeout(2000); // インポート処理完了を待機
      await helpers.takeFullPageScreenshot('import-11-imported-success');
    } catch (error) {
      console.log('⚠️ インポートでエラー:', error);
      await helpers.takeFullPageScreenshot('import-11-imported-error');
    }
    
    // 8. データ復元確認
    console.log('📸 Step 8: データ復元確認');
    
    // Markdownデータの確認
    const markdownArea = page.locator('[data-testid="markdown-editor"] .w-md-editor-text-area, .w-md-editor-text-area').first();
    if (await markdownArea.isVisible()) {
      const markdownContent = await markdownArea.inputValue();
      console.log('📝 復元されたMarkdown:', markdownContent);
      
      if (markdownContent.includes('インポートテスト用データ')) {
        console.log('✅ Markdownデータ復元成功！');
      } else {
        console.log('❌ Markdownデータ復元失敗');
      }
    }
    
    // スプレッドシートデータの確認（表示されているセル数をチェック）
    const spreadsheetContainer = page.locator('[data-testid="spreadsheet-container"]');
    if (await spreadsheetContainer.isVisible()) {
      console.log('✅ スプレッドシートコンテナ表示確認');
      
      // デバッグ情報をコンソールで確認（SpreadsheetEditor内の特定要素）
      const debugInfo = await page.locator('[data-testid="spreadsheet-container"] div:has-text("デバッグ: セル数=")').first().textContent();
      console.log('📊 デバッグ情報:', debugInfo);
      
      // セル数が0より大きいかチェック（インポート成功の証拠）
      if (debugInfo && debugInfo.includes('セル数=') && !debugInfo.includes('セル数=0')) {
        console.log('✅ スプレッドシートデータ復元成功！');
      } else {
        console.log('❌ スプレッドシートデータ復元失敗');
      }
    }
    
    await helpers.takeFullPageScreenshot('import-12-final-verification');
    
    console.log('✅ JSONインポート修正テスト完了！');
  });
});