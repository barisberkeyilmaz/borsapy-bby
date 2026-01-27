"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddStockDialog } from "@/components/portfolio/add-stock-dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { stocksApi } from "@/lib/api";
import { formatNumber, formatPercent, formatMarketCap, cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart2,
  Percent,
  Activity,
  Plus,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MinusCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { usePortfolioStore, Holding } from "@/store/portfolio";

// Metric explanations for tooltips
const METRIC_TOOLTIPS = {
  market_cap: "Piyasa Değeri: Şirketin toplam piyasa değeri. Hisse fiyatı x toplam hisse sayısı ile hesaplanır.",
  pe_ratio: "F/K Oranı (Fiyat/Kazanç): Hisse fiyatının hisse başına kâra oranı. Düşük F/K ucuzluğa, yüksek F/K pahalılığa işaret edebilir.",
  pb_ratio: "PD/DD (Piyasa Değeri/Defter Değeri): Şirketin piyasa değerinin özkaynaklara oranı. 1'in altı varlıkların altında işlem gördüğünü gösterir.",
  volume: "Hacim: Günlük işlem hacmi. Yüksek hacim, yüksek likidite ve ilgi anlamına gelir.",
  rsi: "RSI (Göreceli Güç Endeksi): 0-100 arası değer alır. 30 altı aşırı satım, 70 üstü aşırı alım bölgesi.",
  macd: "MACD: Trend takip göstergesi. Sinyal çizgisinin üstünde yükseliş, altında düşüş trendi.",
  sma: "SMA (Basit Hareketli Ortalama): Belirli dönemdeki fiyatların ortalaması. Trend yönünü belirler.",
  bollinger: "Bollinger Bantları: Fiyatın volatilitesini ölçer. Banda yaklaşma aşırı alım/satım sinyali olabilir.",
  stochastic: "Stochastic: Momentum göstergesi. 20 altı aşırı satım, 80 üstü aşırı alım.",
};

export default function StockPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const addHolding = usePortfolioStore((state) => state.addHolding);

  const { data: stock, isLoading } = useQuery({
    queryKey: ["stock", symbol],
    queryFn: () => stocksApi.getInfo(symbol),
    refetchInterval: 30 * 1000,
  });

  const { data: technicals, isLoading: technicalsLoading } = useQuery({
    queryKey: ["stock", symbol, "technicals"],
    queryFn: () => stocksApi.getTechnicals(symbol),
  });

  const { data: performance, isLoading: performanceLoading } = useQuery({
    queryKey: ["stock", symbol, "performance"],
    queryFn: () => stocksApi.getPerformance(symbol),
  });

  const handleAddToPortfolio = () => {
    setPortfolioDialogOpen(true);
  };

  const handlePortfolioAdd = (holding: Holding) => {
    addHolding(holding);
    setPortfolioDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Hisse bulunamadı</h2>
        <p className="text-muted-foreground">{symbol} sembolü için veri bulunamadı.</p>
      </div>
    );
  }

  const isPositive = (stock.change_percent ?? 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{symbol}</h1>
                <Badge variant={isPositive ? "success" : "destructive"}>
                  {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {formatPercent(stock.change_percent)}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddToPortfolio}
                  className="ml-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Portföye Ekle
                </Button>
              </div>
              <p className="text-lg text-muted-foreground mt-1">{stock.name}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">{formatNumber(stock.last_price)}</p>
              <p className={cn("text-lg", isPositive ? "text-positive" : "text-negative")}>
                {isPositive ? "+" : ""}{formatNumber(stock.change)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              Piyasa Değeri
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
              F/K Oranı
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
                { label: "1 Yıl", value: performance["1y"] },
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
            <p className="text-muted-foreground text-center py-4">Performans verisi yüklenemedi</p>
          )}
        </CardContent>
      </Card>

      {/* Technical Analysis Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Signals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Teknik Sinyaller
            </CardTitle>
          </CardHeader>
          <CardContent>
            {technicalsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : technicals?.signals && technicals.signals.length > 0 ? (
              <div className="space-y-2">
                {technicals.signals.map((signal, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      signal.type === "bullish" && "bg-green-500/10 border border-green-500/20",
                      signal.type === "bearish" && "bg-red-500/10 border border-red-500/20",
                      signal.type === "neutral" && "bg-yellow-500/10 border border-yellow-500/20"
                    )}
                  >
                    {signal.type === "bullish" && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />}
                    {signal.type === "bearish" && <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />}
                    {signal.type === "neutral" && <MinusCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />}
                    <div>
                      <p className="font-medium text-sm">{signal.indicator}</p>
                      <p className="text-xs text-muted-foreground">{signal.signal}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">Sinyal bulunamadı</p>
            )}
          </CardContent>
        </Card>

        {/* Crossovers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Kesişim Olayları
            </CardTitle>
          </CardHeader>
          <CardContent>
            {technicalsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : technicals?.crossovers ? (
              <div className="space-y-3">
                {/* SMA 50/200 Crossover (Golden/Death Cross) */}
                {technicals.crossovers.sma_50_200 ? (
                  <div className={cn(
                    "p-4 rounded-lg",
                    technicals.crossovers.sma_50_200.type === "bullish"
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-red-500/10 border border-red-500/20"
                  )}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {technicals.crossovers.sma_50_200.type === "bullish" ? "🟢 Golden Cross" : "🔴 Death Cross"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          SMA 50, SMA 200&apos;ü {technicals.crossovers.sma_50_200.type === "bullish" ? "yukarı" : "aşağı"} kesti
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{technicals.crossovers.sma_50_200.date}</p>
                        <p className="text-xs text-muted-foreground">{technicals.crossovers.sma_50_200.days_ago} gün önce</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">SMA 50/200 kesişimi: Son 60 günde kesişim yok</p>
                  </div>
                )}

                {/* SMA 20/50 Crossover */}
                {technicals.crossovers.sma_20_50 ? (
                  <div className={cn(
                    "p-4 rounded-lg",
                    technicals.crossovers.sma_20_50.type === "bullish"
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-red-500/10 border border-red-500/20"
                  )}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          SMA 20/50 {technicals.crossovers.sma_20_50.type === "bullish" ? "Yükseliş" : "Düşüş"} Kesişimi
                        </p>
                        <p className="text-sm text-muted-foreground">
                          SMA 20, SMA 50'yi {technicals.crossovers.sma_20_50.type === "bullish" ? "yukarı" : "aşağı"} kesti
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{technicals.crossovers.sma_20_50.date}</p>
                        <p className="text-xs text-muted-foreground">{technicals.crossovers.sma_20_50.days_ago} gün önce</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">SMA 20/50 kesişimi: Son 60 günde kesişim yok</p>
                  </div>
                )}

                {/* MACD Crossover */}
                {technicals.crossovers.macd ? (
                  <div className={cn(
                    "p-4 rounded-lg",
                    technicals.crossovers.macd.type === "bullish"
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-red-500/10 border border-red-500/20"
                  )}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          MACD {technicals.crossovers.macd.type === "bullish" ? "Yükseliş" : "Düşüş"} Kesişimi
                        </p>
                        <p className="text-sm text-muted-foreground">
                          MACD, sinyal çizgisini {technicals.crossovers.macd.type === "bullish" ? "yukarı" : "aşağı"} kesti
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{technicals.crossovers.macd.date}</p>
                        <p className="text-xs text-muted-foreground">{technicals.crossovers.macd.days_ago} gün önce</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">MACD kesişimi: Son 60 günde kesişim yok</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">Kesişim verisi yüklenemedi</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Technical Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Teknik Göstergeler
          </CardTitle>
        </CardHeader>
        <CardContent>
          {technicalsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : technicals?.indicators ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* RSI */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1 mb-2">
                  <p className="text-sm font-medium">RSI (14)</p>
                  <Tooltip content={METRIC_TOOLTIPS.rsi} side="top">
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </Tooltip>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  technicals.indicators.rsi && technicals.indicators.rsi < 30 && "text-green-500",
                  technicals.indicators.rsi && technicals.indicators.rsi > 70 && "text-red-500"
                )}>
                  {technicals.indicators.rsi ? formatNumber(technicals.indicators.rsi, 1) : "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {technicals.indicators.rsi && technicals.indicators.rsi < 30 && "Aşırı satım"}
                  {technicals.indicators.rsi && technicals.indicators.rsi > 70 && "Aşırı alım"}
                  {technicals.indicators.rsi && technicals.indicators.rsi >= 30 && technicals.indicators.rsi <= 70 && "Nötr"}
                </p>
              </div>

              {/* MACD */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1 mb-2">
                  <p className="text-sm font-medium">MACD</p>
                  <Tooltip content={METRIC_TOOLTIPS.macd} side="top">
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </Tooltip>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  technicals.indicators.macd && technicals.indicators.macd_signal &&
                    technicals.indicators.macd > technicals.indicators.macd_signal && "text-green-500",
                  technicals.indicators.macd && technicals.indicators.macd_signal &&
                    technicals.indicators.macd < technicals.indicators.macd_signal && "text-red-500"
                )}>
                  {technicals.indicators.macd ? formatNumber(technicals.indicators.macd, 2) : "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Sinyal: {technicals.indicators.macd_signal ? formatNumber(technicals.indicators.macd_signal, 2) : "-"}
                </p>
              </div>

              {/* Stochastic */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1 mb-2">
                  <p className="text-sm font-medium">Stochastic</p>
                  <Tooltip content={METRIC_TOOLTIPS.stochastic} side="top">
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </Tooltip>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  technicals.indicators.stoch_k && technicals.indicators.stoch_k < 20 && "text-green-500",
                  technicals.indicators.stoch_k && technicals.indicators.stoch_k > 80 && "text-red-500"
                )}>
                  {technicals.indicators.stoch_k ? formatNumber(technicals.indicators.stoch_k, 1) : "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  %D: {technicals.indicators.stoch_d ? formatNumber(technicals.indicators.stoch_d, 1) : "-"}
                </p>
              </div>

              {/* ATR */}
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">ATR (14)</p>
                <p className="text-2xl font-bold">
                  {technicals.indicators.atr ? formatNumber(technicals.indicators.atr, 2) : "-"}
                </p>
                <p className="text-xs text-muted-foreground">Volatilite göstergesi</p>
              </div>

              {/* SMA 20 */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1 mb-2">
                  <p className="text-sm font-medium">SMA 20</p>
                  <Tooltip content={METRIC_TOOLTIPS.sma} side="top">
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold">
                  {technicals.indicators.sma_20 ? formatNumber(technicals.indicators.sma_20, 2) : "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {technicals.current_price && technicals.indicators.sma_20 && (
                    technicals.current_price > technicals.indicators.sma_20 ? "Fiyat üstünde ↑" : "Fiyat altında ↓"
                  )}
                </p>
              </div>

              {/* SMA 50 */}
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">SMA 50</p>
                <p className="text-2xl font-bold">
                  {technicals.indicators.sma_50 ? formatNumber(technicals.indicators.sma_50, 2) : "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {technicals.current_price && technicals.indicators.sma_50 && (
                    technicals.current_price > technicals.indicators.sma_50 ? "Fiyat üstünde ↑" : "Fiyat altında ↓"
                  )}
                </p>
              </div>

              {/* SMA 200 */}
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">SMA 200</p>
                <p className="text-2xl font-bold">
                  {technicals.indicators.sma_200 ? formatNumber(technicals.indicators.sma_200, 2) : "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {technicals.current_price && technicals.indicators.sma_200 && (
                    technicals.current_price > technicals.indicators.sma_200 ? "Fiyat üstünde ↑" : "Fiyat altında ↓"
                  )}
                </p>
              </div>

              {/* Bollinger */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1 mb-2">
                  <p className="text-sm font-medium">Bollinger</p>
                  <Tooltip content={METRIC_TOOLTIPS.bollinger} side="top">
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </Tooltip>
                </div>
                <p className="text-lg font-bold">
                  {technicals.indicators.bollinger_upper ? formatNumber(technicals.indicators.bollinger_upper, 2) : "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Alt: {technicals.indicators.bollinger_lower ? formatNumber(technicals.indicators.bollinger_lower, 2) : "-"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Gösterge verisi yüklenemedi</p>
          )}
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader>
          <CardTitle>Fiyat Aralığı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Daily Range */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Günlük</p>
              <div className="flex justify-between text-sm">
                <span>{formatNumber(stock.low)}</span>
                <span>{formatNumber(stock.high)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: stock.high && stock.low && stock.last_price
                      ? `${((stock.last_price - stock.low) / (stock.high - stock.low)) * 100}%`
                      : "50%",
                  }}
                />
              </div>
            </div>

            {/* 7 Day Range */}
            {technicals?.price_ranges?.["7d"] && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">7 Gün</p>
                <div className="flex justify-between text-sm">
                  <span>{formatNumber(technicals.price_ranges["7d"].low)}</span>
                  <span>{formatNumber(technicals.price_ranges["7d"].high)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: technicals.price_ranges["7d"].high && technicals.price_ranges["7d"].low && stock.last_price
                        ? `${((stock.last_price - technicals.price_ranges["7d"].low) / (technicals.price_ranges["7d"].high - technicals.price_ranges["7d"].low)) * 100}%`
                        : "50%",
                    }}
                  />
                </div>
              </div>
            )}

            {/* 50 Day Range */}
            {technicals?.price_ranges?.["50d"] && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">50 Gün</p>
                <div className="flex justify-between text-sm">
                  <span>{formatNumber(technicals.price_ranges["50d"].low)}</span>
                  <span>{formatNumber(technicals.price_ranges["50d"].high)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: technicals.price_ranges["50d"].high && technicals.price_ranges["50d"].low && stock.last_price
                        ? `${((stock.last_price - technicals.price_ranges["50d"].low) / (technicals.price_ranges["50d"].high - technicals.price_ranges["50d"].low)) * 100}%`
                        : "50%",
                    }}
                  />
                </div>
              </div>
            )}

            {/* 200 Day Range */}
            {technicals?.price_ranges?.["200d"] && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">200 Gün</p>
                <div className="flex justify-between text-sm">
                  <span>{formatNumber(technicals.price_ranges["200d"].low)}</span>
                  <span>{formatNumber(technicals.price_ranges["200d"].high)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: technicals.price_ranges["200d"].high && technicals.price_ranges["200d"].low && stock.last_price
                        ? `${((stock.last_price - technicals.price_ranges["200d"].low) / (technicals.price_ranges["200d"].high - technicals.price_ranges["200d"].low)) * 100}%`
                        : "50%",
                    }}
                  />
                </div>
              </div>
            )}

            {/* 52 Week Range */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">52 Hafta</p>
              <div className="flex justify-between text-sm">
                <span>{formatNumber(stock.year_low)}</span>
                <span>{formatNumber(stock.year_high)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: stock.year_high && stock.year_low && stock.last_price
                      ? `${((stock.last_price - stock.year_low) / (stock.year_high - stock.year_low)) * 100}%`
                      : "50%",
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Add Dialog */}
      <AddStockDialog
        open={portfolioDialogOpen}
        onOpenChange={setPortfolioDialogOpen}
        onAdd={handlePortfolioAdd}
        editingHolding={{
          symbol,
          quantity: 1,
          avgPrice: stock?.last_price || 0,
          addedAt: new Date().toISOString(),
        }}
      />
    </div>
  );
}
