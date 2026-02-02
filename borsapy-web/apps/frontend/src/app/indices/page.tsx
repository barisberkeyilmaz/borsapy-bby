"use client";

export const dynamic = "force-dynamic";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { marketApi } from "@/lib/api";
import { formatNumber, formatPercent, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function IndicesPage() {
  const { data: market, isLoading } = useQuery({
    queryKey: ["market", "summary"],
    queryFn: marketApi.getSummary,
    refetchInterval: 30 * 1000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Endeksler</h1>
        <p className="text-muted-foreground">
          BIST endeksleri ve performansları
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {market?.indices?.map((index) => {
            const isPositive = (index.change_percent ?? 0) >= 0;
            return (
              <Card key={index.name}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{index.name}</CardTitle>
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(index.value, 0)}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-sm", isPositive ? "text-positive" : "text-negative")}>
                      {isPositive ? "+" : ""}{formatNumber(index.change, 2)}
                    </span>
                    <Badge variant={isPositive ? "success" : "destructive"}>
                      {formatPercent(index.change_percent)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!market?.indices?.length && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Endeks verisi yüklenemedi</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
