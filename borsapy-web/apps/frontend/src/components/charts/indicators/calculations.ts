import { CandlestickData, LineData, HistogramData, Time } from "lightweight-charts";

export interface OHLCVData {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}

export interface MACDData {
  macd: LineData<Time>[];
  signal: LineData<Time>[];
  histogram: HistogramData<Time>[];
}

export interface BollingerData {
  upper: LineData<Time>[];
  middle: LineData<Time>[];
  lower: LineData<Time>[];
}

export interface StochasticData {
  k: LineData<Time>[];
  d: LineData<Time>[];
}

// Helper to convert date to timestamp
function dateToTime(dateStr: string): Time {
  return (new Date(dateStr).getTime() / 1000) as Time;
}

// Helper to deduplicate and sort data by time
function deduplicateByTime<T extends { time: Time }>(data: T[]): T[] {
  const seen = new Set<number>();
  return data.filter((item) => {
    const timeNum = item.time as number;
    if (seen.has(timeNum)) return false;
    seen.add(timeNum);
    return true;
  });
}

// SMA - Simple Moving Average
export function calculateSMA(
  data: CandlestickData<Time>[],
  period: number
): LineData<Time>[] {
  const smaData: LineData<Time>[] = [];

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    smaData.push({
      time: data[i].time,
      value: sum / period,
    });
  }

  return deduplicateByTime(smaData);
}

// EMA - Exponential Moving Average
export function calculateEMA(
  data: CandlestickData<Time>[],
  period: number
): LineData<Time>[] {
  const emaData: LineData<Time>[] = [];
  const multiplier = 2 / (period + 1);

  if (data.length < period) return emaData;

  // Calculate initial SMA for the first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  let ema = sum / period;

  emaData.push({
    time: data[period - 1].time,
    value: ema,
  });

  // Calculate EMA for remaining data
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    emaData.push({
      time: data[i].time,
      value: ema,
    });
  }

  return deduplicateByTime(emaData);
}

// RSI - Relative Strength Index
export function calculateRSI(
  data: CandlestickData<Time>[],
  period: number
): LineData<Time>[] {
  const rsiData: LineData<Time>[] = [];

  if (data.length < period + 1) return rsiData;

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i].close - data[i - 1].close);
  }

  // Calculate initial average gain and loss
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }
  avgGain /= period;
  avgLoss /= period;

  // First RSI value
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);
  rsiData.push({
    time: data[period].time,
    value: rsi,
  });

  // Calculate RSI for remaining data using smoothed averages
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);

    rsiData.push({
      time: data[i + 1].time,
      value: rsi,
    });
  }

  return deduplicateByTime(rsiData);
}

