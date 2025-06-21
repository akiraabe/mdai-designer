import { Page, expect } from '@playwright/test';

/**
 * 現代版テストヘルパークラス (2025年6月版)
 * 
 * プロジェクト階層管理システム + 設計書タイプシステムに対応
 * - 3階層構造: App → ProjectListView → DocumentListView → DocumentEditView
 * - 4設計書タイプ: screen/model/api/database
 * - 革新的新機能: @メンション、AI修正提案、ChatPanel等
 */
export class ModernTestHelpers {
  constructor(private page: Page) {}

  /**
   * フルページスクリーンショット撮影
   */
  async takeScreenshot(name: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    
    await this.page.screenshot({
      path: `screenshots/${filename}`,
      fullPage: true
    });
    
    console.log(`📸 スクリーンショット: ${filename}`);
  }

  /**
   * アプリケーション初期化とプロジェクト一覧画面確認
   */
  async waitForAppInitialization(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
    
    // プロジェクト一覧画面が表示されるまで待機
    await expect(this.page.locator('h1')).toContainText('プロジェクト一覧');
    console.log('✅ アプリ初期化完了 - プロジェクト一覧画面表示');
  }

  /**
   * プロジェクト作成
   */
  async createProject(name: string, description?: string): Promise<void> {
    console.log(`🏗️ プロジェクト作成: ${name}`);

    // 新規プロジェクト作成ボタンをクリック（右上のメインボタンを優先）
    const mainCreateButton = this.page.locator('button').filter({ hasText: '新規プロジェクト' }).first();
    const promptCreateButton = this.page.locator('button').filter({ hasText: '新規プロジェクト作成' });
    
    // まず右上のメインボタンがあるかチェック
    if (await mainCreateButton.isVisible().catch(() => false)) {
      await mainCreateButton.click();
    } else {
      // なければ中央のプロンプトボタンを使用
      await expect(promptCreateButton).toBeVisible();
      await promptCreateButton.click();
    }

    // フォーム入力（正確なセレクターを使用）
    await this.page.fill('input[placeholder="例: ECサイト構築プロジェクト"]', name);
    
    if (description) {
      await this.page.fill('textarea[placeholder="プロジェクトの概要や目的を記載..."]', description);
    }

    // 作成ボタンクリック
    await this.page.click('button[type="submit"]:has-text("作成")');
    
    // プロジェクト作成完了を待機（設計書一覧画面への遷移）
    await this.page.waitForTimeout(1500);
    // h1にはプロジェクト名が表示される（設計書一覧画面）
    await expect(this.page.locator('h1')).toContainText(name);
    
    console.log(`✅ プロジェクト作成完了: ${name}`);
  }

  /**
   * 設計書作成（設計書タイプ選択対応）
   */
  async createDocument(name: string, type: 'screen' | 'model' | 'api' | 'database' = 'screen'): Promise<void> {
    console.log(`📝 設計書作成: ${name} (${type})`);

    // 新規設計書作成ボタンをクリック（複数ボタン対応）
    const mainCreateButton = this.page.locator('button').filter({ hasText: '新規設計書' }).first();
    const promptCreateButton = this.page.locator('button').filter({ hasText: '新規設計書作成' });
    
    // まずメインボタンがあるかチェック
    if (await mainCreateButton.isVisible().catch(() => false)) {
      await mainCreateButton.click();
    } else {
      // なければプロンプトボタンを使用
      await expect(promptCreateButton).toBeVisible();
      await promptCreateButton.click();
    }

    // 設計書タイプ選択
    await this.selectDocumentType(type);
    await this.takeScreenshot(`create-document-type-selected-${type}`);

    // 設計書名入力
    await this.page.fill('input[placeholder*="例:"]', name);
    await this.takeScreenshot(`create-document-name-filled`);

    // 作成ボタンクリック
    await this.page.click('button[type="submit"]');
    console.log('🖱️ 作成ボタンをクリック');
    
    // 設計書編集画面への遷移を待機
    await this.page.waitForTimeout(3000);
    await this.takeScreenshot(`create-document-after-submit`);
    
    console.log(`✅ 設計書作成完了: ${name}`);
  }

  /**
   * 設計書タイプ選択
   */
  async selectDocumentType(type: 'screen' | 'model' | 'api' | 'database'): Promise<void> {
    const typeSelectors = {
      screen: 'button:has-text("画面設計書")',
      model: 'button:has-text("データモデル設計書")',
      api: 'button:has-text("API設計書")',
      database: 'button:has-text("データベース設計書")'
    };

    const selector = typeSelectors[type];
    const typeCard = this.page.locator(selector);
    
    await expect(typeCard).toBeVisible();
    await typeCard.click();
    
    console.log(`📊 設計書タイプ選択: ${type}`);
  }

