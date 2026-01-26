"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { stocksApi, SearchResult } from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  Search,
  Briefcase,
  TrendingUp,
  Activity,
  LayoutGrid,
  X,
  Loader2,
} from "lucide-react";

const navigation = [
  { name: "Screener", href: "/screener", icon: Search },
  { name: "Portfolio", href: "/portfolio", icon: Briefcase },
  { name: "Scanner", href: "/scanner", icon: Activity },
  { name: "Backtest", href: "/backtest", icon: TrendingUp },
  { name: "Indices", href: "/indices", icon: LayoutGrid },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
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
        setSearchResults(results.slice(0, 10)); // Limit to 10 results
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

  const handleSelectResult = (symbol: string) => {
    setSearchQuery("");
    setShowDropdown(false);
    router.push(`/stock/${symbol}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">borsapy</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 transition-colors hover:text-foreground/80",
                    isActive ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Search */}
        <div className="ml-auto relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Hisse ara..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              className="w-64 pl-9 pr-9 h-9"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
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
          {showDropdown && (searchResults.length > 0 || (searchQuery.length >= 2 && !isSearching)) && (
            <div className="absolute top-full mt-1 w-full bg-background border rounded-md shadow-lg max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    onClick={() => handleSelectResult(result.symbol)}
                    className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between transition-colors"
                  >
                    <span className="font-medium">{result.symbol}</span>
                    <span className="text-sm text-muted-foreground truncate ml-2 max-w-[180px]">
                      {result.name}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                  Sonuç bulunamadı
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
