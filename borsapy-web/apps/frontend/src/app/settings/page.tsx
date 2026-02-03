"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/settings";
import { formatNumber } from "@/lib/utils";
import {
  Settings,
  Wallet,
  Target,
  ShieldAlert,
  RotateCcw,
  Percent,
} from "lucide-react";

export default function SettingsPage() {
  const {
    totalCapital,
    defaultRiskPercent,
    maxPositionPercent,
    defaultStopLossATR,
    defaultTakeProfitATR,
    setTotalCapital,
    setDefaultRiskPercent,
    setMaxPositionPercent,
    setDefaultStopLossATR,
    setDefaultTakeProfitATR,
    resetToDefaults,
  } = useSettingsStore();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Ayarlar
        </h1>
        <p className="text-muted-foreground">
          Trading ayarlarinizi yapilandirin
        </p>
      </div>

      {/* Capital Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Sermaye Ayarlari
          </CardTitle>
          <CardDescription>
            Toplam sermayenizi ve pozisyon limitlerini belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Toplam Sermaye (TL)</label>
            <Input
              type="number"
              step="1000"
              min="0"
              value={totalCapital}
              onChange={(e) => setTotalCapital(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Trading islemlerinde kullanacaginiz toplam sermaye
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-3 w-3" />
              Maksimum Pozisyon Orani (%)
            </label>
            <div className="flex items-center gap-4">
              <Input
                type="range"
                min="5"
                max="50"
                step="5"
                value={maxPositionPercent}
                onChange={(e) => setMaxPositionPercent(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-mono w-12 text-right">
                {maxPositionPercent}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Tek bir hisseye ayrilabilecek maksimum sermaye orani
              <br />
              <span className="text-muted-foreground/70">
                (Simdi: max {formatNumber((totalCapital * maxPositionPercent) / 100, 0)} TL)
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Risk Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Risk Yonetimi
          </CardTitle>
          <CardDescription>
            Varsayilan risk parametrelerini ayarlayin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Islem Basi Risk (%)</label>
            <div className="flex items-center gap-4">
              <Input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={defaultRiskPercent}
                onChange={(e) => setDefaultRiskPercent(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-mono w-12 text-right">
                {defaultRiskPercent}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Her islemde risk edilecek maksimum sermaye orani
              <br />
              <span className="text-muted-foreground/70">
                (Simdi: max {formatNumber((totalCapital * defaultRiskPercent) / 100, 0)} TL)
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <ShieldAlert className="h-3 w-3 text-red-500" />
                Stop-Loss ATR Carpani
              </label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="5"
                value={defaultStopLossATR}
                onChange={(e) => setDefaultStopLossATR(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Giris fiyatindan ATR x bu deger
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Target className="h-3 w-3 text-green-500" />
                Take-Profit ATR Carpani
              </label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="10"
                value={defaultTakeProfitATR}
                onChange={(e) => setDefaultTakeProfitATR(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Giris fiyatindan ATR x bu deger
              </p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Risk/Odul Orani: 1:{formatNumber(defaultTakeProfitATR / defaultStopLossATR, 1)}</p>
            <p>
              Stop-loss {defaultStopLossATR} ATR, Take-profit {defaultTakeProfitATR} ATR ile
              her basarili islemde kaybin {formatNumber(defaultTakeProfitATR / defaultStopLossATR, 1)} kati kar elde edilir.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={resetToDefaults}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Varsayilanlara Sifirla
        </Button>
      </div>
    </div>
  );
}
