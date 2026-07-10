import { expect, test } from "@playwright/test";

/**
 * S22（工程マスタ管理）はeditor/admin限定（設計書⑦、admin-content.spec.tsと同様の方針）。
 * このE2E環境にはNestJS API/DBが同梱されていないため、実データを伴う一覧の検証はここでは行わず、
 * 未認証時の保護（/loginへのリダイレクト）のみをスモーク確認する。
 */
test("未認証で工程マスタ管理画面にアクセスするとログインページへリダイレクトされる", async ({
  page,
}) => {
  await page.goto("/admin/lifecycle-templates");
  await expect(page).toHaveURL(/\/login/);
});

test("未認証で工程マスタ新規作成画面にアクセスするとログインページへリダイレクトされる", async ({
  page,
}) => {
  await page.goto("/admin/lifecycle-templates/new");
  await expect(page).toHaveURL(/\/login/);
});
