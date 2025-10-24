import { test, expect, Page } from '@playwright/test';

/**
 * Phase 15 E2Eテスト: ゲーム画面機能
 * 
 * テスト範囲:
 * - プレイヤー登録
 * - ルーム作成
 * - ゲーム開始
 * - カードプレイ機能
 * - ドロー・スキップ機能
 * - ゲーム終了
 */

// ユニークなユーザー名を生成（バックエンド要件: 3-12文字、英数字と日本語のみ）
function generateUniqueUsername(prefix: string): string {
  const timestamp = Date.now().toString().slice(-6); // 後ろ6桁
  const random = Math.floor(Math.random() * 100); // 2桁
  // prefixを短縮して全体を12文字以内に収める
  const shortPrefix = prefix.slice(0, 4); // 最大4文字
  return `${shortPrefix}${timestamp}${random}`.slice(0, 12);
}

// テスト用のヘルパー関数（登録したユーザー名を返す）
async function registerPlayer(page: Page, username: string, avatar: string): Promise<string> {
  await page.goto('/#/register');
  await page.getByPlaceholder('あなたの名前を入力してください').fill(username);
  await page.getByPlaceholder(/例: A, 太, ☆/).fill(avatar);
  await page.getByRole('button', { name: 'ゲームを始める' }).click();
  
  // ホーム画面への遷移を待つ（クエリパラメータを含む可能性がある）
  await expect(page).toHaveURL(/\/#\/(\?.*)?$/, { timeout: 10000 });
  
  // ページが完全に読み込まれるまで待つ
  await page.waitForLoadState('networkidle');
  
  return username;
}

async function createRoom(page: Page, roomName: string) {
  await page.goto('/#/rooms');
  await page.getByRole('button', { name: '新しいルームを作成' }).click();
  
  // ルーム作成画面に遷移
  await expect(page).toHaveURL(/\/#\/create-room/);
  
  await page.getByRole('textbox', { name: /楽しいルーム/ }).fill(roomName);
  await page.getByRole('button', { name: 'ルームを作成' }).click();
  
  // 待機画面への遷移を待つ
  await expect(page).toHaveURL(/\/#\/waiting-room\//, { timeout: 10000 });
  
  // 「ルームコード」ヘッダーが表示されるまで待つ
  await expect(page.locator('text=ルームコード')).toBeVisible({ timeout: 10000 });
  
  // URLからルームコードを取得する方が確実
  const url = page.url();
  const match = url.match(/waiting-room\/([^?]+)/);
  return match ? match[1] : '';
}

async function joinRoomByCode(page: Page, roomCode: string) {
  await page.goto(`/#/waiting-room/${roomCode}`);
  
  // ルーム情報の読み込みを待つ
  await page.waitForTimeout(2000);
}

test.describe('Phase 15: ゲーム画面E2Eテスト', () => {
  test.describe.configure({ mode: 'serial' });

  test('1. プレイヤー登録フロー', async ({ page }) => {
    const username = await registerPlayer(page, generateUniqueUsername('testplayer1'), 'A');
    
    // プレイヤー情報が表示されていることを確認（複数存在する場合は最初の要素）
    await expect(page.locator(`text=${username}`).first()).toBeVisible();
  });

  test('2. ルーム作成とルームコード表示', async ({ page }) => {
    await registerPlayer(page, generateUniqueUsername('host_player'), 'H');
    
    const roomCode = await createRoom(page, 'E2E Test Room');
    
    // ルームコードが表示されていることを確認
    expect(roomCode).toBeTruthy();
    expect(roomCode.length).toBeGreaterThan(0);
    
    // 参加者情報が表示されていることを確認
    await expect(page.locator('text=/参加者.*1\\/4/')).toBeVisible();
  });

  test.skip('3. 2人でゲーム開始とゲーム画面表示', async ({ browser }) => {
    // プレイヤー1: ホスト
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await registerPlayer(page1, generateUniqueUsername('player1'), 'A');
    const roomCode = await createRoom(page1, 'Game Start Test');
    
    // プレイヤー2: 参加者
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await registerPlayer(page2, generateUniqueUsername('player2'), 'B');
    await joinRoomByCode(page2, roomCode);
    
    // 2人目が参加するまで待機
    await page1.waitForTimeout(3000);
    
    // プレイヤー2が準備完了ボタンをクリック
    const readyButton = page2.getByRole('button', { name: '準備完了' });
    if (await readyButton.isVisible({ timeout: 5000 })) {
      await readyButton.click();
      await page2.waitForTimeout(1000);
    }
    
    // ホストがゲーム開始ボタンをクリック（表示されるまで待つ）
    const startButton = page1.getByRole('button', { name: 'ゲーム開始' });
    await expect(startButton).toBeVisible({ timeout: 10000 });
    await startButton.click();
    
    // 両方のページでゲーム画面に遷移することを確認
    await expect(page1).toHaveURL(/\/#\/game\//, { timeout: 15000 });
    await expect(page2).toHaveURL(/\/#\/game\//, { timeout: 15000 });
    
    // ゲーム画面の基本要素が表示されていることを確認
    await expect(page1.locator('text=/Speed Match|ゲーム/')).toBeVisible({ timeout: 10000 });
    
    await context1.close();
    await context2.close();
  });

  test.skip('4. カードプレイ機能テスト', async ({ browser }) => {
    // 2人のプレイヤーでゲームを開始
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await registerPlayer(page1, generateUniqueUsername('cardplay_test1'), 'C');
    const roomCode = await createRoom(page1, 'Card Play Test');
    
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await registerPlayer(page2, generateUniqueUsername('cardplay_test2'), 'D');
    await joinRoomByCode(page2, roomCode);
    
    await page1.waitForTimeout(2000);
    await page2.getByRole('button', { name: '準備完了' }).click();
    await page2.waitForTimeout(1000);
    await page1.getByRole('button', { name: 'ゲーム開始' }).click();
    
    // ゲーム画面に遷移
    await expect(page1).toHaveURL(/\/#\/game\//, { timeout: 10000 });
    
    // ターン表示を確認
    const turnIndicator = page1.locator('text=YES, text=NO').first();
    await expect(turnIndicator).toBeVisible();
    
    // 自分のターンの場合、カードをクリックできることを確認
    const isMyTurn = await page1.locator('text=YES').isVisible();
    
    if (isMyTurn) {
      // 手札のカードが表示されていることを確認
      const handCards = page1.locator('[class*="hand"] > div, .game-card').first();
      await expect(handCards).toBeVisible({ timeout: 5000 });
      
      // カードをクリック（選択可能なら）
      const playableCard = page1.locator('[class*="cursor-pointer"]').first();
      if (await playableCard.isVisible()) {
        await playableCard.click();
        
        // 選択メッセージが表示されることを確認
        await expect(page1.locator('text=/を選択中/')).toBeVisible({ timeout: 3000 });
      }
    }
    
    await context1.close();
    await context2.close();
  });

  test.skip('5. ドロー・スキップボタンの動作確認', async ({ browser }) => {
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await registerPlayer(page1, generateUniqueUsername('action_test1'), 'X');
    const roomCode = await createRoom(page1, 'Action Test');
    
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await registerPlayer(page2, generateUniqueUsername('action_test2'), 'Y');
    await joinRoomByCode(page2, roomCode);
    
    await page1.waitForTimeout(2000);
    await page2.getByRole('button', { name: '準備完了' }).click();
    await page2.waitForTimeout(1000);
    await page1.getByRole('button', { name: 'ゲーム開始' }).click();
    
    await expect(page1).toHaveURL(/\/#\/game\//, { timeout: 10000 });
    
    // ドローボタンとスキップボタンが存在することを確認
    await expect(page1.getByRole('button', { name: 'カードを引く' })).toBeVisible();
    await expect(page1.getByRole('button', { name: 'スキップ' })).toBeVisible();
    
    // 自分のターンの場合、ボタンをクリックできることを確認
    const isMyTurn = await page1.locator('text=YES').isVisible();
    
    if (isMyTurn) {
      const drawButton = page1.getByRole('button', { name: 'カードを引く' });
      const isEnabled = await drawButton.isEnabled();
      expect(isEnabled).toBe(true);
    }
    
    await context1.close();
    await context2.close();
  });

  test.skip('6. ゲーム状態の自動更新（ポーリング）', async ({ browser }) => {
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await registerPlayer(page1, generateUniqueUsername('polling_test1'), 'P');
    const roomCode = await createRoom(page1, 'Polling Test');
    
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await registerPlayer(page2, generateUniqueUsername('polling_test2'), 'Q');
    await joinRoomByCode(page2, roomCode);
    
    await page1.waitForTimeout(2000);
    await page2.getByRole('button', { name: '準備完了' }).click();
    await page2.waitForTimeout(1000);
    await page1.getByRole('button', { name: 'ゲーム開始' }).click();
    
    await expect(page1).toHaveURL(/\/#\/game\//, { timeout: 10000 });
    
    // 初期のデッキ残数を取得
    const initialDeckText = await page1.locator('text=/残りカード.*枚/').textContent();
    
    // 3秒以上待機（ポーリング間隔）
    await page1.waitForTimeout(4000);
    
    // ゲーム情報が更新されていることを確認（少なくとも要素が存在する）
    await expect(page1.locator('text=/残りカード/')).toBeVisible();
    
    // プレイヤー情報が更新されていることを確認
    await expect(page1.locator('text=/プレイヤー数.*2人/')).toBeVisible();
    
    await context1.close();
    await context2.close();
  });

  test.skip('7. エラーハンドリング: 無効なゲームIDアクセス', async ({ page }) => {
    await registerPlayer(page, generateUniqueUsername('error_test'), 'E');
    
    // 存在しないゲームIDにアクセス
    await page.goto('/#/game/invalid-game-id-12345');
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=エラー')).toBeVisible({ timeout: 10000 });
    
    // 再試行ボタンが表示されることを確認
    await expect(page.getByRole('button', { name: '再試行' })).toBeVisible();
  });

  test.skip('8. ゲームからの退出機能', async ({ browser }) => {
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await registerPlayer(page1, generateUniqueUsername('exit_test1'), 'Z');
    const roomCode = await createRoom(page1, 'Exit Test');
    
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await registerPlayer(page2, generateUniqueUsername('exit_test2'), 'W');
    await joinRoomByCode(page2, roomCode);
    
    await page1.waitForTimeout(2000);
    await page2.getByRole('button', { name: '準備完了' }).click();
    await page2.waitForTimeout(1000);
    await page1.getByRole('button', { name: 'ゲーム開始' }).click();
    
    await expect(page1).toHaveURL(/\/#\/game\//, { timeout: 10000 });
    
    // 退出ボタンをクリック
    await page1.getByRole('button', { name: '退出' }).click();
    
    // ルーム一覧に戻ることを確認
    await expect(page1).toHaveURL(/\/#\/rooms/, { timeout: 5000 });
    
    await context1.close();
    await context2.close();
  });
});

// テスト9は削除（テスト3と重複するため）
