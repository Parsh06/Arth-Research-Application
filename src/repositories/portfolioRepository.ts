// src/repositories/portfolioRepository.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Portfolio, PortfolioHolding, PortfolioVersion } from '../schemas/portfolio.schema';
import { calculateExpiryTimestamp } from '../utils/datetime';

const COLLECTION = 'portfolios';

export interface CreatePortfolioSubmissionParams {
  userId: string;
  planId: string;
  planName: string;
  holdings: Array<{
    instrumentId?: string;
    symbol: string;
    companyName: string;
    exchange?: string;
    quantity: number;
    buyPriceMinor: number;
  }>;
}

export const portfolioRepository = {
  async getPortfolio(id: string): Promise<Portfolio | null> {
    const docRef = doc(db, COLLECTION, id);
    const snap = await getDoc(docRef);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Portfolio) : null;
  },

  async getUserPortfolio(userId: string): Promise<Portfolio | null> {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Portfolio);
  },

  async getUserPortfolios(userId: string): Promise<Portfolio[]> {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Portfolio));
  },

  subscribeToUserPortfolios(userId: string, onUpdate: (portfolios: Portfolio[]) => void) {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const ports = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Portfolio));
      onUpdate(ports);
    });
  },

  subscribeToUserPortfolio(userId: string, onUpdate: (portfolio: Portfolio | null) => void) {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        onUpdate(null);
      } else {
        const docSnap = snapshot.docs[0];
        onUpdate({ id: docSnap.id, ...docSnap.data() } as Portfolio);
      }
    });
  },

  /**
   * Atomic creation of portfolio root + version 1 snapshot + holdings subcollection.
   */
  async createPortfolioWithVersionAndHoldings(params: CreatePortfolioSubmissionParams): Promise<string> {
    const now = new Date().toISOString();
    const batch = writeBatch(db);

    // 1. Prepare Root Document
    const portfolioRef = doc(collection(db, COLLECTION));
    const portfolioId = portfolioRef.id;

    let totalInvestmentMinor = 0;
    params.holdings.forEach(h => {
      totalInvestmentMinor += h.quantity * h.buyPriceMinor;
    });

    const rootData: Omit<Portfolio, 'id'> = {
      userId: params.userId,
      planId: params.planId,
      planName: params.planName,
      status: 'pending',
      totalInvestmentMinor,
      stockCount: params.holdings.length,
      submittedAt: now,
      createdAt: now,
      updatedAt: now
    };

    // 2. Prepare Initial Version Document (portfolios/{id}/versions/{versionId})
    const versionRef = doc(collection(db, COLLECTION, portfolioId, 'versions'));
    const versionId = versionRef.id;

    const versionData: PortfolioVersion = {
      id: versionId,
      portfolioId,
      versionNumber: 1,
      status: 'pending',
      source: 'user_submitted',
      totalInvestmentMinor,
      stockCount: params.holdings.length,
      submittedAt: now,
      calculationVersion: 1,
      createdAt: now
    };

    batch.set(portfolioRef, { ...rootData, currentVersionId: versionId });
    batch.set(versionRef, versionData);

    // 3. Write individual holdings to subcollections
    const holdingsRef = collection(db, COLLECTION, portfolioId, 'holdings');
    params.holdings.forEach(h => {
      const holdingDocRef = doc(holdingsRef);
      const investedAmountMinor = h.quantity * h.buyPriceMinor;
      const holdingData: PortfolioHolding = {
        id: holdingDocRef.id,
        portfolioId,
        versionId,
        instrumentId: h.instrumentId || `NSE_EQ_${h.symbol.toUpperCase()}`,
        symbol: h.symbol.toUpperCase(),
        companyName: h.companyName,
        exchange: h.exchange || 'NSE',
        quantity: h.quantity,
        quantityScale: 0,
        buyPriceMinor: h.buyPriceMinor,
        investedAmountMinor,
        currentPriceMinor: h.buyPriceMinor,
        currentValueMinor: investedAmountMinor,
        pnlMinor: 0,
        createdAt: now,
        updatedAt: now
      };
      batch.set(holdingDocRef, holdingData);
    });

    await batch.commit();
    return portfolioId;
  },

  /**
   * Resubmits holdings for an existing rejected portfolio and resets status to pending.
   */
  async resubmitPortfolioHoldings(portfolioId: string, holdings: CreatePortfolioSubmissionParams['holdings']): Promise<void> {
    const now = new Date().toISOString();
    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) throw new Error("Portfolio not found");

    // 1. Delete existing holdings
    const existingHoldingsSnap = await getDocs(collection(db, COLLECTION, portfolioId, 'holdings'));
    for (const hDoc of existingHoldingsSnap.docs) {
      await deleteDoc(doc(db, COLLECTION, portfolioId, 'holdings', hDoc.id));
    }

    const batch = writeBatch(db);
    const portfolioRef = doc(db, COLLECTION, portfolioId);

    let totalInvestmentMinor = 0;
    holdings.forEach(h => {
      totalInvestmentMinor += h.quantity * h.buyPriceMinor;
    });

    // Create new version snapshot
    const versionRef = doc(collection(db, COLLECTION, portfolioId, 'versions'));
    const versionId = versionRef.id;

    const versionData: PortfolioVersion = {
      id: versionId,
      portfolioId,
      versionNumber: (portfolio as any).versionNumber ? (portfolio as any).versionNumber + 1 : 2,
      status: 'pending',
      source: 'user_submitted',
      previousVersionId: portfolio.currentVersionId,
      totalInvestmentMinor,
      stockCount: holdings.length,
      submittedAt: now,
      calculationVersion: 1,
      createdAt: now
    };
    batch.set(versionRef, versionData);

    // Update root portfolio
    batch.update(portfolioRef, {
      status: 'pending',
      rejectionReason: null,
      totalInvestmentMinor,
      stockCount: holdings.length,
      currentVersionId: versionId,
      submittedAt: now,
      updatedAt: now
    });

    // Add new holdings subcollection docs
    holdings.forEach((h) => {
      const holdingDocRef = doc(collection(db, COLLECTION, portfolioId, 'holdings'));
      const investedAmountMinor = h.quantity * h.buyPriceMinor;
      const holdingData: PortfolioHolding = {
        id: holdingDocRef.id,
        portfolioId,
        versionId,
        instrumentId: h.instrumentId || `inst_${h.symbol.toLowerCase()}`,
        symbol: h.symbol,
        companyName: h.companyName,
        exchange: h.exchange || 'NSE',
        allocationBps: totalInvestmentMinor > 0 ? Math.round((investedAmountMinor / totalInvestmentMinor) * 10000) : 0,
        quantity: h.quantity,
        quantityScale: 0,
        buyPriceMinor: h.buyPriceMinor,
        investedAmountMinor,
        currentPriceMinor: h.buyPriceMinor,
        currentValueMinor: investedAmountMinor,
        pnlMinor: 0,
        createdAt: now,
        updatedAt: now
      };
      batch.set(holdingDocRef, holdingData);
    });

    await batch.commit();
  },

  async createPortfolio(data: Omit<Portfolio, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), data);
    return docRef.id;
  },

  async updatePortfolio(id: string, updates: Partial<Portfolio>): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
  },

  /**
   * Approves a portfolio, calculates strict expiry date, and writes an approved version snapshot.
   */
  async approvePortfolio(portfolioId: string, validityDays: number, approvedBy: string): Promise<void> {
    const now = new Date().toISOString();
    const expiresAt = calculateExpiryTimestamp(validityDays);

    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) throw new Error("Portfolio not found");

    const batch = writeBatch(db);
    const portfolioRef = doc(db, COLLECTION, portfolioId);

    // Create new approved version snapshot
    const versionRef = doc(collection(db, COLLECTION, portfolioId, 'versions'));
    const versionId = versionRef.id;

    const versionData: PortfolioVersion = {
      id: versionId,
      portfolioId,
      versionNumber: (portfolio as any).versionNumber ? (portfolio as any).versionNumber + 1 : 2,
      status: 'active',
      source: 'admin_approved',
      previousVersionId: portfolio.currentVersionId,
      totalInvestmentMinor: portfolio.totalInvestmentMinor,
      stockCount: portfolio.stockCount,
      approvedAt: now,
      approvedBy,
      calculationVersion: 1,
      createdAt: now
    };

    batch.set(versionRef, versionData);
    batch.update(portfolioRef, {
      status: 'active',
      expiresAt,
      approvedAt: now,
      approvedBy,
      currentVersionId: versionId,
      updatedAt: now
    });

    // Sync Entitlements atomically
    const features = [
      'feature_portfolio_analytics',
      'feature_research_signals',
      'feature_custom_watchlist',
      'feature_priority_support',
      'feature_factor_radar',
      `access_plan_${portfolio.planId}`
    ];

    for (const featureKey of features) {
      const entitlementId = `${portfolio.userId}_${featureKey}`;
      const entitlementRef = doc(db, 'entitlements', entitlementId);
      batch.set(entitlementRef, {
        id: entitlementId,
        userId: portfolio.userId,
        planId: portfolio.planId,
        featureKey,
        isActive: true,
        expiresAt
      }, { merge: true });
    }

    await batch.commit();
  },

  /**
   * Rejects a portfolio with an explicit feedback reason.
   */
  async rejectPortfolio(portfolioId: string, rejectionReason: string, rejectedBy: string): Promise<void> {
    const now = new Date().toISOString();
    const docRef = doc(db, COLLECTION, portfolioId);
    await updateDoc(docRef, {
      status: 'rejected',
      rejectionReason,
      rejectedBy,
      rejectedAt: now,
      updatedAt: now
    });
  },

  /**
   * Extends portfolio validity by N days (default 30 days).
   */
  async extendPortfolio(portfolioId: string, days = 30): Promise<number> {
    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) throw new Error("Portfolio not found");

    const currentExpiry = portfolio.expiresAt && portfolio.expiresAt > Date.now() ? portfolio.expiresAt : Date.now();
    const newExpiry = currentExpiry + (days * 24 * 60 * 60 * 1000);

    const docRef = doc(db, COLLECTION, portfolioId);
    await updateDoc(docRef, {
      status: 'active',
      expiresAt: newExpiry,
      updatedAt: new Date().toISOString()
    });

    // Also extend entitlements in Firestore
    const features = [
      'feature_portfolio_analytics',
      'feature_research_signals',
      'feature_custom_watchlist',
      'feature_priority_support',
      'feature_factor_radar',
      `access_plan_${portfolio.planId}`
    ];

    const batch = writeBatch(db);
    for (const featureKey of features) {
      const entitlementId = `${portfolio.userId}_${featureKey}`;
      const entitlementRef = doc(db, 'entitlements', entitlementId);
      batch.set(entitlementRef, {
        id: entitlementId,
        userId: portfolio.userId,
        planId: portfolio.planId,
        featureKey,
        isActive: true,
        expiresAt: newExpiry
      }, { merge: true });
    }
    await batch.commit();

    return newExpiry;
  },

  async getHoldings(portfolioId: string): Promise<PortfolioHolding[]> {
    const holdingsRef = collection(db, COLLECTION, portfolioId, 'holdings');
    const snap = await getDocs(holdingsRef);
    return snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as PortfolioHolding));
  },

  subscribeToHoldings(portfolioId: string, onUpdate: (holdings: PortfolioHolding[]) => void) {
    const holdingsRef = collection(db, COLLECTION, portfolioId, 'holdings');
    return onSnapshot(holdingsRef, (snapshot) => {
      const holdings = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as PortfolioHolding));
      onUpdate(holdings);
    });
  },

  async addHoldings(portfolioId: string, holdings: Omit<PortfolioHolding, 'id' | 'portfolioId'>[]): Promise<void> {
    const batch = writeBatch(db);
    const holdingsRef = collection(db, COLLECTION, portfolioId, 'holdings');
    const now = new Date().toISOString();

    holdings.forEach(holding => {
      const docRef = doc(holdingsRef);
      batch.set(docRef, { ...holding, portfolioId, createdAt: now, updatedAt: now });
    });

    await batch.commit();
  }
};
