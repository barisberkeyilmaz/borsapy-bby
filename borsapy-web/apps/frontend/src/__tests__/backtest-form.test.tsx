import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BacktestForm } from "@/components/backtest/backtest-form";
import { stocksApi } from "@/lib/api";

jest.mock("@/hooks/useDebounce", () => ({
  useDebounce: (value: string) => value,
}));

jest.mock("@/lib/api", () => ({
  stocksApi: { search: jest.fn() },
}));

beforeEach(() => {
  (stocksApi.search as jest.Mock).mockResolvedValue([
    { symbol: "THYAO", name: "Turk Hava Yollari", type: "stock" },
  ]);
});

test("submits backtest parameters", async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();

  render(
    <BacktestForm selectedStrategy="rsi" onSubmit={onSubmit} isRunning={false} />
  );

  const input = screen.getByPlaceholderText("Hisse ara (örn: THYAO)...");
  await user.type(input, "th");
  await user.click(await screen.findByText("THYAO"));

  const periodSelect = screen.getByRole("combobox");
  await user.selectOptions(periodSelect, "3mo");

  const numberInputs = screen.getAllByRole("spinbutton");
  const capitalInput = numberInputs[0];
  const commissionInput = numberInputs[1];

  await user.clear(capitalInput);
  await user.type(capitalInput, "200000");

  await user.clear(commissionInput);
  await user.type(commissionInput, "0.2");

  await user.click(screen.getByRole("button", { name: "Backtest Başlat" }));

  expect(onSubmit).toHaveBeenCalledWith({
    symbol: "THYAO",
    period: "3mo",
    initial_capital: 200000,
    commission: 0.002,
  });
});
