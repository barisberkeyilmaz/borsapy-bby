import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TemelAnalizClient } from "./temel-analiz-client";
import { StockInfo, Performance, SectorComparison } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getStockInfo(symbol: string): Promise<StockInfo | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stocks/${symbol}`, {
      next: { revalidate: 30 },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function getPerformance(symbol: string): Promise<Performance | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stocks/${symbol}/performance`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function getSectorComparison(symbol: string): Promise<SectorComparison | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/compare/sector/${symbol}`, {
      next: { revalidate: 300 }, // 5 minutes cache for sector data
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function TemelAnalizSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}

interface PageProps {
  params: Promise<{ symbol: string }>;
}

export default async function TemelAnalizDetailPage({ params }: PageProps) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  // Fetch initial data in parallel
  const [stock, performance, sectorComparison] = await Promise.all([
    getStockInfo(upperSymbol),
    getPerformance(upperSymbol),
    getSectorComparison(upperSymbol),
  ]);

  return (
    <Suspense fallback={<TemelAnalizSkeleton />}>
      <TemelAnalizClient
        symbol={upperSymbol}
        initialStock={stock}
        initialPerformance={performance}
        initialSectorComparison={sectorComparison}
      />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  return {
    title: `${upperSymbol} - Temel Analiz | BorsaPy`,
    description: `${upperSymbol} temel analiz, finansal metrikler ve sektor karsilastirmalari`,
  };
}
