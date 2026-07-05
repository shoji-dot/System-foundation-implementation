import { expect, test } from "@playwright/test";

/**
 * S18（通知設定）は認証済みユーザーのみ対象の画面（設計書⑦）。
 * このE2E環境にはNestJS API/DBが同梱されていないため、実データを伴う購読登録の検証はここでは行わず、
 * 未認証時の保護（/loginへのリダイレクト）のみをスモーク確認する（admin-ingestion.spec.tsと同じ方針）。
 */
test("未認証で通知設定にアクセスするとログインページへリダイレクトされる", async ({ page }) => {
  await page.goto("/settings/notifications");
  await expect(page).toHaveURL(/\/login/);
});
