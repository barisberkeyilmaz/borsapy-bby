"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h1 className="text-4xl font-bold">Bir hata olustu</h1>
      <p className="text-muted-foreground">
        Beklenmeyen bir hata meydana geldi.
      </p>
      <Button onClick={() => reset()}>Tekrar dene</Button>
    </div>
  );
}
