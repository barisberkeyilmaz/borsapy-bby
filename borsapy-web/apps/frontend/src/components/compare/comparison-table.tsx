"use client";

import { StockInfo } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatPercent, formatMarketCap, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ComparisonTableProps {
  stocks: StockInfo[];
  isLoading: boolean;
}

interface MetricRow {
  label: string;
  key: keyof StockInfo | ((stock: StockInfo) => number | string | undefined | null);
  format: (value: unknown) => string;
  highlight?: "higher" | "lower";
}

const METRICS: MetricRow[] = [
  {
    label: "Fiyat",
    key: "last_price",
    format: (v) => formatNumber(v as number),
  },
  {
    label: "Degisim",
    key: "change_percent",
    format: (v) => formatPercent(v as number),
    highlight: "higher",
  },
  {
    label: "Piyasa Deg.",
    key: "market_cap",
    format: (v) => formatMarketCap(v as number),
    highlight: "higher",
  },
  {
    label: "F/K",
    key: "pe_ratio",
    format: (v) => (v ? formatNumber(v as number, 1) : "-"),
    highlight: "lower",
  },
  {
    label: "PD/DD",
    key: "pb_ratio",
    format: (v) => (v ? formatNumber(v as number, 2) : "-"),
    highlight: "lower",
  },
  {
    label: "Hacim",
    key: "volume",
    format: (v) => formatNumber(v as number, 0),
    highlight: "higher",
  },
  {
    label: "52H Yuksek",
    key: "year_high",
    format: (v) => formatNumber(v as number),
  },
  {
    label: "52H Dusuk",
    key: "year_low",
    format: (v) => formatNumber(v as number),
  },
];

export function ComparisonTable({ stocks, isLoading }: ComparisonTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: METRICS.length }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Karsilastirmak icin en az 2 hisse secin
      </div>
    );
  }

  // Find best/worst values for highlighting
  const getBestIndex = (metric: MetricRow): number | null => {
    if (!metric.highlight) return null;

    const values = stocks.map((stock) => {
      const key = metric.key;
      if (typeof key === "function") return key(stock);
      return stock[key];
    });

    const numericValues = values.map((v) => (typeof v === "number" ? v : null));
    const validValues = numericValues.filter((v) => v !== null) as number[];

    if (validValues.length === 0) return null;

    const targetValue =
      metric.highlight === "higher"
        ? Math.max(...validValues)
        : Math.min(...validValues);

    return numericValues.findIndex((v) => v === targetValue);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="py-3 px-3 text-left text-sm font-medium text-muted-foreground">
              Metrik
            </th>
            {stocks.map((stock) => (
              <th
                key={stock.symbol}
                className="py-3 px-3 text-center text-sm font-medium"
              >
                <div className="space-y-1">
                  <span className="font-bold">{stock.symbol}</span>
                  {stock.change_percent !== undefined && (
                    <Badge
                      variant={
                        stock.change_percent >= 0 ? "success" : "destructive"
                      }
                      className="ml-2"
                    >
                      {stock.change_percent >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {formatPercent(stock.change_percent)}
                    </Badge>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {METRICS.map((metric, idx) => {
            const bestIndex = getBestIndex(metric);

            return (
              <tr key={idx} className="border-b hover:bg-muted/50">
                <td className="py-3 px-3 text-sm text-muted-foreground">
                  {metric.label}
                </td>
                {stocks.map((stock, stockIdx) => {
                  const key = metric.key;
                  const value =
                    typeof key === "function" ? key(stock) : stock[key];
                  const isBest = bestIndex === stockIdx;

                  return (
                    <td
                      key={stock.symbol}
                      className={cn(
                        "py-3 px-3 text-center text-sm",
                        isBest && "font-bold text-primary"
                      )}
                    >
                      {metric.format(value)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
