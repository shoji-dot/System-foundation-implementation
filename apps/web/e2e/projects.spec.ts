import { expect, test } from "@playwright/test";

/**
 * S15（プロジェクト一覧）・S16（プロジェクト詳細）は認証済みユーザーのみ対象の画面（設計書⑦）。
 * このE2E環境にはNestJS API/DBが同梱されていないため、実データを伴う一覧・作成・タスク操作の検証は
 * ここでは行わず、未認証時の保護（/loginへのリダイレクト）のみをスモーク確認する
 * （admin-ingestion.spec.tsと同じ方針）。
 */
test("未認証でプロジェクト一覧にアクセスするとログインページへリダイレクトされる", async ({
  page,
}) => {
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/login/);
});

test("未認証でプロジェクト詳細にアクセスするとログインページへリダイレクトされる", async ({
  page,
}) => {
  await page.goto("/projects/018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c");
  await expect(page).toHaveURL(/\/login/);
});
