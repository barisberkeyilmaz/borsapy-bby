import { create } from "zustand";
import { persist } from "zustand/middleware";

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

  // Actions
  addCondition: (condition: string, name?: string) => void;
  removeCondition: (id: string) => void;
  updateCondition: (id: string, condition: string) => void;
  clearConditions: () => void;
  setConditions: (conditions: ScanCondition[]) => void;
  setUniverse: (universe: string) => void;
  setInterval: (interval: string) => void;

  // Saved scans
  saveScan: (name: string) => void;
  loadScan: (name: string) => void;
  deleteScan: (name: string) => void;
}

let conditionIdCounter = 0;

export const useScannerStore = create<ScannerState>()(
  persist(
    (set, get) => ({
      conditions: [],
      universe: "XU100",
      interval: "1d",
      savedScans: [],

      addCondition: (condition, name) =>
        set((state) => ({
          conditions: [
            ...state.conditions,
            { id: `cond-${++conditionIdCounter}`, condition, name },
          ],
        })),

      removeCondition: (id) =>
        set((state) => ({
          conditions: state.conditions.filter((c) => c.id !== id),
        })),

      updateCondition: (id, condition) =>
        set((state) => ({
          conditions: state.conditions.map((c) =>
            c.id === id ? { ...c, condition } : c
          ),
        })),

      clearConditions: () => set({ conditions: [] }),

      setConditions: (conditions) => set({ conditions }),

      setUniverse: (universe) => set({ universe }),

      setInterval: (interval) => set({ interval }),

      saveScan: (name) =>
        set((state) => ({
          savedScans: [
            ...state.savedScans.filter((s) => s.name !== name),
            {
              name,
              conditions: state.conditions,
              universe: state.universe,
              interval: state.interval,
            },
          ],
        })),

      loadScan: (name) =>
        set((state) => {
          const saved = state.savedScans.find((s) => s.name === name);
          if (saved) {
            return {
              conditions: saved.conditions,
              universe: saved.universe,
              interval: saved.interval,
            };
          }
          return {};
        }),

      deleteScan: (name) =>
        set((state) => ({
          savedScans: state.savedScans.filter((s) => s.name !== name),
        })),
    }),
    {
      name: "borsapy-scanner",
      partialize: (state) => ({ savedScans: state.savedScans }),
    }
  )
);
