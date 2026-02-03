import { useSyncExternalStore } from "react";

export type ChartType = "candlestick" | "line" | "area";

export type IndicatorType =
  | "sma"
  | "ema"
  | "rsi"
  | "macd"
  | "bollinger"
  | "stochastic"
  | "atr";

export interface ActiveIndicator {
  id: string;
  type: IndicatorType;
  params: Record<string, number>;
  pane: "overlay" | "separate";
  color: string;
  visible: boolean;
}

export interface ChartPreferences {
  chartType: ChartType;
  showVolume: boolean;
  showSupportResistance: boolean;
  showSignals: boolean;
  activeIndicators: ActiveIndicator[];
}

interface ChartState {
  preferences: ChartPreferences;
}

const DEFAULT_PREFERENCES: ChartPreferences = {
  chartType: "candlestick",
  showVolume: true,
  showSupportResistance: true,
  showSignals: true,
  activeIndicators: [],
};

const STORAGE_KEY = "borsapy-chart-preferences";

// Color palette for indicators
const OVERLAY_COLORS = ["#2196f3", "#ff9800", "#9c27b0", "#e91e63", "#00bcd4", "#4caf50"];
const SEPARATE_COLORS = ["#26a69a", "#ef5350", "#42a5f5", "#ab47bc"];

let colorIndex = { overlay: 0, separate: 0 };

function getNextColor(pane: "overlay" | "separate"): string {
  const colors = pane === "overlay" ? OVERLAY_COLORS : SEPARATE_COLORS;
  const color = colors[colorIndex[pane] % colors.length];
  colorIndex[pane]++;
  return color;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Cached server snapshot to avoid infinite loop warning
const SERVER_SNAPSHOT: ChartState = {
  preferences: { ...DEFAULT_PREFERENCES },
};

class ChartStore {
  private state: ChartState = {
    preferences: { ...DEFAULT_PREFERENCES },
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
          preferences: { ...DEFAULT_PREFERENCES, ...data },
        };
      }
    } catch (e) {
      console.error("Failed to load chart preferences:", e);
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.preferences));
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  getState(): ChartState {
    return this.state;
  }

  getServerSnapshot(): ChartState {
    return SERVER_SNAPSHOT;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setChartType(chartType: ChartType) {
    this.state = {
      ...this.state,
      preferences: { ...this.state.preferences, chartType },
    };
    this.saveToStorage();
    this.notify();
  }

  setShowVolume(showVolume: boolean) {
    this.state = {
      ...this.state,
      preferences: { ...this.state.preferences, showVolume },
    };
    this.saveToStorage();
    this.notify();
  }

  setShowSupportResistance(showSupportResistance: boolean) {
    this.state = {
      ...this.state,
      preferences: { ...this.state.preferences, showSupportResistance },
    };
    this.saveToStorage();
    this.notify();
  }

  setShowSignals(showSignals: boolean) {
    this.state = {
      ...this.state,
      preferences: { ...this.state.preferences, showSignals },
    };
    this.saveToStorage();
    this.notify();
  }

  addIndicator(
    type: IndicatorType,
    params: Record<string, number>,
    pane: "overlay" | "separate"
  ): string {
    const id = `${type}-${generateId()}`;
    const color = getNextColor(pane);

    const indicator: ActiveIndicator = {
      id,
      type,
      params,
      pane,
      color,
      visible: true,
    };

    this.state = {
      ...this.state,
      preferences: {
        ...this.state.preferences,
        activeIndicators: [...this.state.preferences.activeIndicators, indicator],
      },
    };
    this.saveToStorage();
    this.notify();
    return id;
  }

  removeIndicator(id: string) {
    this.state = {
      ...this.state,
      preferences: {
        ...this.state.preferences,
        activeIndicators: this.state.preferences.activeIndicators.filter(
          (ind) => ind.id !== id
        ),
      },
    };
    this.saveToStorage();
    this.notify();
  }

  toggleIndicatorVisibility(id: string) {
    this.state = {
      ...this.state,
      preferences: {
        ...this.state.preferences,
        activeIndicators: this.state.preferences.activeIndicators.map((ind) =>
          ind.id === id ? { ...ind, visible: !ind.visible } : ind
        ),
      },
    };
    this.saveToStorage();
    this.notify();
  }

  updateIndicatorParams(id: string, params: Record<string, number>) {
    this.state = {
      ...this.state,
      preferences: {
        ...this.state.preferences,
        activeIndicators: this.state.preferences.activeIndicators.map((ind) =>
          ind.id === id ? { ...ind, params: { ...ind.params, ...params } } : ind
        ),
      },
    };
    this.saveToStorage();
    this.notify();
  }

  updateIndicatorColor(id: string, color: string) {
    this.state = {
      ...this.state,
      preferences: {
        ...this.state.preferences,
        activeIndicators: this.state.preferences.activeIndicators.map((ind) =>
          ind.id === id ? { ...ind, color } : ind
        ),
      },
    };
    this.saveToStorage();
    this.notify();
  }

  clearAllIndicators() {
    colorIndex = { overlay: 0, separate: 0 };
    this.state = {
      ...this.state,
      preferences: {
        ...this.state.preferences,
        activeIndicators: [],
      },
    };
    this.saveToStorage();
    this.notify();
  }

  resetToDefaults() {
    colorIndex = { overlay: 0, separate: 0 };
    this.state = {
      preferences: { ...DEFAULT_PREFERENCES },
    };
    this.saveToStorage();
    this.notify();
  }
}

export const chartStore = new ChartStore();

export function useChartStore() {
  const state = useSyncExternalStore(
    (callback) => chartStore.subscribe(callback),
    () => chartStore.getState(),
    () => chartStore.getServerSnapshot()
  );

  return {
    ...state.preferences,
    setChartType: chartStore.setChartType.bind(chartStore),
    setShowVolume: chartStore.setShowVolume.bind(chartStore),
    setShowSupportResistance: chartStore.setShowSupportResistance.bind(chartStore),
    setShowSignals: chartStore.setShowSignals.bind(chartStore),
    addIndicator: chartStore.addIndicator.bind(chartStore),
    removeIndicator: chartStore.removeIndicator.bind(chartStore),
    toggleIndicatorVisibility: chartStore.toggleIndicatorVisibility.bind(chartStore),
    updateIndicatorParams: chartStore.updateIndicatorParams.bind(chartStore),
    updateIndicatorColor: chartStore.updateIndicatorColor.bind(chartStore),
    clearAllIndicators: chartStore.clearAllIndicators.bind(chartStore),
    resetToDefaults: chartStore.resetToDefaults.bind(chartStore),
  };
}
