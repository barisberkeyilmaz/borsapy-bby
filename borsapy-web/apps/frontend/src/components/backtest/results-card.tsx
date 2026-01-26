"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BacktestResult } from "@/lib/api";
import { formatNumber, formatPercent, formatCurrency, cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Activity,
  AlertTriangle,
} from "lucide-react";

interface ResultsCardProps {
  result: BacktestResult;
}

export function ResultsCard({ result }: ResultsCardProps) {
  const isPositive = (result.net_profit_pct ?? 0) >= 0;
  const beatsBuyHold = (result.vs_buy_hold ?? 0) >= 0;

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{result.symbol}</h2>
                <Badge variant="secondary">{result.strategy_name}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Periyot: {result.period} | Başlangıç: {formatCurrency(result.initial_capital)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Net Kar/Zarar</p>
              <p className={cn(
                "text-3xl font-bold",
                isPositive ? "text-positive" : "text-negative"
              )}>
                {formatPercent(result.net_profit_pct)}
              </p>
              <p className={cn(
                "text-lg",
                isPositive ? "text-positive" : "text-negative"
              )}>
                {isPositive ? "+" : ""}{formatCurrency(result.net_profit ?? 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Win Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kazanma Oranı</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(result.win_rate, 1)}%</div>
            <p className="text-xs text-muted-foreground">
              {result.winning_trades} / {result.total_trades} işlem
            </p>
          </CardContent>
        </Card>

        {/* Profit Factor */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {result.profit_factor ? formatNumber(result.profit_factor, 2) : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              Kar / Zarar oranı
            </p>
          </CardContent>
        </Card>

        {/* Max Drawdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-negative">
              {formatNumber(result.max_drawdown, 2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              En yüksek düşüş
            </p>
          </CardContent>
        </Card>

        {/* Sharpe Ratio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {result.sharpe_ratio ? formatNumber(result.sharpe_ratio, 2) : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              Risk-ayarlı getiri
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comparison with Buy & Hold */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Buy & Hold Karşılaştırması</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Strateji Getirisi</p>
              <p className={cn(
                "text-xl font-bold",
                isPositive ? "text-positive" : "text-negative"
              )}>
                {formatPercent(result.net_profit_pct)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Buy & Hold</p>
              <p className={cn(
                "text-xl font-bold",
                (result.buy_hold_return ?? 0) >= 0 ? "text-positive" : "text-negative"
              )}>
                {formatPercent(result.buy_hold_return)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fark</p>
              <div className="flex items-center gap-2">
                {beatsBuyHold ? (
                  <TrendingUp className="h-5 w-5 text-positive" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-negative" />
                )}
                <p className={cn(
                  "text-xl font-bold",
                  beatsBuyHold ? "text-positive" : "text-negative"
                )}>
                  {formatPercent(result.vs_buy_hold)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
