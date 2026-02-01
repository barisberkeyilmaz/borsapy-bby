"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SectorComparison } from "@/lib/api";
import { formatNumber, formatMarketCap, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Medal } from "lucide-react";

interface SectorRankingProps {
  data: SectorComparison | undefined;
  isLoading: boolean;
}

export function SectorRanking({ data, isLoading }: SectorRankingProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!data || !data.sector || data.sector_stocks.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        {data?.error || "Sektör sıralaması bulunamadı"}
      </div>
    );
  }

  // Find current stock's rank
  const currentStockIndex = data.sector_stocks.findIndex(
    (s: Record<string, unknown>) => (s.symbol as string)?.toUpperCase() === data.symbol.toUpperCase()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{data.sector}</span>
          {" "}sektöründe {data.stock_count} hisse
        </div>
        {currentStockIndex >= 0 && (
          <Badge variant="secondary" className="gap-1">
            <Medal className="h-3 w-3" />
            {currentStockIndex + 1}. sırada
          </Badge>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-2 px-2 text-left w-8">#</th>
              <th className="py-2 px-2 text-left">Sembol</th>
              <th className="py-2 px-2 text-right">Fiyat</th>
              <th className="py-2 px-2 text-right">Değişim</th>
              <th className="py-2 px-2 text-right">Piyasa Değ.</th>
            </tr>
          </thead>
          <tbody>
            {data.sector_stocks.slice(0, 10).map((stock: Record<string, unknown>, idx: number) => {
              const symbol = stock.symbol as string;
              const price = stock.close as number | undefined;
              const change = stock.change_percent as number | undefined;
              const marketCap = stock.market_cap as number | undefined;
              const isCurrentStock = symbol?.toUpperCase() === data.symbol.toUpperCase();

              return (
                <tr
                  key={symbol || idx}
                  className={cn(
                    "border-b hover:bg-muted/50 transition-colors",
                    isCurrentStock && "bg-primary/10"
                  )}
                >
                  <td className="py-2 px-2 text-muted-foreground">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-2">
                    <span className={cn("font-medium", isCurrentStock && "text-primary")}>
                      {symbol}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right">
                    {price ? formatNumber(price) : "-"}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {change !== undefined ? (
                      <span
                        className={cn(
                          "flex items-center justify-end gap-1",
                          change >= 0 ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {change >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {change >= 0 ? "+" : ""}
                        {change.toFixed(2)}%
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-2 px-2 text-right text-muted-foreground">
                    {marketCap ? formatMarketCap(marketCap) : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.sector_stocks.length > 10 && (
        <p className="text-xs text-muted-foreground text-center">
          İlk 10 hisse gösteriliyor (toplam {data.stock_count})
        </p>
      )}
    </div>
  );
}
