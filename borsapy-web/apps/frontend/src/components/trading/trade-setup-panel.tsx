"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { TradeSetup } from "@/lib/api";
import { formatNumber, cn } from "@/lib/utils";
import { TRADING_EXPLANATIONS, getRiskRewardExplanation } from "@/lib/explanations";
import {
  TrendingUp,
  TrendingDown,
  MinusCircle,
  Target,
  ShieldAlert,
  Lightbulb,
  Calculator,
  Info,
} from "lucide-react";
import Link from "next/link";

interface TradeSetupPanelProps {
  tradeSetup: TradeSetup | null;
  currentPrice: number;
  symbol: string;
  isLoading?: boolean;
}

function getRiskRewardLabel(rr: number | null): { label: string; variant: "success" | "warning" | "destructive" | "outline" } {
  if (!rr) return { label: "N/A", variant: "outline" };
  if (rr >= 2) return { label: "Iyi", variant: "success" };
  if (rr >= 1.5) return { label: "Kabul Edilebilir", variant: "warning" };
  return { label: "Dusuk", variant: "destructive" };
}

function getDirectionIcon(direction: string) {
  switch (direction) {
    case "long":
      return <TrendingUp className="h-5 w-5 text-green-500" />;
    case "short":
      return <TrendingDown className="h-5 w-5 text-red-500" />;
    default:
      return <MinusCircle className="h-5 w-5 text-yellow-500" />;
  }
}

function getDirectionBadge(direction: string) {
  switch (direction) {
    case "long":
      return <Badge variant="success">LONG</Badge>;
    case "short":
      return <Badge variant="destructive">SHORT</Badge>;
    default:
      return <Badge variant="outline">NOTR</Badge>;
  }
}

