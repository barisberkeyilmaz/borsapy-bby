"use client";

import { BacktestTrade } from "@/lib/api";
import { formatNumber, formatPercent, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TradesTableProps {
  trades: BacktestTrade[];
}

export function TradesTable({ trades }: TradesTableProps) {
  if (trades.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Bu dönemde işlem yapılmadı
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-3 px-2 text-left font-medium text-muted-foreground">#</th>
            <th className="py-3 px-2 text-left font-medium text-muted-foreground">Giriş Tarihi</th>
            <th className="py-3 px-2 text-right font-medium text-muted-foreground">Giriş Fiyatı</th>
            <th className="py-3 px-2 text-left font-medium text-muted-foreground">Çıkış Tarihi</th>
            <th className="py-3 px-2 text-right font-medium text-muted-foreground">Çıkış Fiyatı</th>
            <th className="py-3 px-2 text-right font-medium text-muted-foreground">Adet</th>
            <th className="py-3 px-2 text-right font-medium text-muted-foreground">K/Z (TL)</th>
            <th className="py-3 px-2 text-right font-medium text-muted-foreground">K/Z %</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, idx) => {
            const isPositive = (trade.profit ?? 0) >= 0;
            return (
              <tr key={idx} className="border-b table-row-hover transition-colors">
                <td className="py-3 px-2">{idx + 1}</td>
                <td className="py-3 px-2">
                  {trade.entry_time
                    ? new Date(trade.entry_time).toLocaleDateString("tr-TR")
                    : "-"}
                </td>
                <td className="py-3 px-2 text-right">
                  {formatNumber(trade.entry_price ?? 0)}
                </td>
                <td className="py-3 px-2">
                  {trade.exit_time
                    ? new Date(trade.exit_time).toLocaleDateString("tr-TR")
                    : "-"}
                </td>
                <td className="py-3 px-2 text-right">
                  {trade.exit_price ? formatNumber(trade.exit_price) : "-"}
                </td>
                <td className="py-3 px-2 text-right">
                  {formatNumber(trade.shares, 2)}
                </td>
                <td className="py-3 px-2 text-right">
                  <span className={cn(isPositive ? "text-positive" : "text-negative")}>
                    {trade.profit !== null
                      ? `${isPositive ? "+" : ""}${formatNumber(trade.profit, 2)}`
                      : "-"}
                  </span>
                </td>
                <td className="py-3 px-2 text-right">
                  {trade.profit_pct !== null ? (
                    <Badge variant={isPositive ? "success" : "destructive"}>
                      {formatPercent(trade.profit_pct)}
                    </Badge>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