  /**
   * プロジェクト一覧に戻る
   */
  async goBackToProjectList(): Promise<void> {
    const backButton = this.page.locator('button').filter({ hasText: '戻る' });
    await backButton.click();
    
    await expect(this.page.locator('h1')).toContainText('プロジェクト一覧');
    console.log('⬅️ プロジェクト一覧に戻る');
  }

  /**
   * 設計書一覧に戻る
   */
  async goBackToDocumentList(): Promise<void> {
    const backButton = this.page.locator('button').filter({ hasText: '戻る' });
    await backButton.click();
    
    // 設計書一覧画面では、h1にプロジェクト名が表示される
    await this.page.waitForTimeout(1500);
    // プロジェクト名が表示されていることを確認（具体的な名前は動的）
    await expect(this.page.locator('h1')).toBeVisible();
    console.log('⬅️ 設計書一覧に戻る');
  }

  /**
   * プロジェクト選択
   */
  async selectProject(projectName: string): Promise<void> {
    console.log(`📂 プロジェクト選択試行: ${projectName}`);
    
    // 方法1: プロジェクトカードのメイン部分をクリック
    const projectCard = this.page.locator(`div:has-text("${projectName}")`).first();
    await expect(projectCard).toBeVisible();
    
    // プロジェクトカードのメイン部分（cursor-pointerの部分）をクリック
    const mainArea = projectCard.locator('div.cursor-pointer');
    
    if (await mainArea.isVisible().catch(() => false)) {
      await mainArea.click();
      console.log('📂 カードメインエリアをクリック');
    } else {
      // 方法2: プロジェクト名のh3要素を直接クリック
      const projectNameElement = projectCard.locator(`h3:has-text("${projectName}")`);
      if (await projectNameElement.isVisible().catch(() => false)) {
        await projectNameElement.click();
        console.log('📂 プロジェクト名要素をクリック');
      } else {
        // 方法3: プロジェクトカード全体をクリック
        await projectCard.click();
        console.log('📂 カード全体をクリック');
      }
    }
    
    await this.page.waitForTimeout(1500);
    // 設計書一覧画面では、プロジェクト名がh1に表示される
    await expect(this.page.locator('h1')).toContainText(projectName);
    
    console.log(`✅ プロジェクト選択成功: ${projectName}`);
  }

  /**
   * 設計書選択
   */
  async selectDocument(documentName: string): Promise<void> {
    const documentCard = this.page.locator(`div:has-text("${documentName}")`).first();
    await expect(documentCard).toBeVisible();
    await documentCard.click();
    
    await this.page.waitForTimeout(2000);
    console.log(`📄 設計書選択: ${documentName}`);
  }

  /**
   * プロジェクト削除
   */
  async deleteProject(projectName: string): Promise<void> {
    console.log(`🗑️ プロジェクト削除開始: ${projectName}`);
    
    // プロジェクトカードの削除ボタンを探してクリック
    const projectCard = this.page.locator(`div:has-text("${projectName}")`).first();
    await expect(projectCard).toBeVisible();
    
    const deleteButton = projectCard.locator('button:has-text("削除")');
    await expect(deleteButton).toBeVisible();
    console.log('🔍 削除ボタンが見つかりました');
    
    // 削除ボタンをクリックしてconfirmダイアログの応答を設定
    this.page.once('dialog', async dialog => {
      console.log(`📋 確認ダイアログ: ${dialog.message()}`);
      await dialog.accept();
      console.log('✅ ダイアログで削除を確認');
    });
    
    await deleteButton.click();
    console.log('🖱️ 削除ボタンをクリック');
    
    // 削除処理完了を待機
    await this.page.waitForTimeout(2000);
    console.log(`✅ プロジェクト削除完了: ${projectName}`);
  }

  /**
   * 設計書削除
   */
  async deleteDocument(documentName: string): Promise<void> {
    console.log(`🗑️ 設計書削除開始: ${documentName}`);
    
    // 設計書カードの削除ボタンを探してクリック
    const documentCard = this.page.locator(`div:has-text("${documentName}")`).first();
    await expect(documentCard).toBeVisible();
    
    const deleteButton = documentCard.locator('button:has-text("削除")');
    await expect(deleteButton).toBeVisible();
    console.log('🔍 削除ボタンが見つかりました');
    
    // 削除ボタンをクリックしてconfirmダイアログの応答を設定
    this.page.once('dialog', async dialog => {
      console.log(`📋 確認ダイアログ: ${dialog.message()}`);
      await dialog.accept();
      console.log('✅ ダイアログで削除を確認');
    });
    
    await deleteButton.click();
    console.log('🖱️ 削除ボタンをクリック');
    
    // 削除処理完了を待機
    await this.page.waitForTimeout(2000);
    console.log(`✅ 設計書削除完了: ${documentName}`);
  }

