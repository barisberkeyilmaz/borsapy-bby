"use client";

import { Providers } from "./providers";
import { Header } from "@/components/layout/header";

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">{children}</main>
      </div>
    </Providers>
  );
}
