import { expect, test } from "@playwright/test";

/**
 * 監査ログ閲覧画面は認証済みユーザーのみ対象（設計書⑦、admin-ingestion.spec.tsと同様の方針）。
 * このE2E環境にはNestJS API/DBが同梱されていないため、実データを伴う一覧の検証はここでは行わず、
 * 未認証時の保護（/loginへのリダイレクト）のみをスモーク確認する。
 */
test("未認証で監査ログ一覧にアクセスするとログインページへリダイレクトされる", async ({ page }) => {
  await page.goto("/admin/audit-logs");
  await expect(page).toHaveURL(/\/login/);
});
