"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { StockChart } from "@/components/charts/stock-chart";
import { PositionCalculator } from "@/components/trading/position-calculator";
import { TradeSetupPanel } from "@/components/trading/trade-setup-panel";
import { AnalysisSummaryComponent } from "@/components/trading/analysis-summary";
import { StockHeader } from "@/components/stock/stock-header";
import { AnalysisNav } from "@/components/stock/analysis-nav";
import { stocksApi, tradingApi, StockInfo, TechnicalAnalysis, StockHistory, SwingSignals, AnalysisSummary, TradingSignal } from "@/lib/api";
import { formatNumber, cn } from "@/lib/utils";

// Sinyal birleştirme fonksiyonu
// Aynı yönde 3 gün içindeki sinyalleri gruplar
// Puanlama: strong=3, medium=1.5
// Toplam >= 3 puan olursa sinyal gösterilir
function consolidateSignals(signals: TradingSignal[]): TradingSignal[] {
  if (!signals || signals.length === 0) return [];

  const STRENGTH_POINTS: Record<string, number> = {
    strong: 3,
    medium: 1.5,
    weak: 1,
  };
  const THRESHOLD = 3;
  const WINDOW_DAYS = 3;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  // Tarihe göre sırala
  const sorted = [...signals].sort((a, b) => a.time - b.time);
  const consolidated: TradingSignal[] = [];
  const used = new Set<number>();

  for (let i = 0; i < sorted.length; i++) {
    if (used.has(i)) continue;

    const baseSignal = sorted[i];
    const baseTime = baseSignal.time * 1000; // Unix timestamp to ms
    const group: TradingSignal[] = [baseSignal];
    used.add(i);

    // Aynı yönde 3 gün içindeki sinyalleri bul
    for (let j = i + 1; j < sorted.length; j++) {
      if (used.has(j)) continue;

      const candidate = sorted[j];
      const candidateTime = candidate.time * 1000;

      // Aynı yön mü?
      if (candidate.signal_type !== baseSignal.signal_type) continue;

      // 3 gün içinde mi?
      if (candidateTime - baseTime > WINDOW_DAYS * MS_PER_DAY) break;

      group.push(candidate);
      used.add(j);
    }

    // Toplam puanı hesapla
    const totalPoints = group.reduce((sum, s) => sum + (STRENGTH_POINTS[s.strength] || 1.5), 0);

    if (totalPoints >= THRESHOLD) {
      // Birleştirilmiş sinyal oluştur
      const reasons = [...new Set(group.map(s => s.indicator))].join(", ");
      const count = group.length;

      consolidated.push({
        ...baseSignal,
        // Birden fazla sinyal varsa güçlü olarak işaretle
        strength: totalPoints >= 4.5 ? "strong" : "medium",
        reason: count > 1 ? `${reasons} (x${count})` : baseSignal.reason,
        indicator: count > 1 ? `${baseSignal.indicator} +${count - 1}` : baseSignal.indicator,
      });
    }
  }

  return consolidated;
}
import {
  BarChart2,
  Activity,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MinusCircle,
  Calendar,
} from "lucide-react";

const METRIC_TOOLTIPS = {
  rsi: "RSI (Goreceli Guc Endeksi): 0-100 arasi deger alir. 30 alti asiri satim, 70 ustu asiri alim bolgesi.",
  macd: "MACD: Trend takip gostergesi. Sinyal cizgisinin ustunde yukselis, altinda dusus trendi.",
  sma: "SMA (Basit Hareketli Ortalama): Belirli donemdeki fiyatlarin ortalamasi. Trend yonunu belirler.",
  bollinger: "Bollinger Bantlari: Fiyatin volatilitesini olcer. Banda yaklasma asiri alim/satim sinyali olabilir.",
  stochastic: "Stochastic: Momentum gostergesi. 20 alti asiri satim, 80 ustu asiri alim.",
};

interface TeknikAnalizClientProps {
  symbol: string;
  initialStock: StockInfo | null;
  initialTechnicals: TechnicalAnalysis | null;
  initialHistory: StockHistory[] | null;
  initialSwingSignals?: SwingSignals | null;
  initialAnalysisSummary?: AnalysisSummary | null;
}

