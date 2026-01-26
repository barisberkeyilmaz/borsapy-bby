"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChartControlsProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  showSMA?: boolean;
  onToggleSMA?: () => void;
}

const PERIODS = [
  { value: "1d", label: "1G" },
  { value: "1wk", label: "1H" },
  { value: "1mo", label: "1A" },
  { value: "3mo", label: "3A" },
  { value: "1y", label: "1Y" },
  { value: "5y", label: "5Y" },
];

export function ChartControls({
  selectedPeriod,
  onPeriodChange,
  showSMA,
  onToggleSMA,
}: ChartControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-1">
        {PERIODS.map((period) => (
          <Button
            key={period.value}
            variant={selectedPeriod === period.value ? "default" : "outline"}
            size="sm"
            onClick={() => onPeriodChange(period.value)}
            className={cn(
              "h-7 px-3 text-xs",
              selectedPeriod === period.value && "bg-primary text-primary-foreground"
            )}
          >
            {period.label}
          </Button>
        ))}
      </div>
      {onToggleSMA && (
        <Button
          variant={showSMA ? "default" : "outline"}
          size="sm"
          onClick={onToggleSMA}
          className="h-7 text-xs"
        >
          SMA
        </Button>
      )}
    </div>
  );
}
