import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StockChart } from "@/components/charts/stock-chart";

const setDataMock = jest.fn();
const applyOptionsMock = jest.fn();
const fitContentMock = jest.fn();

jest.mock("lightweight-charts", () => ({
  createChart: () => ({
    addSeries: () => ({
      setData: setDataMock,
      applyOptions: applyOptionsMock,
      createPriceLine: jest.fn(),
    }),
    priceScale: () => ({ applyOptions: applyOptionsMock }),
    timeScale: () => ({
      fitContent: fitContentMock,
      subscribeVisibleTimeRangeChange: jest.fn(),
      unsubscribeVisibleTimeRangeChange: jest.fn(),
    }),
    applyOptions: applyOptionsMock,
    remove: jest.fn(),
    removeSeries: jest.fn(),
  }),
  ColorType: { Solid: "solid" },
  CandlestickSeries: "CandlestickSeries",
  HistogramSeries: "HistogramSeries",
  LineSeries: "LineSeries",
  AreaSeries: "AreaSeries",
}));

const sampleData = [
  { Date: "2024-01-01", Open: 10, High: 12, Low: 9, Close: 11, Volume: 1000 },
  { Date: "2024-01-02", Open: 11, High: 13, Low: 10, Close: 12, Volume: 1200 },
  { Date: "2024-01-03", Open: 12, High: 14, Low: 11, Close: 13, Volume: 1300 },
];

test("renders empty state when no data", () => {
  render(
    <StockChart
      data={[]}
      period="1mo"
      interval="1d"
      onPeriodChange={jest.fn()}
      onIntervalChange={jest.fn()}
      isLoading={false}
    />
  );

  expect(screen.getByText("Grafik verisi bulunamadi")).toBeInTheDocument();
});

test("renders chart with data", async () => {
  render(
    <StockChart
      data={sampleData}
      period="1mo"
      interval="1d"
      onPeriodChange={jest.fn()}
      onIntervalChange={jest.fn()}
      isLoading={false}
    />
  );

  // Chart container should be rendered
  expect(screen.getByText("Gosterge")).toBeInTheDocument();
});
