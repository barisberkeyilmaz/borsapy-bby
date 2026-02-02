import { useSyncExternalStore } from "react";
import { FilterCriteria } from "@/lib/api";

interface ScreenerState {
  selectedTemplate: string | null;
  filters: FilterCriteria[];
  sector: string | null;
  index: string | null;
  recommendation: string | null;
  savedFilters: { name: string; filters: FilterCriteria[] }[];
}

const STORAGE_KEY = "borsapy-screener";

class ScreenerStore {
  private state: ScreenerState = {
    selectedTemplate: null,
    filters: [],
    sector: null,
    index: null,
    recommendation: null,
    savedFilters: [],
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
        this.state = { ...this.state, savedFilters: data.savedFilters || [] };
      }
    } catch (e) {
      console.error("Failed to load screener:", e);
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedFilters: this.state.savedFilters }));
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  getState(): ScreenerState {
    return this.state;
  }

  getServerSnapshot(): ScreenerState {
    return {
      selectedTemplate: null,
      filters: [],
      sector: null,
      index: null,
      recommendation: null,
      savedFilters: [],
    };
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setTemplate(template: string | null) {
    this.state = {
      ...this.state,
      selectedTemplate: template,
      filters: [],
      sector: null,
      index: null,
      recommendation: null,
    };
    this.notify();
  }

  addFilter(filter: FilterCriteria) {
    this.state = {
      ...this.state,
      filters: [...this.state.filters, filter],
      selectedTemplate: null,
    };
    this.notify();
  }

  removeFilter(index: number) {
    this.state = {
      ...this.state,
      filters: this.state.filters.filter((_, i) => i !== index),
    };
    this.notify();
  }

  updateFilter(index: number, filter: FilterCriteria) {
    this.state = {
      ...this.state,
      filters: this.state.filters.map((f, i) => (i === index ? filter : f)),
    };
    this.notify();
  }

  clearFilters() {
    this.state = {
      ...this.state,
      filters: [],
      sector: null,
      index: null,
      recommendation: null,
      selectedTemplate: null,
    };
    this.notify();
  }

  setSector(sector: string | null) {
    this.state = { ...this.state, sector, selectedTemplate: null };
    this.notify();
  }

  setIndex(index: string | null) {
    this.state = { ...this.state, index, selectedTemplate: null };
    this.notify();
  }

  setRecommendation(recommendation: string | null) {
    this.state = { ...this.state, recommendation, selectedTemplate: null };
    this.notify();
  }

  saveFilters(name: string) {
    const newSavedFilters = [
      ...this.state.savedFilters.filter((s) => s.name !== name),
      { name, filters: this.state.filters },
    ];
    this.state = { ...this.state, savedFilters: newSavedFilters };
    this.saveToStorage();
    this.notify();
  }

  loadSavedFilters(name: string) {
    const saved = this.state.savedFilters.find((s) => s.name === name);
    if (saved) {
      this.state = { ...this.state, filters: saved.filters, selectedTemplate: null };
      this.notify();
    }
  }

  deleteSavedFilters(name: string) {
    this.state = {
      ...this.state,
      savedFilters: this.state.savedFilters.filter((s) => s.name !== name),
    };
    this.saveToStorage();
    this.notify();
  }
}

export const screenerStore = new ScreenerStore();

export function useScreenerStore() {
  const state = useSyncExternalStore(
    (callback) => screenerStore.subscribe(callback),
    () => screenerStore.getState(),
    () => screenerStore.getServerSnapshot()
  );

  return {
    ...state,
    setTemplate: screenerStore.setTemplate.bind(screenerStore),
    addFilter: screenerStore.addFilter.bind(screenerStore),
    removeFilter: screenerStore.removeFilter.bind(screenerStore),
    updateFilter: screenerStore.updateFilter.bind(screenerStore),
    clearFilters: screenerStore.clearFilters.bind(screenerStore),
    setSector: screenerStore.setSector.bind(screenerStore),
    setIndex: screenerStore.setIndex.bind(screenerStore),
    setRecommendation: screenerStore.setRecommendation.bind(screenerStore),
    saveFilters: screenerStore.saveFilters.bind(screenerStore),
    loadSavedFilters: screenerStore.loadSavedFilters.bind(screenerStore),
    deleteSavedFilters: screenerStore.deleteSavedFilters.bind(screenerStore),
  };
}
