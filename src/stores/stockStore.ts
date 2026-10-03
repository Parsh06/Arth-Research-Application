import { create } from 'zustand';
import { stockService, type LiveStockPrice } from '../services/stockService';

interface StockState {
  prices: Record<string, LiveStockPrice>;
  isLoading: boolean;
  lastUpdated: string | null;
  error: string | null;
  fetchPrices: (scripCodes?: string[], symbols?: string[]) => Promise<void>;
  getPrice: (identifier?: string) => LiveStockPrice | undefined;
}

export const useStockStore = create<StockState>((set, get) => ({
  prices: {},
  isLoading: false,
  lastUpdated: null,
  error: null,

  fetchPrices: async (scripCodes?: string[], symbols?: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const data = await stockService.getLatestPrices(scripCodes, symbols);
      set({
        prices: { ...get().prices, ...data },
        isLoading: false,
        lastUpdated: new Date().toISOString()
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Failed to load stock prices'
      });
    }
  },

  getPrice: (identifier?: string) => {
    if (!identifier) return undefined;
    const { prices } = get();
    // Lookup by exact scripCode or uppercase ticker symbol
    return prices[identifier] || prices[identifier.toUpperCase()];
  }
}));
