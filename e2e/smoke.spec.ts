import { expect, test } from "@playwright/test";

test.describe("unauthenticated access", () => {
  test("player home redirects to login", async ({ page }) => {
    await page.goto("/player");
    await expect(page).toHaveURL(/\/login/);
  });

  test("player ledger redirects to login", async ({ page }) => {
    await page.goto("/player/ledger");
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin ledger redirects to login", async ({ page }) => {
    await page.goto("/admin/ledger");
    await expect(page).toHaveURL(/\/login/);
  });
});
