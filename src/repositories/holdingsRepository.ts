import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { PortfolioHolding } from '../types/models';

const COLLECTION = 'portfolioHoldings';

export const holdingsRepository = {
  async getHolding(id: string): Promise<PortfolioHolding | null> {
    const docRef = doc(db, COLLECTION, id);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as PortfolioHolding) : null;
  },

  async getHoldingsForPortfolio(portfolioId: string): Promise<PortfolioHolding[]> {
    const q = query(collection(db, COLLECTION), where('portfolioId', '==', portfolioId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioHolding));
  },

  async createHolding(data: Omit<PortfolioHolding, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), data);
    return docRef.id;
  },

  async updateHolding(id: string, updates: Partial<PortfolioHolding>): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, updates);
  }
};
