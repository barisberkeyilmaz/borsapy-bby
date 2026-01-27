"use client";

import Link from "next/link";
import { ScanResultItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatPercent, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";

interface ScannerResultsProps {
  results: ScanResultItem[];
  isLoading?: boolean;
  conditions?: string[];
}

export function ScannerResults({ results, isLoading, conditions }: ScannerResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Sonuç bulunamadı</p>
        <p className="text-sm mt-1">Koşullarınızı değiştirmeyi deneyin</p>
      </div>
    );
  }

  // Determine which columns to show based on conditions
  const showRsi = conditions?.some((c) => c.includes("rsi"));
  const showMacd = conditions?.some((c) => c.includes("macd") || c.includes("signal"));
  const showSma = conditions?.some((c) => c.includes("sma_"));
  const showStoch = conditions?.some((c) => c.includes("stoch_"));
  const showVolume = conditions?.some((c) => c.includes("volume"));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-3 px-2 text-left font-medium text-muted-foreground">Sembol</th>
            <th className="py-3 px-2 text-right font-medium text-muted-foreground">Fiyat</th>
            <th className="py-3 px-2 text-right font-medium text-muted-foreground">Değişim</th>
            {showVolume && (
              <th className="py-3 px-2 text-right font-medium text-muted-foreground">Hacim</th>
            )}
            {showRsi && (
              <th className="py-3 px-2 text-right font-medium text-muted-foreground">RSI</th>
            )}
            {showMacd && (
              <>
                <th className="py-3 px-2 text-right font-medium text-muted-foreground">MACD</th>
                <th className="py-3 px-2 text-right font-medium text-muted-foreground">Sinyal</th>
              </>
            )}
            {showSma && (
              <>
                <th className="py-3 px-2 text-right font-medium text-muted-foreground">SMA20</th>
                <th className="py-3 px-2 text-right font-medium text-muted-foreground">SMA50</th>
              </>
            )}
            {showStoch && (
              <>
                <th className="py-3 px-2 text-right font-medium text-muted-foreground">Stoch K</th>
                <th className="py-3 px-2 text-right font-medium text-muted-foreground">Stoch D</th>
              </>
            )}
            <th className="py-3 px-2 text-right font-medium text-muted-foreground"></th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => {
            const isPositive = (result.change_percent ?? 0) >= 0;

            return (
              <tr
                key={result.symbol}
                className="border-b hover:bg-muted/50 transition-colors"
              >
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{result.symbol}</span>
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 text-positive" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-negative" />
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 text-right font-mono">
                  {formatNumber(result.close ?? 0)}
                </td>
                <td className={cn(
                  "py-3 px-2 text-right font-mono",
                  isPositive ? "text-positive" : "text-negative"
                )}>
                  {formatPercent(result.change_percent ?? 0)}
                </td>
                {showVolume && (
                  <td className="py-3 px-2 text-right font-mono text-muted-foreground">
                    {formatVolume(result.volume ?? 0)}
                  </td>
                )}
                {showRsi && (
                  <td className="py-3 px-2 text-right">
                    <RsiBadge value={result.rsi} />
                  </td>
                )}
                {showMacd && (
                  <>
                    <td className="py-3 px-2 text-right font-mono text-sm">
                      {result.macd?.toFixed(2) ?? "-"}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-sm">
                      {result.signal?.toFixed(2) ?? "-"}
                    </td>
                  </>
                )}
                {showSma && (
                  <>
                    <td className="py-3 px-2 text-right font-mono text-sm text-muted-foreground">
                      {formatNumber(result.sma_20 ?? 0)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-sm text-muted-foreground">
                      {formatNumber(result.sma_50 ?? 0)}
                    </td>
                  </>
                )}
                {showStoch && (
                  <>
                    <td className="py-3 px-2 text-right font-mono text-sm">
                      {result.stoch_k?.toFixed(1) ?? "-"}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-sm">
                      {result.stoch_d?.toFixed(1) ?? "-"}
                    </td>
                  </>
                )}
                <td className="py-3 px-2 text-right">
                  <Link
                    href={`/stock/${result.symbol}`}
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RsiBadge({ value }: { value?: number }) {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground">-</span>;
  }

  let variant: "default" | "destructive" | "success" | "outline" = "outline";
  if (value < 30) variant = "success"; // Oversold - potential buy
  else if (value > 70) variant = "destructive"; // Overbought - potential sell

  return (
    <Badge variant={variant} className="font-mono">
      {value.toFixed(1)}
    </Badge>
  );
}

function formatVolume(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toString();
}
