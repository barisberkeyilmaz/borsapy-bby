import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FilterCriteria } from "@/lib/api";

interface ScreenerState {
  selectedTemplate: string | null;
  filters: FilterCriteria[];
  sector: string | null;
  index: string | null;
  recommendation: string | null;
  savedFilters: { name: string; filters: FilterCriteria[] }[];
  setTemplate: (template: string | null) => void;
  addFilter: (filter: FilterCriteria) => void;
  removeFilter: (index: number) => void;
  updateFilter: (index: number, filter: FilterCriteria) => void;
  clearFilters: () => void;
  setSector: (sector: string | null) => void;
  setIndex: (index: string | null) => void;
  setRecommendation: (recommendation: string | null) => void;
  saveFilters: (name: string) => void;
  loadSavedFilters: (name: string) => void;
  deleteSavedFilters: (name: string) => void;
}

export const useScreenerStore = create<ScreenerState>()(
  persist(
    (set, get) => ({
      selectedTemplate: null,
      filters: [],
      sector: null,
      index: null,
      recommendation: null,
      savedFilters: [],

      setTemplate: (template) => set({
        selectedTemplate: template,
        filters: [],
        sector: null,
        index: null,
        recommendation: null,
      }),

      addFilter: (filter) => set((state) => ({
        filters: [...state.filters, filter],
        selectedTemplate: null,
      })),

      removeFilter: (index) => set((state) => ({
        filters: state.filters.filter((_, i) => i !== index),
      })),

      updateFilter: (index, filter) => set((state) => ({
        filters: state.filters.map((f, i) => i === index ? filter : f),
      })),

      clearFilters: () => set({
        filters: [],
        sector: null,
        index: null,
        recommendation: null,
        selectedTemplate: null,
      }),

      setSector: (sector) => set({ sector, selectedTemplate: null }),
      setIndex: (index) => set({ index, selectedTemplate: null }),
      setRecommendation: (recommendation) => set({ recommendation, selectedTemplate: null }),

      saveFilters: (name) => set((state) => ({
        savedFilters: [
          ...state.savedFilters.filter((s) => s.name !== name),
          { name, filters: state.filters },
        ],
      })),

      loadSavedFilters: (name) => set((state) => {
        const saved = state.savedFilters.find((s) => s.name === name);
        return saved ? { filters: saved.filters, selectedTemplate: null } : {};
      }),

      deleteSavedFilters: (name) => set((state) => ({
        savedFilters: state.savedFilters.filter((s) => s.name !== name),
      })),
    }),
    {
      name: "borsapy-screener",
      partialize: (state) => ({ savedFilters: state.savedFilters }),
    }
  )
);
