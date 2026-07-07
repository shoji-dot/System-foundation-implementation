import { expect, test } from "@playwright/test";

/**
 * S08（JMDN検索）・S09（分類詳細）は認証済みユーザーのみ対象の画面（設計書⑦）。
 * このE2E環境にはNestJS API/DBが同梱されていないため、実データを伴う一覧絞り込み・定義・各国マッピング
 * 表示の検証はここでは行わず、未認証時の保護（/loginへのリダイレクト）のみをスモーク確認する
 * （admin-ingestion.spec.tsと同じ方針）。
 */
test("未認証でJMDN検索にアクセスするとログインページへリダイレクトされる", async ({ page }) => {
  await page.goto("/classifications");
  await expect(page).toHaveURL(/\/login/);
});

test("未認証で分類詳細にアクセスするとログインページへリダイレクトされる", async ({ page }) => {
  await page.goto("/classifications/018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a");
  await expect(page).toHaveURL(/\/login/);
});
