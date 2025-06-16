import { Page, expect } from '@playwright/test';

/**
 * テストヘルパークラス
 * 設計書エディタの操作を簡単にするためのユーティリティ
 */
export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * フルページスクリーンショット撮影
   * PlaywrightのGOLD RULE: 必ずfullPage: trueを使用！
   */
  async takeFullPageScreenshot(name: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    
    await this.page.screenshot({
      path: `screenshots/${filename}`,
      fullPage: true  // 🌟 Playwrightの鉄則！
    });
    
    console.log(`📸 スクリーンショット保存: ${filename}`);
  }

  /**
   * プロジェクト作成
   */
  async createProject(name: string, description?: string): Promise<void> {
    // 複数の新規プロジェクトボタンのいずれかをクリック
    const buttons = [
      'button:has-text("新規プロジェクト")',
      'button:has-text("新規プロジェクト作成")'
    ];
    
    let createButton;
    for (const selector of buttons) {
      const button = this.page.locator(selector).first();
      if (await button.isVisible().catch(() => false)) {
        createButton = button;
        break;
      }
    }
    
    if (!createButton) {
      throw new Error('新規プロジェクト作成ボタンが見つかりません');
    }
    
    await createButton.click();
    
    // フォームに入力
    await this.page.fill('input[placeholder*="プロジェクト"]', name);
    if (description) {
      await this.page.fill('textarea[placeholder*="概要"]', description);
    }
    
    // 作成ボタンをクリック
    await this.page.click('button[type="submit"]:has-text("作成")');
    
    // 設計書一覧画面への遷移を待機
    await this.page.waitForTimeout(1500);
  }

  /**
   * 設計書作成
   */
  async createDocument(name: string): Promise<void> {
    // 複数の新規設計書ボタンのいずれかをクリック
    const buttons = [
      'button:has-text("新規設計書")',
      'button:has-text("新規設計書作成")'
    ];
    
    let createButton;
    for (const selector of buttons) {
      const button = this.page.locator(selector).first();
      if (await button.isVisible().catch(() => false)) {
        createButton = button;
        break;
      }
    }
    
    if (!createButton) {
      throw new Error('新規設計書作成ボタンが見つかりません');
    }
    
    await createButton.click();
    
    // フォームに入力
    await this.page.fill('input[placeholder*="設計書"]', name);
    
    // 作成ボタンをクリック
    await this.page.click('button[type="submit"]:has-text("作成")');
    
    // 設計書編集画面への遷移を待機
    await this.page.waitForTimeout(1500);
  }

  /**
   * テストデータボタンをクリック
   */
  async clickTestDataButton(): Promise<void> {
    // 紫のテストデータボタンを探してクリック
    const testButton = this.page.locator('[data-testid="test-data-button"]');
    await expect(testButton).toBeVisible();
    await testButton.click();
    
    // データ読み込み完了まで待機
    await this.page.waitForTimeout(1500);
  }

  /**
   * Markdownエリアを編集
   */
  async editMarkdownArea(content: string): Promise<void> {
    // 複数の方法でMarkdownエディタのテキストエリアを探す
    const textAreaSelectors = [
      '[data-testid="markdown-editor"] .w-md-editor-text-area',
      '.w-md-editor-text-area',
      '[data-testid="markdown-editor"] textarea',
      '.w-md-editor textarea'
    ];
    
    let textArea;
    for (const selector of textAreaSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        textArea = element;
        break;
      }
    }
    
    if (!textArea) {
      throw new Error('Markdownエディタのテキストエリアが見つかりません');
    }
    
    await expect(textArea).toBeVisible();
    
    // 既存の内容をクリアして新しい内容を入力
    await textArea.clear();
    await textArea.fill(content);
    
    // 入力完了の確認
    await expect(textArea).toHaveValue(content);
  }

  /**
   * スプレッドシートエリアのリサイズ
   */
  async resizeSpreadsheetArea(size: 'large' | 'small'): Promise<void> {
    // リサイズハンドルを取得
    const resizeHandle = this.page.locator('[data-testid="resize-handle"]').first();
    
    if (!(await resizeHandle.isVisible())) {
      // data-testidが無い場合の代替手段
      // スプレッドシートエリア下部のリサイズハンドルを探す
      const handles = this.page.locator('div[style*="cursor: ns-resize"]');
      await expect(handles.first()).toBeVisible();
      
      const handleBox = await handles.first().boundingBox();
      if (!handleBox) throw new Error('リサイズハンドルの位置を取得できません');
      
      // ドラッグ操作
      await this.page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await this.page.mouse.down();
      
      if (size === 'large') {
        // 下に200px移動（拡大）
        await this.page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + 200);
      } else {
        // 上に150px移動（縮小）
        await this.page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y - 150);
      }
      
      await this.page.mouse.up();
    } else {
      // data-testidがある場合
      const handleBox = await resizeHandle.boundingBox();
      if (!handleBox) throw new Error('リサイズハンドルの位置を取得できません');
      
      await resizeHandle.hover();
      await this.page.mouse.down();
      
      const moveY = size === 'large' ? 200 : -150;
      await this.page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + moveY);
      await this.page.mouse.up();
    }
    
    // リサイズ完了まで待機
    await this.page.waitForTimeout(1000);
  }

  /**
   * ファイル保存
   */
  async saveToFile(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `playwright-test-${timestamp}.json`;
    
    // エクスポートボタンをクリック
    const exportButton = this.page.locator('[data-testid="export-button"]');
    await expect(exportButton).toBeVisible();
    
    // ダウンロード処理を監視（正しいPlaywright書き方）
    const downloadPromise = this.page.waitForEvent('download');
    await exportButton.click();
    
    const download = await downloadPromise;
    await download.saveAs(`downloads/${filename}`);
    
    console.log(`💾 ファイル保存完了: ${filename}`);
    return filename;
  }

  /**
   * ファイル読み込み
   */
  async loadFromFile(filename: string): Promise<void> {
    // インポートボタンをクリック
    const importButton = this.page.locator('[data-testid="import-button"]');
    await expect(importButton).toBeVisible();
    
    // 特定のファイル入力を選択（JSONファイル用）
    const fileInput = this.page.locator('#import-json');
    await importButton.click();
    
    // ファイルを設定
    await fileInput.setInputFiles(`downloads/${filename}`);
    
    console.log(`📂 ファイルインポート完了: ${filename}`);
    
    // インポート完了まで待機
    await this.page.waitForTimeout(1500);
  }

  /**
   * 編集モードに切り替え
   */
  async switchToEditMode(): Promise<void> {
    // まず設計書編集画面にいることを確認
    await expect(this.page.locator('[data-testid="spreadsheet-container"]')).toBeVisible();
    
    const toggleSwitch = this.page.locator('[data-testid="edit-mode-toggle"]');
    await expect(toggleSwitch).toBeVisible({ timeout: 10000 });
    await toggleSwitch.click();
    
    // モード切り替え完了まで待機
    await this.page.waitForTimeout(500);
  }

  /**
   * 表示モードに切り替え
   */
  async switchToViewMode(): Promise<void> {
    // まず設計書編集画面にいることを確認
    await expect(this.page.locator('[data-testid="spreadsheet-container"]')).toBeVisible();
    
    const toggleSwitch = this.page.locator('[data-testid="edit-mode-toggle"]');
    await expect(toggleSwitch).toBeVisible({ timeout: 10000 });
    await toggleSwitch.click();
    
    // モード切り替え完了まで待機
    await this.page.waitForTimeout(500);
  }

  /**
   * スプレッドシートのセルを編集
   */
  async editSpreadsheetCell(cellAddress: string, value: string): Promise<void> {
    // 編集モードになっていることを確認
    await this.page.waitForTimeout(1000);
    
    // Fortune-Sheetのセルテーブル要素を使用
    const cellTable = this.page.locator('#luckysheet-sheettable_0, .luckysheet-cell-sheettable').first();
    await expect(cellTable).toBeVisible({ timeout: 5000 });
    
    // セルテーブルをクリック（行3、列A）
    const cellX = 50; // 列Aの概算位置
    const cellY = 60; // 行3の概算位置
    
    await cellTable.click({ position: { x: cellX, y: cellY }, force: true });
    await this.page.waitForTimeout(500);
    
    // 値を入力
    await this.page.keyboard.type(value, { delay: 100 });
    await this.page.keyboard.press('Enter');
    
    // 入力完了を待機
    await this.page.waitForTimeout(1000);
  }
}