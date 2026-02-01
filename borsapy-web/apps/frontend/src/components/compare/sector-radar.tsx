"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { SectorComparison } from "@/lib/api";

interface SectorRadarProps {
  data: SectorComparison | undefined;
  isLoading: boolean;
}

const METRIC_LABELS: Record<string, string> = {
  pe_ratio: "F/K",
  pb_ratio: "PD/DD",
  market_cap: "Piyasa Deg.",
  roe: "ROE",
  dividend_yield: "Temettü",
  debt_to_equity: "Borç/Özkaynak",
};

export function SectorRadar({ data, isLoading }: SectorRadarProps) {
  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  if (!data || !data.sector || Object.keys(data.metrics).length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        {data?.error || "Sektör verisi bulunamadı"}
      </div>
    );
  }

  // Transform data for radar chart
  // Normalize values: stock value relative to sector avg (100 = average)
  const chartData = Object.entries(data.metrics).map(([key, metric]) => {
    const stockNormalized = metric.stock_value && metric.sector_avg
      ? (metric.stock_value / metric.sector_avg) * 100
      : 100;

    return {
      metric: METRIC_LABELS[key] || key,
      stock: Math.min(stockNormalized, 200), // Cap at 200% for visualization
      sector: 100, // Sector average is always 100
      fullMark: 200,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Karşılaştırma metrikleri bulunamadı
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 200]}
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Radar
              name="Sektör Ort."
              dataKey="sector"
              stroke="#6b7280"
              fill="#6b7280"
              fillOpacity={0.1}
              strokeDasharray="5 5"
            />
            <Radar
              name={data.symbol}
              dataKey="stock"
              stroke="#2563eb"
              fill="#2563eb"
              fillOpacity={0.3}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Metric details */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {Object.entries(data.metrics).map(([key, metric]) => (
          <div key={key} className="p-2 rounded-md bg-muted/50">
            <div className="text-muted-foreground text-xs">
              {METRIC_LABELS[key] || key}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-medium">
                {metric.stock_value?.toFixed(2) ?? "-"}
              </span>
              {metric.vs_sector !== null && (
                <span
                  className={`text-xs ${
                    metric.vs_sector > 0
                      ? "text-red-500"
                      : metric.vs_sector < 0
                      ? "text-green-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {metric.vs_sector > 0 ? "+" : ""}
                  {metric.vs_sector?.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Sektör: {metric.sector_avg?.toFixed(2) ?? "-"}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        * Değerler sektör ortalamasına göre normalize edilmiştir (100 = sektör ortalaması)
      </p>
    </div>
  );
}
