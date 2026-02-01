"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  LineData,
  Time,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
} from "lightweight-charts";
import { ChartControls } from "./chart-controls";
import { Skeleton } from "@/components/ui/skeleton";

interface OHLCVData {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}

interface StockChartProps {
  data: OHLCVData[];
  isLoading?: boolean;
  period: string;
  onPeriodChange: (period: string) => void;
}

function calculateSMA(data: CandlestickData<Time>[], period: number): LineData<Time>[] {
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

  return smaData;
}

export function StockChart({ data, isLoading, period, onPeriodChange }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const sma20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const [showSMA, setShowSMA] = useState(true);

  // Transform data for chart
  const transformData = useCallback(() => {
    if (!data || data.length === 0) return { candleData: [], volumeData: [] };

    const candleData: CandlestickData<Time>[] = [];
    const volumeData: HistogramData<Time>[] = [];

    data.forEach((item) => {
      const time = (new Date(item.Date).getTime() / 1000) as Time;
      const isUp = item.Close >= item.Open;

      candleData.push({
        time,
        open: item.Open,
        high: item.High,
        low: item.Low,
        close: item.Close,
      });

      volumeData.push({
        time,
        value: item.Volume,
        color: isUp ? "rgba(76, 175, 80, 0.5)" : "rgba(255, 82, 82, 0.5)",
      });
    });

    return { candleData, volumeData };
  }, [data]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.1)" },
        horzLines: { color: "rgba(255, 255, 255, 0.1)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      crosshair: {
        mode: 1,
        vertLine: {
          color: "rgba(255, 255, 255, 0.4)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#2a2a2a",
        },
        horzLine: {
          color: "rgba(255, 255, 255, 0.4)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#2a2a2a",
        },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
    });

    chartRef.current = chart;

    // Candlestick series (v5 API)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#4caf50",
      downColor: "#ff5252",
      borderUpColor: "#4caf50",
      borderDownColor: "#ff5252",
      wickUpColor: "#4caf50",
      wickDownColor: "#ff5252",
    });
    candlestickSeriesRef.current = candlestickSeries as any;

    // Volume series (v5 API)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    volumeSeriesRef.current = volumeSeries as any;

    chart.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // SMA 20 series (v5 API)
    const sma20Series = chart.addSeries(LineSeries, {
      color: "#2196f3",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    sma20SeriesRef.current = sma20Series as any;

    // SMA 50 series (v5 API)
    const sma50Series = chart.addSeries(LineSeries, {
      color: "#ff9800",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    sma50SeriesRef.current = sma50Series as any;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      try {
        chart.remove();
      } catch {
        // Chart may already be removed
      }
    };
  }, []);

  // Update data when it changes
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;

    const { candleData, volumeData } = transformData();

    if (candleData.length > 0) {
      candlestickSeriesRef.current.setData(candleData);
      volumeSeriesRef.current.setData(volumeData);

      // Calculate and set SMA data
      if (sma20SeriesRef.current && sma50SeriesRef.current) {
        const sma20Data = calculateSMA(candleData, 20);
        const sma50Data = calculateSMA(candleData, 50);
        sma20SeriesRef.current.setData(sma20Data);
        sma50SeriesRef.current.setData(sma50Data);
      }

      // Fit content
      chartRef.current?.timeScale().fitContent();
    }
  }, [data, transformData]);

  // Toggle SMA visibility
  useEffect(() => {
    if (sma20SeriesRef.current && sma50SeriesRef.current) {
      sma20SeriesRef.current.applyOptions({ visible: showSMA });
      sma50SeriesRef.current.applyOptions({ visible: showSMA });
    }
  }, [showSMA]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-4">
        <ChartControls
          selectedPeriod={period}
          onPeriodChange={onPeriodChange}
          showSMA={showSMA}
          onToggleSMA={() => setShowSMA(!showSMA)}
        />
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          Grafik verisi bulunamadi
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ChartControls
        selectedPeriod={period}
        onPeriodChange={onPeriodChange}
        showSMA={showSMA}
        onToggleSMA={() => setShowSMA(!showSMA)}
      />
      <div ref={chartContainerRef} className="w-full" />
      {showSMA && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-[#2196f3]" />
            <span>SMA 20</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-[#ff9800]" />
            <span>SMA 50</span>
          </div>
        </div>
      )}
    </div>
  );
}
