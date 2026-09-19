// src/stores/planStore.ts
import { create } from 'zustand';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Plan } from '../types/models';
import { toMinorUnits } from '../utils/money';

interface PlanState {
  plans: Plan[];
  isLoadingPlans: boolean;
  
  fetchPlans: () => Promise<void>;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plans: [],
  isLoadingPlans: false,

  fetchPlans: async () => {
    // Show loading if we don't already have plans populated
    if (get().plans.length === 0) {
      set({ isLoadingPlans: true });
    }
    
    try {
      const plansRef = collection(db, 'plans');
      const snapshot = await getDocs(plansRef);
      
      if (snapshot.empty) {
        // No plans configured in Firestore by admin
        set({ plans: [], isLoadingPlans: false });
        return;
      }
      
      const plansData = snapshot.docs
        .map(docSnap => {
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
        })
        .filter((p: any) => p.isActive !== false); // Public showcase only displays active plans
      
      set({ plans: plansData, isLoadingPlans: false });
    } catch (error) {
      console.warn("Firestore plans fetch error:", error);
      set({ plans: [], isLoadingPlans: false });
    } finally {
      set({ isLoadingPlans: false });
    }
  }
}));
