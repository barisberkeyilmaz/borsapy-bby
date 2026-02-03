"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { stocksApi, SearchResult } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, TrendingUp, ArrowRight } from "lucide-react";

interface SingleStockSelectorProps {
  title: string;
  description: string;
  targetPath: string;
}

const POPULAR_STOCKS = [
  { symbol: "THYAO", name: "Turk Hava Yollari" },
  { symbol: "GARAN", name: "Garanti BBVA" },
  { symbol: "ASELS", name: "Aselsan" },
  { symbol: "SISE", name: "Turkiye Sise ve Cam" },
  { symbol: "KCHOL", name: "Koc Holding" },
  { symbol: "EREGL", name: "Eregli Demir Celik" },
  { symbol: "AKBNK", name: "Akbank" },
  { symbol: "SAHOL", name: "Sabanci Holding" },
];

export function SingleStockSelector({
  title,
  description,
  targetPath,
}: SingleStockSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Search on debounced query change
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await stocksApi.search(debouncedQuery);
        setSearchResults(results.slice(0, 10));
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectStock = (symbol: string) => {
    setSearchQuery("");
    setShowDropdown(false);
    setNavigatingTo(symbol);
    startTransition(() => {
      router.push(`${targetPath}/${symbol}`);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
    if (e.key === "Enter" && searchResults.length > 0) {
      handleSelectStock(searchResults[0].symbol);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">{title}</h1>
        <p className="text-lg text-muted-foreground">{description}</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Hisse sembolü veya ismi ara..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                className="h-14 text-lg pl-12 pr-12"
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search Dropdown */}
            {showDropdown && (searchResults.length > 0 || (searchQuery.length >= 2 && !isSearching)) && (
              <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <button
                      key={result.symbol}
                      onClick={() => handleSelectStock(result.symbol)}
                      disabled={isPending}
                      className="w-full px-4 py-3 text-left hover:bg-muted flex items-center justify-between transition-colors disabled:opacity-50"
                    >
                      <div>
                        <span className="font-semibold">{result.symbol}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {result.name}
                        </span>
                      </div>
                      {navigatingTo === result.symbol ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-muted-foreground">
                    Sonuc bulunamadi
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Popular Stocks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Populer Hisseler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {POPULAR_STOCKS.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => handleSelectStock(stock.symbol)}
                disabled={isPending}
                className="p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-muted/50 transition-colors text-left disabled:opacity-50 relative"
              >
                {navigatingTo === stock.symbol && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
                <p className="font-semibold">{stock.symbol}</p>
                <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
