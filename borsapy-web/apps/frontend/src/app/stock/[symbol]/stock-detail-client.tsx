"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { StockHeader } from "@/components/stock/stock-header";
import { stocksApi, StockInfo, TechnicalAnalysis, Performance } from "@/lib/api";
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
  LineChart,
  PieChart,
  CheckCircle,
  XCircle,
  MinusCircle,
} from "lucide-react";

const METRIC_TOOLTIPS = {
  market_cap: "Piyasa Degeri: Sirketin toplam piyasa degeri. Hisse fiyati x toplam hisse sayisi ile hesaplanir.",
  pe_ratio: "F/K Orani (Fiyat/Kazanc): Hisse fiyatinin hisse basina kara orani. Dusuk F/K ucuzluga, yuksek F/K pahaliliga isaret edebilir.",
  pb_ratio: "PD/DD (Piyasa Degeri/Defter Degeri): Sirketin piyasa degerinin ozkaynaklara orani. 1'in alti varliklarin altinda islem gordugunu gosterir.",
  volume: "Hacim: Gunluk islem hacmi. Yuksek hacim, yuksek likidite ve ilgi anlamina gelir.",
};

interface StockDetailClientProps {
  symbol: string;
  initialStock: StockInfo | null;
  initialTechnicals: TechnicalAnalysis | null;
  initialPerformance: Performance | null;
}

export function StockDetailClient({
  symbol,
  initialStock,
  initialTechnicals,
  initialPerformance,
}: StockDetailClientProps) {
  const { data: stock } = useQuery({
    queryKey: ["stock", symbol],
    queryFn: () => stocksApi.getInfo(symbol),
    initialData: initialStock ?? undefined,
    refetchInterval: 30 * 1000,
  });

  const { data: technicals, isLoading: technicalsLoading } = useQuery({
    queryKey: ["stock", symbol, "technicals"],
    queryFn: () => stocksApi.getTechnicals(symbol),
    initialData: initialTechnicals ?? undefined,
  });

  const { data: performance, isLoading: performanceLoading } = useQuery({
    queryKey: ["stock", symbol, "performance"],
    queryFn: () => stocksApi.getPerformance(symbol),
    initialData: initialPerformance ?? undefined,
  });

  if (!stock) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Hisse bulunamadi</h2>
        <p className="text-muted-foreground">{symbol} sembolu icin veri bulunamadi.</p>
      </div>
    );
  }

  // Get RSI status for summary
  const getRsiStatus = () => {
    if (!technicals?.indicators?.rsi) return null;
    const rsi = technicals.indicators.rsi;
    if (rsi < 30) return { label: "Asiri Satim", type: "bullish" };
    if (rsi > 70) return { label: "Asiri Alim", type: "bearish" };
    return { label: "Notr", type: "neutral" };
  };

  // Get trend status
  const getTrendStatus = () => {
    if (!technicals?.indicators || !technicals.current_price) return null;
    const { sma_50, sma_200 } = technicals.indicators;
    const price = technicals.current_price;

    if (sma_50 && sma_200 && price > sma_50 && price > sma_200) {
      return { label: "Yukselis", type: "bullish" };
    }
    if (sma_50 && sma_200 && price < sma_50 && price < sma_200) {
      return { label: "Dusus", type: "bearish" };
    }
    return { label: "Yatay", type: "neutral" };
  };

  const rsiStatus = getRsiStatus();
  const trendStatus = getTrendStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <StockHeader stock={stock} />

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <Link href={`/teknik-analiz/${symbol}`} className="flex-1">
          <Button variant="outline" className="w-full h-auto py-4" size="lg">
            <LineChart className="h-5 w-5 mr-2" />
            <div className="text-left">
              <p className="font-semibold">Teknik Analiz</p>
              <p className="text-xs text-muted-foreground">Grafik ve gostergeler</p>
            </div>
          </Button>
        </Link>
        <Link href={`/temel-analiz/${symbol}`} className="flex-1">
          <Button variant="outline" className="w-full h-auto py-4" size="lg">
            <PieChart className="h-5 w-5 mr-2" />
            <div className="text-left">
              <p className="font-semibold">Temel Analiz</p>
              <p className="text-xs text-muted-foreground">Finansal metrikler</p>
            </div>
          </Button>
        </Link>
      </div>

      {/* Key Stats Grid */}
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Technical Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChart className="h-4 w-4" />
              Teknik Ozet
            </CardTitle>
          </CardHeader>
          <CardContent>
            {technicalsLoading ? (
              <Skeleton className="h-16" />
            ) : (
              <div className="flex items-center gap-6">
                {/* RSI */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">RSI:</span>
                  <span className="font-medium">
                    {technicals?.indicators?.rsi ? formatNumber(technicals.indicators.rsi, 0) : "-"}
                  </span>
                  {rsiStatus && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      rsiStatus.type === "bullish" && "bg-green-500/10 text-green-500",
                      rsiStatus.type === "bearish" && "bg-red-500/10 text-red-500",
                      rsiStatus.type === "neutral" && "bg-yellow-500/10 text-yellow-500"
                    )}>
                      {rsiStatus.label}
                    </span>
                  )}
                </div>

                {/* Trend */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Trend:</span>
                  {trendStatus && (
                    <span className={cn(
                      "flex items-center gap-1 text-xs px-2 py-0.5 rounded",
                      trendStatus.type === "bullish" && "bg-green-500/10 text-green-500",
                      trendStatus.type === "bearish" && "bg-red-500/10 text-red-500",
                      trendStatus.type === "neutral" && "bg-yellow-500/10 text-yellow-500"
                    )}>
                      {trendStatus.type === "bullish" && <CheckCircle className="h-3 w-3" />}
                      {trendStatus.type === "bearish" && <XCircle className="h-3 w-3" />}
                      {trendStatus.type === "neutral" && <MinusCircle className="h-3 w-3" />}
                      {trendStatus.label}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fundamental Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-4 w-4" />
              Temel Ozet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">F/K:</span>
                <span className="font-medium">{stock.pe_ratio ? formatNumber(stock.pe_ratio, 1) : "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">PD/DD:</span>
                <span className="font-medium">{stock.pb_ratio ? formatNumber(stock.pb_ratio, 2) : "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">52H:</span>
                <span className="font-medium">
                  {stock.year_high && stock.year_low && stock.last_price ? (
                    `%${formatNumber(((stock.last_price - stock.year_low) / (stock.year_high - stock.year_low)) * 100, 0)}`
                  ) : "-"}
                </span>
              </div>
            </div>
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
    </div>
  );
}
