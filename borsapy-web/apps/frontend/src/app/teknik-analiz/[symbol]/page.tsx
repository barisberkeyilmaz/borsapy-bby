import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TeknikAnalizClient } from "./teknik-analiz-client";
import { StockInfo, TechnicalAnalysis, StockHistory, SwingSignals, AnalysisSummary } from "@/lib/api";

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

async function getTechnicals(symbol: string): Promise<TechnicalAnalysis | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stocks/${symbol}/technicals`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function getHistory(symbol: string, period = "6mo", interval = "1d"): Promise<StockHistory[] | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/stocks/${symbol}/history?period=${period}&interval=${interval}`,
      { next: { revalidate: 60 } }
    );
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function getSwingSignals(symbol: string, period = "6mo"): Promise<SwingSignals | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/trading/${symbol}/swing-signals?period=${period}`,
      { next: { revalidate: 60 } }
    );
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function getAnalysisSummary(symbol: string, period = "6mo"): Promise<AnalysisSummary | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/trading/${symbol}/analysis-summary?period=${period}`,
      { next: { revalidate: 60 } }
    );
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function TeknikAnalizSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}

interface PageProps {
  params: Promise<{ symbol: string }>;
}

export default async function TeknikAnalizDetailPage({ params }: PageProps) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  // Fetch initial data in parallel
  const [stock, technicals, history, swingSignals, analysisSummary] = await Promise.all([
    getStockInfo(upperSymbol),
    getTechnicals(upperSymbol),
    getHistory(upperSymbol, "6mo", "1d"),
    getSwingSignals(upperSymbol, "6mo"),
    getAnalysisSummary(upperSymbol, "6mo"),
  ]);

  return (
    <Suspense fallback={<TeknikAnalizSkeleton />}>
      <TeknikAnalizClient
        symbol={upperSymbol}
        initialStock={stock}
        initialTechnicals={technicals}
        initialHistory={history}
        initialSwingSignals={swingSignals}
        initialAnalysisSummary={analysisSummary}
      />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  return {
    title: `${upperSymbol} - Teknik Analiz | BorsaPy`,
    description: `${upperSymbol} teknik analiz, grafik ve teknik gostergeler`,
  };
}
