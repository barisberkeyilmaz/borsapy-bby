"use client";

import { Button } from "@/components/ui/button";
import { useChartStore, ActiveIndicator } from "@/store/chart";
import { INDICATOR_CONFIGS, formatIndicatorLabel } from "./indicators/config";
import { X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface IndicatorValue {
  indicatorId: string;
  values: Record<string, number | null>;
}

interface ChartLegendProps {
  indicatorValues?: IndicatorValue[];
  className?: string;
}

export function ChartLegend({ indicatorValues = [], className }: ChartLegendProps) {
  const {
    activeIndicators,
    removeIndicator,
    toggleIndicatorVisibility,
  } = useChartStore();

  const overlayIndicators = activeIndicators.filter((ind) => ind.pane === "overlay");

  if (overlayIndicators.length === 0) return null;

  const formatValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "-";
    return value.toFixed(2);
  };

  const getIndicatorCurrentValues = (indicator: ActiveIndicator): Record<string, number | null> => {
    const found = indicatorValues.find((v) => v.indicatorId === indicator.id);
    return found?.values || {};
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-3 text-xs", className)}>
      {overlayIndicators.map((indicator) => {
        const config = INDICATOR_CONFIGS[indicator.type];
        const label = formatIndicatorLabel(indicator.type, indicator.params);
        const values = getIndicatorCurrentValues(indicator);

        return (
          <div
            key={indicator.id}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 transition-opacity",
              !indicator.visible && "opacity-50"
            )}
          >
            {/* Color indicator */}
            <div
              className="w-3 h-0.5 rounded-full"
              style={{ backgroundColor: indicator.color }}
            />

            {/* Label */}
            <span className="font-medium text-muted-foreground">{label}</span>

            {/* Value */}
            {indicator.visible && Object.keys(values).length > 0 && (
              <span className="text-foreground">
                {Object.entries(values)
                  .map(([key, val]) => formatValue(val))
                  .join(" / ")}
              </span>
            )}

            {/* Toggle visibility */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleIndicatorVisibility(indicator.id)}
              className="h-4 w-4 p-0 hover:bg-transparent"
            >
              {indicator.visible ? (
                <Eye className="h-3 w-3 text-muted-foreground" />
              ) : (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>

            {/* Remove */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeIndicator(indicator.id)}
              className="h-4 w-4 p-0 hover:bg-transparent"
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
