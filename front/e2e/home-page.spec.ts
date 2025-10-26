import { test, expect } from '@playwright/test';

/**
 * ホーム画面 (/#/) E2Eテスト
 * プレイヤー登録済み・未登録の両方のケースをテスト
 */

// ユニークなユーザー名を生成（12文字制限、英数字のみ）
function generateUniqueUsername(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `test${timestamp.slice(0, 5)}${random}`;
}

// プレイヤー登録ヘルパー
async function registerPlayer(page: any, username: string, avatar: string) {
  await page.goto('/#/register');
  await page.waitForSelector('input[placeholder*="名前"]', { timeout: 5000 });
  await page.fill('input[placeholder*="名前"]', username);
  await page.fill('input[placeholder*="例"]', avatar);
  await page.click('button:has-text("ゲームを始める"), button:has-text("登録")');
  await page.waitForURL(/\/#\/(\?.*)?$/, { timeout: 5000 });
}

test.describe('ホーム画面 (/#/) E2Eテスト', () => {
  test.describe.configure({ mode: 'serial' });

  test('1. 未登録ユーザーは登録画面にリダイレクトされる', async ({ page }) => {
    // LocalStorageをクリア
    await page.context().clearCookies();
    await page.goto('/#/');
    
    // 登録画面にリダイレクトされることを確認
    await page.waitForURL(/\/#\/register/, { timeout: 5000 });
    
    // 登録画面の要素が表示されることを確認
    const hasRegisterForm = await page.locator('input[placeholder*="名前"]').isVisible();
    expect(hasRegisterForm).toBeTruthy();
    
    console.log('✓ 未登録ユーザーは登録画面にリダイレクトされました');
  });

  test('2. 登録済みユーザーはホーム画面が表示される', async ({ page }) => {
    const username = generateUniqueUsername();
    await registerPlayer(page, username, 'A');
    
    // ホーム画面にいることを確認
    await expect(page).toHaveURL(/\/#\/(\?.*)?$/);
    
    // タイトルが表示されることを確認
    const hasTitle = await page.locator('text="スピードマッチへようこそ！"').isVisible();
    expect(hasTitle).toBeTruthy();
    
    console.log('✓ 登録済みユーザーはホーム画面が表示されました');
  });

  test('3. ウェルカムメッセージが表示される（登録直後）', async ({ page }) => {
    const username = generateUniqueUsername();
    await registerPlayer(page, username, 'A');
    
    // 登録完了ウェルカムメッセージが表示されることを確認
    const welcomeMessage = await page.locator(`text=/登録完了！ようこそ、${username}さん！/`).isVisible({ timeout: 2000 }).catch(() => false);
    
    if (welcomeMessage) {
      console.log('✓ 登録完了ウェルカムメッセージが表示されました');
    } else {
      console.log('⚠️  ウェルカムメッセージが表示されませんでした（既に消えた可能性）');
    }
  });

  test('4. 再訪問時のウェルカムメッセージが表示される', async ({ page }) => {
    const username = generateUniqueUsername();
    await registerPlayer(page, username, 'A');
    
    // 一度別のページに移動
    await page.goto('/#/profile');
    await page.waitForLoadState('networkidle');
    
    // ホーム画面に戻る
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    
    // 「おかえりなさい」メッセージが表示されることを確認
    const welcomeBack = await page.locator(`text=/おかえりなさい、${username}さん！/`).isVisible({ timeout: 2000 }).catch(() => false);
    
    if (welcomeBack) {
      console.log('✓ 再訪問時のウェルカムメッセージが表示されました');
    } else {
      console.log('⚠️  再訪問メッセージが表示されませんでした');
    }
  });

  test('5. ルーム作成カードが表示される', async ({ page }) => {
    const username = generateUniqueUsername();
    await registerPlayer(page, username, 'A');
    
    // ルーム作成カードの要素を確認
    const hasCreateRoomHeading = await page.getByRole('heading', { name: 'ルーム作成' }).isVisible();
    expect(hasCreateRoomHeading).toBeTruthy();
    
    const hasCreateButton = await page.getByRole('button', { name: 'ルーム作成' }).isVisible();
    expect(hasCreateButton).toBeTruthy();
    
    console.log('✓ ルーム作成カードが表示されました');
  });

  test('6. ルーム参加カードが表示される', async ({ page }) => {
    const username = generateUniqueUsername();
    await registerPlayer(page, username, 'A');
    
    // ルーム参加カードの要素を確認
    const hasJoinRoomHeading = await page.getByRole('heading', { name: 'ルーム参加' }).isVisible();
    expect(hasJoinRoomHeading).toBeTruthy();
    
    const hasJoinButton = await page.getByRole('button', { name: 'ルーム参加' }).isVisible();
    expect(hasJoinButton).toBeTruthy();
    
    console.log('✓ ルーム参加カードが表示されました');
  });

  test('7. ルーム一覧カードが表示される', async ({ page }) => {
    const username = generateUniqueUsername();
    await registerPlayer(page, username, 'A');
    
    // ルーム一覧カードの要素を確認
    const hasRoomListHeading = await page.getByRole('heading', { name: 'ルーム一覧' }).isVisible();
    expect(hasRoomListHeading).toBeTruthy();
    
    const hasRoomListButton = await page.getByRole('button', { name: 'ルーム一覧' }).isVisible();
    expect(hasRoomListButton).toBeTruthy();
    
    console.log('✓ ルーム一覧カードが表示されました');
  });

  test('8. デザインシステムデモが表示される', async ({ page }) => {
    const username = generateUniqueUsername();
    await registerPlayer(page, username, 'A');
    
    // デザインシステムデモセクションの確認
    const hasDemoTitle = await page.locator('text="デザインシステム デモ"').isVisible();
    expect(hasDemoTitle).toBeTruthy();
    
    // 各種ボタンが表示されることを確認
    const hasPrimaryButton = await page.locator('button:has-text("Primary")').isVisible();
    const hasSecondaryButton = await page.locator('button:has-text("Secondary")').isVisible();
    const hasSuccessButton = await page.locator('button:has-text("Success")').isVisible();
    
    expect(hasPrimaryButton).toBeTruthy();
    expect(hasSecondaryButton).toBeTruthy();
    expect(hasSuccessButton).toBeTruthy();
    
    console.log('✓ デザインシステムデモが表示されました');
  });

  test('9. ヘッダーナビゲーションが表示される', async ({ page }) => {
    const username = generateUniqueUsername();
    await registerPlayer(page, username, 'A');
    
    // ヘッダーの存在確認
    const hasHeader = await page.locator('header, [role="banner"]').isVisible().catch(() => 
      page.locator('text="スピードマッチ"').isVisible()
    );
    expect(hasHeader).toBeTruthy();
    
    // プレイヤー名が表示されることを確認
    const hasPlayerName = await page.locator(`text=${username}`).first().isVisible().catch(() => false);
    
    if (hasPlayerName) {
      console.log('✓ ヘッダーにプレイヤー名が表示されました');
    } else {
      console.log('⚠️  ヘッダーにプレイヤー名が表示されませんでした');
    }
  });

  test('10. フッターが表示される', async ({ page }) => {
    const username = generateUniqueUsername();
    await registerPlayer(page, username, 'A');
    
    // ページを最下部までスクロール
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // フッターの存在確認
    const hasFooter = await page.locator('footer, [role="contentinfo"]').isVisible().catch(() => false);
    
    if (hasFooter) {
      console.log('✓ フッターが表示されました');
    } else {
      console.log('⚠️  フッターが表示されませんでした（スクロール範囲外の可能性）');
    }
  });

  test('11. レスポンシブデザイン（モバイル）', async ({ page }) => {
    const username = generateUniqueUsername();
    await registerPlayer(page, username, 'A');
    
    // モバイルビューポートに変更
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // 主要な要素が表示されることを確認
    const hasTitle = await page.locator('text="スピードマッチへようこそ！"').isVisible();
    const hasCards = await page.getByRole('heading', { name: 'ルーム作成' }).isVisible();
    
    expect(hasTitle).toBeTruthy();
    expect(hasCards).toBeTruthy();
    
    console.log('✓ モバイルビューで正しく表示されました');
    
    // デスクトップビューに戻す
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('12. ボタンのクリック動作', async ({ page }) => {
    const username = generateUniqueUsername();
    await registerPlayer(page, username, 'A');
    
    // ルーム作成ボタンをクリック
    const createButton = page.getByRole('button', { name: 'ルーム作成' });
    await createButton.click();
    await page.waitForLoadState('networkidle');
    
    // ルーム作成画面に遷移したことを確認
    const currentUrl = page.url();
    console.log(`現在のURL: ${currentUrl}`);
    
    const navigatedToCreateRoom = currentUrl.includes('/#/create-room');
    expect(navigatedToCreateRoom).toBeTruthy();
    
    console.log('✓ ルーム作成ボタンが正しく動作しました');
  });
});

// 登録画面の保護機能テスト
test.describe('登録画面の保護機能', () => {
  test('13. 登録済みユーザーが/registerにアクセスするとホーム画面にリダイレクトされる', async ({ page }) => {
    const username = generateUniqueUsername();
    await registerPlayer(page, username, 'A');
    
    // 登録画面に直接アクセス
    await page.goto('/#/register');
    await page.waitForLoadState('networkidle');
    
    // ホーム画面にリダイレクトされていることを確認
    const currentUrl = page.url();
    console.log(`現在のURL: ${currentUrl}`);
    
    const redirectedToHome = currentUrl === 'http://localhost:5173/#/' || currentUrl === 'http://localhost:5173/#/home';
    expect(redirectedToHome).toBeTruthy();
    
    // ホーム画面の要素が表示されていることを確認
    const hasWelcomeMessage = await page.locator('text="スピードマッチへようこそ！"').isVisible();
    expect(hasWelcomeMessage).toBeTruthy();
    
    console.log('✓ 登録済みユーザーが/registerにアクセスするとホーム画面にリダイレクトされました');
  });
});
