import { useSyncExternalStore } from "react";

export interface TradingSettings {
  totalCapital: number;           // Toplam sermaye (TL)
  defaultRiskPercent: number;     // Islem basi risk % (varsayilan: 2)
  maxPositionPercent: number;     // Tek hisse max % (varsayilan: 10)
  defaultStopLossATR: number;     // ATR carpani (varsayilan: 2)
  defaultTakeProfitATR: number;   // ATR carpani (varsayilan: 3)
}

interface SettingsState {
  trading: TradingSettings;
}

const DEFAULT_TRADING_SETTINGS: TradingSettings = {
  totalCapital: 100000,
  defaultRiskPercent: 2,
  maxPositionPercent: 10,
  defaultStopLossATR: 2,
  defaultTakeProfitATR: 3,
};

const STORAGE_KEY = "borsapy-settings";

class SettingsStore {
  private state: SettingsState = {
    trading: { ...DEFAULT_TRADING_SETTINGS },
  };
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.state = {
          trading: { ...DEFAULT_TRADING_SETTINGS, ...data.trading },
        };
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  getState(): SettingsState {
    return this.state;
  }

  getServerSnapshot(): SettingsState {
    return {
      trading: { ...DEFAULT_TRADING_SETTINGS },
    };
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setTradingSettings(settings: Partial<TradingSettings>) {
    this.state = {
      ...this.state,
      trading: { ...this.state.trading, ...settings },
    };
    this.saveToStorage();
    this.notify();
  }

  setTotalCapital(value: number) {
    this.setTradingSettings({ totalCapital: value });
  }

  setDefaultRiskPercent(value: number) {
    this.setTradingSettings({ defaultRiskPercent: value });
  }

  setMaxPositionPercent(value: number) {
    this.setTradingSettings({ maxPositionPercent: value });
  }

  setDefaultStopLossATR(value: number) {
    this.setTradingSettings({ defaultStopLossATR: value });
  }

  setDefaultTakeProfitATR(value: number) {
    this.setTradingSettings({ defaultTakeProfitATR: value });
  }

  resetToDefaults() {
    this.state = {
      trading: { ...DEFAULT_TRADING_SETTINGS },
    };
    this.saveToStorage();
    this.notify();
  }
}

export const settingsStore = new SettingsStore();

export function useSettingsStore() {
  const state = useSyncExternalStore(
    (callback) => settingsStore.subscribe(callback),
    () => settingsStore.getState(),
    () => settingsStore.getServerSnapshot()
  );

  return {
    ...state.trading,
    setTradingSettings: settingsStore.setTradingSettings.bind(settingsStore),
    setTotalCapital: settingsStore.setTotalCapital.bind(settingsStore),
    setDefaultRiskPercent: settingsStore.setDefaultRiskPercent.bind(settingsStore),
    setMaxPositionPercent: settingsStore.setMaxPositionPercent.bind(settingsStore),
    setDefaultStopLossATR: settingsStore.setDefaultStopLossATR.bind(settingsStore),
    setDefaultTakeProfitATR: settingsStore.setDefaultTakeProfitATR.bind(settingsStore),
    resetToDefaults: settingsStore.resetToDefaults.bind(settingsStore),
  };
}
