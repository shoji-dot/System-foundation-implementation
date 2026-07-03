import { expect, test } from "@playwright/test";

test("ホームページが表示される", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "医療機器薬事承認支援アプリ" })).toBeVisible();
});

test("/api/health が ok を返す", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe("ok");
});
