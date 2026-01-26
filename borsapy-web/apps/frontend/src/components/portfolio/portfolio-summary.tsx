"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatPercent, formatCurrency } from "@/lib/utils";
import { Holding } from "@/store/portfolio";
import { TrendingUp, TrendingDown, Wallet, PieChart, BarChart3, Percent } from "lucide-react";

interface PortfolioSummaryProps {
  holdings: Holding[];
  currentPrices: Record<string, number>;
}

export function PortfolioSummary({ holdings, currentPrices }: PortfolioSummaryProps) {
  // Calculate totals
  const totalCost = holdings.reduce((sum, h) => sum + h.avgPrice * h.quantity, 0);
  const totalValue = holdings.reduce((sum, h) => {
    const currentPrice = currentPrices[h.symbol] || h.avgPrice;
    return sum + currentPrice * h.quantity;
  }, 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
  const isPositive = totalPnL >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Değer</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          <p className="text-xs text-muted-foreground">
            {holdings.length} hisse
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Maliyet</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Kar/Zarar</CardTitle>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-positive" />
          ) : (
            <TrendingDown className="h-4 w-4 text-negative" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isPositive ? "text-positive" : "text-negative"}`}>
            {isPositive ? "+" : ""}{formatCurrency(totalPnL)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Getiri</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isPositive ? "text-positive" : "text-negative"}`}>
            {formatPercent(totalPnLPercent)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
