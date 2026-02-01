import { test, expect } from "@playwright/test";

test("header search navigates to stock page", async ({ page }) => {
  await page.route("**/api/stocks/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { symbol: "GARAN", name: "Garanti Bankasi", type: "stock" },
      ]),
    });
  });

  await page.goto("/");

  const input = page.getByPlaceholder("Hisse ara...");
  await input.fill("ga");

  await page.getByText("GARAN").click();

  await expect(page).toHaveURL(/\/stock\/GARAN/);
});
