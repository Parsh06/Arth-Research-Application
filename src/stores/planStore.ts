// src/stores/planStore.ts
import { create } from 'zustand';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Plan } from '../types/models';
import { toMinorUnits } from '../utils/money';

export const DEFAULT_PLANS: Plan[] = [
  {
    id: "wealth-multiplier-pro",
    name: "Wealth Multiplier Pro",
    description: "Our flagship algorithmic portfolio designed for aggressive compounding. Hand-picked multi-bagger candidates with dynamic risk parity.",
    price: 4999,
    validityDays: 30,
    features: [
      "15-20 High Conviction Quant Stocks",
      "Weekly Factor Rebalancing Signals",
      "Dedicated Institutional RM Support",
      "SEBI Statutory Research Audit Reports"
    ],
    category: 'equity',
    riskLevel: 'High',
    expectedCagr: 35,
    minInvestment: 100000,
    stockLimit: 20,
    isActive: true,
    isPopular: true,
    recommendedStocks: ["HDFCBANK", "RELIANCE", "INFY", "TCS", "ICICIBANK"]
  },
  {
    id: "momentum-alpha",
    name: "Momentum Alpha",
    description: "Ride structural market momentum with our proprietary systematic trend-following factor models.",
    price: 2999,
    validityDays: 30,
    features: [
      "10-15 Momentum Factor Stocks",
      "Monthly Risk-Weighted Rebalancing",
      "Real-time Signal Terminal Feed",
      "Monthly Quantitative Strategy Briefings"
    ],
    category: 'equity',
    riskLevel: 'Medium',
    expectedCagr: 25,
    minInvestment: 50000,
    stockLimit: 15,
    isActive: true,
    isPopular: false,
    recommendedStocks: ["ITC", "LT", "SBIN", "BHARTIARTL", "BAJFINANCE"]
  },
  {
    id: "dividend-shield",
    name: "Dividend Shield",
    description: "Low-volatility, cash-flow generative dividend portfolio for conservative capital compounding and downside protection.",
    price: 1999,
    validityDays: 90,
    features: [
      "High Cash-Flow Dividend Champions",
      "Quarterly Parity Rebalancing",
      "Downside Risk Guard Reports",
      "Comprehensive Yield Analytics"
    ],
    category: 'equity',
    riskLevel: 'Low',
    expectedCagr: 18,
    minInvestment: 25000,
    stockLimit: 10,
    isActive: true,
    isPopular: false,
    recommendedStocks: ["ITC", "COALINDIA", "VEDL", "POWERGRID", "NTPC"]
  }
];

interface PlanState {
  plans: Plan[];
  isLoadingPlans: boolean;
  
  fetchPlans: () => Promise<void>;
  seedMockData: () => Promise<void>;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plans: DEFAULT_PLANS,
  isLoadingPlans: false,

  fetchPlans: async () => {
    // Only show loading if we don't already have plans populated
    if (get().plans.length === 0) {
      set({ isLoadingPlans: true });
    }
    
    try {
      const plansRef = collection(db, 'plans');
      const snapshot = await getDocs(plansRef);
      
      if (snapshot.empty) {
        // If Firestore is empty, use default institutional plans
        set({ plans: DEFAULT_PLANS, isLoadingPlans: false });
        return;
      }
      
      const plansData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const priceMinor = data.priceMinor || toMinorUnits(data.price || 0);
        const minInvestmentMinor = data.minInvestmentMinor || toMinorUnits(data.minInvestment || 0);
        return {
          id: docSnap.id,
          ...data,
          price: data.price || (priceMinor / 100),
          priceMinor,
          minInvestment: data.minInvestment || (minInvestmentMinor / 100),
          minInvestmentMinor,
          features: Array.isArray(data.features) ? data.features : []
        } as unknown as Plan;
      });
      
      set({ plans: plansData.length > 0 ? plansData : DEFAULT_PLANS, isLoadingPlans: false });
    } catch (error) {
      console.warn("Firestore plans fetch returned fallback:", error);
      // Fallback to default institutional plans so users are never blocked
      set({ plans: DEFAULT_PLANS, isLoadingPlans: false });
    } finally {
      set({ isLoadingPlans: false });
    }
  },

  seedMockData: async () => {
    const now = new Date().toISOString();
    try {
      for (const plan of DEFAULT_PLANS) {
        const { id, ...dataToSave } = plan;
        await addDoc(collection(db, 'plans'), {
          ...dataToSave,
          priceMinor: toMinorUnits(plan.price),
          minInvestmentMinor: toMinorUnits(plan.minInvestment),
          createdAt: now
        });
      }
      await get().fetchPlans();
    } catch (error) {
      console.warn("Could not seed plans to Firestore:", error);
      set({ plans: DEFAULT_PLANS, isLoadingPlans: false });
    }
  }
}));
