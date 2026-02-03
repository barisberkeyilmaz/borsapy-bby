"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function IndicesRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefresh = () => {
    setIsSpinning(true);
    startTransition(() => {
      router.refresh();
    });
    // Keep spinning for at least 500ms for visual feedback
    setTimeout(() => setIsSpinning(false), 500);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isPending}
    >
      <RefreshCw className={cn("h-4 w-4 mr-2", (isPending || isSpinning) && "animate-spin")} />
      Yenile
    </Button>
  );
}
