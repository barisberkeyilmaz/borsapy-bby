import { test, expect } from "@playwright/test";

const stocksResponse = [
  {
    symbol: "AAA",
    name: "Alpha",
    last_price: 10,
    change_percent: 1,
    market_cap: 1000000,
    pe_ratio: 8,
    pb_ratio: 1.2,
    volume: 10000,
    year_high: 12,
    year_low: 7,
  },
  {
    symbol: "BBB",
    name: "Beta",
    last_price: 20,
    change_percent: -2,
    market_cap: 2000000,
    pe_ratio: 12,
    pb_ratio: 1.8,
    volume: 20000,
    year_high: 22,
    year_low: 15,
  },
];

const performanceResponse = {
  symbols: ["AAA", "BBB"],
  dates: ["2024-01-01", "2024-01-02"],
  series: {
    AAA: { dates: ["2024-01-01", "2024-01-02"], values: [100, 101] },
    BBB: { dates: ["2024-01-01", "2024-01-02"], values: [100, 99] },
  },
};

const sectorResponse = {
  symbol: "AAA",
  sector: "TEST",
  metrics: {},
  sector_stocks: [],
  stock_count: 1,
};

test("compare flow shows metrics after selecting two stocks", async ({ page }) => {
  await page.route("**/api/stocks/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { symbol: "AAA", name: "Alpha", type: "stock" },
        { symbol: "BBB", name: "Beta", type: "stock" },
      ]),
    });
  });

  await page.route("**/api/compare/stocks**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(stocksResponse),
    });
  });

  await page.route("**/api/compare/performance**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(performanceResponse),
    });
  });

  await page.route("**/api/compare/sector/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(sectorResponse),
    });
  });

  await page.goto("/compare");

  const input = page.getByPlaceholder("Hisse ekle...");
  await input.fill("aa");
  await page.getByText("AAA").click();

  await input.fill("bb");
  await page.getByText("BBB").click();

  await expect(page.getByText("Temel Metrikler")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "AAA" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "BBB" })).toBeVisible();

  await page.getByRole("button", { name: "AAA" }).click();
  await expect(page.getByText("Sektör Ortalamasına Göre")).toBeVisible();
});
