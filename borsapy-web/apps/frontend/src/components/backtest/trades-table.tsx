"use client";

import { useState } from "react";
import { BacktestTrade } from "@/lib/api";
import { formatNumber, formatPercent, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TradesTableProps {
  trades: BacktestTrade[];
}

function IndicatorBadge({ name, value }: { name: string; value: number }) {
  const formatted = name.toLowerCase().includes("rsi") || name.toLowerCase().includes("stoch")
    ? value.toFixed(1)
    : value.toFixed(2);

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted">
      <span className="font-medium">{name.toUpperCase()}:</span>
      <span className="ml-1">{formatted}</span>
    </span>
  );
}

export function TradesTable({ trades }: TradesTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

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
            <th className="py-3 px-2 text-left font-medium text-muted-foreground w-8"></th>
            <th className="py-3 px-2 text-left font-medium text-muted-foreground">#</th>
            <th className="py-3 px-2 text-left font-medium text-muted-foreground">Giriş</th>
            <th className="py-3 px-2 text-left font-medium text-muted-foreground">Çıkış</th>
            <th className="py-3 px-2 text-left font-medium text-muted-foreground">Sinyal</th>
            <th className="py-3 px-2 text-right font-medium text-muted-foreground">K/Z</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, idx) => {
            const isPositive = (trade.profit ?? 0) >= 0;
            const isExpanded = expandedRow === idx;

            return (
              <>
                <tr
                  key={idx}
                  className={cn(
                    "border-b cursor-pointer transition-colors",
                    isExpanded ? "bg-muted/50" : "hover:bg-muted/30"
                  )}
                  onClick={() => setExpandedRow(isExpanded ? null : idx)}
                >
                  <td className="py-3 px-2">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </td>
                  <td className="py-3 px-2">{idx + 1}</td>
                  <td className="py-3 px-2">
                    <div className="flex flex-col">
                      <span>
                        {trade.entry_time
                          ? new Date(trade.entry_time).toLocaleDateString("tr-TR")
                          : "-"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatNumber(trade.entry_price ?? 0)} TL
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex flex-col">
                      <span>
                        {trade.exit_time
                          ? new Date(trade.exit_time).toLocaleDateString("tr-TR")
                          : "-"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {trade.exit_price ? `${formatNumber(trade.exit_price)} TL` : "-"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="max-w-[200px] truncate text-xs" title={trade.entry_reason}>
                      {trade.entry_reason || "-"}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex flex-col items-end">
                      <span className={cn(isPositive ? "text-positive" : "text-negative")}>
                        {trade.profit !== null
                          ? `${isPositive ? "+" : ""}${formatNumber(trade.profit, 0)} TL`
                          : "-"}
                      </span>
                      {trade.profit_pct !== null && (
                        <Badge variant={isPositive ? "success" : "destructive"} className="mt-1">
                          {formatPercent(trade.profit_pct)}
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${idx}-details`} className="bg-muted/30 border-b">
                    <td colSpan={6} className="py-4 px-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Entry Details */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-green-500">Giriş Detayları</h4>
                          <div className="text-sm">
                            <p><span className="text-muted-foreground">Tarih:</span> {trade.entry_time ? new Date(trade.entry_time).toLocaleString("tr-TR") : "-"}</p>
                            <p><span className="text-muted-foreground">Fiyat:</span> {formatNumber(trade.entry_price ?? 0)} TL</p>
                            <p><span className="text-muted-foreground">Adet:</span> {formatNumber(trade.shares, 2)}</p>
                            <p><span className="text-muted-foreground">Sebep:</span> {trade.entry_reason || "-"}</p>
                          </div>
                          {trade.entry_indicators && Object.keys(trade.entry_indicators).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(trade.entry_indicators).map(([key, value]) => (
                                <IndicatorBadge key={key} name={key} value={value as number} />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Exit Details */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-red-500">Çıkış Detayları</h4>
                          <div className="text-sm">
                            <p><span className="text-muted-foreground">Tarih:</span> {trade.exit_time ? new Date(trade.exit_time).toLocaleString("tr-TR") : "-"}</p>
                            <p><span className="text-muted-foreground">Fiyat:</span> {trade.exit_price ? `${formatNumber(trade.exit_price)} TL` : "-"}</p>
                            <p><span className="text-muted-foreground">Sebep:</span> {trade.exit_reason || "-"}</p>
                          </div>
                          {trade.exit_indicators && Object.keys(trade.exit_indicators).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(trade.exit_indicators).map(([key, value]) => (
                                <IndicatorBadge key={key} name={key} value={value as number} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
