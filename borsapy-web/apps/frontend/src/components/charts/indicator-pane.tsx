"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  LineData,
  HistogramData,
  Time,
  LineSeries,
  HistogramSeries,
  ITimeScaleApi,
} from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ActiveIndicator } from "@/store/chart";
import { INDICATOR_CONFIGS } from "./indicators/config";
import { MACDData, StochasticData, BollingerData } from "./indicators/calculations";

interface IndicatorPaneProps {
  indicator: ActiveIndicator;
  data: LineData<Time>[] | MACDData | StochasticData | BollingerData;
  onRemove: () => void;
  mainTimeScale?: ITimeScaleApi<Time>;
  width: number;
}

export function IndicatorPane({
  indicator,
  data,
  onRemove,
  mainTimeScale,
  width,
}: IndicatorPaneProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<Map<string, ISeriesApi<"Line" | "Histogram">>>(new Map());

  const config = INDICATOR_CONFIGS[indicator.type];
  const label = `${config.shortName}(${Object.values(indicator.params).join(", ")})`;

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      width: width,
      height: 100,
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
        visible: false,
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
    });

    chartRef.current = chart;

    // Add reference lines if configured
    if (config.referenceLines) {
      config.referenceLines.forEach((level) => {
        const priceLine = {
          price: level,
          color: "rgba(255, 255, 255, 0.2)",
          lineWidth: 1 as const,
          lineStyle: 2 as const,
          axisLabelVisible: true,
          title: String(level),
        };
        // Reference lines will be added to the first series
      });
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      seriesRefs.current.clear();
    };
  }, [width, config.referenceLines]);

  // Handle resize
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({ width });
    }
  }, [width]);

  // Sync time scale with main chart
  useEffect(() => {
    if (!chartRef.current || !mainTimeScale) return;

    const handleVisibleRangeChange = () => {
      const visibleRange = mainTimeScale.getVisibleRange();
      if (visibleRange && chartRef.current) {
        chartRef.current.timeScale().setVisibleRange(visibleRange);
      }
    };

    mainTimeScale.subscribeVisibleTimeRangeChange(handleVisibleRangeChange);

    return () => {
      mainTimeScale.unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
    };
  }, [mainTimeScale]);

  // Update data
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = chartRef.current;

    // Clear existing series
    seriesRefs.current.forEach((series) => {
      try {
        chart.removeSeries(series);
      } catch {
        // Series may already be removed
      }
    });
    seriesRefs.current.clear();

    // Handle different indicator types
    if (indicator.type === "macd" && "macd" in data) {
      const macdData = data as MACDData;

      // Histogram
      const histogramSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "price", precision: 4 },
        priceLineVisible: false,
        lastValueVisible: false,
      });
      histogramSeries.setData(macdData.histogram);
      seriesRefs.current.set("histogram", histogramSeries as any);

      // MACD line
      const macdSeries = chart.addSeries(LineSeries, {
        color: "#2196f3",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      macdSeries.setData(macdData.macd);
      seriesRefs.current.set("macd", macdSeries as any);

      // Signal line
      const signalSeries = chart.addSeries(LineSeries, {
        color: "#ff9800",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      signalSeries.setData(macdData.signal);
      seriesRefs.current.set("signal", signalSeries as any);

      // Add zero reference line
      macdSeries.createPriceLine({
        price: 0,
        color: "rgba(255, 255, 255, 0.2)",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: false,
      });
    } else if (indicator.type === "stochastic" && "k" in data) {
      const stochData = data as StochasticData;

      // %K line
      const kSeries = chart.addSeries(LineSeries, {
        color: "#2196f3",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      kSeries.setData(stochData.k);
      seriesRefs.current.set("k", kSeries as any);

      // %D line
      const dSeries = chart.addSeries(LineSeries, {
        color: "#ff9800",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      dSeries.setData(stochData.d);
      seriesRefs.current.set("d", dSeries as any);

      // Add reference lines
      kSeries.createPriceLine({
        price: 20,
        color: "rgba(255, 255, 255, 0.2)",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
      });
      kSeries.createPriceLine({
        price: 80,
        color: "rgba(255, 255, 255, 0.2)",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
      });
    } else if (Array.isArray(data)) {
      // Single line indicators (RSI, ATR)
      const lineSeries = chart.addSeries(LineSeries, {
        color: indicator.color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      lineSeries.setData(data as LineData<Time>[]);
      seriesRefs.current.set("main", lineSeries as any);

      // Add reference lines for RSI
      if (indicator.type === "rsi") {
        lineSeries.createPriceLine({
          price: 30,
          color: "rgba(76, 175, 80, 0.3)",
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
        });
        lineSeries.createPriceLine({
          price: 70,
          color: "rgba(255, 82, 82, 0.3)",
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
        });
      }
    }

    // Fit content
    chart.timeScale().fitContent();
  }, [data, indicator.type, indicator.color]);

  return (
    <div className="relative border-t border-border/50">
      {/* Header */}
      <div className="absolute top-1 left-2 z-10 flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-5 w-5 p-0 hover:bg-muted"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="w-full h-[100px]" />
    </div>
  );
}
