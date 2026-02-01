import { render, screen, within } from "@testing-library/react";
import { ComparisonTable } from "@/components/compare/comparison-table";

const stocks = [
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

test("renders empty state", () => {
  render(<ComparisonTable stocks={[]} isLoading={false} />);
  expect(screen.getByText("Karsilastirmak icin en az 2 hisse secin")).toBeInTheDocument();
});

test("highlights best metric value", () => {
  render(<ComparisonTable stocks={stocks as any} isLoading={false} />);

  const rowLabel = screen.getByText("Piyasa Deg.");
  const row = rowLabel.closest("tr");
  expect(row).toBeTruthy();

  if (!row) return;

  const cells = within(row).getAllByRole("cell");
  const bestCell = cells.find((cell) => cell.textContent?.includes("$2.00M"));
  expect(bestCell).toBeTruthy();
  expect(bestCell).toHaveClass("text-primary");
});
