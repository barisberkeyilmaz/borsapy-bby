"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Play, Save, Trash2, FolderOpen } from "lucide-react";
import { useScannerStore } from "@/store/scanner";
import { useIndicators } from "@/hooks/useScanner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const OPERATORS = [
  { value: "<", label: "< (küçük)" },
  { value: ">", label: "> (büyük)" },
  { value: "<=", label: "<= (küçük eşit)" },
  { value: ">=", label: ">= (büyük eşit)" },
];

const COMPARISON_FIELDS = [
  { value: "", label: "Değer girin" },
  { value: "close", label: "Kapanış" },
  { value: "sma_20", label: "SMA 20" },
  { value: "sma_50", label: "SMA 50" },
  { value: "sma_200", label: "SMA 200" },
  { value: "ema_20", label: "EMA 20" },
  { value: "ema_50", label: "EMA 50" },
  { value: "signal", label: "MACD Sinyal" },
  { value: "bb_upper", label: "BB Üst" },
  { value: "bb_lower", label: "BB Alt" },
];

interface ConditionBuilderProps {
  className?: string;
  onRunScan?: () => void;
  isScanning?: boolean;
}

export function ConditionBuilder({ className, onRunScan, isScanning }: ConditionBuilderProps) {
  const { data: indicatorCategories } = useIndicators();
  const {
    conditions,
    addCondition,
    removeCondition,
    clearConditions,
    savedScans,
    saveScan,
    loadScan,
    deleteScan,
    universe,
    interval,
    setConditions,
    setUniverse,
    setInterval,
  } = useScannerStore();

  const [leftField, setLeftField] = useState("");
  const [operator, setOperator] = useState("<");
  const [rightType, setRightType] = useState<"value" | "field">("value");
  const [rightValue, setRightValue] = useState("");
  const [rightField, setRightField] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savedScansOpen, setSavedScansOpen] = useState(false);
  const [newScanName, setNewScanName] = useState("");

  // Flatten indicator options
  const indicatorOptions =
    indicatorCategories?.flatMap((cat) =>
      cat.indicators.map((ind) => ({
        value: ind.id,
        label: `${ind.name}`,
      }))
    ) || [];

  const handleAddCondition = () => {
    if (!leftField) return;

    let condition = "";
    if (rightType === "value" && rightValue) {
      // Handle volume suffixes (M, K)
      let value = rightValue;
      if (leftField === "volume" || leftField === "market_cap") {
        // Keep M, K suffixes
        condition = `${leftField} ${operator} ${value}`;
      } else {
        condition = `${leftField} ${operator} ${value}`;
      }
    } else if (rightType === "field" && rightField) {
      condition = `${leftField} ${operator} ${rightField}`;
    }

    if (condition) {
      addCondition(condition);
      // Reset form
      setLeftField("");
      setRightValue("");
      setRightField("");
    }
  };

  const formatCondition = (condition: string): string => {
    // Make conditions more readable
    return condition
      .replace("rsi", "RSI")
      .replace("macd", "MACD")
      .replace("signal", "Sinyal")
      .replace("close", "Kapanış")
      .replace("volume", "Hacim")
      .replace("sma_", "SMA")
      .replace("ema_", "EMA")
      .replace("stoch_k", "Stoch K")
      .replace("stoch_d", "Stoch D")
      .replace("bb_upper", "BB Üst")
      .replace("bb_lower", "BB Alt")
      .replace("change_percent", "Değişim %");
  };

  const handleSaveScan = () => {
    if (!newScanName.trim() || conditions.length === 0) return;
    saveScan(newScanName.trim());
    setNewScanName("");
    setSaveDialogOpen(false);
  };

  const handleLoadScan = (name: string) => {
    loadScan(name);
    setSavedScansOpen(false);
  };

  const handleDeleteScan = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteScan(name);
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Koşullar</CardTitle>
          <div className="flex items-center gap-1">
            {/* Saved Scans Button */}
            <Dialog open={savedScansOpen} onOpenChange={setSavedScansOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  title="Kayıtlı Taramalar"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Kayıtlı Taramalar</DialogTitle>
                </DialogHeader>
                {savedScans.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Henüz kayıtlı tarama yok
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {savedScans.map((scan) => (
                      <div
                        key={scan.name}
                        onClick={() => handleLoadScan(scan.name)}
                        className="flex items-center justify-between p-3 rounded-md border hover:bg-muted cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">{scan.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {scan.conditions.length} koşul • {scan.universe} • {scan.interval}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteScan(scan.name, e)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Save Button */}
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  disabled={conditions.length === 0}
                  title="Taramayı Kaydet"
                >
                  <Save className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Taramayı Kaydet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tarama Adı</label>
                    <Input
                      value={newScanName}
                      onChange={(e) => setNewScanName(e.target.value)}
                      placeholder="örn: RSI Aşırı Satım"
                      onKeyDown={(e) => e.key === "Enter" && handleSaveScan()}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>Koşullar ({conditions.length}):</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {conditions.map((c) => (
                        <Badge key={c.id} variant="outline" className="text-xs font-mono">
                          {c.condition}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-2">Evren: {universe} • Zaman: {interval}</p>
                  </div>
                  <Button
                    onClick={handleSaveScan}
                    disabled={!newScanName.trim()}
                    className="w-full"
                  >
                    Kaydet
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {conditions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConditions}
                className="h-6 px-2 text-xs"
              >
                Temizle
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active conditions */}
        {conditions.length > 0 && (
          <div className="space-y-2">
            {conditions.map((cond, idx) => (
              <div
                key={cond.id}
                className="flex items-center gap-2 p-2 bg-muted rounded-md"
              >
                {idx > 0 && (
                  <Badge variant="outline" className="text-xs">
                    VE
                  </Badge>
                )}
                <span className="text-sm flex-1 font-mono">
                  {formatCondition(cond.condition)}
                </span>
                <button
                  onClick={() => removeCondition(cond.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add condition form */}
        <div className="space-y-3 pt-2 border-t">
          <label className="text-xs text-muted-foreground">Koşul Ekle</label>

          {/* Left field (indicator) */}
          <Select
            value={leftField}
            onChange={(e) => setLeftField(e.target.value)}
            options={indicatorOptions}
            placeholder="Gösterge seçin"
          />

          {/* Operator */}
          <Select
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            options={OPERATORS}
          />

          {/* Right side type toggle */}
          <div className="flex gap-2">
            <Button
              variant={rightType === "value" ? "default" : "outline"}
              size="sm"
              onClick={() => setRightType("value")}
              className="flex-1"
            >
              Değer
            </Button>
            <Button
              variant={rightType === "field" ? "default" : "outline"}
              size="sm"
              onClick={() => setRightType("field")}
              className="flex-1"
            >
              Gösterge
            </Button>
          </div>

          {/* Right value/field */}
          {rightType === "value" ? (
            <Input
              type="text"
              placeholder={leftField === "volume" ? "örn: 1M, 500K" : "Değer girin"}
              value={rightValue}
              onChange={(e) => setRightValue(e.target.value)}
            />
          ) : (
            <Select
              value={rightField}
              onChange={(e) => setRightField(e.target.value)}
              options={COMPARISON_FIELDS.filter((f) => f.value !== leftField)}
              placeholder="Karşılaştırma alanı"
            />
          )}

          <Button
            onClick={handleAddCondition}
            disabled={!leftField || (rightType === "value" ? !rightValue : !rightField)}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Koşul Ekle
          </Button>
        </div>

        {/* Scan Button */}
        {onRunScan && (
          <div className="pt-4 border-t">
            <Button
              onClick={onRunScan}
              disabled={conditions.length === 0 || isScanning}
              className="w-full"
            >
              {isScanning ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Taranıyor...
                </span>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Tara
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
