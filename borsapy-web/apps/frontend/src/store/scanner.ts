import { useSyncExternalStore } from "react";

export interface ScanCondition {
  id: string;
  condition: string;
  name?: string;
}

export interface SavedScan {
  name: string;
  conditions: ScanCondition[];
  universe: string;
  interval: string;
}

interface ScannerState {
  conditions: ScanCondition[];
  universe: string;
  interval: string;
  savedScans: SavedScan[];
}

const STORAGE_KEY = "borsapy-scanner";
let conditionIdCounter = 0;

class ScannerStore {
  private state: ScannerState = {
    conditions: [],
    universe: "XU100",
    interval: "1d",
    savedScans: [],
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
        this.state = { ...this.state, savedScans: data.savedScans || [] };
      }
    } catch (e) {
      console.error("Failed to load scanner:", e);
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedScans: this.state.savedScans }));
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  getState(): ScannerState {
    return this.state;
  }

  getServerSnapshot(): ScannerState {
    return {
      conditions: [],
      universe: "XU100",
      interval: "1d",
      savedScans: [],
    };
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  addCondition(condition: string, name?: string) {
    this.state = {
      ...this.state,
      conditions: [
        ...this.state.conditions,
        { id: `cond-${++conditionIdCounter}`, condition, name },
      ],
    };
    this.notify();
  }

  removeCondition(id: string) {
    this.state = {
      ...this.state,
      conditions: this.state.conditions.filter((c) => c.id !== id),
    };
    this.notify();
  }

  updateCondition(id: string, condition: string) {
    this.state = {
      ...this.state,
      conditions: this.state.conditions.map((c) =>
        c.id === id ? { ...c, condition } : c
      ),
    };
    this.notify();
  }

  clearConditions() {
    this.state = { ...this.state, conditions: [] };
    this.notify();
  }

  setConditions(conditions: ScanCondition[]) {
    this.state = { ...this.state, conditions };
    this.notify();
  }

  setUniverse(universe: string) {
    this.state = { ...this.state, universe };
    this.notify();
  }

  setInterval(interval: string) {
    this.state = { ...this.state, interval };
    this.notify();
  }

  saveScan(name: string) {
    const newSavedScans = [
      ...this.state.savedScans.filter((s) => s.name !== name),
      {
        name,
        conditions: this.state.conditions,
        universe: this.state.universe,
        interval: this.state.interval,
      },
    ];
    this.state = { ...this.state, savedScans: newSavedScans };
    this.saveToStorage();
    this.notify();
  }

  loadScan(name: string) {
    const saved = this.state.savedScans.find((s) => s.name === name);
    if (saved) {
      this.state = {
        ...this.state,
        conditions: saved.conditions,
        universe: saved.universe,
        interval: saved.interval,
      };
      this.notify();
    }
  }

  deleteScan(name: string) {
    this.state = {
      ...this.state,
      savedScans: this.state.savedScans.filter((s) => s.name !== name),
    };
    this.saveToStorage();
    this.notify();
  }
}

export const scannerStore = new ScannerStore();

export function useScannerStore() {
  const state = useSyncExternalStore(
    (callback) => scannerStore.subscribe(callback),
    () => scannerStore.getState(),
    () => scannerStore.getServerSnapshot()
  );

  return {
    ...state,
    addCondition: scannerStore.addCondition.bind(scannerStore),
    removeCondition: scannerStore.removeCondition.bind(scannerStore),
    updateCondition: scannerStore.updateCondition.bind(scannerStore),
    clearConditions: scannerStore.clearConditions.bind(scannerStore),
    setConditions: scannerStore.setConditions.bind(scannerStore),
    setUniverse: scannerStore.setUniverse.bind(scannerStore),
    setInterval: scannerStore.setInterval.bind(scannerStore),
    saveScan: scannerStore.saveScan.bind(scannerStore),
    loadScan: scannerStore.loadScan.bind(scannerStore),
    deleteScan: scannerStore.deleteScan.bind(scannerStore),
  };
}
