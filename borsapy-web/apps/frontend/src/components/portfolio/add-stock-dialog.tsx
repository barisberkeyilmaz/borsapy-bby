"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { stocksApi, SearchResult } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { Loader2, Search } from "lucide-react";
import { Holding } from "@/store/portfolio";

interface AddStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (holding: Holding) => void;
  editingHolding?: Holding | null;
}

export function AddStockDialog({
  open,
  onOpenChange,
  onAdd,
  editingHolding,
}: AddStockDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (editingHolding) {
        setSelectedSymbol(editingHolding.symbol);
        setQuantity(String(editingHolding.quantity));
        setAvgPrice(String(editingHolding.avgPrice));
        setSearchQuery("");
      } else {
        setSelectedSymbol("");
        setQuantity("");
        setAvgPrice("");
        setSearchQuery("");
      }
      setSearchResults([]);
    }
  }, [open, editingHolding]);

  // Search stocks
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await stocksApi.search(debouncedQuery);
        setSearchResults(results.slice(0, 8));
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const handleSelectSymbol = async (symbol: string) => {
    setSelectedSymbol(symbol);
    setSearchQuery("");
    setSearchResults([]);

    // Get current price
    try {
      const info = await stocksApi.getFastInfo(symbol);
      if (info.last_price && !avgPrice) {
        setAvgPrice(String(info.last_price));
      }
    } catch (error) {
      console.error("Failed to get price:", error);
    }
  };

  const handleSubmit = () => {
    if (!selectedSymbol || !quantity || !avgPrice) return;

    onAdd({
      symbol: selectedSymbol,
      quantity: Number(quantity),
      avgPrice: Number(avgPrice),
      addedAt: editingHolding?.addedAt || new Date().toISOString(),
    });

    onOpenChange(false);
  };

  const isValid = selectedSymbol && quantity && avgPrice && Number(quantity) > 0 && Number(avgPrice) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingHolding ? "Hisse Düzenle" : "Portföye Hisse Ekle"}
          </DialogTitle>
          <DialogDescription>
            {editingHolding
              ? "Hisse bilgilerini güncelleyin"
              : "Portföyünüze yeni bir hisse ekleyin"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Symbol Search */}
          {!editingHolding && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Hisse Sembolü</label>
              {selectedSymbol ? (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{selectedSymbol}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSymbol("")}
                  >
                    Değiştir
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Hisse ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full mt-1 w-full bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
                      {searchResults.map((result) => (
                        <button
                          key={result.symbol}
                          onClick={() => handleSelectSymbol(result.symbol)}
                          className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between"
                        >
                          <span className="font-medium">{result.symbol}</span>
                          <span className="text-sm text-muted-foreground truncate ml-2 max-w-[180px]">
                            {result.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {editingHolding && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Hisse Sembolü</label>
              <div className="font-bold text-lg">{selectedSymbol}</div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Adet</label>
            <Input
              type="number"
              placeholder="Örn: 100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0"
              step="1"
            />
          </div>

          {/* Average Price */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ortalama Maliyet (TL)</label>
            <Input
              type="number"
              placeholder="Örn: 25.50"
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            {editingHolding ? "Güncelle" : "Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
