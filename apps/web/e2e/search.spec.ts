import { expect, test } from "@playwright/test";

/**
 * S05（統合検索）は認証済みユーザーのみ対象の画面（設計書⑦）。
 * このE2E環境にはNestJS API/DBが同梱されていないため、実データを伴う検索・スコープ切替の検証は
 * ここでは行わず、未認証時の保護（/loginへのリダイレクト）のみをスモーク確認する
 * （admin-ingestion.spec.tsと同じ方針）。
 */
test("未認証で検索にアクセスするとログインページへリダイレクトされる", async ({ page }) => {
  await page.goto("/search");
  await expect(page).toHaveURL(/\/login/);
});
