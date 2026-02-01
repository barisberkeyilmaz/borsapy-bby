"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  LineSeries,
  Time,
} from "lightweight-charts";
import { Skeleton } from "@/components/ui/skeleton";
import { ComparePerformance } from "@/lib/api";

// Color palette for different stocks
const COLORS = [
  "#2563eb", // blue
  "#dc2626", // red
  "#16a34a", // green
  "#ea580c", // orange
  "#9333ea", // purple
  "#0891b2", // cyan
  "#db2777", // pink
  "#84cc16", // lime
  "#6366f1", // indigo
  "#f59e0b", // amber
];

interface PerformanceChartProps {
  data: ComparePerformance | undefined;
  isLoading: boolean;
}

export function PerformanceChart({ data, isLoading }: PerformanceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.symbols.length === 0) return;

    // Clear previous chart safely
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch {
        // Chart may already be removed
      }
      chartRef.current = null;
    }

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
      height: 350,
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

    // Add line series for each symbol
    data.symbols.forEach((symbol, idx) => {
      const seriesData = data.series[symbol];
      if (!seriesData) return;

      const color = COLORS[idx % COLORS.length];

      const series = chart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: symbol,
      });

      // Convert data to chart format
      const chartData = seriesData.dates.map((date, i) => ({
        time: (new Date(date).getTime() / 1000) as Time,
        value: seriesData.values[i],
      }));

      series.setData(chartData);
    });

    // Fit content
    chart.timeScale().fitContent();

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
  }, [data]);

  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  if (!data || data.symbols.length === 0) {
    return (
      <div className="h-[350px] flex items-center justify-center text-muted-foreground">
        Performans grafiği icin en az 2 hisse secin
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={chartContainerRef} className="w-full" />
      <div className="flex flex-wrap gap-4 justify-center">
        {data.symbols.map((symbol, idx) => (
          <div key={symbol} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-0.5"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            <span>{symbol}</span>
            {data.series[symbol] && (
              <span className="text-muted-foreground">
                ({data.series[symbol].values[data.series[symbol].values.length - 1]?.toFixed(1) || "-"})
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        * Degerler baslangic = 100 olarak normalize edilmistir
      </p>
    </div>
  );
}
