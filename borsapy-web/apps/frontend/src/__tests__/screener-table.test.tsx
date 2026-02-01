import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScreenerTable } from "@/components/tables/screener-table";

jest.mock("next/link", () => {
  return ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

test("renders empty state", () => {
  render(<ScreenerTable data={[]} />);
  expect(screen.getByText("Sonuç bulunamadı")).toBeInTheDocument();
});

test("sorts by price and triggers add-to-portfolio", async () => {
  const user = userEvent.setup();
  const onAdd = jest.fn();
  const data = [
    {
      symbol: "AAA",
      name: "Alpha",
      price: 10,
      change_percent: 1,
      market_cap_usd: 2,
      pe: 10,
      pb: 1,
      dividend_yield: 1,
      upside_potential: 5,
    },
    {
      symbol: "BBB",
      name: "Beta",
      price: 20,
      change_percent: -1,
      market_cap_usd: 3,
      pe: 8,
      pb: 1.2,
      dividend_yield: null,
      upside_potential: -5,
    },
  ];

  render(<ScreenerTable data={data} onAddToPortfolio={onAdd} />);

  const priceHeader = screen.getByRole("button", { name: /Fiyat/i });
  await user.click(priceHeader);

  let rows = screen.getAllByRole("row");
  expect(within(rows[1]).getByText("BBB")).toBeInTheDocument();

  await user.click(priceHeader);
  rows = screen.getAllByRole("row");
  expect(within(rows[1]).getByText("AAA")).toBeInTheDocument();

  const addButtons = screen.getAllByTitle("Portföye Ekle");
  await user.click(addButtons[0]);
  expect(onAdd).toHaveBeenCalledWith("AAA");
});