export function TradeSetupPanel({
  tradeSetup,
  currentPrice,
  symbol,
  isLoading,
}: TradeSetupPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trade Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tradeSetup) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trade Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Trade setup verisi yuklenemedi
          </p>
        </CardContent>
      </Card>
    );
  }

  const rrInfo = getRiskRewardLabel(tradeSetup.risk_reward);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getDirectionIcon(tradeSetup.direction)}
            Trade Setup
          </CardTitle>
          <Tooltip
            content={TRADING_EXPLANATIONS[tradeSetup.direction]?.long || ""}
            side="left"
          >
            <div className="cursor-help">
              {getDirectionBadge(tradeSetup.direction)}
            </div>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Setup Section */}
        {tradeSetup.active && tradeSetup.stop_loss && tradeSetup.take_profit_1 ? (
          <>
            {/* Price Levels */}
            <div className="space-y-2">
              {/* Entry Price */}
              <Tooltip content={TRADING_EXPLANATIONS.entry_price?.long || ""} side="right">
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50 cursor-help">
                  <span className="text-sm flex items-center gap-1">
                    Giris Bolgesi
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </span>
                  <span className="font-mono font-medium">
                    {formatNumber(tradeSetup.entry_price, 2)} TL
                  </span>
                </div>
              </Tooltip>

              {/* Stop Loss */}
              <Tooltip content={TRADING_EXPLANATIONS.stop_loss?.long || ""} side="right">
                <div className="flex items-center justify-between p-2 rounded-md bg-red-500/10 border border-red-500/20 cursor-help">
                  <span className="text-sm flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                    Stop Loss
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </span>
                  <div className="text-right">
                    <span className="font-mono font-medium">
                      {formatNumber(tradeSetup.stop_loss, 2)} TL
                    </span>
                    {tradeSetup.stop_loss_percent && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        {tradeSetup.stop_loss_percent > 0 ? "+" : ""}
                        {formatNumber(tradeSetup.stop_loss_percent, 1)}%
                      </Badge>
                    )}
                  </div>
                </div>
              </Tooltip>

              {/* Take Profit Levels */}
              {tradeSetup.take_profit_1 && (
                <Tooltip content={TRADING_EXPLANATIONS.take_profit_1?.long || ""} side="right">
                  <div className="flex items-center justify-between p-2 rounded-md bg-green-500/10 border border-green-500/20 cursor-help">
                    <span className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      Hedef 1
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </span>
                    <div className="text-right">
                      <span className="font-mono font-medium">
                        {formatNumber(tradeSetup.take_profit_1, 2)} TL
                      </span>
                      <Badge variant="success" className="ml-2 text-xs">
                        +{formatNumber(((tradeSetup.take_profit_1 - currentPrice) / currentPrice) * 100, 1)}%
                      </Badge>
                    </div>
                  </div>
                </Tooltip>
              )}

              {tradeSetup.take_profit_2 && (
                <Tooltip content={TRADING_EXPLANATIONS.take_profit_2?.long || ""} side="right">
                  <div className="flex items-center justify-between p-2 rounded-md bg-green-500/5 border border-green-500/10 cursor-help">
                    <span className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-400" />
                      Hedef 2
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </span>
                    <div className="text-right">
                      <span className="font-mono font-medium">
                        {formatNumber(tradeSetup.take_profit_2, 2)} TL
                      </span>
                      <Badge variant="outline" className="ml-2 text-xs text-green-500">
                        +{formatNumber(((tradeSetup.take_profit_2 - currentPrice) / currentPrice) * 100, 1)}%
                      </Badge>
                    </div>
                  </div>
                </Tooltip>
              )}

              {tradeSetup.take_profit_3 && (
                <Tooltip content={TRADING_EXPLANATIONS.take_profit_3?.long || ""} side="right">
                  <div className="flex items-center justify-between p-2 rounded-md bg-green-500/5 border border-green-500/10 cursor-help">
                    <span className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-300" />
                      Hedef 3
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </span>
                    <div className="text-right">
                      <span className="font-mono font-medium">
                        {formatNumber(tradeSetup.take_profit_3, 2)} TL
                      </span>
                      <Badge variant="outline" className="ml-2 text-xs text-green-500">
                        +{formatNumber(((tradeSetup.take_profit_3 - currentPrice) / currentPrice) * 100, 1)}%
                      </Badge>
                    </div>
                  </div>
                </Tooltip>
              )}
            </div>

            {/* Setup Reasons */}
            {tradeSetup.reasons && tradeSetup.reasons.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Setup Nedenleri
                </p>
                <ul className="space-y-1">
                  {tradeSetup.reasons.map((reason, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk/Reward */}
            <Tooltip content={getRiskRewardExplanation(tradeSetup.risk_reward)} side="top">
              <div className={cn(
                "flex items-center justify-between p-3 rounded-md cursor-help",
                rrInfo.variant === "success" && "bg-green-500/10 border border-green-500/20",
                rrInfo.variant === "warning" && "bg-yellow-500/10 border border-yellow-500/20",
                rrInfo.variant === "destructive" && "bg-red-500/10 border border-red-500/20",
                rrInfo.variant === "outline" && "bg-muted/50"
              )}>
                <span className="text-sm font-medium flex items-center gap-1">
                  Risk/Odul
                  <Info className="h-3 w-3 text-muted-foreground" />
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">
                    1:{tradeSetup.risk_reward ? formatNumber(tradeSetup.risk_reward, 1) : "N/A"}
                  </span>
                  <Badge variant={rrInfo.variant}>{rrInfo.label}</Badge>
                </div>
              </div>
            </Tooltip>

            {/* Position Calculator Link */}
            <Link href={`/teknik-analiz/${symbol}#position-calculator`}>
              <Button variant="outline" className="w-full" size="sm">
                <Calculator className="h-4 w-4 mr-2" />
                Pozisyon Hesapla
              </Button>
            </Link>
          </>
        ) : (
          /* No Active Setup */
          <div className="text-center py-4 space-y-2">
            <MinusCircle className="h-12 w-12 text-yellow-500 mx-auto opacity-50" />
            <p className="text-sm font-medium">Net Sinyal Yok</p>
            <p className="text-xs text-muted-foreground">
              {tradeSetup.reasons && tradeSetup.reasons.length > 0
                ? tradeSetup.reasons[0]
                : "Su an icin net bir trade setup bulunmuyor. Fiyatin destek/direnc seviyelerine yaklasmasini bekleyin."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
