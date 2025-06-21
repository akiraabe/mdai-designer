import { test, expect } from '@playwright/test';
import { ModernTestHelpers } from './shared/test-helpers';

/**
 * 設計書タイプシステム E2Eテスト
 * 
 * 4種類の設計書タイプ（screen/model/api/database）の選択・表示・機能差を確認
 * - 設計書タイプ選択UI
 * - タイプ別専用機能の確認
 * - タイプ別タブフィルタリング
 * - ビッグスイッチパターンによる完全分離の確認
 */

test.describe('設計書タイプシステム', () => {
  let helpers: ModernTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new ModernTestHelpers(page);
    await helpers.waitForAppInitialization();
    
    // 各テスト用のプロジェクトを作成
    await helpers.createProject('タイプシステムテストプロジェクト', '設計書タイプシステムテスト用');
  });

  test('設計書タイプ選択UIの動作確認', async ({ page }) => {
    console.log('🎬 設計書タイプ選択UIテスト開始');

    // 1. 新規設計書作成ボタンをクリック
    const createButton = page.locator('button').filter({ hasText: '新規設計書' }).first();
    await createButton.click();
    await helpers.takeScreenshot('01-create-form-opened');

    // 2. 設計書タイプ選択画面の表示確認
    await expect(page.locator('button:has-text("画面設計書")')).toBeVisible();
    await expect(page.locator('button:has-text("データモデル設計書")')).toBeVisible();
    
    // API設計書とデータベース設計書は状態によって表示/非表示が変わる
    const hasApiType = await page.locator('button:has-text("API設計書")').isVisible().catch(() => false);
    const hasDatabaseType = await page.locator('button:has-text("データベース設計書")').isVisible().catch(() => false);
    
    console.log(`API設計書タイプ表示: ${hasApiType}`);
    console.log(`データベース設計書タイプ表示: ${hasDatabaseType}`);

    // 3. 各タイプの説明文が表示されることを確認
    await expect(page.locator('text=UI画面の設計')).toBeVisible();
    await expect(page.locator('text=エンティティとER図')).toBeVisible();

    await helpers.takeScreenshot('02-document-types-displayed');

    // 4. 画面設計書を選択
    await helpers.selectDocumentType('screen');
    await helpers.takeScreenshot('03-screen-type-selected');

    // 5. 選択状態の視覚的フィードバック確認（実装依存）
    const screenCard = page.locator('button:has-text("画面設計書")');
    const cardStyle = await screenCard.getAttribute('style');
    console.log(`画面設計書選択状態のスタイル: ${cardStyle}`);

    console.log('✅ 設計書タイプ選択UIテスト完了');
  });

  test('画面設計書タイプの専用機能確認', async ({ page }) => {
    console.log('🎬 画面設計書タイプ専用機能テスト開始');

    // 1. 画面設計書を作成
    await helpers.createDocument('画面設計書機能テスト', 'screen');
    await helpers.takeScreenshot('01-screen-document-created');

    // 2. 画面設計書専用タブの確認
    await helpers.verifyScreenDocumentView();
    
    // 3. 各タブの存在確認（画面設計書の全タブ）
    await expect(page.locator('button:has-text("全体表示")')).toBeVisible();
    await expect(page.locator('button:has-text("表示条件")')).toBeVisible();
    await expect(page.locator('button:has-text("画面イメージ")')).toBeVisible();
    await expect(page.locator('button:has-text("項目定義")')).toBeVisible();
    await expect(page.locator('button:has-text("補足説明")')).toBeVisible();

    // 4. データモデル専用タブが表示されないことを確認
    await expect(page.locator('button:has-text("データモデル")')).not.toBeVisible();

    await helpers.takeScreenshot('02-screen-tabs-verified');

    // 5. 各タブの切り替え動作確認
    await helpers.switchTab('表示条件');
    await helpers.takeScreenshot('03-conditions-tab');

    await helpers.switchTab('画面イメージ');
    await helpers.takeScreenshot('04-mockup-tab');

    await helpers.switchTab('項目定義');
    await helpers.takeScreenshot('05-definitions-tab');

    // 6. 画面設計書特有のコンポーネント確認
    await helpers.switchTab('項目定義');
    
    // スプレッドシートコンポーネントの存在確認
    const hasSpreadsheet = await page.locator('[data-testid="spreadsheet-container"]').isVisible().catch(() => false);
    if (hasSpreadsheet) {
      console.log('✅ スプレッドシートコンポーネント表示確認');
    }

    // 7. テストデータ読み込み機能確認（画面設計書のみ）
    await helpers.loadTestData();
    await helpers.takeScreenshot('06-test-data-loaded');

    console.log('✅ 画面設計書タイプ専用機能テスト完了');
  });

  test('データモデル設計書タイプの専用機能確認', async ({ page }) => {
    console.log('🎬 データモデル設計書タイプ専用機能テスト開始');

    // 1. データモデル設計書を作成
    await helpers.createDocument('データモデル設計書機能テスト', 'model');
    await helpers.takeScreenshot('01-model-document-created');

    // 2. データモデル設計書専用タブの確認
    await helpers.verifyModelDocumentView();

    // 3. データモデル設計書の限定タブ確認
    await expect(page.locator('button:has-text("全体表示")')).toBeVisible();
    await expect(page.locator('button:has-text("データモデル")')).toBeVisible();
    await expect(page.locator('button:has-text("補足説明")')).toBeVisible();

    // 4. 画面設計書専用タブが表示されないことを確認
    await expect(page.locator('button:has-text("表示条件")')).not.toBeVisible();
    await expect(page.locator('button:has-text("画面イメージ")')).not.toBeVisible();
    await expect(page.locator('button:has-text("項目定義")')).not.toBeVisible();

    await helpers.takeScreenshot('02-model-tabs-verified');

    // 5. データモデルタブの動作確認
    await helpers.switchTab('データモデル');
    await helpers.takeScreenshot('03-data-model-tab');

    // 6. データモデル設計書特有のコンポーネント確認
    // Mermaidエディタやビジュアルエディタなどの存在確認
    const hasMermaidEditor = await page.locator('[data-testid="mermaid-editor"]').isVisible().catch(() => false);
    const hasVisualEditor = await page.locator('[data-testid="visual-editor"]').isVisible().catch(() => false);
    
    console.log(`Mermaidエディタ表示: ${hasMermaidEditor}`);
    console.log(`ビジュアルエディタ表示: ${hasVisualEditor}`);

    // 7. スプレッドシートコンポーネントが表示されないことを確認
    await expect(page.locator('[data-testid="spreadsheet-container"]')).not.toBeVisible();

    await helpers.takeScreenshot('04-model-components-verified');

    console.log('✅ データモデル設計書タイプ専用機能テスト完了');
  });

  test('API設計書タイプの状態確認', async ({ page }) => {
    console.log('🎬 API設計書タイプ状態確認テスト開始');

    // 1. 新規設計書作成フォームを開く
    const createButton = page.locator('button').filter({ hasText: '新規設計書' }).first();
    await createButton.click();
    await helpers.takeScreenshot('01-create-form-opened');

    // 2. API設計書の表示状態を確認
    const apiCard = page.locator('button:has-text("API設計書")');
    const isApiVisible = await apiCard.isVisible().catch(() => false);

    if (isApiVisible) {
      console.log('API設計書タイプが表示されています');
      
      // 準備中バッジの確認
      const hasPrepBadge = await page.locator('text=準備中').isVisible().catch(() => false);
      if (hasPrepBadge) {
        console.log('✅ 準備中バッジ表示確認');
      }

      // 選択できない状態の確認
      const isDisabled = await apiCard.getAttribute('class');
      console.log(`API設計書カードの状態: ${isDisabled}`);

      await helpers.takeScreenshot('02-api-type-status');

      // 選択を試行（無効化されているはず） - イベント伝播を防ぐ
      try {
        await apiCard.click({ timeout: 1000 });
        console.log('API設計書がクリックされました（予期しない動作）');
      } catch (error) {
        console.log('✅ API設計書は正しく無効化されています');
      }
      await helpers.takeScreenshot('03-api-type-click-attempt');

    } else {
      console.log('API設計書タイプは非表示設定です');
      await helpers.takeScreenshot('02-api-type-hidden');
    }

    console.log('✅ API設計書タイプ状態確認テスト完了');
  });

  test('データベース設計書タイプの状態確認', async ({ page }) => {
    console.log('🎬 データベース設計書タイプ状態確認テスト開始');

    // 1. 新規設計書作成フォームを開く
    const createButton = page.locator('button').filter({ hasText: '新規設計書' }).first();
    await createButton.click();
    await helpers.takeScreenshot('01-create-form-opened');

    // 2. データベース設計書の表示状態を確認
    const databaseCard = page.locator('button:has-text("データベース設計書")');
    const isDatabaseVisible = await databaseCard.isVisible().catch(() => false);

    if (isDatabaseVisible) {
      console.log('データベース設計書タイプが表示されています');
      await helpers.takeScreenshot('02-database-type-displayed');

      // 状態確認
      const cardClass = await databaseCard.getAttribute('class');
      console.log(`データベース設計書カードの状態: ${cardClass}`);

    } else {
      console.log('データベース設計書タイプは非表示設定です（設定通り）');
      await helpers.takeScreenshot('02-database-type-hidden');
    }

    console.log('✅ データベース設計書タイプ状態確認テスト完了');
  });

  test('タイプ間の機能分離確認', async ({ page }) => {
    console.log('🎬 タイプ間機能分離確認テスト開始');

    // 1. 画面設計書とデータモデル設計書を両方作成
    await helpers.createDocument('機能分離テスト_画面設計書', 'screen');
    await helpers.goBackToDocumentList();
    
    await helpers.createDocument('機能分離テスト_データモデル設計書', 'model');
    await helpers.goBackToDocumentList();
    await helpers.takeScreenshot('01-both-documents-created');

    // 2. 画面設計書の機能確認
    await helpers.selectDocument('機能分離テスト_画面設計書');
    await helpers.verifyScreenDocumentView();
    
    // 画面設計書特有の機能があることを確認
    await expect(page.locator('button:has-text("表示条件")')).toBeVisible();
    await expect(page.locator('button:has-text("項目定義")')).toBeVisible();
    
    // データモデル特有の機能がないことを確認
    await expect(page.locator('button:has-text("データモデル")')).not.toBeVisible();
    
    await helpers.takeScreenshot('02-screen-document-functions');

    // 3. データモデル設計書の機能確認
    await helpers.goBackToDocumentList();
    await helpers.selectDocument('機能分離テスト_データモデル設計書');
    await helpers.verifyModelDocumentView();
    
    // データモデル設計書特有の機能があることを確認
    await expect(page.locator('button:has-text("データモデル")')).toBeVisible();
    
    // 画面設計書特有の機能がないことを確認
    await expect(page.locator('button:has-text("表示条件")')).not.toBeVisible();
    await expect(page.locator('button:has-text("項目定義")')).not.toBeVisible();
    
    await helpers.takeScreenshot('03-model-document-functions');

    // 4. 設計書一覧でのタイプ表示確認
    await helpers.goBackToDocumentList();
    
    // 各設計書のタイプが正しく表示されることを確認
    await expect(page.locator('text=画面設計書').first()).toBeVisible();
    await expect(page.locator('text=データモデル設計書').first()).toBeVisible();
    
    await helpers.takeScreenshot('04-document-types-in-list');

    console.log('✅ タイプ間機能分離確認テスト完了');
  });

  test('ビッグスイッチパターンによる完全分離の動作確認', async ({ page }) => {
    console.log('🎬 ビッグスイッチパターン動作確認テスト開始');

    // 1. 異なるタイプの設計書を連続で作成・確認
    const testCases = [
      { name: 'スイッチテスト_画面設計書', type: 'screen' as const, verifyFunc: 'verifyScreenDocumentView' },
      { name: 'スイッチテスト_データモデル設計書', type: 'model' as const, verifyFunc: 'verifyModelDocumentView' }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      // 設計書作成
      await helpers.createDocument(testCase.name, testCase.type);
      await helpers.takeScreenshot(`0${i + 1}-${testCase.type}-document-created`);

      // タイプ別専用表示の確認
      if (testCase.verifyFunc === 'verifyScreenDocumentView') {
        await helpers.verifyScreenDocumentView();
      } else {
        await helpers.verifyModelDocumentView();
      }

      await helpers.takeScreenshot(`0${i + 1}-${testCase.type}-view-verified`);

      // 設計書一覧に戻る
      await helpers.goBackToDocumentList();
    }

    // 2. 作成された設計書間の切り替え確認
    await helpers.selectDocument('スイッチテスト_画面設計書');
    await helpers.verifyScreenDocumentView();
    await helpers.goBackToDocumentList();

    await helpers.selectDocument('スイッチテスト_データモデル設計書');
    await helpers.verifyModelDocumentView();
    await helpers.goBackToDocumentList();

    await helpers.takeScreenshot('03-big-switch-pattern-verified');

    console.log('✅ ビッグスイッチパターン動作確認テスト完了');
  });
});