const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

// Screener API
export interface Template {
  name: string;
  description: string;
}

export interface ScreenerResult {
  results: Record<string, unknown>[];
  count: number;
  template: string | null;
}

export interface FilterCriteria {
  criteria: string;
  min?: number;
  max?: number;
  required?: boolean;
}

export interface ScreenerRequest {
  filters?: FilterCriteria[];
  sector?: string;
  index?: string;
  recommendation?: string;
}

export interface CriteriaInfo {
  id: string;
  name: string;
  min?: string;
  max?: string;
}

export const screenerApi = {
  getTemplates: () => fetchApi<Template[]>("/api/screener/templates"),
  runTemplate: (name: string) => fetchApi<ScreenerResult>(`/api/screener/templates/${name}`),
  runCustom: (request: ScreenerRequest) =>
    fetchApi<ScreenerResult>("/api/screener/run", {
      method: "POST",
      body: JSON.stringify(request),
    }),
  getCriteria: () => fetchApi<CriteriaInfo[]>("/api/screener/criteria"),
  getSectors: () => fetchApi<string[]>("/api/screener/sectors"),
  getIndices: () => fetchApi<string[]>("/api/screener/indices"),
};

// Stocks API
export interface StockInfo {
  symbol: string;
  name?: string;
  last_price?: number;
  change?: number;
  change_percent?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  market_cap?: number;
  pe_ratio?: number;
  pb_ratio?: number;
  year_high?: number;
  year_low?: number;
}

export interface StockHistory {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
}

export interface TechnicalIndicators {
  rsi?: number;
  macd?: number;
  macd_signal?: number;
  sma_20?: number;
  sma_50?: number;
  sma_200?: number;
  ema_12?: number;
  ema_26?: number;
  bollinger_upper?: number;
  bollinger_lower?: number;
  bollinger_mid?: number;
  atr?: number;
  stoch_k?: number;
  stoch_d?: number;
}

export interface Crossover {
  type: "bullish" | "bearish";
  date: string;
  days_ago: number;
}

export interface TechnicalSignal {
  indicator: string;
  signal: string;
  type: "bullish" | "bearish" | "neutral";
}

export interface PriceRange {
  low: number;
  high: number;
}

export interface TechnicalAnalysis {
  indicators: TechnicalIndicators;
  crossovers: {
    sma_50_200?: Crossover;
    sma_20_50?: Crossover;
    macd?: Crossover;
  };
  signals: TechnicalSignal[];
  current_price?: number;
  price_ranges?: {
    "7d"?: PriceRange;
    "50d"?: PriceRange;
    "200d"?: PriceRange;
  };
}

export interface Performance {
  "1w"?: number;
  "1m"?: number;
  "3m"?: number;
  "6m"?: number;
  "1y"?: number;
  ytd?: number;
}

export const stocksApi = {
  getInfo: (symbol: string) => fetchApi<StockInfo>(`/api/stocks/${symbol}`),
  getHistory: (symbol: string, period = "1mo", interval = "1d") =>
    fetchApi<StockHistory[]>(`/api/stocks/${symbol}/history?period=${period}&interval=${interval}`),
  getFastInfo: (symbol: string) => fetchApi<StockInfo>(`/api/stocks/${symbol}/fast-info`),
  search: (query: string) => fetchApi<SearchResult[]>(`/api/stocks/search?q=${encodeURIComponent(query)}`),
  getTechnicals: (symbol: string) => fetchApi<TechnicalAnalysis>(`/api/stocks/${symbol}/technicals`),
  getPerformance: (symbol: string) => fetchApi<Performance>(`/api/stocks/${symbol}/performance`),
};

// Market API
export interface MarketSummary {
  indices: {
    name: string;
    value: number;
    change: number;
    change_percent: number;
  }[];
}

export const marketApi = {
  getSummary: () => fetchApi<MarketSummary>("/api/market/summary"),
};

// Backtest API
export interface BacktestStrategy {
  id: string;
  name: string;
  description: string;
}

export interface BacktestRequest {
  symbol: string;
  strategy: string;
  period: string;
  initial_capital: number;
  commission: number;
}

export interface BacktestTrade {
  entry_time: string | null;
  entry_price: number | null;
  exit_time: string | null;
  exit_price: number | null;
  side: string;
  shares: number;
  profit: number | null;
  profit_pct: number | null;
  entry_indicators: Record<string, number>;
  exit_indicators: Record<string, number>;
  entry_reason: string;
  exit_reason: string;
}

