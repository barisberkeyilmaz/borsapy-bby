"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { ScreenerTable } from "@/components/tables/screener-table";
import { AddStockDialog } from "@/components/portfolio/add-stock-dialog";
import {
  useTemplates,
  useTemplateResults,
  useSectors,
  useCustomScreener,
} from "@/hooks/useScreener";
import { useScreenerStore } from "@/store/screener";
import { usePortfolioStore, Holding } from "@/store/portfolio";
import { FilterCriteria, stocksApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  X,
  Plus,
  Download,
  RefreshCw,
  ChevronRight,
  Info,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

// Template filter criteria descriptions
const TEMPLATE_CRITERIA: Record<string, string> = {
  small_cap: "Piyasa değeri < $1B",
  mid_cap: "Piyasa değeri $1B - $5B arası",
  large_cap: "Piyasa değeri > $5B",
  high_dividend: "Temettü verimi > %2",
  high_upside: "Analist hedef fiyatı > %20 yükseliş potansiyeli",
  low_upside: "Analist hedef fiyatı < %5 yükseliş potansiyeli",
  high_volume: "İşlem hacmi ortalamanın üstünde",
  low_volume: "İşlem hacmi ortalamanın altında",
  buy_recommendation: "Analist önerisi: AL",
  sell_recommendation: "Analist önerisi: SAT",
  high_net_margin: "Net kar marjı > %10",
  high_return: "Son 1 hafta getirisi > %0",
  low_pe: "F/K oranı < 10",
  high_roe: "Özkaynak karlılığı > %15",
  high_foreign_ownership: "Yabancı payı > %50",
};

const CRITERIA_OPTIONS = [
  { value: "pe", label: "F/K Oranı" },
  { value: "pb", label: "PD/DD" },
  { value: "market_cap", label: "Piyasa Değeri (mn $)" },
  { value: "dividend_yield", label: "Temettü Verimi (%)" },
  { value: "roe", label: "Özkaynak Karlılığı (%)" },
  { value: "net_margin", label: "Net Kar Marjı (%)" },
  { value: "upside_potential", label: "Yükseliş Potansiyeli (%)" },
  { value: "foreign_ratio", label: "Yabancı Payı (%)" },
  { value: "return_1w", label: "Haftalık Getiri (%)" },
  { value: "return_1m", label: "Aylık Getiri (%)" },
  { value: "return_ytd", label: "YTD Getiri (%)" },
];

export default function ScreenerPage() {
  const {
    selectedTemplate,
    filters,
    sector,
    setTemplate,
    addFilter,
    removeFilter,
    clearFilters,
    setSector,
  } = useScreenerStore();

  const { addHolding } = usePortfolioStore();

  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const { data: sectors } = useSectors();
  const {
    data: templateResults,
    isLoading: resultsLoading,
    refetch,
  } = useTemplateResults(selectedTemplate);

  const customScreener = useCustomScreener();

  const [newFilter, setNewFilter] = useState<Partial<FilterCriteria>>({
    criteria: "",
  });

  // Portfolio dialog state
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [selectedSymbolForPortfolio, setSelectedSymbolForPortfolio] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Run custom screener when filters change
  useEffect(() => {
    if (filters.length > 0 || sector) {
      customScreener.mutate({ filters, sector: sector || undefined });
    }
  }, [filters, sector]);

  const results = selectedTemplate
    ? templateResults
    : customScreener.data;

  const isLoading = resultsLoading || customScreener.isPending;

  // Reset page when results change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTemplate, filters, sector]);

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    if (!results?.results) return { data: [], totalPages: 0, totalItems: 0 };

    const totalItems = results.results.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const data = results.results.slice(startIndex, startIndex + pageSize);

    return { data, totalPages, totalItems };
  }, [results, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleAddToPortfolio = async (symbol: string) => {
    setSelectedSymbolForPortfolio(symbol);
    setPortfolioDialogOpen(true);
  };

  const handlePortfolioAdd = (holding: Holding) => {
    addHolding(holding);
    setPortfolioDialogOpen(false);
    setSelectedSymbolForPortfolio(null);
  };

  const handleAddFilter = () => {
    if (newFilter.criteria && (newFilter.min !== undefined || newFilter.max !== undefined)) {
      addFilter(newFilter as FilterCriteria);
      setNewFilter({ criteria: "" });
    }
  };

  const handleExportCSV = () => {
    if (!results?.results) return;

    const headers = Object.keys(results.results[0] || {}).join(",");
    const rows = results.results.map((row) =>
      Object.values(row).join(",")
    );
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `screener-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hisse Tarama</h1>
          <p className="text-muted-foreground">
            BIST hisselerini kriterlere göre filtreleyin
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Yenile
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!results?.results?.length}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Templates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Şablonlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {templatesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                templates?.map((template) => (
                  <Tooltip
                    key={template.name}
                    content={TEMPLATE_CRITERIA[template.name] || template.description}
                    side="right"
                  >
                    <button
                      onClick={() => setTemplate(template.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors text-left",
                        selectedTemplate === template.name
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <span className="truncate pr-2">{template.description}</span>
                      {selectedTemplate === template.name && (
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                      )}
                    </button>
                  </Tooltip>
                ))
              )}
            </CardContent>
          </Card>

          {/* Custom Filters */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Filtreler</CardTitle>
                {filters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 px-2 text-xs"
                  >
                    Temizle
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Active filters */}
              {filters.map((filter, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-muted rounded-md"
                >
                  <span className="text-xs flex-1">
                    {CRITERIA_OPTIONS.find((c) => c.value === filter.criteria)?.label}
                    : {filter.min ?? "-"} - {filter.max ?? "-"}
                  </span>
                  <button
                    onClick={() => removeFilter(idx)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Sector filter */}
              {sectors && sectors.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Sektör</label>
                  <Select
                    value={sector || ""}
                    onChange={(e) => setSector(e.target.value || null)}
                    options={[
                      { value: "", label: "Tümü" },
                      ...sectors.map((s) => ({ value: s, label: s })),
                    ]}
                  />
                </div>
              )}

              {/* Add filter */}
              <div className="space-y-2 pt-2 border-t">
                <label className="text-xs text-muted-foreground">Filtre Ekle</label>
                <Select
                  value={newFilter.criteria || ""}
                  onChange={(e) =>
                    setNewFilter({ ...newFilter, criteria: e.target.value })
                  }
                  options={CRITERIA_OPTIONS}
                  placeholder="Kriter seçin"
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={newFilter.min ?? ""}
                    onChange={(e) =>
                      setNewFilter({
                        ...newFilter,
                        min: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={newFilter.max ?? ""}
                    onChange={(e) =>
                      setNewFilter({
                        ...newFilter,
                        max: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={handleAddFilter}
                  disabled={!newFilter.criteria}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ekle
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">
                  Sonuçlar
                  {results?.count !== undefined && (
                    <Badge variant="secondary" className="ml-2">
                      {results.count}
                    </Badge>
                  )}
                </CardTitle>
                {selectedTemplate && TEMPLATE_CRITERIA[selectedTemplate] && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Filtre: {TEMPLATE_CRITERIA[selectedTemplate]}
                  </p>
                )}
              </div>
              {selectedTemplate && (
                <Badge variant="outline">{selectedTemplate}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScreenerTable
              data={paginatedData.data}
              isLoading={isLoading}
              onAddToPortfolio={handleAddToPortfolio}
            />
            {paginatedData.totalItems > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={paginatedData.totalPages}
                pageSize={pageSize}
                totalItems={paginatedData.totalItems}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Add Dialog */}
      <AddStockDialog
        open={portfolioDialogOpen}
        onOpenChange={setPortfolioDialogOpen}
        onAdd={handlePortfolioAdd}
        editingHolding={
          selectedSymbolForPortfolio
            ? { symbol: selectedSymbolForPortfolio, quantity: 1, avgPrice: 0, addedAt: new Date().toISOString() }
            : null
        }
      />
    </div>
  );
}
