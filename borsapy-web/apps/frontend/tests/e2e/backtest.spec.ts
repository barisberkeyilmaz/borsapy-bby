import { test, expect } from "@playwright/test";

const strategiesResponse = [
  { id: "rsi", name: "RSI Strategy", description: "RSI 30/70" },
  { id: "macd", name: "MACD Crossover", description: "MACD cross" },
];

const backtestResponse = {
  symbol: "AAA",
  strategy_name: "RSI Strategy",
  period: "1y",
  initial_capital: 100000,
  final_equity: 110000,
  net_profit: 10000,
  net_profit_pct: 10,
  total_trades: 0,
  winning_trades: 0,
  losing_trades: 0,
  win_rate: 0,
  profit_factor: 1.2,
  max_drawdown: 5,
  sharpe_ratio: 0.8,
  sortino_ratio: 0.7,
  buy_hold_return: 8,
  vs_buy_hold: 2,
  trades: [],
  equity_curve: [
    { date: "2024-01-01", equity: 100000 },
    { date: "2024-02-01", equity: 110000 },
  ],
};

test("backtest flow runs and renders results", async ({ page }) => {
  await page.route("**/api/backtest/strategies", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(strategiesResponse),
    });
  });

  await page.route("**/api/stocks/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { symbol: "AAA", name: "Alpha", type: "stock" },
      ]),
    });
  });

  await page.route("**/api/backtest/run", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(backtestResponse),
    });
  });

  await page.goto("/backtest");

  await page.getByText("RSI Strategy").click();

  const input = page.getByPlaceholder("Hisse ara (örn: THYAO)...");
  await input.fill("aa");
  await page.getByText("AAA").click();

  await page.getByRole("button", { name: "Backtest Başlat" }).click();

  await expect(page.getByText("Net Kar/Zarar")).toBeVisible();
  await expect(page.getByText("Portföy Değeri Grafiği")).toBeVisible();
  await expect(page.getByText("Bu dönemde işlem yapılmadı")).toBeVisible();
});