// MACD - Moving Average Convergence Divergence
export function calculateMACD(
  data: CandlestickData<Time>[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDData {
  const result: MACDData = {
    macd: [],
    signal: [],
    histogram: [],
  };

  if (data.length < slowPeriod + signalPeriod) return result;

  // Calculate EMAs
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  // Need to align the EMAs - slow EMA starts later
  const offset = slowPeriod - fastPeriod;

  // Calculate MACD line (fast EMA - slow EMA)
  const macdValues: { time: Time; value: number }[] = [];
  for (let i = 0; i < slowEMA.length; i++) {
    const fastIndex = i + offset;
    if (fastIndex < fastEMA.length) {
      macdValues.push({
        time: slowEMA[i].time,
        value: fastEMA[fastIndex].value - slowEMA[i].value,
      });
    }
  }

  // Calculate signal line (EMA of MACD)
  if (macdValues.length < signalPeriod) return result;

  const multiplier = 2 / (signalPeriod + 1);
  let sum = 0;
  for (let i = 0; i < signalPeriod; i++) {
    sum += macdValues[i].value;
  }
  let signalEMA = sum / signalPeriod;

  // First signal value
  result.macd.push({ time: macdValues[signalPeriod - 1].time, value: macdValues[signalPeriod - 1].value });
  result.signal.push({ time: macdValues[signalPeriod - 1].time, value: signalEMA });
  const firstHistValue = macdValues[signalPeriod - 1].value - signalEMA;
  result.histogram.push({
    time: macdValues[signalPeriod - 1].time,
    value: firstHistValue,
    color: firstHistValue >= 0 ? "rgba(76, 175, 80, 0.7)" : "rgba(255, 82, 82, 0.7)",
  });

  // Calculate remaining values
  for (let i = signalPeriod; i < macdValues.length; i++) {
    signalEMA = (macdValues[i].value - signalEMA) * multiplier + signalEMA;
    const histValue = macdValues[i].value - signalEMA;

    result.macd.push({ time: macdValues[i].time, value: macdValues[i].value });
    result.signal.push({ time: macdValues[i].time, value: signalEMA });
    result.histogram.push({
      time: macdValues[i].time,
      value: histValue,
      color: histValue >= 0 ? "rgba(76, 175, 80, 0.7)" : "rgba(255, 82, 82, 0.7)",
    });
  }

  return {
    macd: deduplicateByTime(result.macd),
    signal: deduplicateByTime(result.signal),
    histogram: deduplicateByTime(result.histogram),
  };
}

// Bollinger Bands
export function calculateBollinger(
  data: CandlestickData<Time>[],
  period: number = 20,
  stdDev: number = 2
): BollingerData {
  const result: BollingerData = {
    upper: [],
    middle: [],
    lower: [],
  };

  if (data.length < period) return result;

  for (let i = period - 1; i < data.length; i++) {
    // Calculate SMA (middle band)
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    const sma = sum / period;

    // Calculate standard deviation
    let squaredDiffSum = 0;
    for (let j = 0; j < period; j++) {
      const diff = data[i - j].close - sma;
      squaredDiffSum += diff * diff;
    }
    const std = Math.sqrt(squaredDiffSum / period);

    result.middle.push({ time: data[i].time, value: sma });
    result.upper.push({ time: data[i].time, value: sma + stdDev * std });
    result.lower.push({ time: data[i].time, value: sma - stdDev * std });
  }

  return {
    upper: deduplicateByTime(result.upper),
    middle: deduplicateByTime(result.middle),
    lower: deduplicateByTime(result.lower),
  };
}

// Stochastic Oscillator
export function calculateStochastic(
  data: CandlestickData<Time>[],
  kPeriod: number = 14,
  dPeriod: number = 3
): StochasticData {
  const result: StochasticData = {
    k: [],
    d: [],
  };

  if (data.length < kPeriod + dPeriod - 1) return result;

  // Calculate %K values
  const kValues: { time: Time; value: number }[] = [];
  for (let i = kPeriod - 1; i < data.length; i++) {
    let highest = data[i].high;
    let lowest = data[i].low;

    for (let j = 1; j < kPeriod; j++) {
      highest = Math.max(highest, data[i - j].high);
      lowest = Math.min(lowest, data[i - j].low);
    }

    const range = highest - lowest;
    const k = range === 0 ? 50 : ((data[i].close - lowest) / range) * 100;

    kValues.push({ time: data[i].time, value: k });
  }

  // Calculate %D (SMA of %K)
  for (let i = dPeriod - 1; i < kValues.length; i++) {
    let sum = 0;
    for (let j = 0; j < dPeriod; j++) {
      sum += kValues[i - j].value;
    }
    const d = sum / dPeriod;

    result.k.push(kValues[i]);
    result.d.push({ time: kValues[i].time, value: d });
  }

  return {
    k: deduplicateByTime(result.k),
    d: deduplicateByTime(result.d),
  };
}

// ATR - Average True Range
export function calculateATR(
  data: CandlestickData<Time>[],
  period: number = 14
): LineData<Time>[] {
  const atrData: LineData<Time>[] = [];

  if (data.length < period + 1) return atrData;

  // Calculate True Range values
  const trValues: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trValues.push(tr);
  }

  // Calculate initial ATR (simple average of first n TR values)
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += trValues[i];
  }
  let atr = sum / period;

  atrData.push({
    time: data[period].time,
    value: atr,
  });

  // Calculate ATR using smoothed average
  for (let i = period; i < trValues.length; i++) {
    atr = (atr * (period - 1) + trValues[i]) / period;
    atrData.push({
      time: data[i + 1].time,
      value: atr,
    });
  }

  return deduplicateByTime(atrData);
}

// Helper function to transform raw OHLCV data to candlestick format
export function transformToCandlestick(data: OHLCVData[]): CandlestickData<Time>[] {
  return data.map((item) => ({
    time: dateToTime(item.Date),
    open: item.Open,
    high: item.High,
    low: item.Low,
    close: item.Close,
  }));
}
