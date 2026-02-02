"use client";

export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConditionBuilder } from "@/components/scanner/condition-builder";
import { ScannerResults } from "@/components/scanner/scanner-results";
import { usePresets, useUniverses, useIntervals, useScan } from "@/hooks/useScanner";
import { useScannerStore } from "@/store/scanner";
import { cn } from "@/lib/utils";
import {
  Activity,
  Play,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Layers,
  Zap,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  momentum: <Activity className="h-4 w-4" />,
  trend: <TrendingUp className="h-4 w-4" />,
  volume: <BarChart3 className="h-4 w-4" />,
  combo: <Layers className="h-4 w-4" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  momentum: "Momentum",
  trend: "Trend",
  volume: "Hacim",
  combo: "Kombine",
};

export default function ScannerPage() {
  const { data: presets, isLoading: presetsLoading } = usePresets();
  const { data: universes } = useUniverses();
  const { data: intervals } = useIntervals();
  const scanMutation = useScan();

  const {
    conditions,
    universe,
    interval,
    setConditions,
    setUniverse,
    setInterval,
  } = useScannerStore();

  const handlePresetClick = (preset: { conditions: string[]; id: string }) => {
    // Set conditions from preset
    const newConditions = preset.conditions.map((c, i) => ({
      id: `preset-${preset.id}-${i}`,
      condition: c,
    }));
    setConditions(newConditions);
  };

  const handleRunScan = () => {
    if (conditions.length === 0) return;

    scanMutation.mutate({
      conditions: conditions.map((c) => c.condition),
      universe,
      interval,
      limit: 100,
    });
  };

  // Group presets by category
  const presetsByCategory = presets?.reduce(
    (acc, preset) => {
      const cat = preset.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(preset);
      return acc;
    },
    {} as Record<string, typeof presets>
  );

  const universeOptions = universes?.map((u) => ({ value: u.id, label: u.name })) || [
    { value: "XU100", label: "BIST 100" },
  ];

  const intervalOptions = intervals?.map((i) => ({ value: i.id, label: i.name })) || [
    { value: "1d", label: "Günlük" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teknik Tarama</h1>
          <p className="text-muted-foreground">
            Teknik göstergelere göre hisse taraması yapın
          </p>
        </div>
        <Button
          onClick={handleRunScan}
          disabled={conditions.length === 0 || scanMutation.isPending}
          size="lg"
        >
          {scanMutation.isPending ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Tara
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Universe & Interval Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tarama Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Evren</label>
                <Select
                  value={universe}
                  onChange={(e) => setUniverse(e.target.value)}
                  options={universeOptions}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Zaman Dilimi</label>
                <Select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  options={intervalOptions}
                />
              </div>
            </CardContent>
          </Card>

          {/* Presets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Hazır Taramalar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {presetsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                presetsByCategory &&
                Object.entries(presetsByCategory).map(([category, categoryPresets]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {CATEGORY_ICONS[category]}
                      <span>{CATEGORY_LABELS[category] || category}</span>
                    </div>
                    <div className="space-y-1">
                      {categoryPresets?.map((preset) => {
                        const isActive = conditions.length === preset.conditions.length &&
                          conditions.every((c, i) => c.condition === preset.conditions[i]);

                        return (
                          <button
                            key={preset.id}
                            onClick={() => handlePresetClick(preset)}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors text-left",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            )}
                          >
                            <div>
                              <span className="font-medium">{preset.name}</span>
                              <p className="text-xs opacity-70 mt-0.5">
                                {preset.description}
                              </p>
                            </div>
                            {isActive && <Zap className="h-4 w-4 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Custom Condition Builder */}
          <ConditionBuilder
            onRunScan={handleRunScan}
            isScanning={scanMutation.isPending}
          />
        </div>

        {/* Results */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">
                  Sonuçlar
                  {scanMutation.data?.count !== undefined && (
                    <Badge variant="secondary" className="ml-2">
                      {scanMutation.data.count}
                    </Badge>
                  )}
                </CardTitle>
                {conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {conditions.map((c) => (
                      <Badge key={c.id} variant="outline" className="text-xs font-mono">
                        {c.condition}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {scanMutation.data && (
                <div className="text-xs text-muted-foreground">
                  {universe} • {interval}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!scanMutation.data && !scanMutation.isPending ? (
              <div className="text-center py-16 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Tarama yapmaya hazır</p>
                <p className="text-sm mt-1">
                  Sol taraftan hazır tarama seçin veya özel koşullar ekleyin
                </p>
              </div>
            ) : (
              <ScannerResults
                results={scanMutation.data?.results || []}
                isLoading={scanMutation.isPending}
                conditions={conditions.map((c) => c.condition)}
              />
            )}

            {scanMutation.isError && (
              <div className="text-center py-8 text-destructive">
                <p>Tarama sırasında hata oluştu</p>
                <p className="text-sm mt-1">{(scanMutation.error as Error)?.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
