// src/stores/planStore.ts
import { create } from 'zustand';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Plan } from '../types/models';
import { toMinorUnits } from '../utils/money';

interface PlanState {
  plans: Plan[];
  isLoadingPlans: boolean;
  
  fetchPlans: () => Promise<void>;
  seedMockData: () => Promise<void>;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plans: [],
  isLoadingPlans: false,

  fetchPlans: async () => {
    set({ isLoadingPlans: true });
    try {
      const plansRef = collection(db, 'plans');
      const snapshot = await getDocs(plansRef);
      
      if (snapshot.empty) {
        await get().seedMockData();
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
          minInvestmentMinor
        } as unknown as Plan;
      });
      
      set({ plans: plansData, isLoadingPlans: false });
    } catch (error) {
      console.error("Error fetching plans:", error);
      set({ isLoadingPlans: false });
    }
  },

  seedMockData: async () => {
    const now = new Date().toISOString();
    const mockPlans = [
      {
        name: "Wealth Multiplier Pro",
        description: "Our flagship algorithmic portfolio designed for aggressive growth. Hand-picked multi-bagger candidates.",
        price: 4999,
        priceMinor: 499900,
        currency: 'INR',
        validityDays: 30,
        features: ["15-20 High Conviction Stocks", "Weekly Rebalancing Updates", "Dedicated RM Support", "Premium Research Reports"],
        category: 'equity',
        riskLevel: 'High',
        expectedCagr: 35,
        minInvestment: 100000,
        minInvestmentMinor: 10000000,
        stockLimit: 20,
        isActive: true,
        isPopular: true,
        recommendedStocks: ["HDFCBANK", "RELIANCE", "INFY", "TCS", "ICICIBANK"],
        createdAt: now
      },
      {
        name: "Momentum Alpha",
        description: "Ride the market momentum with our proprietary trend-following system.",
        price: 2999,
        priceMinor: 299900,
        currency: 'INR',
        validityDays: 30,
        features: ["10-15 Momentum Stocks", "Monthly Rebalancing", "Email Support", "Monthly Newsletter"],
        category: 'equity',
        riskLevel: 'Medium',
        expectedCagr: 25,
        minInvestment: 50000,
        minInvestmentMinor: 5000000,
        stockLimit: 15,
        isActive: true,
        isPopular: false,
        recommendedStocks: ["ITC", "LT", "SBIN", "BHARTIARTL", "BAJFINANCE"],
        createdAt: now
      },
      {
        name: "Dividend Shield",
        description: "Low-volatility, cash-flow generative dividend portfolio for conservative capital compounding.",
        price: 1999,
        priceMinor: 199900,
        currency: 'INR',
        validityDays: 90,
        features: ["High Dividend Yield Tickers", "Quarterly Rebalancing", "Risk Guard Reports"],
        category: 'equity',
        riskLevel: 'Low',
        expectedCagr: 18,
        minInvestment: 25000,
        minInvestmentMinor: 2500000,
        stockLimit: 10,
        isActive: true,
        isPopular: false,
        recommendedStocks: ["ITC", "COALINDIA", "VEDL", "POWERGRID", "NTPC"],
        createdAt: now
      }
    ];

    try {
      for (const plan of mockPlans) {
        await addDoc(collection(db, 'plans'), plan);
      }
      await get().fetchPlans();
    } catch (error) {
      console.error("Error seeding plans:", error);
    }
  }
}));
