import { expect, test } from "@playwright/test";

/**
 * S06（法令一覧）・S07（法令詳細）は認証済みユーザーのみ対象の画面（設計書⑦）。
 * このE2E環境にはNestJS API/DBが同梱されていないため、実データを伴う一覧絞り込み・条文表示・版切替・
 * 改正差分の検証はここでは行わず、未認証時の保護（/loginへのリダイレクト）のみをスモーク確認する
 * （admin-ingestion.spec.tsと同じ方針）。
 */
test("未認証で法令一覧にアクセスするとログインページへリダイレクトされる", async ({ page }) => {
  await page.goto("/regulations");
  await expect(page).toHaveURL(/\/login/);
});

test("未認証で法令詳細にアクセスするとログインページへリダイレクトされる", async ({ page }) => {
  await page.goto("/regulations/018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c");
  await expect(page).toHaveURL(/\/login/);
});
