"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn, formatNumber, formatPercent, formatMarketCap } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Plus, Info } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

type SortDirection = "asc" | "desc" | null;

interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface ScreenerTableProps {
  data: Record<string, unknown>[];
  isLoading?: boolean;
  onAddToPortfolio?: (symbol: string) => void;
}

const COLUMN_CONFIG = [
  { key: "symbol", label: "Sembol", width: "w-24" },
  { key: "name", label: "Şirket", width: "w-48" },
  { key: "price", label: "Fiyat", width: "w-24", align: "right" as const },
  { key: "change_percent", label: "Değişim", width: "w-24", align: "right" as const, tooltip: "Günlük fiyat değişimi (%)" },
  { key: "market_cap_usd", label: "Piy. Değeri", width: "w-28", align: "right" as const, tooltip: "Piyasa değeri (milyon $)" },
  { key: "pe", label: "F/K", width: "w-20", align: "right" as const, tooltip: "Fiyat/Kazanç oranı. Düşük değerler ucuzluğa işaret edebilir" },
  { key: "pb", label: "PD/DD", width: "w-20", align: "right" as const, tooltip: "Piyasa Değeri/Defter Değeri. 1'in altı varlıklardan ucuz işlem görüldüğünü gösterir" },
  { key: "dividend_yield", label: "Temettü", width: "w-20", align: "right" as const, tooltip: "Temettü verimi (%)" },
  { key: "upside_potential", label: "Potansiyel", width: "w-24", align: "right" as const, tooltip: "Analist hedef fiyatına göre yükseliş potansiyeli (%)" },
];

export function ScreenerTable({ data, isLoading, onAddToPortfolio }: ScreenerTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "", direction: null });

  const columns = useMemo(() => {
    if (!data || data.length === 0) return COLUMN_CONFIG;

    // Filter columns based on available data
    const availableKeys = new Set(Object.keys(data[0]));
    return COLUMN_CONFIG.filter(
      (col) => availableKeys.has(col.key) || col.key === "symbol"
    );
  }, [data]);

  const sortedData = useMemo(() => {
    if (!data || !sortConfig.key || !sortConfig.direction) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortConfig.direction === "asc" ? 1 : -1;
      if (bVal == null) return sortConfig.direction === "asc" ? -1 : 1;

      // String comparison
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal, "tr")
          : bVal.localeCompare(aVal, "tr");
      }

      // Number comparison
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key !== key) {
        return { key, direction: "desc" };
      }
      if (prev.direction === "desc") {
        return { key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key: "", direction: null };
      }
      return { key, direction: "desc" };
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    }
    if (sortConfig.direction === "asc") {
      return <ArrowUp className="h-3 w-3" />;
    }
    return <ArrowDown className="h-3 w-3" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Sonuç bulunamadı
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "py-3 px-2 font-medium text-muted-foreground",
                  col.width,
                  col.align === "right" ? "text-right" : "text-left"
                )}
              >
                <button
                  onClick={() => handleSort(col.key)}
                  className={cn(
                    "inline-flex items-center gap-1 hover:text-foreground transition-colors",
                    sortConfig.key === col.key && "text-foreground"
                  )}
                >
                  {col.label}
                  {(col as any).tooltip && (
                    <Tooltip content={(col as any).tooltip} side="top">
                      <Info className="h-3 w-3 opacity-50" />
                    </Tooltip>
                  )}
                  {getSortIcon(col.key)}
                </button>
              </th>
            ))}
            {onAddToPortfolio && <th className="w-10"></th>}
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, idx) => (
            <tr
              key={(row.symbol as string) || idx}
              className="border-b table-row-hover transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "py-3 px-2",
                    col.align === "right" ? "text-right" : "text-left"
                  )}
                >
                  {renderCell(col.key, row)}
                </td>
              ))}
              {onAddToPortfolio && (
                <td className="py-3 px-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onAddToPortfolio(row.symbol as string)}
                    title="Portföye Ekle"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </td>
              )}
              <td className="py-3 px-2">
                <Link
                  href={`/stock/${row.symbol}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(key: string, row: Record<string, unknown>): React.ReactNode {
  const value = row[key];

  switch (key) {
    case "symbol":
      return (
        <Link
          href={`/stock/${value}`}
          className="font-medium text-primary hover:underline"
        >
          {value as string}
        </Link>
      );

    case "name":
      return (
        <span className="truncate max-w-[200px] block" title={value as string}>
          {value as string}
        </span>
      );

    case "price":
      return formatNumber(value as number);

    case "change_percent":
      const change = value as number;
      return (
        <Badge variant={change >= 0 ? "success" : "destructive"}>
          {formatPercent(change)}
        </Badge>
      );

    case "market_cap_usd":
      return formatMarketCap((value as number) * 1000000);

    case "pe":
    case "pb":
      return formatNumber(value as number, 1);

    case "dividend_yield":
      return value !== null && value !== undefined
        ? `${formatNumber(value as number, 1)}%`
        : "-";

    case "upside_potential":
      const upside = value as number;
      if (upside === null || upside === undefined) return "-";
      return (
        <span className={cn(upside >= 0 ? "text-positive" : "text-negative")}>
          {formatPercent(upside)}
        </span>
      );

    default:
      return value !== null && value !== undefined ? String(value) : "-";
  }
}
