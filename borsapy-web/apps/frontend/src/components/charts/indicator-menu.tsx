"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useChartStore, IndicatorType } from "@/store/chart";
import {
  INDICATOR_CONFIGS,
  INDICATOR_CATEGORIES,
  getDefaultParams,
} from "./indicators/config";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function IndicatorMenu() {
  const [open, setOpen] = useState(false);
  const { activeIndicators, addIndicator } = useChartStore();

  const handleAddIndicator = (type: IndicatorType) => {
    const config = INDICATOR_CONFIGS[type];
    const params = getDefaultParams(type);
    addIndicator(type, params, config.pane);
    setOpen(false);
  };

  // Check if indicator type is already active
  const isIndicatorActive = (type: IndicatorType) => {
    return activeIndicators.some((ind) => ind.type === type);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Gosterge
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0"
        align="start"
      >
        <div className="p-2 border-b">
          <p className="text-sm font-medium">Gosterge Ekle</p>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {INDICATOR_CATEGORIES.map((category) => (
            <div key={category.id} className="py-1">
              <div className="px-3 py-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  {category.name}
                </p>
              </div>
              {category.indicators.map((type) => {
                const config = INDICATOR_CONFIGS[type];
                const isActive = isIndicatorActive(type);
                return (
                  <button
                    key={type}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 transition-colors",
                      isActive && "bg-muted/30"
                    )}
                    onClick={() => handleAddIndicator(type)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{config.shortName}</span>
                      <span className="text-xs text-muted-foreground">
                        {config.name}
                      </span>
                    </div>
                    {isActive && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
