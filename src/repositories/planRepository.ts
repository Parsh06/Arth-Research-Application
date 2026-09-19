import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { PlanSchema } from '../schemas/plan.schema';
import type { Plan } from '../schemas/plan.schema';
import { toMinorUnits } from '../utils/money';

export const planRepository = {
  /**
   * Fetch all active plans or all plans (for admin)
   */
  async getAllPlans(onlyActive: boolean = false): Promise<Plan[]> {
    const plansRef = collection(db, 'plans');
    let q = query(plansRef, orderBy('createdAt', 'desc'));
    if (onlyActive) {
      q = query(plansRef, where('isActive', '==', true));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const priceMinor = data.priceMinor ?? toMinorUnits(data.price || 0);
      const minInvestmentMinor = data.minInvestmentMinor ?? toMinorUnits(data.minInvestment || 0);
      return PlanSchema.parse({
        id: docSnap.id,
        ...data,
        priceMinor,
        minInvestmentMinor,
        features: Array.isArray(data.features) ? data.features : [],
        createdAt: data.createdAt || new Date().toISOString()
      });
    });
  },

  /**
   * Create a new plan
   */
  async createPlan(planData: Omit<Plan, 'id'>): Promise<string> {
    const newDocRef = doc(collection(db, 'plans'));
    const parsed = PlanSchema.parse({
      ...planData,
      id: newDocRef.id
    });
    await setDoc(newDocRef, parsed);
    return newDocRef.id;
  },

  /**
   * Update an existing plan
   */
  async updatePlan(id: string, updates: Partial<Plan>): Promise<void> {
    const planRef = doc(db, 'plans', id);
    const updatePayload = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(planRef, updatePayload);
  },

  /**
   * Delete a plan
   */
  async deletePlan(id: string): Promise<void> {
    const planRef = doc(db, 'plans', id);
    await deleteDoc(planRef);
  }
};
