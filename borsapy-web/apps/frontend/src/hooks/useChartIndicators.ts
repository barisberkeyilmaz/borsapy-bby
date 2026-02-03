import { useMemo } from "react";
import { CandlestickData, LineData, Time } from "lightweight-charts";
import { ActiveIndicator } from "@/store/chart";
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollinger,
  calculateStochastic,
  calculateATR,
  MACDData,
  BollingerData,
  StochasticData,
} from "@/components/charts/indicators/calculations";

export type IndicatorData =
  | LineData<Time>[]
  | MACDData
  | BollingerData
  | StochasticData;

export interface CalculatedIndicator {
  indicator: ActiveIndicator;
  data: IndicatorData;
}

export function useChartIndicators(
  candleData: CandlestickData<Time>[],
  activeIndicators: ActiveIndicator[]
): CalculatedIndicator[] {
  return useMemo(() => {
    if (!candleData || candleData.length === 0) return [];

    return activeIndicators.map((indicator) => {
      let data: IndicatorData = [];

      switch (indicator.type) {
        case "sma":
          data = calculateSMA(candleData, indicator.params.period || 20);
          break;

        case "ema":
          data = calculateEMA(candleData, indicator.params.period || 12);
          break;

        case "rsi":
          data = calculateRSI(candleData, indicator.params.period || 14);
          break;

        case "macd":
          data = calculateMACD(
            candleData,
            indicator.params.fastPeriod || 12,
            indicator.params.slowPeriod || 26,
            indicator.params.signalPeriod || 9
          );
          break;

        case "bollinger":
          data = calculateBollinger(
            candleData,
            indicator.params.period || 20,
            indicator.params.stdDev || 2
          );
          break;

        case "stochastic":
          data = calculateStochastic(
            candleData,
            indicator.params.kPeriod || 14,
            indicator.params.dPeriod || 3
          );
          break;

        case "atr":
          data = calculateATR(candleData, indicator.params.period || 14);
          break;
      }

      return { indicator, data };
    });
  }, [candleData, activeIndicators]);
}

// Helper to get the latest values for an indicator
export function getLatestIndicatorValue(
  calculatedIndicator: CalculatedIndicator
): Record<string, number | null> {
  const { indicator, data } = calculatedIndicator;

  if (!data) return {};

  switch (indicator.type) {
    case "sma":
    case "ema":
    case "rsi":
    case "atr": {
      const lineData = data as LineData<Time>[];
      if (lineData.length === 0) return { value: null };
      return { value: lineData[lineData.length - 1].value };
    }

    case "macd": {
      const macdData = data as MACDData;
      if (macdData.macd.length === 0) return { macd: null, signal: null };
      return {
        macd: macdData.macd[macdData.macd.length - 1].value,
        signal: macdData.signal[macdData.signal.length - 1].value,
      };
    }

    case "bollinger": {
      const bbData = data as BollingerData;
      if (bbData.middle.length === 0) return { upper: null, middle: null, lower: null };
      return {
        upper: bbData.upper[bbData.upper.length - 1].value,
        middle: bbData.middle[bbData.middle.length - 1].value,
        lower: bbData.lower[bbData.lower.length - 1].value,
      };
    }

    case "stochastic": {
      const stochData = data as StochasticData;
      if (stochData.k.length === 0) return { k: null, d: null };
      return {
        k: stochData.k[stochData.k.length - 1].value,
        d: stochData.d[stochData.d.length - 1].value,
      };
    }

    default:
      return {};
  }
}
