"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatPercent, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { StockInfo } from "@/lib/api";

interface StockHeaderProps {
  stock: StockInfo | null | undefined;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function StockHeader({ stock, isLoading, children }: StockHeaderProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start justify-between">
            <div>
              <Skeleton className="h-9 w-32 mb-2" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="text-right">
              <Skeleton className="h-10 w-28 mb-2" />
              <Skeleton className="h-6 w-20 ml-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stock) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-muted-foreground text-center">Hisse bilgisi bulunamadi</p>
        </CardContent>
      </Card>
    );
  }

  const isPositive = (stock.change_percent ?? 0) >= 0;

  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{stock.symbol}</h1>
              <Badge variant={isPositive ? "success" : "destructive"}>
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {formatPercent(stock.change_percent)}
              </Badge>
              {children}
            </div>
            <p className="text-lg text-muted-foreground mt-1">{stock.name}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{formatNumber(stock.last_price)}</p>
            <p className={cn("text-lg", isPositive ? "text-positive" : "text-negative")}>
              {isPositive ? "+" : ""}
              {formatNumber(stock.change)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
