import { expect, test } from "@playwright/test";

/**
 * S27（プラン/請求）は認証済みユーザーのみ対象の画面（設計変更書①、全員利用可＝要ログイン）。
 * このE2E環境にはNestJS API/DBが同梱されていないため、実データを伴うCheckout/Portal遷移の検証は
 * ここでは行わず、未認証時の保護（/loginへのリダイレクト）のみをスモーク確認する
 * （settings-notifications.spec.tsと同じ方針）。
 */
test("未認証でプラン/請求にアクセスするとログインページへリダイレクトされる", async ({ page }) => {
  await page.goto("/account/billing");
  await expect(page).toHaveURL(/\/login/);
});
