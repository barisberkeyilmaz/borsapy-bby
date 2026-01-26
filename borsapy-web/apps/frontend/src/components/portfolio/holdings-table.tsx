"use client";

import Link from "next/link";
import { cn, formatNumber, formatPercent, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Holding } from "@/store/portfolio";
import { ExternalLink, Trash2, Pencil } from "lucide-react";

interface HoldingsTableProps {
  holdings: Holding[];
  currentPrices: Record<string, number>;
  isLoading?: boolean;
  onRemove: (symbol: string) => void;
  onEdit: (symbol: string) => void;
}

export function HoldingsTable({
  holdings,
  currentPrices,
  isLoading,
  onRemove,
  onEdit,
}: HoldingsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (holdings.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-3 px-2 text-left font-medium text-muted-foreground">Sembol</th>
            <th className="py-3 px-2 text-right font-medium text-muted-foreground">Adet</th>
            <th className="py-3 px-2 text-right font-medium text-muted-foreground">Ort. Maliyet</th>
            <th className="py-3 px-2 text-right font-medium text-muted-foreground">Güncel Fiyat</th>
            <th className="py-3 px-2 text-right font-medium text-muted-foreground">Maliyet</th>
            <th className="py-3 px-2 text-right font-medium text-muted-foreground">Değer</th>
            <th className="py-3 px-2 text-right font-medium text-muted-foreground">K/Z</th>
            <th className="py-3 px-2 text-right font-medium text-muted-foreground">K/Z %</th>
            <th className="w-24"></th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => {
            const currentPrice = currentPrices[holding.symbol] || holding.avgPrice;
            const cost = holding.avgPrice * holding.quantity;
            const value = currentPrice * holding.quantity;
            const pnl = value - cost;
            const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
            const isPositive = pnl >= 0;

            return (
              <tr
                key={holding.symbol}
                className="border-b table-row-hover transition-colors"
              >
                <td className="py-3 px-2">
                  <Link
                    href={`/stock/${holding.symbol}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {holding.symbol}
                  </Link>
                </td>
                <td className="py-3 px-2 text-right">{formatNumber(holding.quantity, 0)}</td>
                <td className="py-3 px-2 text-right">{formatNumber(holding.avgPrice)}</td>
                <td className="py-3 px-2 text-right">{formatNumber(currentPrice)}</td>
                <td className="py-3 px-2 text-right">{formatCurrency(cost)}</td>
                <td className="py-3 px-2 text-right">{formatCurrency(value)}</td>
                <td className="py-3 px-2 text-right">
                  <span className={cn(isPositive ? "text-positive" : "text-negative")}>
                    {isPositive ? "+" : ""}{formatCurrency(pnl)}
                  </span>
                </td>
                <td className="py-3 px-2 text-right">
                  <Badge variant={isPositive ? "success" : "destructive"}>
                    {formatPercent(pnlPercent)}
                  </Badge>
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit(holding.symbol)}
                      title="Düzenle"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onRemove(holding.symbol)}
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Link
                      href={`/stock/${holding.symbol}`}
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
