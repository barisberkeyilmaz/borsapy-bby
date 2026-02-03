import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatPercent, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { IndicesRefreshButton } from "./indices-refresh-button";

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

interface MarketIndex {
  name: string;
  value: number;
  change: number;
  change_percent: number;
}

interface MarketSummary {
  indices: MarketIndex[];
}

async function getMarketSummary(): Promise<MarketSummary | null> {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await fetch(`${API_BASE_URL}/api/market/summary`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

export default async function IndicesPage() {
  const market = await getMarketSummary();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Endeksler</h1>
          <p className="text-muted-foreground">
            BIST endeksleri ve performanslari
          </p>
        </div>
        <IndicesRefreshButton />
      </div>

      {market?.indices && market.indices.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {market.indices.map((index) => {
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
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Endeks verisi yuklenemedi</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
