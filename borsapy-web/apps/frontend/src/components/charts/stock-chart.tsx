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
  AreaSeries,
  ITimeScaleApi,
  IPriceLine,
  SeriesMarker,
  LineStyle,
} from "lightweight-charts";
import { PriceLevel, TradingSignal } from "@/lib/api";
import { ChartToolbar } from "./chart-toolbar";
import { ChartLegend } from "./chart-legend";
import { IndicatorPane } from "./indicator-pane";
import { Skeleton } from "@/components/ui/skeleton";
import { useChartStore, ChartType } from "@/store/chart";
import {
  useChartIndicators,
  getLatestIndicatorValue,
  CalculatedIndicator,
} from "@/hooks/useChartIndicators";
import { BollingerData } from "./indicators/calculations";
import { SeriesMarkersPrimitive } from "./markers-primitive";

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
  interval: string;
  onPeriodChange: (period: string) => void;
  onIntervalChange: (interval: string) => void;
  levels?: PriceLevel[];
  signals?: TradingSignal[];
}

export function StockChart({
  data,
  isLoading,
  period,
  interval,
  onPeriodChange,
  onIntervalChange,
  levels,
  signals,
}: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<"Candlestick" | "Line" | "Area"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const overlaySeriesRefs = useRef<Map<string, ISeriesApi<"Line">[]>>(new Map());
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const resizeHandlerRef = useRef<(() => void) | null>(null);
  const timeScaleRef = useRef<ITimeScaleApi<Time> | null>(null);
  const markersPrimitiveRef = useRef<SeriesMarkersPrimitive | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const {
    chartType,
    showVolume,
    showSupportResistance,
    showSignals,
    activeIndicators,
    setChartType,
    setShowVolume,
    setShowSupportResistance,
    setShowSignals,
    removeIndicator,
  } = useChartStore();

  // Transform raw data to candlestick format
  const transformData = useCallback(() => {
    if (!data || data.length === 0) return { candleData: [], volumeData: [] };

    const candleData: CandlestickData<Time>[] = [];
    const volumeData: HistogramData<Time>[] = [];
    const seenTimes = new Set<number>();

    // Sort data by date and filter duplicates
    const sortedData = [...data].sort(
      (a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime()
    );

    sortedData.forEach((item) => {
      const time = (new Date(item.Date).getTime() / 1000) as Time;

      // Skip duplicate timestamps
      if (seenTimes.has(time as number)) return;
      seenTimes.add(time as number);

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

  const { candleData, volumeData } = transformData();

  // Calculate indicators
  const calculatedIndicators = useChartIndicators(candleData, activeIndicators);

  // Separate overlay and panel indicators
  const overlayIndicators = calculatedIndicators.filter(
    (ci) => ci.indicator.pane === "overlay" && ci.indicator.visible
  );
  const panelIndicators = calculatedIndicators.filter(
    (ci) => ci.indicator.pane === "separate" && ci.indicator.visible
  );

  // Get indicator values for legend
  const indicatorValues = overlayIndicators.map((ci) => ({
    indicatorId: ci.indicator.id,
    values: getLatestIndicatorValue(ci),
  }));

  // Initialize main chart
  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;
    if (!data || data.length === 0) return;

    const container = chartContainerRef.current;
    setContainerWidth(container.clientWidth);

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.1)" },
        horzLines: { color: "rgba(255, 255, 255, 0.1)" },
      },
      width: container.clientWidth,
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
    timeScaleRef.current = chart.timeScale();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const newWidth = chartContainerRef.current.clientWidth;
        chartRef.current.applyOptions({ width: newWidth });
        setContainerWidth(newWidth);
      }
    };

    resizeHandlerRef.current = handleResize;
    window.addEventListener("resize", handleResize);
  }, [data]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (resizeHandlerRef.current) {
        window.removeEventListener("resize", resizeHandlerRef.current);
      }
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch {
          // Chart may already be removed
        }
        chartRef.current = null;
      }
    };
  }, []);

  // Update main series based on chart type
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = chartRef.current;

    // Remove existing main series
    if (mainSeriesRef.current) {
      try {
        chart.removeSeries(mainSeriesRef.current);
      } catch {
        // Series may already be removed
      }
      mainSeriesRef.current = null;
    }

    // Remove existing volume series
    if (volumeSeriesRef.current) {
      try {
        chart.removeSeries(volumeSeriesRef.current);
      } catch {
        // Series may already be removed
      }
      volumeSeriesRef.current = null;
    }

    if (candleData.length === 0) return;

    // Create new main series based on chart type
    if (chartType === "candlestick") {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#4caf50",
        downColor: "#ff5252",
        borderUpColor: "#4caf50",
        borderDownColor: "#ff5252",
        wickUpColor: "#4caf50",
        wickDownColor: "#ff5252",
      });
      series.setData(candleData);
      mainSeriesRef.current = series as any;
    } else if (chartType === "line") {
      const series = chart.addSeries(LineSeries, {
        color: "#2196f3",
        lineWidth: 2,
      });
      const lineData: LineData<Time>[] = candleData.map((d) => ({
        time: d.time,
        value: d.close,
      }));
      series.setData(lineData);
      mainSeriesRef.current = series as any;
    } else if (chartType === "area") {
      const series = chart.addSeries(AreaSeries, {
        topColor: "rgba(33, 150, 243, 0.4)",
        bottomColor: "rgba(33, 150, 243, 0.0)",
        lineColor: "#2196f3",
        lineWidth: 2,
      });
      const areaData: LineData<Time>[] = candleData.map((d) => ({
        time: d.time,
        value: d.close,
      }));
      series.setData(areaData);
      mainSeriesRef.current = series as any;
    }

    // Create volume series if enabled
    if (showVolume && volumeData.length > 0) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      volumeSeries.setData(volumeData);
      volumeSeriesRef.current = volumeSeries as any;

      chart.priceScale("volume").applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
    }

    // Add signal markers to the main series
    if (mainSeriesRef.current && showSignals && signals && signals.length > 0) {
      const dateToTimeMap = new Map<string, Time>();
      data.forEach((item) => {
        const time = (new Date(item.Date).getTime() / 1000) as Time;
        dateToTimeMap.set(item.Date, time);
        const dateOnly = item.Date.substring(0, 10);
        if (!dateToTimeMap.has(dateOnly)) {
          dateToTimeMap.set(dateOnly, time);
        }
      });

      const markers: SeriesMarker<Time>[] = [];
      const usedTimes = new Set<number>();

      for (const signal of signals) {
        let candleTime: Time | null = null;

        if (dateToTimeMap.has(signal.date)) {
          candleTime = dateToTimeMap.get(signal.date)!;
        } else {
          const signalDateOnly = signal.date.substring(0, 10);
          if (dateToTimeMap.has(signalDateOnly)) {
            candleTime = dateToTimeMap.get(signalDateOnly)!;
          }
        }

        if (candleTime === null) continue;
        if (usedTimes.has(candleTime as number)) continue;
        usedTimes.add(candleTime as number);

        const isBuy = signal.signal_type === "buy";
        markers.push({
          time: candleTime,
          position: isBuy ? "belowBar" : "aboveBar",
          color: isBuy ? "#22c55e" : "#ef4444",
          shape: isBuy ? "arrowUp" : "arrowDown",
          text: signal.indicator.toUpperCase(),
        });
      }

      markers.sort((a, b) => (a.time as number) - (b.time as number));

      // Use primitive for markers in lightweight-charts v5
      const series = mainSeriesRef.current as any;

      // Remove old primitive if exists
      if (markersPrimitiveRef.current) {
        try {
          series.detachPrimitive(markersPrimitiveRef.current);
        } catch {
          // Primitive may already be detached
        }
        markersPrimitiveRef.current = null;
      }

      if (markers.length > 0) {
        const primitive = new SeriesMarkersPrimitive();
        primitive.setMarkers(markers);
        series.attachPrimitive(primitive);
        markersPrimitiveRef.current = primitive;
      }
    }

    // Fit content
    chart.timeScale().fitContent();
  }, [chartType, candleData, volumeData, showVolume, showSignals, signals, data]);

  // Update overlay indicators
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = chartRef.current;

    // Remove existing overlay series
    overlaySeriesRefs.current.forEach((seriesArray) => {
      seriesArray.forEach((series) => {
        try {
          chart.removeSeries(series);
        } catch {
          // Series may already be removed
        }
      });
    });
    overlaySeriesRefs.current.clear();

    // Add new overlay indicators
    overlayIndicators.forEach((ci) => {
      const { indicator, data: indicatorData } = ci;
      const seriesArray: ISeriesApi<"Line">[] = [];

      if (indicator.type === "bollinger") {
        const bbData = indicatorData as BollingerData;
        if (bbData.middle.length > 0) {
          // Upper band
          const upperSeries = chart.addSeries(LineSeries, {
            color: indicator.color,
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          upperSeries.setData(bbData.upper);
          seriesArray.push(upperSeries as any);

          // Middle band
          const middleSeries = chart.addSeries(LineSeries, {
            color: indicator.color,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          middleSeries.setData(bbData.middle);
          seriesArray.push(middleSeries as any);

          // Lower band
          const lowerSeries = chart.addSeries(LineSeries, {
            color: indicator.color,
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          lowerSeries.setData(bbData.lower);
          seriesArray.push(lowerSeries as any);
        }
      } else {
        // SMA, EMA
        const lineData = indicatorData as LineData<Time>[];
        if (lineData.length > 0) {
          const series = chart.addSeries(LineSeries, {
            color: indicator.color,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          series.setData(lineData);
          seriesArray.push(series as any);
        }
      }

      overlaySeriesRefs.current.set(indicator.id, seriesArray);
    });
  }, [overlayIndicators]);

  // Update support/resistance price lines
  useEffect(() => {
    if (!mainSeriesRef.current) return;

    const series = mainSeriesRef.current;

    // Remove existing price lines
    priceLinesRef.current.forEach((priceLine) => {
      try {
        series.removePriceLine(priceLine);
      } catch {
        // Price line may already be removed
      }
    });
    priceLinesRef.current = [];

    // Add new price lines if S/R is enabled
    if (showSupportResistance && levels && levels.length > 0) {
      levels.forEach((level) => {
        const isSupport = level.type === "support";
        const color = isSupport ? "#22c55e" : "#ef4444"; // green for support, red for resistance
        const labelPrefix = isSupport ? "S" : "R";

        const priceLine = series.createPriceLine({
          price: level.price,
          color: color,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `${labelPrefix}: ${level.price.toFixed(2)}`,
        });
        priceLinesRef.current.push(priceLine);
      });
    }
  }, [levels, showSupportResistance, mainSeriesRef.current]);

  // Clear markers when showSignals is toggled off
  useEffect(() => {
    if (!mainSeriesRef.current) return;

    if (!showSignals && markersPrimitiveRef.current) {
      try {
        (mainSeriesRef.current as any).detachPrimitive(markersPrimitiveRef.current);
        markersPrimitiveRef.current = null;
      } catch {
        // Primitive may already be detached
      }
    }
  }, [showSignals]);

  const hasData = !!data && data.length > 0;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <ChartToolbar
        period={period}
        interval={interval}
        chartType={chartType}
        showVolume={showVolume}
        showSupportResistance={showSupportResistance}
        showSignals={showSignals}
        hasLevels={!!levels && levels.length > 0}
        hasSignals={!!signals && signals.length > 0}
        onPeriodChange={onPeriodChange}
        onIntervalChange={onIntervalChange}
        onChartTypeChange={setChartType}
        onToggleVolume={() => setShowVolume(!showVolume)}
        onToggleSupportResistance={() => setShowSupportResistance(!showSupportResistance)}
        onToggleSignals={() => setShowSignals(!showSignals)}
      />

      {/* Legend for overlay indicators */}
      <ChartLegend indicatorValues={indicatorValues} />

      {/* Main Chart */}
      <div className="relative rounded-lg border border-border/50 overflow-hidden">
        <div ref={chartContainerRef} className="w-full h-[400px]" />
        {isLoading && !hasData && (
          <div className="absolute inset-0">
            <Skeleton className="h-full w-full" />
          </div>
        )}
        {!isLoading && !hasData && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Grafik verisi bulunamadi
          </div>
        )}

        {/* Separate Panel Indicators */}
        {panelIndicators.map((ci) => (
          <IndicatorPane
            key={ci.indicator.id}
            indicator={ci.indicator}
            data={ci.data}
            onRemove={() => removeIndicator(ci.indicator.id)}
            mainTimeScale={timeScaleRef.current || undefined}
            width={containerWidth}
          />
        ))}
      </div>
    </div>
  );
}
