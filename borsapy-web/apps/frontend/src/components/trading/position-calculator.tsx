"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettingsStore } from "@/store/settings";
import { usePortfolioStore } from "@/store/portfolio";
import { tradingApi, SwingLevels } from "@/lib/api";
import { formatNumber, formatPercent, cn } from "@/lib/utils";
import {
  Calculator,
  Target,
  ShieldAlert,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Plus,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface PositionCalculatorProps {
  symbol: string;
  currentPrice: number;
}

export function PositionCalculator({ symbol, currentPrice }: PositionCalculatorProps) {
  const {
    totalCapital,
    defaultRiskPercent,
    maxPositionPercent,
    defaultStopLossATR,
    defaultTakeProfitATR,
  } = useSettingsStore();

  const { addHolding } = usePortfolioStore();

  const [entryPrice, setEntryPrice] = useState<number>(currentPrice);
  const [stopLossATR, setStopLossATR] = useState<number>(defaultStopLossATR);
  const [takeProfitATR, setTakeProfitATR] = useState<number>(defaultTakeProfitATR);
  const [riskPercent, setRiskPercent] = useState<number>(defaultRiskPercent);

  // Update entry price when current price changes
  useEffect(() => {
    setEntryPrice(currentPrice);
  }, [currentPrice]);

  // Fetch swing levels from API
  const { data: swingLevels, isLoading } = useQuery({
    queryKey: ["swing-levels", symbol, entryPrice, stopLossATR, takeProfitATR],
    queryFn: () => tradingApi.getSwingLevels(symbol, entryPrice, stopLossATR, takeProfitATR),
    enabled: !!symbol && entryPrice > 0,
    staleTime: 30 * 1000,
  });

  // Calculate position sizing
  const calculations = useMemo(() => {
    if (!swingLevels?.atr_levels || !entryPrice) return null;

    const { stop_loss, stop_loss_percent, take_profit, take_profit_percent, risk_reward } =
      swingLevels.atr_levels;

    // Risk amount in TL
    const riskAmount = (totalCapital * riskPercent) / 100;

    // Risk per share (entry - stop loss)
    const riskPerShare = entryPrice - stop_loss;

    // Position size in lots
    const positionSize = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;

    // Position value
    const positionValue = positionSize * entryPrice;

    // Position as percent of capital
    const positionPercent = (positionValue / totalCapital) * 100;

    // Check if position exceeds max position percent
    const exceedsMaxPosition = positionPercent > maxPositionPercent;

    // Adjust position if exceeds max
    const maxPositionValue = (totalCapital * maxPositionPercent) / 100;
    const adjustedPositionSize = exceedsMaxPosition
      ? Math.floor(maxPositionValue / entryPrice)
      : positionSize;
    const adjustedPositionValue = adjustedPositionSize * entryPrice;
    const adjustedPositionPercent = (adjustedPositionValue / totalCapital) * 100;

    // Potential profit/loss
    const potentialLoss = adjustedPositionSize * riskPerShare;
    const potentialProfit = adjustedPositionSize * (take_profit - entryPrice);

    return {
      stopLoss: stop_loss,
      stopLossPercent: stop_loss_percent,
      takeProfit: take_profit,
      takeProfitPercent: take_profit_percent,
      riskReward: risk_reward,
      riskAmount,
      positionSize: adjustedPositionSize,
      positionValue: adjustedPositionValue,
      positionPercent: adjustedPositionPercent,
      potentialLoss,
      potentialProfit,
      exceedsMaxPosition,
      originalPositionSize: positionSize,
    };
  }, [swingLevels, entryPrice, totalCapital, riskPercent, maxPositionPercent]);

  const handleAddToPortfolio = () => {
    if (!calculations || calculations.positionSize === 0) return;

    addHolding({
      symbol,
      quantity: calculations.positionSize,
      avgPrice: entryPrice,
      addedAt: new Date().toISOString(),
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Pozisyon Hesaplayici
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Pozisyon Hesaplayici
          </CardTitle>
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Giris Fiyati (TL)</label>
            <Input
              type="number"
              step="0.01"
              value={entryPrice}
              onChange={(e) => setEntryPrice(Number(e.target.value))}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Risk (%)</label>
            <Input
              type="number"
              step="0.5"
              min="0.5"
              max="10"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Stop-Loss ATR</label>
            <Input
              type="number"
              step="0.5"
              min="0.5"
              max="5"
              value={stopLossATR}
              onChange={(e) => setStopLossATR(Number(e.target.value))}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Take-Profit ATR</label>
            <Input
              type="number"
              step="0.5"
              min="0.5"
              max="10"
              value={takeProfitATR}
              onChange={(e) => setTakeProfitATR(Number(e.target.value))}
              className="h-9"
            />
          </div>
        </div>

        {/* ATR Info */}
        {swingLevels?.atr && (
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
            <span>ATR (14 gun)</span>
            <span className="font-mono">{formatNumber(swingLevels.atr, 2)} TL</span>
          </div>
        )}

        {/* Levels */}
        {calculations && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                Stop-Loss
              </span>
              <div className="text-right">
                <span className="font-mono font-medium">
                  {formatNumber(calculations.stopLoss, 2)} TL
                </span>
                <Badge variant="destructive" className="ml-2 text-xs">
                  -{formatNumber(calculations.stopLossPercent, 1)}%
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                Take-Profit
              </span>
              <div className="text-right">
                <span className="font-mono font-medium">
                  {formatNumber(calculations.takeProfit, 2)} TL
                </span>
                <Badge variant="success" className="ml-2 text-xs">
                  +{formatNumber(calculations.takeProfitPercent, 1)}%
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Position Sizing Results */}
        {calculations && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Risk Tutari</span>
              <span className="font-mono">
                {formatNumber(calculations.potentialLoss, 0)} TL ({riskPercent}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Alinacak Adet</span>
              <span className="font-mono font-medium">{calculations.positionSize} lot</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pozisyon Degeri</span>
              <span className="font-mono">
                {formatNumber(calculations.positionValue, 0)} TL (
                {formatNumber(calculations.positionPercent, 1)}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Potansiyel Kar</span>
              <span className="font-mono text-green-500">
                +{formatNumber(calculations.potentialProfit, 0)} TL
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Risk/Odul
              </span>
              <Badge
                variant={calculations.riskReward >= 1.5 ? "success" : "outline"}
                className="font-mono"
              >
                1:{formatNumber(calculations.riskReward, 1)}
              </Badge>
            </div>
          </div>
        )}

        {/* Warnings */}
        {calculations?.exceedsMaxPosition && (
          <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 rounded-md px-3 py-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Pozisyon max. limit ({maxPositionPercent}%) asildigi icin{" "}
              {calculations.originalPositionSize} lot yerine {calculations.positionSize} lot
              onerilmektedir.
            </span>
          </div>
        )}

        {/* Capital Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
          <span className="flex items-center gap-1">
            <Wallet className="h-3 w-3" />
            Sermaye
          </span>
          <span className="font-mono">{formatNumber(totalCapital, 0)} TL</span>
        </div>

        {/* Add to Portfolio Button */}
        {calculations && calculations.positionSize > 0 && (
          <Button onClick={handleAddToPortfolio} className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Portfoye Ekle
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
