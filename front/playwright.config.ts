import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright設定ファイル
 * Speed Match Card Game フロントエンドのE2Eテスト
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // ゲームは順次実行が必要
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1, // 並列実行は1つのみ（同時ゲームを避ける）
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on', // すべてのテストで動画を録画
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 開発サーバーを自動起動
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
