"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { StockHeader } from "@/components/stock/stock-header";
import { AnalysisNav } from "@/components/stock/analysis-nav";
import { SectorStocksTable } from "@/components/stock/sector-stocks-table";
import { stocksApi, compareApi, StockInfo, Performance, SectorComparison } from "@/lib/api";
import { formatNumber, formatPercent, formatMarketCap, cn } from "@/lib/utils";
import {
  DollarSign,
  BarChart2,
  Percent,
  Activity,
  TrendingUp,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Scale,
} from "lucide-react";

const METRIC_TOOLTIPS = {
  market_cap: "Piyasa Degeri: Sirketin toplam piyasa degeri. Hisse fiyati x toplam hisse sayisi ile hesaplanir.",
  pe_ratio: "F/K Orani (Fiyat/Kazanc): Hisse fiyatinin hisse basina kara orani. Dusuk F/K ucuzluga, yuksek F/K pahaliliga isaret edebilir.",
  pb_ratio: "PD/DD (Piyasa Degeri/Defter Degeri): Sirketin piyasa degerinin ozkaynaklara orani. 1'in alti varliklarin altinda islem gordugunu gosterir.",
  volume: "Hacim: Gunluk islem hacmi. Yuksek hacim, yuksek likidite ve ilgi anlamina gelir.",
};

interface TemelAnalizClientProps {
  symbol: string;
  initialStock: StockInfo | null;
  initialPerformance: Performance | null;
  initialSectorComparison: SectorComparison | null;
}

