export const dynamic = "force-dynamic";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Sayfa bulunamadı</p>
      <Link
        href="/"
        className="text-primary hover:underline"
      >
        Ana sayfaya dön
      </Link>
    </div>
  );
}
