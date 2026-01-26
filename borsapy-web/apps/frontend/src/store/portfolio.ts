import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Holding {
  symbol: string;
  quantity: number;
  avgPrice: number;
  addedAt: string;
}

interface PortfolioState {
  holdings: Holding[];
  addHolding: (holding: Holding) => void;
  removeHolding: (symbol: string) => void;
  updateHolding: (symbol: string, updates: Partial<Omit<Holding, "symbol">>) => void;
  clearPortfolio: () => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      holdings: [],

      addHolding: (holding) => set((state) => {
        const existing = state.holdings.find((h) => h.symbol === holding.symbol);
        if (existing) {
          // Calculate new average price
          const totalCost = existing.avgPrice * existing.quantity + holding.avgPrice * holding.quantity;
          const totalQuantity = existing.quantity + holding.quantity;
          return {
            holdings: state.holdings.map((h) =>
              h.symbol === holding.symbol
                ? {
                    ...h,
                    quantity: totalQuantity,
                    avgPrice: totalCost / totalQuantity,
                  }
                : h
            ),
          };
        }
        return {
          holdings: [...state.holdings, holding],
        };
      }),

      removeHolding: (symbol) => set((state) => ({
        holdings: state.holdings.filter((h) => h.symbol !== symbol),
      })),

      updateHolding: (symbol, updates) => set((state) => ({
        holdings: state.holdings.map((h) =>
          h.symbol === symbol ? { ...h, ...updates } : h
        ),
      })),

      clearPortfolio: () => set({ holdings: [] }),
    }),
    {
      name: "borsapy-portfolio",
    }
  )
);
