"use client";

import { BacktestStrategy } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, Activity, BarChart3, Layers } from "lucide-react";

interface StrategySelectorProps {
  strategies: BacktestStrategy[];
  selectedStrategy: string | null;
  onSelect: (strategyId: string) => void;
  isLoading?: boolean;
}

const strategyIcons: Record<string, React.ReactNode> = {
  rsi: <Activity className="h-5 w-5" />,
  macd: <BarChart3 className="h-5 w-5" />,
  sma_cross: <TrendingUp className="h-5 w-5" />,
  bollinger: <Layers className="h-5 w-5" />,
};

export function StrategySelector({
  strategies,
  selectedStrategy,
  onSelect,
  isLoading,
}: StrategySelectorProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {strategies.map((strategy) => (
        <Card
          key={strategy.id}
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            selectedStrategy === strategy.id && "border-primary bg-primary/5"
          )}
          onClick={() => onSelect(strategy.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                selectedStrategy === strategy.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}>
                {strategyIcons[strategy.id] || <TrendingUp className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="font-medium">{strategy.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {strategy.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
