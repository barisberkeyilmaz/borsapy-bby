"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StockSelector } from "@/components/compare/stock-selector";
import { ComparisonTable } from "@/components/compare/comparison-table";
import { PerformanceChart } from "@/components/compare/performance-chart";
import { SectorRadar } from "@/components/compare/sector-radar";
import { SectorRanking } from "@/components/compare/sector-ranking";
import { compareApi } from "@/lib/api";
import { GitCompare, BarChart3, TrendingUp, PieChart, ListOrdered } from "lucide-react";

const PERIODS = [
  { value: "1mo", label: "1 Ay" },
  { value: "3mo", label: "3 Ay" },
  { value: "6mo", label: "6 Ay" },
  { value: "1y", label: "1 Yil" },
  { value: "2y", label: "2 Yil" },
];

export default function ComparePage() {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [period, setPeriod] = useState("1y");
  const [sectorSymbol, setSectorSymbol] = useState<string | null>(null);

  const {
    data: stocksData,
    isLoading: stocksLoading,
  } = useQuery({
    queryKey: ["compare", "stocks", selectedSymbols],
    queryFn: () => compareApi.getStocks(selectedSymbols),
    enabled: selectedSymbols.length >= 2,
  });

  const {
    data: performanceData,
    isLoading: performanceLoading,
  } = useQuery({
    queryKey: ["compare", "performance", selectedSymbols, period],
    queryFn: () => compareApi.getPerformance(selectedSymbols, period),
    enabled: selectedSymbols.length >= 2,
  });

  const {
    data: sectorData,
    isLoading: sectorLoading,
  } = useQuery({
    queryKey: ["compare", "sector", sectorSymbol],
    queryFn: () => compareApi.getSectorComparison(sectorSymbol!),
    enabled: !!sectorSymbol,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Karsilastir</h1>
        <p className="text-muted-foreground">
          Hisseleri yan yana karsilastirin ve performanslarini analiz edin
        </p>
      </div>

      {/* Stock Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            Hisse Secimi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StockSelector
            selectedSymbols={selectedSymbols}
            onSymbolsChange={setSelectedSymbols}
            maxSymbols={5}
          />
        </CardContent>
      </Card>

      {selectedSymbols.length >= 2 && (
        <>
          {/* Comparison Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Temel Metrikler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonTable
                stocks={stocksData || []}
                isLoading={stocksLoading}
              />
            </CardContent>
          </Card>

          {/* Performance Chart */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performans Karsilastirmasi
                </CardTitle>
                <div className="flex gap-1">
                  {PERIODS.map((p) => (
                    <Button
                      key={p.value}
                      variant={period === p.value ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPeriod(p.value)}
                      className="h-7 px-2 text-xs"
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PerformanceChart
                data={performanceData}
                isLoading={performanceLoading}
              />
            </CardContent>
          </Card>

          {/* Sector Analysis */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Sektör Analizi
                </CardTitle>
                <div className="flex gap-1">
                  {selectedSymbols.map((symbol) => (
                    <Button
                      key={symbol}
                      variant={sectorSymbol === symbol ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSectorSymbol(symbol)}
                      className="h-7 px-2 text-xs"
                    >
                      {symbol}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!sectorSymbol ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Sektör analizi için yukarıdan bir hisse seçin
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      Sektör Ortalamasına Göre
                    </h4>
                    <SectorRadar data={sectorData} isLoading={sectorLoading} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <ListOrdered className="h-4 w-4" />
                      Sektör Sıralaması
                    </h4>
                    <SectorRanking data={sectorData} isLoading={sectorLoading} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {selectedSymbols.length < 2 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Karsilastirmaya baslayin</p>
            <p className="text-sm mt-1">
              Yukaridaki arama kutusundan en az 2 hisse secin
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
