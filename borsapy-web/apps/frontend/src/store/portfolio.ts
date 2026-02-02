export interface Holding {
  symbol: string;
  quantity: number;
  avgPrice: number;
  addedAt: string;
}

interface PortfolioState {
  holdings: Holding[];
}

const STORAGE_KEY = "borsapy-portfolio";

// Simple event-based store that doesn't use React context
class PortfolioStore {
  private state: PortfolioState = { holdings: [] };
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Only load from storage on client
    if (typeof window !== "undefined") {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.state = { holdings: data.holdings || [] };
      }
    } catch (e) {
      console.error("Failed to load portfolio:", e);
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

  getState(): PortfolioState {
    return this.state;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  addHolding(holding: Holding) {
    const existing = this.state.holdings.find((h) => h.symbol === holding.symbol);
    if (existing) {
      const totalCost = existing.avgPrice * existing.quantity + holding.avgPrice * holding.quantity;
      const totalQuantity = existing.quantity + holding.quantity;
      this.state = {
        holdings: this.state.holdings.map((h) =>
          h.symbol === holding.symbol
            ? { ...h, quantity: totalQuantity, avgPrice: totalCost / totalQuantity }
            : h
        ),
      };
    } else {
      this.state = { holdings: [...this.state.holdings, holding] };
    }
    this.saveToStorage();
    this.notify();
  }

  removeHolding(symbol: string) {
    this.state = { holdings: this.state.holdings.filter((h) => h.symbol !== symbol) };
    this.saveToStorage();
    this.notify();
  }

  updateHolding(symbol: string, updates: Partial<Omit<Holding, "symbol">>) {
    this.state = {
      holdings: this.state.holdings.map((h) =>
        h.symbol === symbol ? { ...h, ...updates } : h
      ),
    };
    this.saveToStorage();
    this.notify();
  }

  clearPortfolio() {
    this.state = { holdings: [] };
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.notify();
  }
}

export const portfolioStore = new PortfolioStore();

// React hook that subscribes to the store
import { useSyncExternalStore } from "react";

export function usePortfolioStore() {
  const state = useSyncExternalStore(
    (callback) => portfolioStore.subscribe(callback),
    () => portfolioStore.getState(),
    () => ({ holdings: [] }) // Server snapshot - empty state
  );

  return {
    holdings: state.holdings,
    addHolding: portfolioStore.addHolding.bind(portfolioStore),
    removeHolding: portfolioStore.removeHolding.bind(portfolioStore),
    updateHolding: portfolioStore.updateHolding.bind(portfolioStore),
    clearPortfolio: portfolioStore.clearPortfolio.bind(portfolioStore),
  };
}
