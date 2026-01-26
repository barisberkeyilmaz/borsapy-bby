"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

const SCAN_TYPES = [
  { id: "rsi_oversold", name: "RSI Aşırı Satım", description: "RSI < 30 olan hisseler" },
  { id: "rsi_overbought", name: "RSI Aşırı Alım", description: "RSI > 70 olan hisseler" },
  { id: "macd_bullish", name: "MACD Boğa Kesişimi", description: "MACD sinyal çizgisini yukarı kesiyor" },
  { id: "macd_bearish", name: "MACD Ayı Kesişimi", description: "MACD sinyal çizgisini aşağı kesiyor" },
  { id: "golden_cross", name: "Altın Kesişim", description: "50 günlük SMA, 200 günlük SMA'yı yukarı kesiyor" },
  { id: "death_cross", name: "Ölüm Kesişimi", description: "50 günlük SMA, 200 günlük SMA'yı aşağı kesiyor" },
  { id: "volume_spike", name: "Hacim Artışı", description: "Ortalama hacmin 2x üzerinde" },
  { id: "new_high", name: "Yeni Zirve", description: "52 haftalık yeni zirve yapan hisseler" },
];

export default function ScannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Teknik Tarama</h1>
        <p className="text-muted-foreground">
          Teknik indikatörlere göre hisse taraması
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SCAN_TYPES.map((scan) => (
          <Card key={scan.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{scan.name}</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{scan.description}</p>
              <Badge variant="outline" className="mt-2">Yakında</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Teknik tarama özelliği Faz 4&apos;te eklenecektir.</p>
      </div>
    </div>
  );
}