export function TemelAnalizClient({
  symbol,
  initialStock,
  initialPerformance,
  initialSectorComparison,
}: TemelAnalizClientProps) {
  const { data: stock, isLoading } = useQuery({
    queryKey: ["stock", symbol],
    queryFn: () => stocksApi.getInfo(symbol),
    initialData: initialStock ?? undefined,
    refetchInterval: 30 * 1000,
  });

  const { data: performance, isLoading: performanceLoading } = useQuery({
    queryKey: ["stock", symbol, "performance"],
    queryFn: () => stocksApi.getPerformance(symbol),
    initialData: initialPerformance ?? undefined,
  });

  const { data: sectorComparison, isLoading: sectorLoading, error: sectorError } = useQuery({
    queryKey: ["stock", symbol, "sector-comparison"],
    queryFn: () => compareApi.getSectorComparison(symbol),
    initialData: initialSectorComparison ?? undefined,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading && !stock) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Hisse bulunamadi</h2>
        <p className="text-muted-foreground">{symbol} sembolu icin veri bulunamadi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <StockHeader stock={stock} />

      {/* Analysis Navigation */}
      <AnalysisNav symbol={symbol} />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Piyasa Degeri
              <Tooltip content={METRIC_TOOLTIPS.market_cap} side="bottom">
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </Tooltip>
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMarketCap(stock.market_cap)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              F/K Orani
              <Tooltip content={METRIC_TOOLTIPS.pe_ratio} side="bottom">
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </Tooltip>
            </CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stock.pe_ratio ? formatNumber(stock.pe_ratio, 1) : "-"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              PD/DD
              <Tooltip content={METRIC_TOOLTIPS.pb_ratio} side="bottom">
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </Tooltip>
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stock.pb_ratio ? formatNumber(stock.pb_ratio, 2) : "-"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Hacim
              <Tooltip content={METRIC_TOOLTIPS.volume} side="bottom">
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </Tooltip>
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stock.volume, 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performans
          </CardTitle>
        </CardHeader>
        <CardContent>
          {performanceLoading ? (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : performance ? (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {[
                { label: "1 Hafta", value: performance["1w"] },
                { label: "1 Ay", value: performance["1m"] },
                { label: "3 Ay", value: performance["3m"] },
                { label: "6 Ay", value: performance["6m"] },
                { label: "1 Yil", value: performance["1y"] },
                { label: "YTD", value: performance.ytd },
              ].map((item) => (
                <div key={item.label} className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className={cn(
                    "text-lg font-bold",
                    item.value === null || item.value === undefined
                      ? "text-muted-foreground"
                      : item.value >= 0
                        ? "text-positive"
                        : "text-negative"
                  )}>
                    {item.value !== null && item.value !== undefined ? (
                      <span className="flex items-center justify-center gap-1">
                        {item.value >= 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        {formatPercent(item.value)}
                      </span>
                    ) : "-"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Performans verisi yuklenemedi</p>
          )}
        </CardContent>
      </Card>

      {/* 52 Week Range */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            52 Hafta Fiyat Araligi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-muted-foreground">En Dusuk</p>
                <p className="text-xl font-bold">{formatNumber(stock.year_low)}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">En Yuksek</p>
                <p className="text-xl font-bold">{formatNumber(stock.year_high)}</p>
              </div>
            </div>
            <div className="relative">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                  style={{ width: "100%" }}
                />
              </div>
              {stock.year_high && stock.year_low && stock.last_price && (
                <div
                  className="absolute top-0 w-1 h-3 bg-foreground rounded-full"
                  style={{
                    left: `${((stock.last_price - stock.year_low) / (stock.year_high - stock.year_low)) * 100}%`,
                    transform: "translateX(-50%)",
                  }}
                />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Mevcut Fiyat</p>
              <p className="text-2xl font-bold">{formatNumber(stock.last_price)}</p>
              {stock.year_high && stock.year_low && stock.last_price && (
                <p className="text-sm text-muted-foreground">
                  52H yuksekten %{formatNumber(((stock.year_high - stock.last_price) / stock.year_high) * 100, 1)} dusuk
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sector Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Sektor Karsilastirmasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sectorLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : sectorComparison && !sectorComparison.error ? (
            <div className="space-y-6">
              {sectorComparison.sector && (
                <p className="text-muted-foreground">
                  Sektor: <span className="font-medium text-foreground">{sectorComparison.sector}</span>
                  {sectorComparison.stock_count && (
                    <span className="ml-2">({sectorComparison.stock_count} hisse)</span>
                  )}
                </p>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(sectorComparison.metrics).map(([key, metric]) => {
                  const label = key === "pe_ratio" ? "F/K Orani" :
                               key === "pb_ratio" ? "PD/DD" :
                               key === "market_cap" ? "Piyasa Degeri" :
                               key === "volume" ? "Hacim" : key;

                  const isPositive = metric.vs_sector !== null && metric.vs_sector > 0;

                  return (
                    <div key={key} className="p-4 rounded-lg border border-border/50">
                      <p className="text-sm text-muted-foreground mb-2">{label}</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xl font-bold">
                            {metric.stock_value !== null
                              ? (key === "market_cap" ? formatMarketCap(metric.stock_value) : formatNumber(metric.stock_value, 2))
                              : "-"
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Sektor Ort: {metric.sector_avg !== null
                              ? (key === "market_cap" ? formatMarketCap(metric.sector_avg) : formatNumber(metric.sector_avg, 2))
                              : "-"
                            }
                          </p>
                        </div>
                        {metric.vs_sector !== null && (
                          <div className={cn(
                            "text-sm font-medium px-2 py-1 rounded",
                            isPositive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                          )}>
                            {isPositive ? "+" : ""}{formatPercent(metric.vs_sector)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sector Stocks Table - Virtualized */}
              {sectorComparison.sector_stocks && sectorComparison.sector_stocks.length > 0 && (
                <div className="mt-6">
                  <SectorStocksTable
                    stocks={sectorComparison.sector_stocks}
                    currentSymbol={symbol}
                    maxHeight={400}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                {sectorError
                  ? "Sektor karsilastirma verisi su an yuklenemiyor"
                  : sectorComparison?.error
                    ? sectorComparison.error
                    : "Sektor bilgisi bulunamadi"
                }
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Bu hisse icin sektor verisi mevcut olmayabilir
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
