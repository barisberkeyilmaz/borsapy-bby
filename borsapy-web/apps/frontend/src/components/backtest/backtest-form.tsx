"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { stocksApi, SearchResult } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, Loader2, Play } from "lucide-react";

interface BacktestFormProps {
  selectedStrategy: string | null;
  onSubmit: (params: {
    symbol: string;
    period: string;
    initial_capital: number;
    commission: number;
  }) => void;
  isRunning?: boolean;
}

const PERIOD_OPTIONS = [
  { value: "3mo", label: "3 Ay" },
  { value: "6mo", label: "6 Ay" },
  { value: "1y", label: "1 Yıl" },
  { value: "2y", label: "2 Yıl" },
  { value: "5y", label: "5 Yıl" },
];

export function BacktestForm({ selectedStrategy, onSubmit, isRunning }: BacktestFormProps) {
  const [symbol, setSymbol] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [period, setPeriod] = useState("1y");
  const [initialCapital, setInitialCapital] = useState("100000");
  const [commission, setCommission] = useState("0.1");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSymbol = useDebounce(symbol, 300);

  // Search stocks
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSymbol || debouncedSymbol.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await stocksApi.search(debouncedSymbol);
        setSearchResults(results.slice(0, 8));
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSymbol]);

  const handleSelectSymbol = (sym: string) => {
    setSelectedSymbol(sym);
    setSymbol("");
    setSearchResults([]);
  };

  const handleSubmit = () => {
    if (!selectedSymbol || !selectedStrategy) return;

    onSubmit({
      symbol: selectedSymbol,
      period,
      initial_capital: Number(initialCapital),
      commission: Number(commission) / 100, // Convert percentage to decimal
    });
  };

  const isValid = selectedSymbol && selectedStrategy && Number(initialCapital) > 0;

  return (
    <div className="space-y-4">
      {/* Symbol Search */}
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
              placeholder="Hisse ara (örn: THYAO)..."
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
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

      {/* Period */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Test Periyodu</label>
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          options={PERIOD_OPTIONS}
        />
      </div>

      {/* Initial Capital */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Başlangıç Sermayesi (TL)</label>
        <Input
          type="number"
          value={initialCapital}
          onChange={(e) => setInitialCapital(e.target.value)}
          min="1000"
          step="1000"
        />
      </div>

      {/* Commission */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Komisyon Oranı (%)</label>
        <Input
          type="number"
          value={commission}
          onChange={(e) => setCommission(e.target.value)}
          min="0"
          max="5"
          step="0.01"
        />
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!isValid || isRunning}
        className="w-full"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Test Çalışıyor...
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Backtest Başlat
          </>
        )}
      </Button>
    </div>
  );
}
