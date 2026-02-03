"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LineChart, PieChart } from "lucide-react";

interface AnalysisNavProps {
  symbol: string;
}

export function AnalysisNav({ symbol }: AnalysisNavProps) {
  const pathname = usePathname();
  const isTeknik = pathname?.startsWith("/teknik-analiz") ?? false;
  const isTemel = pathname?.startsWith("/temel-analiz") ?? false;

  return (
    <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
      <Link
        href={`/teknik-analiz/${symbol}`}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
          isTeknik
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LineChart className="h-4 w-4" />
        Teknik Analiz
      </Link>
      <Link
        href={`/temel-analiz/${symbol}`}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
          isTemel
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <PieChart className="h-4 w-4" />
        Temel Analiz
      </Link>
    </div>
  );
}