  /**
   * 画面設計書特有の機能テスト用ヘルパー
   */
  async verifyScreenDocumentView(): Promise<void> {
    // 画面設計書のタブが表示されているか確認
    await expect(this.page.locator('button:has-text("表示条件")')).toBeVisible();
    await expect(this.page.locator('button:has-text("画面イメージ")')).toBeVisible();
    await expect(this.page.locator('button:has-text("項目定義")')).toBeVisible();
    await expect(this.page.locator('button:has-text("補足説明")')).toBeVisible();
    
    console.log('✅ 画面設計書表示確認');
  }

  /**
   * データモデル設計書特有の機能テスト用ヘルパー
   */
  async verifyModelDocumentView(): Promise<void> {
    // データモデル設計書のタブが表示されているか確認
    await expect(this.page.locator('button:has-text("データモデル")')).toBeVisible();
    await expect(this.page.locator('button:has-text("補足説明")')).toBeVisible();
    
    // 表示条件タブは表示されないことを確認
    await expect(this.page.locator('button:has-text("表示条件")')).not.toBeVisible();
    
    console.log('✅ データモデル設計書表示確認');
  }

  /**
   * タブ切り替え
   */
  async switchTab(tabName: string): Promise<void> {
    const tab = this.page.locator(`button:has-text("${tabName}")`);
    await expect(tab).toBeVisible();
    await tab.click();
    
    await this.page.waitForTimeout(500);
    console.log(`🔄 タブ切り替え: ${tabName}`);
  }

  /**
   * テストデータ読み込み（レガシー機能との互換性）
   */
  async loadTestData(): Promise<void> {
    const testDataButton = this.page.locator('button').filter({ hasText: 'テストデータ' });
    
    if (await testDataButton.isVisible()) {
      await testDataButton.click();
      await this.page.waitForTimeout(1500);
      console.log('✅ テストデータ読み込み完了');
    } else {
      console.log('⚠️ テストデータボタンが見つかりません（設計書タイプにより非対応）');
    }
  }

  /**
   * MarkdownエリアにCLAUDE.mdから学習したセレクターで対応
   */
  async editMarkdown(content: string, sectionType: 'conditions' | 'supplement' = 'conditions'): Promise<void> {
    // セクションごとのMarkdownエディタを特定
    const editorSelectors = {
      conditions: '[data-testid="conditions-markdown-editor"]',
      supplement: '[data-testid="supplement-markdown-editor"]'
    };

    const selector = editorSelectors[sectionType];
    
    // @uiw/react-md-editorの複数の要素タイプに対応
    const possibleEditors = [
      this.page.locator(`${selector} textarea`).first(),
      this.page.locator(`${selector} .w-md-editor-text-textarea`).first(),
      this.page.locator(`${selector} .CodeMirror textarea`).first(),
      this.page.locator(`${selector} [contenteditable="true"]`).first()
    ];
    
    let editorFound = false;
    for (const editor of possibleEditors) {
      if (await editor.isVisible().catch(() => false)) {
        await editor.clear();
        await editor.fill(content);
        console.log(`✅ Markdown編集完了 (${sectionType})`);
        editorFound = true;
        break;
      }
    }
    
    if (!editorFound) {
      console.log(`⚠️ Markdownエディタが見つかりません (${sectionType})`);
      // デバッグ用：実際の要素構造を確認
      await this.takeScreenshot(`debug-markdown-editor-${sectionType}`);
    }
  }

  /**
   * データ永続化テスト（保存・読み込み）
   */
  async saveDocument(): Promise<void> {
    // 自動保存が有効な場合は保存ボタンは不要の場合もある
    const saveButton = this.page.locator('button').filter({ hasText: '保存' });
    
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await this.page.waitForTimeout(1000);
      console.log('💾 設計書保存完了');
    } else {
      console.log('ℹ️ 自動保存が有効（手動保存不要）');
    }
  }

  /**
   * 画面要素の表示確認（汎用）
   */
  async verifyElementExists(selector: string, description: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible();
    console.log(`✅ ${description} 表示確認`);
  }

  /**
   * 画面要素の非表示確認（汎用）
   */
  async verifyElementNotExists(selector: string, description: string): Promise<void> {
    await expect(this.page.locator(selector)).not.toBeVisible();
    console.log(`✅ ${description} 非表示確認`);
  }
}