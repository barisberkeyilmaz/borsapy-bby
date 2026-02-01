"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { stocksApi, SearchResult } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { X, Plus, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockSelectorProps {
  selectedSymbols: string[];
  onSymbolsChange: (symbols: string[]) => void;
  maxSymbols?: number;
}

export function StockSelector({
  selectedSymbols,
  onSymbolsChange,
  maxSymbols = 5,
}: StockSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Search on debounced query change
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const searchResults = await stocksApi.search(debouncedQuery);
        // Filter out already selected symbols
        const filtered = searchResults.filter(
          (r) => !selectedSymbols.includes(r.symbol)
        );
        setResults(filtered.slice(0, 8));
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery, selectedSymbols]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSymbol = (symbol: string) => {
    if (selectedSymbols.length < maxSymbols) {
      onSymbolsChange([...selectedSymbols, symbol]);
    }
    setQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleRemoveSymbol = (symbol: string) => {
    onSymbolsChange(selectedSymbols.filter((s) => s !== symbol));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedSymbols.map((symbol) => (
          <Badge
            key={symbol}
            variant="secondary"
            className="text-sm py-1 px-3 gap-1"
          >
            {symbol}
            <button
              onClick={() => handleRemoveSymbol(symbol)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {selectedSymbols.length < maxSymbols && (
        <div ref={containerRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Hisse ekle..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="pl-9 pr-9"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showDropdown && results.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-background border rounded-md shadow-lg max-h-64 overflow-y-auto z-50">
              {results.map((result) => (
                <button
                  key={result.symbol}
                  onClick={() => handleSelectSymbol(result.symbol)}
                  className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between transition-colors"
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

      <p className="text-xs text-muted-foreground">
        {selectedSymbols.length}/{maxSymbols} hisse secildi
      </p>
    </div>
  );
}
