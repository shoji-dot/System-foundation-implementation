import { defineConfig, devices } from "@playwright/test";

/**
 * S01ランディング等の主要画面E2E（設計書⑮品質ゲート: 主要画面E2E(Playwright)）。
 * Phase 0 はホームページ疎通確認のみ。画面実装が進むフェーズごとにテストを追加する。
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
