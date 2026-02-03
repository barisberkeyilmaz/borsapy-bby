"use client";

import { useRef, ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: ReactNode;
  width?: string;
  className?: string;
  headerClassName?: string;
  render: (item: T, index: number) => ReactNode;
}

interface VirtualTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  maxHeight?: number;
  className?: string;
  headerClassName?: string;
  rowClassName?: (item: T, index: number) => string;
  onRowClick?: (item: T, index: number) => void;
  emptyMessage?: string;
  overscan?: number;
}

export function VirtualTable<T>({
  data,
  columns,
  rowHeight = 48,
  maxHeight = 400,
  className,
  headerClassName,
  rowClassName,
  onRowClick,
  emptyMessage = "Veri bulunamadi",
  overscan = 5,
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead className={cn("sticky top-0 bg-background z-10", headerClassName)}>
          <tr className="border-b">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "py-3 px-2 text-left font-medium text-muted-foreground",
                  column.headerClassName
                )}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
      </table>
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ maxHeight: maxHeight - rowHeight }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          <table className="w-full text-sm">
            <tbody>
              {virtualItems.map((virtualRow) => {
                const item = data[virtualRow.index];
                const rowClasses = rowClassName
                  ? rowClassName(item, virtualRow.index)
                  : "";

                return (
                  <tr
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    className={cn(
                      "border-b transition-colors",
                      onRowClick && "cursor-pointer hover:bg-muted/50",
                      rowClasses
                    )}
                    onClick={() => onRowClick?.(item, virtualRow.index)}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn("py-3 px-2", column.className)}
                        style={{ width: column.width }}
                      >
                        {column.render(item, virtualRow.index)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Simple virtualized list component for non-table layouts
interface VirtualListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight?: number;
  maxHeight?: number;
  className?: string;
  emptyMessage?: string;
  overscan?: number;
}

export function VirtualList<T>({
  data,
  renderItem,
  itemHeight = 48,
  maxHeight = 400,
  className,
  emptyMessage = "Veri bulunamadi",
  overscan = 5,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto", className)}
      style={{ maxHeight }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const item = data[virtualRow.index];

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
              {renderItem(item, virtualRow.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
