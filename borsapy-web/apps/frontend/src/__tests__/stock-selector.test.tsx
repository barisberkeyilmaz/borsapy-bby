import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StockSelector } from "@/components/compare/stock-selector";
import { stocksApi } from "@/lib/api";

jest.mock("@/hooks/useDebounce", () => ({
  useDebounce: (value: string) => value,
}));

jest.mock("@/lib/api", () => ({
  stocksApi: { search: jest.fn() },
}));

beforeEach(() => {
  (stocksApi.search as jest.Mock).mockResolvedValue([
    { symbol: "AAA", name: "Alpha", type: "stock" },
    { symbol: "BBB", name: "Beta", type: "stock" },
  ]);
});

test("adds and removes symbols", async () => {
  const user = userEvent.setup();
  const onSymbolsChange = jest.fn();

  render(
    <StockSelector
      selectedSymbols={["AAA"]}
      onSymbolsChange={onSymbolsChange}
      maxSymbols={3}
    />
  );

  const input = screen.getByPlaceholderText("Hisse ekle...");
  await user.type(input, "bb");

  const result = await screen.findByText("BBB");
  await user.click(result);

  expect(onSymbolsChange).toHaveBeenCalledWith(["AAA", "BBB"]);

  const badge = screen.getByText("AAA").closest("span");
  const removeButton = badge?.querySelector("button");
  expect(removeButton).toBeTruthy();

  if (removeButton) {
    await user.click(removeButton);
  }

  expect(onSymbolsChange).toHaveBeenCalledWith([]);
});
