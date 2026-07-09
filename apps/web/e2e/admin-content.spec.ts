import { expect, test } from "@playwright/test";

/**
 * コンテンツ管理画面（コース・タグ管理）はeditor/admin限定（設計書⑦、admin-audit-logs.spec.tsと同様の方針）。
 * このE2E環境にはNestJS API/DBが同梱されていないため、実データを伴う一覧の検証はここでは行わず、
 * 未認証時の保護（/loginへのリダイレクト）のみをスモーク確認する。
 */
test("未認証でコンテンツ管理画面にアクセスするとログインページへリダイレクトされる", async ({
  page,
}) => {
  await page.goto("/admin/content");
  await expect(page).toHaveURL(/\/login/);
});