export interface BacktestResult {
  symbol: string;
  strategy_name: string;
  period: string;
  initial_capital: number;
  final_equity: number | null;
  net_profit: number | null;
  net_profit_pct: number | null;
  total_trades: number | null;
  winning_trades: number | null;
  losing_trades: number | null;
  win_rate: number | null;
  profit_factor: number | null;
  max_drawdown: number | null;
  sharpe_ratio: number | null;
  sortino_ratio: number | null;
  buy_hold_return: number | null;
  vs_buy_hold: number | null;
  trades: BacktestTrade[];
  equity_curve: { date: string; equity: number }[];
}

export const backtestApi = {
  getStrategies: () => fetchApi<BacktestStrategy[]>("/api/backtest/strategies"),
  run: (request: BacktestRequest) =>
    fetchApi<BacktestResult>("/api/backtest/run", {
      method: "POST",
      body: JSON.stringify(request),
    }),
};

// Scanner API
export interface ScanRequest {
  conditions: string[];
  universe: string;
  interval: string;
  limit: number;
}

export interface ScanResultItem {
  symbol: string;
  close?: number;
  volume?: number;
  change?: number;
  change_percent?: number;
  market_cap?: number;
  rsi?: number;
  macd?: number;
  signal?: number;
  sma_20?: number;
  sma_50?: number;
  sma_200?: number;
  stoch_k?: number;
  stoch_d?: number;
  conditions_met?: string[];
  [key: string]: unknown;
}

export interface ScanResult {
  results: ScanResultItem[];
  count: number;
  conditions: string[];
  universe: string;
  interval: string;
}

export interface ScanPreset {
  id: string;
  name: string;
  description: string;
  conditions: string[];
  category: string;
}

export interface IndicatorInfo {
  id: string;
  name: string;
  description: string;
}

export interface IndicatorCategory {
  category: string;
  indicators: IndicatorInfo[];
}

export interface Universe {
  id: string;
  name: string;
  description: string;
}

export interface Interval {
  id: string;
  name: string;
  category: string;
}

export const scannerApi = {
  run: (request: ScanRequest) =>
    fetchApi<ScanResult>("/api/scanner/run", {
      method: "POST",
      body: JSON.stringify(request),
    }),
  getPresets: () => fetchApi<ScanPreset[]>("/api/scanner/presets"),
  getIndicators: () => fetchApi<IndicatorCategory[]>("/api/scanner/indicators"),
  getUniverses: () => fetchApi<Universe[]>("/api/scanner/universes"),
  getIntervals: () => fetchApi<Interval[]>("/api/scanner/intervals"),
};

// Compare API
export interface ComparePerformance {
  symbols: string[];
  dates: string[];
  series: Record<string, { dates: string[]; values: number[] }>;
}

export interface SectorComparison {
  symbol: string;
  sector: string | null;
  metrics: Record<string, {
    stock_value: number | null;
    sector_avg: number | null;
    vs_sector: number | null;
  }>;
  sector_stocks: Record<string, unknown>[];
  stock_count?: number;
  error?: string;
}

export const compareApi = {
  getStocks: (symbols: string[]) =>
    fetchApi<StockInfo[]>(`/api/compare/stocks?symbols=${symbols.join(",")}`),
  getPerformance: (symbols: string[], period = "1y") =>
    fetchApi<ComparePerformance>(`/api/compare/performance?symbols=${symbols.join(",")}&period=${period}`),
  getSectorComparison: (symbol: string) =>
    fetchApi<SectorComparison>(`/api/compare/sector/${symbol}`),
};

// Trading API
export interface ATRLevels {
  stop_loss: number;
  stop_loss_percent: number;
  take_profit: number;
  take_profit_percent: number;
  risk_reward: number;
}

export interface SwingLevels {
  symbol: string;
  current_price: number;
  atr: number | null;
  atr_levels: ATRLevels | null;
  support_levels: number[];
  resistance_levels: number[];
}

export const tradingApi = {
  getSwingLevels: (
    symbol: string,
    entryPrice?: number,
    stopLossATR = 2.0,
    takeProfitATR = 3.0
  ) => {
    const params = new URLSearchParams();
    if (entryPrice !== undefined) params.append("entry_price", String(entryPrice));
    params.append("stop_loss_atr", String(stopLossATR));
    params.append("take_profit_atr", String(takeProfitATR));
    const query = params.toString();
    return fetchApi<SwingLevels>(`/api/trading/${symbol}/swing-levels${query ? `?${query}` : ""}`);
  },
};
