"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { formatNumber, formatMarketCap, cn } from "@/lib/utils";
import Link from "next/link";

interface SectorStock {
  symbol?: string;
  pe_ratio?: number | null;
  pb_ratio?: number | null;
  market_cap?: number | null;
  [key: string]: unknown;
}

interface SectorStocksTableProps {
  stocks: SectorStock[];
  currentSymbol: string;
  maxHeight?: number;
}

export function SectorStocksTable({
  stocks,
  currentSymbol,
  maxHeight = 400,
}: SectorStocksTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: stocks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 5,
  });

  if (stocks.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Sektorde baska hisse bulunamadi
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div>
      <p className="text-sm font-medium mb-3">
        Sektordeki Diger Hisseler ({stocks.length} hisse)
      </p>
      <div className="overflow-x-auto border rounded-lg">
        {/* Fixed header */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="text-left py-2 px-3 font-medium">Sembol</th>
              <th className="text-right py-2 px-3 font-medium">F/K</th>
              <th className="text-right py-2 px-3 font-medium">PD/DD</th>
              <th className="text-right py-2 px-3 font-medium">Piyasa Deg.</th>
            </tr>
          </thead>
        </table>

        {/* Virtualized body */}
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ maxHeight: maxHeight - 44 }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualItems.map((virtualRow) => {
              const stock = stocks[virtualRow.index];
              const isCurrentStock = stock.symbol === currentSymbol;

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <table className="w-full text-sm">
                    <tbody>
                      <tr
                        className={cn(
                          "border-b border-border/30 hover:bg-muted/50 transition-colors",
                          isCurrentStock && "bg-primary/10"
                        )}
                      >
                        <td className="py-2 px-3 font-medium">
                          {isCurrentStock ? (
                            <span>
                              {String(stock.symbol || "-")}
                              <span className="ml-2 text-xs text-muted-foreground">(Bu hisse)</span>
                            </span>
                          ) : (
                            <Link
                              href={`/temel-analiz/${stock.symbol}`}
                              className="hover:text-primary hover:underline"
                            >
                              {String(stock.symbol || "-")}
                            </Link>
                          )}
                        </td>
                        <td className="text-right py-2 px-3">
                          {stock.pe_ratio !== null && stock.pe_ratio !== undefined
                            ? formatNumber(Number(stock.pe_ratio), 1)
                            : "-"}
                        </td>
                        <td className="text-right py-2 px-3">
                          {stock.pb_ratio !== null && stock.pb_ratio !== undefined
                            ? formatNumber(Number(stock.pb_ratio), 2)
                            : "-"}
                        </td>
                        <td className="text-right py-2 px-3">
                          {stock.market_cap
                            ? formatMarketCap(Number(stock.market_cap))
                            : "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
