// src/stores/portfolioStore.ts
import { create } from 'zustand';
import { portfolioRepository, type CreatePortfolioSubmissionParams } from '../repositories/portfolioRepository';
import { valuationService, type PortfolioValuation, type PriceMetric } from '../services/valuationService';
import type { Portfolio, PortfolioHolding } from '../schemas/portfolio.schema';
import { useStockStore } from './stockStore';
import type { Unsubscribe } from 'firebase/firestore';

interface PortfolioState {
  userPortfolio: Portfolio | null;
  userPortfolios: Portfolio[];
  activePortfolioId: string | null;
  holdings: PortfolioHolding[];
  valuation: PortfolioValuation | null;
  allPortfolios: Portfolio[];
  isLoading: boolean;
  
  initPortfolioListener: (userId: string) => void;
  setActivePortfolioId: (portfolioId: string) => void;
  refreshValuationWithLivePrices: () => Promise<void>;
  unsubscribePortfolio: () => void;
  fetchAllPortfolios: () => Promise<void>;
  submitPortfolio: (params: CreatePortfolioSubmissionParams) => Promise<string>;
  createPortfolio: (data: Omit<Portfolio, 'id'>) => Promise<string>;
  updatePortfolio: (id: string, updates: Partial<Portfolio>) => Promise<void>;
}

let unsubscribePorts: Unsubscribe | null = null;
let unsubscribeHold: Unsubscribe | null = null;

async function evaluateHoldings(holdings: PortfolioHolding[]): Promise<PortfolioValuation> {
  const scripCodes = holdings.map(h => h.scripCode).filter(Boolean) as string[];
  const symbols = holdings.map(h => h.symbol).filter(Boolean);

  try {
    // Attempt live price fetch
    await useStockStore.getState().fetchPrices(scripCodes, symbols);
  } catch (e) {
    console.warn('[PortfolioStore] Live price update warning:', e);
  }

  const currentPrices = useStockStore.getState().prices;
  const priceMap: Record<string, PriceMetric> = {};

  for (const [key, p] of Object.entries(currentPrices)) {
    priceMap[key] = {
      ltpMinor: p.ltpPaise || Math.round((p.ltp || 0) * 100),
      changeMinor: Math.round((p.change || 0) * 100),
      percentChange: p.percentChange || 0
    };
  }

  return valuationService.evaluatePortfolio(holdings, priceMap);
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  userPortfolio: null,
  userPortfolios: [],
  activePortfolioId: null,
  holdings: [],
  valuation: null,
  allPortfolios: [],
  isLoading: false,

  setActivePortfolioId: async (portfolioId: string) => {
    const { userPortfolios } = get();
    const selected = userPortfolios.find(p => p.id === portfolioId) || null;
    set({ activePortfolioId: portfolioId, userPortfolio: selected });

    if (unsubscribeHold) unsubscribeHold();
    if (selected) {
      unsubscribeHold = portfolioRepository.subscribeToHoldings(selected.id, async (holdings) => {
        const valuation = await evaluateHoldings(holdings);
        set({ holdings, valuation });
      });
    } else {
      set({ holdings: [], valuation: null });
    }
  },

  refreshValuationWithLivePrices: async () => {
    const { holdings } = get();
    if (holdings.length > 0) {
      const valuation = await evaluateHoldings(holdings);
      set({ valuation });
    }
  },

  initPortfolioListener: (userId: string) => {
    set({ isLoading: true });
    
    // Cleanup existing listeners if any
    if (unsubscribePorts) unsubscribePorts();
    if (unsubscribeHold) unsubscribeHold();

    unsubscribePorts = portfolioRepository.subscribeToUserPortfolios(userId, (portfolios) => {
      const currentActiveId = get().activePortfolioId;
      
      if (portfolios && portfolios.length > 0) {
        // Prioritize previously selected, or first active portfolio, or first in list
        let active = portfolios.find(p => p.id === currentActiveId);
        if (!active) {
          active = portfolios.find(p => p.status === 'active') || portfolios[0];
        }

        set({
          userPortfolios: portfolios,
          userPortfolio: active,
          activePortfolioId: active.id,
          isLoading: false
        });
        
        // Listen to holdings subcollection for the active portfolio
        if (unsubscribeHold) unsubscribeHold();
        unsubscribeHold = portfolioRepository.subscribeToHoldings(active.id, async (holdings) => {
          const valuation = await evaluateHoldings(holdings);
          set({ holdings, valuation });
        });
      } else {
        set({
          userPortfolios: [],
          userPortfolio: null,
          activePortfolioId: null,
          holdings: [],
          valuation: null,
          isLoading: false
        });
      }
    });
  },

  unsubscribePortfolio: () => {
    if (unsubscribePorts) unsubscribePorts();
    if (unsubscribeHold) unsubscribeHold();
    unsubscribePorts = null;
    unsubscribeHold = null;
    set({ userPortfolio: null, userPortfolios: [], activePortfolioId: null, holdings: [], valuation: null });
  },

  fetchAllPortfolios: async () => {
    set({ isLoading: true });
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      const snap = await getDocs(collection(db, 'portfolios'));
      const apps = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Portfolio));
      set({ allPortfolios: apps, isLoading: false });
    } catch (e) {
      console.error("Failed to fetch all portfolios", e);
      set({ isLoading: false });
    }
  },

  submitPortfolio: async (params: CreatePortfolioSubmissionParams) => {
    return await portfolioRepository.createPortfolioWithVersionAndHoldings(params);
  },

  createPortfolio: async (data: Omit<Portfolio, 'id'>) => {
    return await portfolioRepository.createPortfolio(data);
  },

  updatePortfolio: async (id: string, updates: Partial<Portfolio>) => {
    await portfolioRepository.updatePortfolio(id, updates);
    set(state => ({
      userPortfolio: state.userPortfolio?.id === id ? { ...state.userPortfolio, ...updates } : state.userPortfolio,
      userPortfolios: state.userPortfolios.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  }
}));
