import { expect, test } from "@playwright/test";

/**
 * S14（AIチャット）はグローバルナビの5項目固定に対応するための準備中ページ。
 * 認証済みユーザーのみ対象（設計書⑦）。このE2E環境にはNestJS API/DBが同梱されていないため、
 * 未認証時の保護（/loginへのリダイレクト）のみをスモーク確認する（admin-ingestion.spec.tsと同じ方針）。
 * S05（検索）は search.spec.ts、S10-S12（学習）は courses.spec.ts に分離した。
 */
for (const path of ["/ai"]) {
  test(`未認証で${path}にアクセスするとログインページへリダイレクトされる`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  });
}
