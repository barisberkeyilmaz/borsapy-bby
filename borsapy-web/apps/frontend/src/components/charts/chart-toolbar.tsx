"use client";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CHART_EXPLANATIONS } from "@/lib/explanations";
import { ChartType } from "@/store/chart";
import { IndicatorMenu } from "./indicator-menu";
import { CandlestickChart, LineChart, AreaChart, Volume2, TrendingUp, Target } from "lucide-react";

interface ChartToolbarProps {
  period: string;
  interval: string;
  chartType: ChartType;
  showVolume: boolean;
  showSupportResistance?: boolean;
  showSignals?: boolean;
  hasLevels?: boolean;
  hasSignals?: boolean;
  onPeriodChange: (period: string) => void;
  onIntervalChange: (interval: string) => void;
  onChartTypeChange: (type: ChartType) => void;
  onToggleVolume: () => void;
  onToggleSupportResistance?: () => void;
  onToggleSignals?: () => void;
}

const PERIODS = [
  { value: "1d", label: "1G", key: "period_1d" },
  { value: "5d", label: "1H", key: "period_5d" },
  { value: "1mo", label: "1A", key: "period_1mo" },
  { value: "3mo", label: "3A", key: "period_3mo" },
  { value: "6mo", label: "6A", key: "period_6mo" },
  { value: "1y", label: "1Y", key: "period_1y" },
  { value: "5y", label: "5Y", key: "period_5y" },
];

const INTERVALS = [
  { value: "1m", label: "1 dk" },
  { value: "5m", label: "5 dk" },
  { value: "15m", label: "15 dk" },
  { value: "1h", label: "1 sa" },
  { value: "1d", label: "Gunluk" },
  { value: "1W", label: "Haftalik" },
  { value: "1M", label: "Aylik" },
];

const CHART_TYPES: { value: ChartType; label: string; key: string; icon: React.ReactNode }[] = [
  { value: "candlestick", label: "Mum", key: "candlestick", icon: <CandlestickChart className="h-4 w-4" /> },
  { value: "line", label: "Cizgi", key: "line", icon: <LineChart className="h-4 w-4" /> },
  { value: "area", label: "Alan", key: "area", icon: <AreaChart className="h-4 w-4" /> },
];

export function ChartToolbar({
  period,
  interval,
  chartType,
  showVolume,
  showSupportResistance,
  showSignals,
  hasLevels,
  hasSignals,
  onPeriodChange,
  onIntervalChange,
  onChartTypeChange,
  onToggleVolume,
  onToggleSupportResistance,
  onToggleSignals,
}: ChartToolbarProps) {
  const handlePeriodChange = (newPeriod: string) => {
    onPeriodChange(newPeriod);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Period buttons */}
      <div className="flex gap-1">
        {PERIODS.map((p) => {
          const explanation = CHART_EXPLANATIONS[p.key];
          return (
            <Tooltip
              key={p.value}
              content={explanation?.long || p.label}
              side="bottom"
            >
              <Button
                variant={period === p.value ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodChange(p.value)}
                className={cn(
                  "h-7 px-2.5 text-xs",
                  period === p.value && "bg-primary text-primary-foreground"
                )}
              >
                {p.label}
              </Button>
            </Tooltip>
          );
        })}
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Interval selector */}
      <Tooltip content={CHART_EXPLANATIONS.interval?.long || "Zaman dilimi secin"} side="bottom">
        <Select
          value={interval}
          onChange={(e) => onIntervalChange(e.target.value)}
          options={INTERVALS}
          className="h-8 w-28 text-xs"
        />
      </Tooltip>

      <div className="h-6 w-px bg-border" />

      {/* Chart type selector */}
      <div className="flex gap-1">
        {CHART_TYPES.map((type) => {
          const explanation = CHART_EXPLANATIONS[type.key];
          return (
            <Tooltip
              key={type.value}
              content={explanation?.long || type.label}
              side="bottom"
            >
              <Button
                variant={chartType === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => onChartTypeChange(type.value)}
                className={cn(
                  "h-7 px-2",
                  chartType === type.value && "bg-primary text-primary-foreground"
                )}
              >
                {type.icon}
              </Button>
            </Tooltip>
          );
        })}
      </div>

      {/* Volume toggle */}
      <Tooltip content={CHART_EXPLANATIONS.volume?.long || "Islem hacmini goster"} side="bottom">
        <Button
          variant={showVolume ? "default" : "outline"}
          size="sm"
          onClick={onToggleVolume}
          className={cn(
            "h-7 px-2",
            showVolume && "bg-primary text-primary-foreground"
          )}
        >
          <Volume2 className="h-4 w-4" />
        </Button>
      </Tooltip>

      {/* Support/Resistance toggle - only show if there are levels */}
      {hasLevels && onToggleSupportResistance && (
        <Tooltip content={CHART_EXPLANATIONS.support_resistance?.long || "Destek/Direnc seviyelerini goster"} side="bottom">
          <Button
            variant={showSupportResistance ? "default" : "outline"}
            size="sm"
            onClick={onToggleSupportResistance}
            className={cn(
              "h-7 px-2",
              showSupportResistance && "bg-primary text-primary-foreground"
            )}
          >
            <TrendingUp className="h-4 w-4" />
          </Button>
        </Tooltip>
      )}

      {/* Signals toggle - only show if there are signals */}
      {hasSignals && onToggleSignals && (
        <Tooltip content={CHART_EXPLANATIONS.signals?.long || "Al/Sat sinyallerini goster"} side="bottom">
          <Button
            variant={showSignals ? "default" : "outline"}
            size="sm"
            onClick={onToggleSignals}
            className={cn(
              "h-7 px-2",
              showSignals && "bg-primary text-primary-foreground"
            )}
          >
            <Target className="h-4 w-4" />
          </Button>
        </Tooltip>
      )}

      <div className="h-6 w-px bg-border" />

      {/* Indicator menu */}
      <IndicatorMenu />
    </div>
  );
}
