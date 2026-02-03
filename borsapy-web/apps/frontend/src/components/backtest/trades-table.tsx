"use client";

import { useState, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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

function TradeDetailRow({ trade }: { trade: BacktestTrade }) {
  return (
    <div className="py-4 px-4 bg-muted/30 border-b">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Entry Details */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-green-500">Giris Detaylari</h4>
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
          <h4 className="text-sm font-medium text-red-500">Cikis Detaylari</h4>
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
    </div>
  );
}

export function TradesTable({ trades }: TradesTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate row heights based on whether row is expanded
  const getRowHeight = (index: number) => {
    if (expandedRow === index) {
      return 200; // Expanded row height
    }
    return 60; // Normal row height
  };

  const virtualizer = useVirtualizer({
    count: trades.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => getRowHeight(index),
    overscan: 5,
  });

  // Recalculate when expanded row changes
  useEffect(() => {
    virtualizer.measure();
  }, [expandedRow]);

  if (trades.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Bu donemde islem yapilmadi
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="overflow-x-auto">
      {/* Fixed header */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-3 px-2 text-left font-medium text-muted-foreground w-8"></th>
            <th className="py-3 px-2 text-left font-medium text-muted-foreground w-12">#</th>
            <th className="py-3 px-2 text-left font-medium text-muted-foreground">Giris</th>
            <th className="py-3 px-2 text-left font-medium text-muted-foreground">Cikis</th>
            <th className="py-3 px-2 text-left font-medium text-muted-foreground">Sinyal</th>
            <th className="py-3 px-2 text-right font-medium text-muted-foreground">K/Z</th>
          </tr>
        </thead>
      </table>

      {/* Virtualized body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ maxHeight: 500 }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const trade = trades[virtualRow.index];
            const idx = virtualRow.index;
            const isPositive = (trade.profit ?? 0) >= 0;
            const isExpanded = expandedRow === idx;

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <table className="w-full text-sm">
                  <tbody>
                    <tr
                      className={cn(
                        "border-b cursor-pointer transition-colors",
                        isExpanded ? "bg-muted/50" : "hover:bg-muted/30"
                      )}
                      onClick={() => setExpandedRow(isExpanded ? null : idx)}
                    >
                      <td className="py-3 px-2 w-8">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="py-3 px-2 w-12">{idx + 1}</td>
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
                  </tbody>
                </table>
                {isExpanded && <TradeDetailRow trade={trade} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
