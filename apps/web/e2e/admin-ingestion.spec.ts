import { expect, test } from "@playwright/test";

/**
 * S20（管理: 取込レビュー）は認証済みユーザーのみ対象の画面（設計書⑦）。
 * このE2E環境にはNestJS API/DBが同梱されていないため、実データを伴う一覧・詳細・公開の
 * 検証はここでは行わず、未認証時の保護（/loginへのリダイレクト）のみをスモーク確認する。
 */
test("未認証で取込レビュー一覧にアクセスするとログインページへリダイレクトされる", async ({
  page,
}) => {
  await page.goto("/admin/ingestion");
  await expect(page).toHaveURL(/\/login/);
});

test("未認証で取込レビュー詳細にアクセスするとログインページへリダイレクトされる", async ({
  page,
}) => {
  await page.goto("/admin/ingestion/018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c");
  await expect(page).toHaveURL(/\/login/);
});
