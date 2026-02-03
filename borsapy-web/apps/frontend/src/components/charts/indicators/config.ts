import { IndicatorType } from "@/store/chart";

export interface IndicatorParam {
  key: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
}

export interface IndicatorConfig {
  type: IndicatorType;
  name: string;
  shortName: string;
  description: string;
  category: "trend" | "momentum" | "volatility";
  pane: "overlay" | "separate";
  params: IndicatorParam[];
  defaultColors: string[];
  referenceLines?: number[];
  minValue?: number;
  maxValue?: number;
}

export const INDICATOR_CONFIGS: Record<IndicatorType, IndicatorConfig> = {
  sma: {
    type: "sma",
    name: "Basit Hareketli Ortalama",
    shortName: "SMA",
    description: "Belirli periyottaki kapaniş fiyatlarinin basit ortalaması",
    category: "trend",
    pane: "overlay",
    params: [
      { key: "period", label: "Periyot", defaultValue: 20, min: 2, max: 200, step: 1 },
    ],
    defaultColors: ["#2196f3", "#ff9800", "#9c27b0"],
  },
  ema: {
    type: "ema",
    name: "Ustel Hareketli Ortalama",
    shortName: "EMA",
    description: "Son fiyatlara daha fazla agirlik veren hareketli ortalama",
    category: "trend",
    pane: "overlay",
    params: [
      { key: "period", label: "Periyot", defaultValue: 12, min: 2, max: 200, step: 1 },
    ],
    defaultColors: ["#e91e63", "#00bcd4", "#8bc34a"],
  },
  bollinger: {
    type: "bollinger",
    name: "Bollinger Bantlari",
    shortName: "BB",
    description: "Fiyat volatilitesini gosteren ust ve alt bantlar",
    category: "volatility",
    pane: "overlay",
    params: [
      { key: "period", label: "Periyot", defaultValue: 20, min: 5, max: 50, step: 1 },
      { key: "stdDev", label: "Std. Sapma", defaultValue: 2, min: 1, max: 4, step: 0.5 },
    ],
    defaultColors: ["#9c27b0"],
  },
  rsi: {
    type: "rsi",
    name: "RSI",
    shortName: "RSI",
    description: "Goreceli guc endeksi - asiri alim/satim gostergesi",
    category: "momentum",
    pane: "separate",
    params: [
      { key: "period", label: "Periyot", defaultValue: 14, min: 2, max: 50, step: 1 },
    ],
    defaultColors: ["#26a69a"],
    referenceLines: [30, 70],
    minValue: 0,
    maxValue: 100,
  },
  macd: {
    type: "macd",
    name: "MACD",
    shortName: "MACD",
    description: "Hareketli ortalama yakinlasma/uzaklasma gostergesi",
    category: "momentum",
    pane: "separate",
    params: [
      { key: "fastPeriod", label: "Hizli EMA", defaultValue: 12, min: 2, max: 50, step: 1 },
      { key: "slowPeriod", label: "Yavas EMA", defaultValue: 26, min: 2, max: 100, step: 1 },
      { key: "signalPeriod", label: "Sinyal", defaultValue: 9, min: 2, max: 50, step: 1 },
    ],
    defaultColors: ["#2196f3", "#ff9800", "#26a69a"],
    referenceLines: [0],
  },
  stochastic: {
    type: "stochastic",
    name: "Stokastik",
    shortName: "STOCH",
    description: "Momentum gostergesi - asiri alim/satim seviyeleri",
    category: "momentum",
    pane: "separate",
    params: [
      { key: "kPeriod", label: "%K Periyot", defaultValue: 14, min: 2, max: 50, step: 1 },
      { key: "dPeriod", label: "%D Periyot", defaultValue: 3, min: 2, max: 20, step: 1 },
    ],
    defaultColors: ["#2196f3", "#ff9800"],
    referenceLines: [20, 80],
    minValue: 0,
    maxValue: 100,
  },
  atr: {
    type: "atr",
    name: "ATR",
    shortName: "ATR",
    description: "Ortalama gercek aralik - volatilite gostergesi",
    category: "volatility",
    pane: "separate",
    params: [
      { key: "period", label: "Periyot", defaultValue: 14, min: 2, max: 50, step: 1 },
    ],
    defaultColors: ["#ff5722"],
  },
};

export const INDICATOR_CATEGORIES = [
  {
    id: "trend",
    name: "Trend",
    indicators: ["sma", "ema", "bollinger"] as IndicatorType[],
  },
  {
    id: "momentum",
    name: "Momentum",
    indicators: ["rsi", "macd", "stochastic"] as IndicatorType[],
  },
  {
    id: "volatility",
    name: "Volatilite",
    indicators: ["atr"] as IndicatorType[],
  },
];

export function getDefaultParams(type: IndicatorType): Record<string, number> {
  const config = INDICATOR_CONFIGS[type];
  const params: Record<string, number> = {};
  config.params.forEach((param) => {
    params[param.key] = param.defaultValue;
  });
  return params;
}

export function formatIndicatorLabel(
  type: IndicatorType,
  params: Record<string, number>
): string {
  const config = INDICATOR_CONFIGS[type];
  const paramValues = config.params.map((p) => params[p.key]).join(", ");
  return `${config.shortName}(${paramValues})`;
}

// Period/Interval compatibility rules
export const PERIOD_INTERVAL_RULES: Record<string, string[]> = {
  "1d": ["1m", "5m", "15m"],
  "5d": ["5m", "15m", "1h"],
  "1mo": ["15m", "1h", "1d"],
  "3mo": ["1h", "1d", "1W"],
  "6mo": ["1d", "1W"],
  "1y": ["1d", "1W", "1M"],
  "5y": ["1d", "1W", "1M"],
};

export function getCompatibleIntervals(period: string): string[] {
  return PERIOD_INTERVAL_RULES[period] || ["1d"];
}

export function getDefaultInterval(period: string): string {
  const compatibleIntervals = getCompatibleIntervals(period);
  // Prefer daily if available, otherwise the first compatible
  if (compatibleIntervals.includes("1d")) return "1d";
  return compatibleIntervals[0] || "1d";
}
