import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChartControls } from "@/components/charts/chart-controls";

test("calls onPeriodChange and toggles SMA", async () => {
  const user = userEvent.setup();
  const onPeriodChange = jest.fn();
  const onToggleSMA = jest.fn();

  render(
    <ChartControls
      selectedPeriod="1mo"
      onPeriodChange={onPeriodChange}
      showSMA
      onToggleSMA={onToggleSMA}
    />
  );

  await user.click(screen.getByRole("button", { name: "1Y" }));
  expect(onPeriodChange).toHaveBeenCalledWith("1y");

  await user.click(screen.getByRole("button", { name: "SMA" }));
  expect(onToggleSMA).toHaveBeenCalled();
});
