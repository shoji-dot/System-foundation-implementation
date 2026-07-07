import { expect, test } from "@playwright/test";

/**
 * S10（学習コース一覧）・S11（レッスン）・S12（クイズ/結果）・S13（学習進捗）は認証済みユーザーのみ対象の
 * 画面（設計書⑦）。このE2E環境にはNestJS API/DBが同梱されていないため、実データを伴うコース・レッスン・
 * クイズ・進捗表示の検証はここでは行わず、未認証時の保護（/loginへのリダイレクト）のみをスモーク確認する
 * （classifications.spec.tsと同じ方針）。
 */
const PROTECTED_PATHS = [
  "/courses",
  "/courses/018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
  "/courses/018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a/lessons/018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6b",
  "/courses/018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a/lessons/018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6b/quiz",
  "/courses/progress",
];

for (const path of PROTECTED_PATHS) {
  test(`未認証で${path}にアクセスするとログインページへリダイレクトされる`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  });
}
