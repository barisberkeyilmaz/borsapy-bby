"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import { AddStockDialog } from "@/components/portfolio/add-stock-dialog";
import { usePortfolioStore, Holding } from "@/store/portfolio";
import { stocksApi } from "@/lib/api";
import { Briefcase, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PortfolioPage() {
  const { holdings, addHolding, removeHolding, updateHolding } = usePortfolioStore();
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);

  // Fetch current prices for all holdings
  const fetchPrices = useCallback(async () => {
    if (holdings.length === 0) return;

    setIsLoading(true);
    const prices: Record<string, number> = {};

    try {
      await Promise.all(
        holdings.map(async (holding) => {
          try {
            const info = await stocksApi.getFastInfo(holding.symbol);
            if (info.last_price) {
              prices[holding.symbol] = info.last_price;
            }
          } catch (error) {
            console.error(`Failed to fetch price for ${holding.symbol}:`, error);
          }
        })
      );
      setCurrentPrices(prices);
    } finally {
      setIsLoading(false);
    }
  }, [holdings]);

  // Fetch prices on mount and when holdings change
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Auto-refresh prices every 30 seconds
  useEffect(() => {
    if (holdings.length === 0) return;

    const interval = setInterval(fetchPrices, 30 * 1000);
    return () => clearInterval(interval);
  }, [holdings.length, fetchPrices]);

  const handleAddHolding = (holding: Holding) => {
    if (editingHolding) {
      // Update existing holding
      updateHolding(holding.symbol, {
        quantity: holding.quantity,
        avgPrice: holding.avgPrice,
      });
      setEditingHolding(null);
    } else {
      addHolding(holding);
    }
  };

  const handleEditHolding = (symbol: string) => {
    const holding = holdings.find((h) => h.symbol === symbol);
    if (holding) {
      setEditingHolding(holding);
      setDialogOpen(true);
    }
  };

  const handleOpenDialog = () => {
    setEditingHolding(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portföy</h1>
          <p className="text-muted-foreground">
            Hisselerinizi takip edin ve performansınızı izleyin
          </p>
        </div>
        <div className="flex gap-2">
          {holdings.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPrices}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Yenile
            </Button>
          )}
          <Button onClick={handleOpenDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Hisse Ekle
          </Button>
        </div>
      </div>

      {holdings.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">Portföyünüz boş</h3>
                <p className="text-sm text-muted-foreground">
                  Başlamak için hisse ekleyin
                </p>
              </div>
              <Button variant="outline" onClick={handleOpenDialog}>
                <Plus className="h-4 w-4 mr-2" />
                İlk Hissenizi Ekleyin
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <PortfolioSummary holdings={holdings} currentPrices={currentPrices} />

          {/* Holdings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Hisseler</CardTitle>
            </CardHeader>
            <CardContent>
              <HoldingsTable
                holdings={holdings}
                currentPrices={currentPrices}
                isLoading={isLoading && Object.keys(currentPrices).length === 0}
                onRemove={removeHolding}
                onEdit={handleEditHolding}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Add/Edit Stock Dialog */}
      <AddStockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAddHolding}
        editingHolding={editingHolding}
      />
    </div>
  );
}
