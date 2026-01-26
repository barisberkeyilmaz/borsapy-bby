"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  LineData,
  Time,
  AreaSeries,
  LineSeries,
} from "lightweight-charts";
import { Skeleton } from "@/components/ui/skeleton";

interface EquityChartProps {
  data: { date: string; equity: number }[];
  initialCapital: number;
}

export function EquityChart({ data, initialCapital }: EquityChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

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
      height: 300,
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

    // Add equity line (v5 API)
    const equitySeries = chart.addSeries(AreaSeries, {
      lineColor: "#4caf50",
      topColor: "rgba(76, 175, 80, 0.3)",
      bottomColor: "rgba(76, 175, 80, 0.0)",
      lineWidth: 2,
    });

    // Add initial capital line (v5 API)
    const capitalSeries = chart.addSeries(LineSeries, {
      color: "#666",
      lineWidth: 1,
      lineStyle: 2, // Dashed
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Transform data
    const equityData: LineData<Time>[] = data.map((item) => ({
      time: (new Date(item.date).getTime() / 1000) as Time,
      value: item.equity,
    }));

    const capitalData: LineData<Time>[] = data.map((item) => ({
      time: (new Date(item.date).getTime() / 1000) as Time,
      value: initialCapital,
    }));

    equitySeries.setData(equityData);
    capitalSeries.setData(capitalData);

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
      chart.remove();
    };
  }, [data, initialCapital]);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Grafik için yeterli veri yok
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={chartContainerRef} className="w-full" />
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-[#4caf50]" />
          <span>Portföy Değeri</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-[#666] border-dashed" style={{ borderTopWidth: 1 }} />
          <span>Başlangıç Sermayesi</span>
        </div>
      </div>
    </div>
  );
}