export function TeknikAnalizClient({
  symbol,
  initialStock,
  initialTechnicals,
  initialHistory,
  initialSwingSignals,
  initialAnalysisSummary,
}: TeknikAnalizClientProps) {
  const [chartPeriod, setChartPeriod] = useState("6mo");
  const [chartInterval, setChartInterval] = useState("1d");

  const { data: stock, isLoading } = useQuery({
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

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["stock", symbol, "history", chartPeriod, chartInterval],
    queryFn: () => stocksApi.getHistory(symbol, chartPeriod, chartInterval),
    initialData: chartPeriod === "6mo" && chartInterval === "1d" ? (initialHistory ?? undefined) : undefined,
  });

  const { data: swingSignals, isLoading: swingSignalsLoading } = useQuery({
    queryKey: ["stock", symbol, "swing-signals", chartPeriod, chartInterval],
    queryFn: () => tradingApi.getSwingSignals(symbol, chartPeriod, chartInterval),
    initialData: chartPeriod === "6mo" && chartInterval === "1d" ? (initialSwingSignals ?? undefined) : undefined,
  });

  const { data: analysisSummary, isLoading: analysisSummaryLoading } = useQuery({
    queryKey: ["stock", symbol, "analysis-summary", chartPeriod],
    queryFn: () => tradingApi.getAnalysisSummary(symbol, chartPeriod),
    initialData: chartPeriod === "6mo" ? (initialAnalysisSummary ?? undefined) : undefined,
  });

  // Sinyalleri birleştir (3 gün içindeki aynı yöndeki sinyalleri grupla)
  const consolidatedSignals = useMemo(() => {
    const signals = swingSignals?.signals || [];
    const consolidated = consolidateSignals(signals);
    if (signals.length !== consolidated.length) {
      console.log(`[Signals] ${signals.length} sinyal -> ${consolidated.length} birleştirilmiş sinyal`);
    }
    return consolidated;
  }, [swingSignals?.signals]);

  if (isLoading && !stock) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-[500px] w-full" />
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

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Fiyat Grafigi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StockChart
            data={historyData || []}
            isLoading={historyLoading}
            period={chartPeriod}
            interval={chartInterval}
            onPeriodChange={setChartPeriod}
            onIntervalChange={setChartInterval}
            levels={swingSignals?.levels}
            signals={consolidatedSignals}
          />
        </CardContent>
      </Card>

      {/* Analysis Summary - Full width above the grid */}
      <AnalysisSummaryComponent
        summary={analysisSummary ?? null}
        isLoading={analysisSummaryLoading}
      />

      {/* Technical Analysis Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trade Setup Panel */}
        <TradeSetupPanel
          tradeSetup={swingSignals?.trade_setup ?? null}
          currentPrice={stock.last_price || 0}
          symbol={symbol}
          isLoading={swingSignalsLoading}
        />

        {/* Position Calculator */}
        {stock.last_price && (
          <PositionCalculator symbol={symbol} currentPrice={stock.last_price} />
        )}

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
              <p className="text-muted-foreground text-center py-4">Sinyal bulunamadi</p>
            )}
          </CardContent>
        </Card>

        {/* Crossovers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Kesisim Olaylari
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
                          {technicals.crossovers.sma_50_200.type === "bullish" ? "Golden Cross" : "Death Cross"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          SMA 50, SMA 200&apos;u {technicals.crossovers.sma_50_200.type === "bullish" ? "yukari" : "asagi"} kesti
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{technicals.crossovers.sma_50_200.date}</p>
                        <p className="text-xs text-muted-foreground">{technicals.crossovers.sma_50_200.days_ago} gun once</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">SMA 50/200 kesisimi: Son 60 gunde kesisim yok</p>
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
                          SMA 20/50 {technicals.crossovers.sma_20_50.type === "bullish" ? "Yukselis" : "Dusus"} Kesisimi
                        </p>
                        <p className="text-sm text-muted-foreground">
                          SMA 20, SMA 50&apos;yi {technicals.crossovers.sma_20_50.type === "bullish" ? "yukari" : "asagi"} kesti
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{technicals.crossovers.sma_20_50.date}</p>
                        <p className="text-xs text-muted-foreground">{technicals.crossovers.sma_20_50.days_ago} gun once</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">SMA 20/50 kesisimi: Son 60 gunde kesisim yok</p>
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
                          MACD {technicals.crossovers.macd.type === "bullish" ? "Yukselis" : "Dusus"} Kesisimi
                        </p>
                        <p className="text-sm text-muted-foreground">
                          MACD, sinyal cizgisini {technicals.crossovers.macd.type === "bullish" ? "yukari" : "asagi"} kesti
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{technicals.crossovers.macd.date}</p>
                        <p className="text-xs text-muted-foreground">{technicals.crossovers.macd.days_ago} gun once</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">MACD kesisimi: Son 60 gunde kesisim yok</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">Kesisim verisi yuklenemedi</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Technical Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Teknik Gostergeler
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
                  {technicals.indicators.rsi && technicals.indicators.rsi < 30 && "Asiri satim"}
                  {technicals.indicators.rsi && technicals.indicators.rsi > 70 && "Asiri alim"}
                  {technicals.indicators.rsi && technicals.indicators.rsi >= 30 && technicals.indicators.rsi <= 70 && "Notr"}
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
                <p className="text-xs text-muted-foreground">Volatilite gostergesi</p>
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
                    technicals.current_price > technicals.indicators.sma_20 ? "Fiyat ustunde" : "Fiyat altinda"
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
                    technicals.current_price > technicals.indicators.sma_50 ? "Fiyat ustunde" : "Fiyat altinda"
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
                    technicals.current_price > technicals.indicators.sma_200 ? "Fiyat ustunde" : "Fiyat altinda"
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
            <p className="text-muted-foreground text-center py-4">Gosterge verisi yuklenemedi</p>
          )}
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader>
          <CardTitle>Fiyat Araligi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Daily Range */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Gunluk</p>
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
                <p className="text-sm font-medium text-muted-foreground">7 Gun</p>
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
                <p className="text-sm font-medium text-muted-foreground">50 Gun</p>
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
                <p className="text-sm font-medium text-muted-foreground">200 Gun</p>
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
    </div>
  );
}
