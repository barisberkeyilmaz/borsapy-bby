"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StrategySelector } from "@/components/backtest/strategy-selector";
import { BacktestForm } from "@/components/backtest/backtest-form";
import { ResultsCard } from "@/components/backtest/results-card";
import { TradesTable } from "@/components/backtest/trades-table";
import { EquityChart } from "@/components/backtest/equity-chart";
import { backtestApi, BacktestResult } from "@/lib/api";

export default function BacktestPage() {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const { data: strategies, isLoading: strategiesLoading } = useQuery({
    queryKey: ["backtest-strategies"],
    queryFn: backtestApi.getStrategies,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const backtestMutation = useMutation({
    mutationFn: (params: {
      symbol: string;
      period: string;
      initial_capital: number;
      commission: number;
    }) => {
      if (!selectedStrategy) throw new Error("Strateji seçilmedi");
      return backtestApi.run({
        ...params,
        strategy: selectedStrategy,
      });
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error) => {
      console.error("Backtest error:", error);
    },
  });

  const handleRunBacktest = (params: {
    symbol: string;
    period: string;
    initial_capital: number;
    commission: number;
  }) => {
    backtestMutation.mutate(params);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Backtest</h1>
        <p className="text-muted-foreground">
          Stratejilerinizi geçmiş veriler üzerinde test edin
        </p>
      </div>

      {/* Strategy Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Strateji Seçin</CardTitle>
        </CardHeader>
        <CardContent>
          <StrategySelector
            strategies={strategies || []}
            selectedStrategy={selectedStrategy}
            onSelect={setSelectedStrategy}
            isLoading={strategiesLoading}
          />
        </CardContent>
      </Card>

      {/* Configuration and Form */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Parametreler</CardTitle>
          </CardHeader>
          <CardContent>
            <BacktestForm
              selectedStrategy={selectedStrategy}
              onSubmit={handleRunBacktest}
              isRunning={backtestMutation.isPending}
            />
          </CardContent>
        </Card>

        {/* Results Area */}
        <div className="space-y-6">
          {backtestMutation.error && (
            <Card className="border-destructive">
              <CardContent className="py-4">
                <p className="text-destructive">
                  Hata: {backtestMutation.error instanceof Error
                    ? backtestMutation.error.message
                    : "Backtest başarısız oldu"}
                </p>
              </CardContent>
            </Card>
          )}

          {result ? (
            <>
              {/* Results Summary */}
              <ResultsCard result={result} />

              {/* Equity Curve Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Portföy Değeri Grafiği</CardTitle>
                </CardHeader>
                <CardContent>
                  <EquityChart
                    data={result.equity_curve}
                    initialCapital={result.initial_capital}
                  />
                </CardContent>
              </Card>

              {/* Trades Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    İşlem Geçmişi ({result.total_trades} işlem)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TradesTable trades={result.trades} />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    {selectedStrategy
                      ? "Backtest başlatmak için parametreleri girin ve \"Backtest Başlat\" butonuna tıklayın."
                      : "Önce bir strateji seçin."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
