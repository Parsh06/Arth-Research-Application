// src/stores/portfolioStore.ts
import { create } from 'zustand';
import { portfolioRepository, type CreatePortfolioSubmissionParams } from '../repositories/portfolioRepository';
import { valuationService, type PortfolioValuation } from '../services/valuationService';
import type { Portfolio, PortfolioHolding } from '../schemas/portfolio.schema';
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
  unsubscribePortfolio: () => void;
  fetchAllPortfolios: () => Promise<void>;
  submitPortfolio: (params: CreatePortfolioSubmissionParams) => Promise<string>;
  createPortfolio: (data: Omit<Portfolio, 'id'>) => Promise<string>;
  updatePortfolio: (id: string, updates: Partial<Portfolio>) => Promise<void>;
}

let unsubscribePorts: Unsubscribe | null = null;
let unsubscribeHold: Unsubscribe | null = null;

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  userPortfolio: null,
  userPortfolios: [],
  activePortfolioId: null,
  holdings: [],
  valuation: null,
  allPortfolios: [],
  isLoading: false,

  setActivePortfolioId: (portfolioId: string) => {
    const { userPortfolios } = get();
    const selected = userPortfolios.find(p => p.id === portfolioId) || null;
    set({ activePortfolioId: portfolioId, userPortfolio: selected });

    if (unsubscribeHold) unsubscribeHold();
    if (selected) {
      unsubscribeHold = portfolioRepository.subscribeToHoldings(selected.id, (holdings) => {
        const valuation = valuationService.evaluatePortfolio(holdings);
        set({ holdings, valuation });
      });
    } else {
      set({ holdings: [], valuation: null });
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
        unsubscribeHold = portfolioRepository.subscribeToHoldings(active.id, (holdings) => {
          const valuation = valuationService.evaluatePortfolio(holdings);
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
    set({ isLoading: true });
    try {
      const id = await portfolioRepository.createPortfolioWithVersionAndHoldings(params);
      set({ isLoading: false });
      return id;
    } catch (e) {
      console.error("Failed to submit portfolio", e);
      set({ isLoading: false });
      throw e;
    }
  },

  createPortfolio: async (data: Omit<Portfolio, 'id'>) => {
    set({ isLoading: true });
    try {
      const id = await portfolioRepository.createPortfolio(data);
      return id;
    } catch (e) {
      console.error("Failed to create portfolio", e);
      set({ isLoading: false });
      throw e;
    }
  },

  updatePortfolio: async (id: string, updates: Partial<Portfolio>) => {
    set({ isLoading: true });
    try {
      await portfolioRepository.updatePortfolio(id, updates);
      
      const { allPortfolios } = get();
      set({ allPortfolios: allPortfolios.map(p => p.id === id ? { ...p, ...updates } : p), isLoading: false });
    } catch (e) {
      console.error("Failed to update portfolio", e);
      set({ isLoading: false });
    }
  }
}));
