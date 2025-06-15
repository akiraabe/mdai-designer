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
 * 6. ファイル保存
 * 7. 画面リロード
 * 8. ファイル読み込み
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

  test('基本操作フロー：編集→保存→読み込み', async ({ page }) => {
    console.log('🎬 統合テストシナリオ開始');

    // 1. 画面初期化（初期表示）
    console.log('📸 Step 1: 初期表示');
    await helpers.takeFullPageScreenshot('01-initial-display');
    
    // スプレッドシートが表示されていることを確認
    await expect(page.locator('[data-testid="spreadsheet-container"]')).toBeVisible();

    // 2. テストデータ読み込み
    console.log('📸 Step 2: テストデータ読み込み');
    await helpers.clickTestDataButton();
    await page.waitForTimeout(1000); // データ読み込み完了待機
    await helpers.takeFullPageScreenshot('02-test-data-loaded');

    // 3. Markdownエリア編集
    console.log('📸 Step 3: Markdown編集');
    await helpers.editMarkdownArea('## E2Eテスト実行中\\n\\n項目定義の自動テストを実施しています。\\n\\n- リサイズ機能\\n- ファイル操作\\n- データ永続化');
    await helpers.takeFullPageScreenshot('03-markdown-edited');

    // 4. 項目定義エリア拡大
    console.log('📸 Step 4: エリア拡大');
    await helpers.resizeSpreadsheetArea('large');
    await page.waitForTimeout(500); // リサイズアニメーション完了待機
    await helpers.takeFullPageScreenshot('04-resized-large');

    // 5. 項目定義エリア縮小
    console.log('📸 Step 5: エリア縮小');
    await helpers.resizeSpreadsheetArea('small');
    await page.waitForTimeout(500);
    await helpers.takeFullPageScreenshot('05-resized-small');

    // 6. ファイル保存
    console.log('📸 Step 6: ファイル保存');
    const savedFilename = await helpers.saveToFile();
    await helpers.takeFullPageScreenshot('06-after-save');
    console.log(`💾 保存完了: ${savedFilename}`);

    // 7. 画面リロード
    console.log('📸 Step 7: 画面リロード');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await helpers.takeFullPageScreenshot('07-after-reload');

    // 8. ファイル読み込み
    console.log('📸 Step 8: ファイル読み込み');
    await helpers.loadFromFile(savedFilename);
    await page.waitForTimeout(1000); // 読み込み完了待機
    await helpers.takeFullPageScreenshot('08-after-load');

    // 9. 最終確認
    console.log('✅ Step 9: 最終確認');
    
    // スプレッドシートが表示されているか確認
    await expect(page.locator('[data-testid="spreadsheet-container"]')).toBeVisible();
    
    // Markdownエディタが表示されているか確認（内容チェックは省略）
    await expect(page.locator('[data-testid="markdown-editor-container"]').first()).toBeVisible();
    
    await helpers.takeFullPageScreenshot('09-final-verification');

    console.log('🎉 統合テスト完了！');
  });

  test('編集モード切り替えテスト', async ({ page }) => {
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