import { expect, test } from "@playwright/test";

/**
 * TEST-004 — E2E landing page flow (PRD §48) — mobile (project "mobile").
 */

test.describe("Landing mobile", () => {
  test("menu drawer berfungsi", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Buka menu" }).click();
    // drawer adalah role=dialog dengan aria-label "Menu navigasi"
    const drawer = page.getByRole("dialog", { name: "Menu navigasi" });
    await expect(drawer).toBeVisible();
    // Escape menutup (drawer punya handler keydown)
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });

  test("sticky booking bar muncul saat scroll & tanpa horizontal overflow", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 800));
    await expect(page.getByRole("button", { name: "Book Now" })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
