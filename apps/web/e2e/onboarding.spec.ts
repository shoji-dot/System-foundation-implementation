import { expect, test } from "@playwright/test";

/**
 * S03（オンボーディング）。このE2E環境にはNestJS API/DBが同梱されていないため、実際のログイン状態を
 * 伴う必須ゲート（middleware.ts）の検証はここでは行わず、admin-content.spec.ts等と同様、
 * 未認証時の保護（/loginへのリダイレクト）のみをスモーク確認する。
 */
test("未認証でオンボーディング画面にアクセスするとログインページへリダイレクトされる", async ({
  page,
}) => {
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/login/);
});
